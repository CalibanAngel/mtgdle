# MTGdle — État des lieux du dépôt

Analyse du 28 octobre 2026. Voir aussi le [cahier des charges proposé](CAHIER_DES_CHARGES.md).

Ce diagnostic décrit l'état initial. Les corrections et vérifications réalisées ensuite sont détaillées dans le [bilan de stabilisation](VALIDATION_STABILISATION.md), notamment les tests désormais exécutables et le démarrage local.

## 1. Diagnostic général

Le projet possède un socle de collecte et de stockage des cartes déjà substantiel, un début de catalogue jouable et une interface de recherche. Il n’est pas encore un jeu complet : il manque surtout la comparaison d’une proposition avec la réponse du jour, les retours au joueur, la fin de partie et l’historique individuel.

La priorité est de terminer une boucle de jeu simple sur le socle existant. Une réécriture générale ou une architecture plus distribuée n’est pas nécessaire à ce stade.

### Périmètre et limites de l’analyse

Lecture des sources TypeScript du front et de l’API, des contrats partagés, des configurations, des schémas TypeORM, des deux migrations et des tests. Contrôles TypeScript et Jest exécutés avec les dépendances déjà présentes. Les fichiers JavaScript et déclarations générés présents dans les sources n’ont pas servi de référence métier.

L’application complète n’a pas été démarrée ; aucun import ni changement de base n’a été lancé. Le contenu et les volumes réels de PostgreSQL, les performances, le rendu navigateur et un éventuel déploiement ne sont donc pas certifiés. Ce document est un diagnostic de développement, pas un audit de sécurité exhaustif. Les fichiers locaux déjà présents ont été conservés.

## 2. Ce qui est déjà fait

« Présent » signifie qu’une implémentation existe dans les sources ; cela ne prouve pas son bon fonctionnement de bout en bout.

| Domaine           | Réalisation constatée                                                                                                          | État                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| Organisation      | Monorepo avec API, front, types partagés et configuration ESLint commune.                                                      | Présent, outillage à harmoniser.    |
| API               | NestJS 11, contrôleurs par domaine, Swagger sur `/api`, validation globale, sérialisation, gestion centralisée des exceptions. | Présent.                            |
| Scryfall          | Accès aux éditions, carte aléatoire et carte par UUID ; mapping vers les modèles internes.                                     | Présent, cas complexes incomplets.  |
| Import            | Bulk JSON distant ou fichier local, lecture en streaming, traitement séquentiel par lots et bilan temporel.                    | Présent, reprise non aboutie.       |
| Éditions          | Import avec filtre, upsert et lecture via API et interface.                                                                    | Présent.                            |
| Cartes            | Schémas relationnels, mapping et sauvegarde en cascade des faces et images.                                                    | Présent, persistance à vérifier.    |
| Catalogue jouable | Ajout manuel par nom ; automatique si rang EDHREC ≤ 500 ; dédoublonnage par nom.                                               | Présent.                            |
| Défi quotidien    | Modèle `game`, tirage dans les cartes jouables, route manuelle et cron quotidien à 1 h.                                        | Ébauche.                            |
| Proposition       | Le front appelle une route de proposition avec un UUID.                                                                        | Le serveur ne compare pas la carte. |
| Interface         | Recherche illustrée, routes éditions et santé, navigation, thème clair/sombre, React Query.                                    | Prototype.                          |
| Résultats         | Fichier de composant vide et tableau de démonstration sans données de jeu.                                                     | À réaliser.                         |
| Statistiques      | Compteur global `numberOfGuess` et métriques d’import.                                                                         | Pas de statistiques personnelles.   |
| Exploitation      | PostgreSQL 17 via Docker Compose, configuration d’environnement, health check base et Scryfall.                                | Socle local.                        |
| Tests             | Jest, outils Nest/Supertest/Nock, tests de services et mappers.                                                                | Suite actuellement inexécutable.    |

## 3. Architecture actuelle

Les contrôleurs de `packages/api/src/api` délèguent aux services applicatifs puis aux services et repositories de `models`. L’intégration Scryfall est isolée dans `infrastructure/external/scryfall`, tandis que TypeORM gère PostgreSQL. Le module `schedule` déclenche la création quotidienne.

Le front utilise React 18, Vite, HeroUI, React Router et TanStack Query. Ses fonctionnalités sont rangées par domaine (`game`, `sets`, `health`). `packages/shared-types` fournit notamment les types d’éditions, de cartes jouables, d’images et de bilans d’import.

La base décrite par les entités comporte sept tables : `set`, `card`, `card_face`, `card_image_uris`, `mana_cost`, `playable_card`, `game`. `card.id` reprend l’UUID Scryfall de l’impression. `playable_card` utilise le nom comme clé primaire et référence une impression. `game` utilise la date comme clé primaire et référence la carte à trouver. Aucune table de joueur, de participation ou de proposition individuelle n’est définie.

## 4. Les points forts

- **Séparation des responsabilités lisible.** Les accès Scryfall, le stockage et les routes ne sont pas mélangés dans un même fichier ; les règles de comparaison ont une place naturelle dans les services métier.
- **Bon choix d’import massif.** Le streaming évite de charger tout le JSON en mémoire ; l’attente entre lots limite les écritures simultanées.
- **Distinction entre catalogue importé et jouable.** Elle permet de conserver beaucoup de données tout en proposant un jeu accessible et une sélection manuelle.
- **Premières protections contre les doublons.** Les éditions ont un code unique ; les insertions jouables utilisent des requêtes paramétrées et `ON CONFLICT DO NOTHING`, avec retours « inséré », « déjà présent » et « introuvable ».
- **Base d’API documentée et observable.** Swagger, logs, health checks et clés d’erreurs métier facilitent la reprise du développement.
- **Contrats partagés et organisation front par fonctionnalité.** Ce sont de bonnes bases pour ajouter des réponses de comparaison typées sans dupliquer les modèles entre client et serveur.

## 5. Les points moins aboutis et les corrections à prévoir

### A. Le traitement d’une proposition est encore un bouchon

Dans `game.api-service.ts`, `guessCard(id)` affiche l’identifiant avec `console.log`, puis appelle `cardGuessed()` sans lui transmettre la carte. Le repository tente seulement d’incrémenter un compteur pour la date courante. Un UUID syntaxiquement valide n’est pas vérifié contre le catalogue, et le résultat retourné est un booléen lié à la mise à jour, pas une victoire.

Il manque : lecture du défi, validation de la proposition, comparaison, gestion des essais, état terminal, révélation et stockage individuel. Le compteur actuel ne représente donc ni un nombre fiable de gagnants ni des statistiques joueur.

La requête du compteur contient aussi les identifiants SQL bruts `numberOfGuess` et `guessDate` sans guillemets, alors que ces noms camelCase sont ceux des colonnes TypeORM : PostgreSQL les replie en minuscules. Cela constitue un risque concret d’erreur SQL à confirmer par un test d’intégration.

### B. Le cycle quotidien n’est pas fiabilisé

Le cron s’exécute à 1 h sans fuseau explicite ; la lecture du jour utilise une date UTC JavaScript, et l’écriture s’appuie sur `CURRENT_DATE` PostgreSQL. Le jour de référence peut diverger entre ces mécanismes.

La clé primaire date empêche deux lignes pour une même journée, mais le code ne traite pas la relance comme une opération idempotente. Aucun rattrapage après arrêt ni verrou entre instances n’apparaît. Le tirage utilise `ORDER BY RANDOM()` sans exclusion des réponses récentes ; un catalogue vide fait échouer la sélection. `POST /game/today` ne renvoie pas le défi créé et aucune route de lecture du défi du jour n’est exposée.

### C. L’interface ne ferme pas la boucle de jeu

`GameView` n’affiche que `SearchCard`. `guessed-card.tsx` est vide et `guessed-cards.tsx` contient des personnes fictives provenant d’un exemple de tableau ; ce tableau n’est pas branché au jeu.

La sélection dans l’autocomplétion déclenche immédiatement l’appel. Les identifiants joués sont ajoutés à `removedIds`, mais la liste affichée reçoit toujours `playableCards` au lieu de `filteredCards`. Le retrait n’est donc pas appliqué à la liste. L’état local est modifié avant de connaître le succès de la requête et aucune comparaison n’est affichée.

Il manque aussi une gestion visible du chargement et des erreurs de jeu, la protection contre les soumissions multiples, la sauvegarde de partie et l’écran de fin. Aucune utilisation de `localStorage` ou `sessionStorage` n’a été trouvée pour le jeu.

### D. Les imports sont bien amorcés, mais restent des traitements de développement

Le pipeline global importe les éditions, les cartes, puis la sélection automatique. Le filtre cartes reste toujours `normal` + quatre types d’éditions, même si `onlyExpansion=false` élargit l’import des éditions : ce paramètre n’élargit pas réellement le catalogue de cartes.

Les cartes sont enregistrées via `save`, avec des faces et images auxquelles de nouveaux objets sont associés à chaque mapping. Une deuxième importation doit être testée : l’UUID parent stable ne garantit pas à lui seul l’absence de nouveaux enfants ou de conflits sur l’unicité des faces.

Le bilan `totalItems` compte les éléments lus des lots, avant le filtrage métier ; il ne mesure pas les cartes réellement insérées. Il n’existe pas de suivi persistant des exécutions, de reprise à un lot connu ni de verrou d’import. Les appels distants ne présentent pas de stratégie explicite de relance ou de limitation de débit. Le fichier local est résolu relativement à `process.cwd()` : le répertoire de lancement compte.

La sélection automatique ajoute des cartes, mais ne réévalue pas celles déjà présentes si leur rang sort du seuil. La première impression est choisie parmi celles déjà importées, pas nécessairement parmi toutes les impressions historiques. Il faut définir cette politique avant de comparer rareté ou édition dans le jeu.

### E. Le modèle de données est plus riche que ce qui est effectivement alimenté

- `CardFace.manaCost` est rempli par le mapper mais absent des colonnes de `card-face.schema.ts` : le coût brut n’est pas persisté à cet endroit.
- `mana_cost` est déclaré, mais le mapper étudié n’alimente pas `detailedManaCost`. Le modèle de coût détaillé reste donc à raccorder ou à simplifier.
- Le rang `edhrcRank` est stocké en `smallint`, donc limité à 32 767 pour les valeurs positives. Le bulk importe aussi des cartes hors top 500 : toute valeur supérieure ferait échouer l’écriture. Employer un entier adapté et tester ce cas.
- `numberOfGuess` est aussi un `smallint`, peu adapté à un compteur global appelé à croître.
- Les couleurs et mots-clés utilisent `simple-array` ; c’est simple au départ, mais peu pratique pour des requêtes par ensembles. Envisager des tableaux PostgreSQL ou du JSONB selon les usages réels.
- L’identité logique `oracle_id` n’est pas stockée. Le dédoublonnage repose sur le nom et l’impression, ce qui fragilise une évolution multilingue ou multi-impressions.
- Les suppressions de cartes peuvent supprimer les défis liés par cascade. Préserver l’historique avant de prévoir une purge du catalogue.

Les deux migrations présentes ne créent que l’ancienne table `sets` et sa contrainte de code. Elles ne reconstituent pas les sept tables actuelles, dont `set` au singulier. La configuration Nest déclare `migrations: []`, tandis que le datasource CLI cible `migrations/**/*.ts` avec un chemin relatif : la procédure de migration doit être remise à plat.

### F. L’outillage conserve des traces du passage au monorepo

- Le script racine `build:api` appelle `bun run build`, mais le package API déclare `build:nest`, pas `build`.
- `nest-cli.json` et la configuration TypeScript de build mentionnent encore `packages/common` et `packages/scripts`, absents de l’arborescence consultée ; le package partagé actuel est `shared-types`.
- Les tests importent encore des chemins vers un ancien `src` racine. Le test e2e attend l’ancien `Hello World!` et sa route.
- Plusieurs dépendances importées ne sont pas déclarées dans leur package utilisateur : notamment `joi`, `stream-json` côté API et `axios`, `joi`, `@heroui/react`, `@heroui/table`, `@heroui/spinner` côté front. La résolution locale actuelle ne prouve pas qu’une installation propre sera reproductible.
- L’API émet du CommonJS tandis que `shared-types` déclare un package ESM. Distinguer les imports de types des imports de valeurs, notamment les enums, puis vérifier le démarrage avec la version Node retenue.
- Le README racine reste celui du starter Nest ; aucun exemple d’environnement versionné ni pipeline CI n’a été trouvé. Bun est utilisé par les scripts et lockfiles locaux, mais n’est pas disponible dans le PATH de cette session.

### G. La mise en ligne demande encore quelques garde-fous

Les routes d’import, de sélection et de création quotidienne n’ont pas de garde d’authentification visible. Elles doivent être réservées à l’administration avant publication, avec limitation des appels coûteux. Le DTO d’ajout manuel vérifie seulement qu’il reçoit un tableau, pas chaque chaîne ni une taille maximale.

La gestion d’erreur renvoie parfois le message PostgreSQL dans `details` : réserver ces détails aux logs serveur. La configuration expose les possibilités `synchronize` et `dropSchema`, qui doivent être neutralisées en production. L’URL API du front et l’origine CORS sont construites en HTTP ; prévoir une configuration d’URL complète pour HTTPS.

Enfin, `/health` agrège PostgreSQL et Scryfall. Une panne de Scryfall peut rendre ce contrôle global négatif alors que le jeu sur données locales reste utilisable : séparer les signaux de santé selon les usages.

## 6. Vérifications exécutées

Commandes lancées depuis la racine, sans installation de dépendances et sans émission JavaScript pour les contrôles TypeScript :

| Vérification                                                                                                        | Résultat                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `node node_modules/typescript/bin/tsc -p packages/front/tsconfig.json --noEmit --incremental false`                 | Réussite, code de sortie 0. Ce n’est ni un build Vite ni une validation navigateur. |
| `node node_modules/typescript/bin/tsc -p packages/api/tsconfig.json --noEmit --incremental false --composite false` | Échec, trois diagnostics listés ci-dessous.                                         |
| `node node_modules/jest/bin/jest.js --config jest.config.ts --runInBand --watch=false --no-cache`                   | Huit suites en échec avant exécution, zéro test exécuté.                            |

Erreurs TypeScript API :

1. `IInsertManualCardsDto` importé dans `playable-card.dto.ts` n’est pas exporté par `@mtgdle/shared-types`.
2. Le mapper de carte split construit un objet par spread qui ne possède pas le getter `isPlayable` requis par le type `Card`.
3. `WithLoggerClass` est déclaré mais inutilisé dans `with-logger.abstract.ts`.

Jest échoue pour sept suites sur les anciens chemins d’import. La huitième, `health.controller.spec.ts`, est vide. Une première exécution a également rencontré un problème de permission sur le cache ; la relance hors bac à sable a confirmé les huit échecs de sources décrits ici.

Aucun score de couverture valide ne peut être déduit. Le test e2e n’a pas été exécuté, et son ancien chemin d’import est visible à la lecture. Les builds de production, migrations et requêtes SQL ne sont pas validés par ces contrôles.

## 7. Ce qui reste à faire, dans un ordre utile

| Priorité                   | Lot                                                                                                                                          | Critère de sortie                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| P0 — reprise               | Réparer les trois erreurs API, scripts, dépendances, chemins de tests et configuration monorepo ; écrire les instructions de démarrage.      | Installation propre, contrôles TypeScript et builds reproductibles ; tests pertinents exécutables.           |
| P0 — base                  | Réconcilier les schémas et migrations ; corriger les rangs, la persistance des coûts et la relance d’import.                                 | Base vide recréable ; petit import exécuté deux fois sans doublons ni perte de données.                      |
| P1 — jeu serveur           | Fixer les règles, l’identité des cartes et le jour de référence ; développer les comparaisons et une génération idempotente avec rattrapage. | Même réponse pour tous, indices déterministes, réponse cachée.                                               |
| P1 — sessions et interface | Enregistrer les essais, afficher le tableau, traiter les erreurs, gérer victoire/défaite et reprise.                                         | Une partie complète reste cohérente après rechargement et double clic.                                       |
| P2 — statistiques          | Définir et calculer victoires, taux, séries et distribution ; ajouter le partage.                                                            | Un résultat n’est compté qu’une fois ; un partage ne révèle pas la carte.                                    |
| P2 — exploitation          | Protéger les routes administratives, fiabiliser les batchs, ajouter CI, logs et sauvegardes.                                                 | Traitements relançables, administration inaccessible au public et restauration vérifiée avant mise en ligne. |
| P3 — enrichissement        | Localisation française, cartes complexes, nouveaux modes et comptes éventuels.                                                               | À engager après validation du MVP.                                                                           |

## 8. Repères dans le code

| Sujet                   | Sources principales depuis la racine                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Proposition et compteur | `packages/api/src/api/game/game.api-service.ts`, `packages/api/src/models/game/game.repository.ts`                                       |
| Tirage et planification | `packages/api/src/models/game/game.service.ts`, `packages/api/src/schedule/schedule.service.ts`                                          |
| Pipeline d’import       | `packages/api/src/api/bulk/bulk.api-service.ts`, `packages/api/src/infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.dao.ts` |
| Filtrage et mapping     | `packages/api/src/models/card/card.service.ts`, `packages/api/src/infrastructure/external/scryfall/card/scryfall-card-to-card.mapper.ts` |
| Catalogue jouable       | `packages/api/src/models/playable-card/playable-card.repository.ts`                                                                      |
| Interface de jeu        | `packages/front/src/feature/game/components/`                                                                                            |
| Schémas et migrations   | `packages/api/src/models/**/*.schema.ts`, `packages/api/src/infrastructure/database/`, `migrations/`                                     |
| Tests et outillage      | `test/`, `jest.config.ts`, `nest-cli.json`, les `package.json` et `tsconfig*.json`                                                       |
