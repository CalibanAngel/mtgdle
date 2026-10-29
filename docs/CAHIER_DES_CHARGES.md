# MTGdle — Cahier des charges léger

Version de cadrage du 28 octobre 2026, établie à partir du dépôt.

Complément technique : [plan de mise à jour de Node.js, Bun et des dépendances](PLAN_MISE_A_JOUR.md).

Ce document décrit la cible d’une première version jouable (MVP). Les règles de gameplay ci-dessous intègrent les décisions validées ensemble. Les choix encore ouverts sont explicitement signalés ; ce document décrit une cible, pas des fonctionnalités déjà réalisées. L’état réel du code figure dans [l’état des lieux](ETAT_DES_LIEUX.md).

## 1. Objectif et périmètre

Créer un jeu web quotidien inspiré de Wordle et de Pokédle : retrouver une carte Magic: The Gathering grâce aux indices obtenus après chaque proposition. Le jeu doit être utilisable sur ordinateur et mobile, sans compte obligatoire.

Le MVP comprend : une carte commune à tous chaque jour, une recherche avec autocomplétion, un tableau de comparaison, une fin de partie, une reprise après rechargement, des statistiques personnelles et un partage sans révéler la réponse.

Les comptes utilisateurs, classements, archives jouables et mode « texte de carte » sont des évolutions possibles, hors MVP.

## 2. Gameplay validé

### Catalogue et défi quotidien

- Conserver au départ le périmètre actuel : cartes de layout `normal`, issues des éditions `expansion`, `core`, `commander` et `masters`.
- Constituer le catalogue jouable à partir des cartes importées : sélection automatique de rang EDHREC inférieur ou égal à 500, complétée par une sélection manuelle. Le rang mesure ici une popularité orientée Commander ; ce choix pourra évoluer selon le public.
- Une carte logique ne doit apparaître qu’une fois dans la recherche, toutes impressions confondues. La miniature du mode classique représente son premier artwork standard. La première édition et la période de parution décrivent sa première sortie historique, même si une variante spéciale l’a précédé.
- Tirer une réponse commune par jour. Proposition : renouvellement à minuit dans le fuseau `Europe/Paris`, avec date et heure du prochain défi renvoyées par le serveur.
- Ne pas retirer une carte du catalogue au milieu d’un défi. Éviter les répétitions récentes ; la fenêtre d’exclusion reste à définir selon la taille du catalogue.

### Déroulement

1. Le joueur ouvre la page et consulte une explication courte des règles.
2. Il recherche une carte par son nom et confirme sa proposition. La sélection seule ne consomme pas d’essai.
3. Le serveur valide la carte et renvoie les comparaisons avec la réponse du jour.
4. Le tableau conserve les essais dans leur ordre de soumission et explique les indices.
5. La bonne carte déclenche la victoire. Les essais sont illimités : aucune défaite automatique après un nombre d’essais donné. Un abandon explicite reste possible.
6. Après dix propositions incorrectes distinctes acceptées par le serveur, un bouton permet de demander un indice facultatif.
7. Le résultat indique le nombre d’essais et l’utilisation éventuelle d’un indice, permet le partage et annonce le prochain défi.

Une carte acceptée comme proposition ne peut plus être choisie dans cette partie : elle disparaît des suggestions et le serveur refuse toute nouvelle soumission de la même identité logique, même sous une autre impression. Cette exclusion persiste après rechargement et s’applique aussi aux modes visuels. Une requête invalide, un doublon ou une erreur réseau ne consomme pas d’essai. Une requête dont la réponse réseau est perdue est rejouée avec la même clé d’idempotence pour retrouver l’essai enregistré sans le compter deux fois.

Après victoire ou abandon, les nouvelles propositions sont refusées. Un défi expiré ne reçoit plus d’essai ; une partie inachevée expire sans être comptée comme une partie terminée. Le fuseau de renouvellement reste à confirmer.

### Indice après dix erreurs

Le déblocage est automatique, son utilisation volontaire et gratuite en essais. Le serveur conserve son état et son résultat ; recharger la page ne permet pas de tirer un nouvel indice.

- **Indice initial retenu : réduction des choix.** Lors de l’activation, retirer aléatoirement la moitié des cartes encore sélectionnables (arrondi à l’entier inférieur), sans jamais retirer la réponse. Les cartes déjà jouées ne participent pas au calcul. Le retrait est définitif pour cette partie uniquement et contrôlé côté serveur. Si une seule carte reste sélectionnable, aucune réduction n’est possible ; l’interface le signale sans enregistrer une utilisation fictive.
- **Variante envisagée : texte d’ambiance (lore).** Afficher le texte de l’impression de référence s’il existe, en masquant le nom de la carte lorsqu’il apparaît. Prévoir la réduction des choix comme solution de remplacement. Le choix entre ces aides ou leur attribution reste à définir ; le MVP ne les cumule pas automatiquement.

### Sept critères de comparaison du mode classique

| Critère                      | Règle                                                                                                                                                                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identité couleur             | Vert si ensembles identiques, orange si intersection non vide, rouge sinon. Deux ensembles vides correspondent. Utiliser `color_identity`, et non `colors` ni les seules couleurs des symboles du coût de mana. L’identité inclut les couleurs pertinentes du texte de règles ; lire la valeur normalisée fournie par Scryfall. |
| Valeur de mana (CCM)         | Égalité ou flèche vers une valeur recherchée supérieure ou inférieure.                                                                                                                                                                                                                                                          |
| Types principaux             | Même comparaison d’ensembles pour les types (`Creature`, `Artifact`, etc.) ; exclure supertypes et sous-types de cette colonne.                                                                                                                                                                                                 |
| Première édition             | Correspondance exacte avec la première édition historique retenue.                                                                                                                                                                                                                                                              |
| Période de première parution | Tranches fixes de deux ans sans chevauchement : 2000–2001, 2002–2003, etc. Même tranche : vert ; cible plus ancienne : ↓ ; plus récente : ↑.                                                                                                                                                                                    |
| Mots-clés                    | Vert si ensembles identiques, orange si au moins un mot-clé commun, rouge sinon. Afficher ceux de la proposition et distinguer ceux partagés avec la cible, sans révéler les mots-clés manquants. Deux ensembles vides correspondent.                                                                                           |
| Capacité activée             | Oui/non, avec correspondance exacte. Déterminer cette propriété séparément des mots-clés.                                                                                                                                                                                                                                       |

Les tranches sont ancrées sur les années paires : une année appartient à la tranche commençant à `2 × floor(année / 2)`. Leur largeur est configurable et figée dans la version des règles du défi ; deux ans constituent le choix initial validé. La date exacte de la cible ne doit pas être révélée par cet indice.

Exemple : pour une proposition d’identité blanche de valeur de mana 2 et une cible d’identité blanche et bleue de valeur 4, l’identité correspond partiellement et la flèche mana pointe vers le haut. Seule l’identité de la carte détermine la victoire, même si tous les critères affichés correspondent.

Pour les mots-clés, comparer des identifiants normalisés, indépendants de la langue affichée (vol, célérité, etc.). Pour les capacités activées, analyser le texte de règles en traitant les textes de rappel, les capacités accordées et les cas particuliers ; ne pas assimiler simplement présence d’un mot-clé ou d’un caractère « : » à un résultat fiable. Prévoir des fixtures et corrections explicites pour les cas ambigus.

La rareté ne fait pas partie des sept critères retenus. Force, endurance, loyauté et couleurs propres de la carte restent des extensions possibles. Le MVP conserve une seule colonne d’identité couleur pour éviter la redondance. Les couleurs propres (`colors`) ne se déduisent pas non plus uniquement du coût de mana. Les états doivent être compréhensibles par texte ou icônes, sans dépendre uniquement de la couleur.

### Illustration et première impression

La miniature montre l’artwork standard (normal) de la première impression standard historique de la carte, et non celui de la plus ancienne impression actuellement importée. La recherche de cette référence doit pouvoir dépasser les quatre types d’éditions du catalogue jouable : une restriction de sélection ne doit pas fausser l’histoire de la carte.

Exclure les traitements spéciaux : alternate art, showcase, borderless et extended art. Ne pas confondre le layout `normal` (structure de carte) ou le format d’image `normal` avec un artwork standard. Déterminer la variante à partir des métadonnées d’impression et prévoir une sélection manuelle pour les cas ambigus. Si la toute première parution ne comporte aucun art standard, garder sa date et son édition historiques pour les indices, mais utiliser le premier art standard disponible ultérieurement et conserver ces deux références distinctes. Ne jamais utiliser silencieusement un special art en remplacement.

Si plusieurs impressions standard ou illustrations standard existent à la même première date, sélectionner une référence de façon déterministe et conserver son identifiant. Proposition technique à confirmer : préférence pour une impression anglaise avec image disponible parmi les impressions de cette date, puis départage stable par identifiant. Une absence d’image doit produire une miniature de remplacement explicite ; ne pas présenter silencieusement une réimpression comme la première. Les règles de jeu utilisent les caractéristiques normalisées actuelles, tandis que la date et l’édition proviennent de la première sortie historique et l’artwork de la première impression standard.

### Modes visuels prévus après le mode classique

- **Illustration zoomée** : cadrage initial fixe puis dézoom progressif après chaque proposition incorrecte acceptée, jusqu’à l’illustration entière.
- **Illustration floutée** : diminution progressive du flou après chaque proposition incorrecte acceptée, jusqu’à une illustration nette.

Utiliser uniquement l’illustration, sans nom ni autres zones de la carte donnant directement la réponse. Dans ces modes, la recherche ne montre aucune vignette. L’artwork de référence reste le premier artwork standard ; un remplacement nécessaire doit être défini explicitement. Les essais restent illimités une fois l’image entièrement révélée. Les paliers de dézoom et de flou restent à régler par des essais de jeu ; les sept critères ne sont affichés que dans le mode classique.

Chaque mode possède son défi et sa progression indépendants. La règle de non-répétition des cartes et la reprise après rechargement sont communes. L’indice supplémentaire à dix erreurs est prévu pour le mode classique ; son utilité dans les modes visuels reste à décider. Les modes visuels ne doivent pas livrer la réponse dans les noms de fichiers ou métadonnées : prévoir des images transformées servies par des identifiants opaques plutôt qu’un simple filtre CSS sur l’image source complète.

### Sauvegarde et statistiques

Créer une session de jeu anonyme, identifiée par un cookie opaque, et conserver côté serveur les propositions et le résultat de chaque défi. Le navigateur peut garder un cache pour améliorer la reprise ; le serveur reste l’autorité sur les essais et la victoire.

Afficher : parties terminées, victoires, taux de victoire, série quotidienne actuelle et record, répartition du nombre d’essais gagnants. Un abandon ou une journée manquée interrompt la série ; une simple visite ne compte pas comme partie terminée. Un résultat ne doit être compté qu’une fois. Les statistiques restent liées au navigateur tant qu’aucun compte n’existe et peuvent être perdues si son identifiant est effacé.

## 3. Architecture

Conserver le monorepo TypeScript et une application serveur unique : cette taille de projet ne justifie pas de microservices.

```text
Navigateur : React / Vite / HeroUI / TanStack Query
                        |
                    API NestJS
                /               \
     Services métier         Intégration Scryfall
             |                   |
      TypeORM / PostgreSQL   Imports et mises à jour
             ^
      Tâches planifiées
```

- `packages/front` : recherche, tableau d’indices, résultats, statistiques, états de chargement et erreurs.
- `packages/api` : validation, règles de jeu, accès aux données, imports et planification. Garder la séparation existante entre contrôleurs, services, repositories et intégration externe.
- `packages/shared-types` : contrats communs du catalogue, du défi public, des propositions, des comparaisons et des statistiques.
- PostgreSQL : catalogue, défis quotidiens, sessions et historique des essais.

Les parties doivent fonctionner avec les données déjà importées lorsque Scryfall est indisponible ; les illustrations peuvent toutefois dépendre de son hébergement. Ne jamais envoyer l’identifiant de la réponse avant la fin de partie. Utiliser des DTO publics explicites plutôt que sérialiser directement les entités métier.

## 4. API cible

Les routes de jeu ci-dessous sont des contrats proposés, à compléter dans Swagger. Les routes d’import existent déjà en partie, mais doivent devenir réservées à l’administration.

| Méthode et route proposée                         | Responsabilité                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `GET /game/today`                                 | Identifiant du défi, date, mode, seuil et état de l’indice, expiration et état de la session ; aucune réponse anticipée. |
| `GET /playable-cards`                             | Noms et identifiants autorisés, illustrations éventuelles ; filtrage serveur à ajouter si le catalogue grandit.          |
| `POST /game/:gameId/guesses`                      | Corps `{ cardId, requestId }` ; validation et enregistrement d’un essai, retour des indices et du nouvel état.           |
| `POST /game/:gameId/abandon`                      | Termine la partie et autorise la révélation.                                                                             |
| `GET /stats/me`                                   | Statistiques de la session anonyme.                                                                                      |
| `GET /health`                                     | État de l’application et des dépendances ; distinguer la disponibilité du jeu de celle de l’import Scryfall.             |
| Routes d’administration d’import et de génération | Lancer un traitement et consulter son bilan ; accès protégé.                                                             |

La soumission doit vérifier l’existence du défi, son état, l’appartenance de la carte au catalogue et les doublons. Un même `requestId` rejoué renvoie le même résultat. Une transaction et une contrainte unique sur participation/carte logique empêchent deux soumissions concurrentes de compter la même carte deux fois. L’activation de l’indice est également idempotente et vérifie le seuil de dix erreurs. Prévoir des erreurs stables : 400 invalide, 404 introuvable, 409 conflit ou partie terminée, 429 limitation de débit. Documenter précisément la réponse à chaque cas.

Ajouter `POST /game/:gameId/hint` pour activer l’aide et retourner son résultat persistant. Le catalogue sélectionnable exclut les propositions précédentes et les cartes retirées par l’indice. La lecture du défi accepte un mode et restitue la progression correspondante.

## 5. Base de données

### Socle à conserver et fiabiliser

| Table actuelle    | Rôle                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `set`             | Éditions, code unique, type, date, icône.                             |
| `card`            | Impression Scryfall, caractéristiques, édition et rang de popularité. |
| `card_face`       | Texte, type, force/endurance/loyauté et illustration d’une face.      |
| `card_image_uris` | URLs d’illustrations.                                                 |
| `mana_cost`       | Modèle prévu pour le détail du coût ; alimentation à clarifier.       |
| `playable_card`   | Catalogue sélectionné et origine automatique ou manuelle.             |
| `game`            | Réponse d’un jour et compteur global rudimentaire.                    |

### Évolution nécessaire

Ajouter une identité logique de carte, distincte de l’impression Scryfall, par exemple en conservant son `oracle_id` lorsque disponible. Lier le catalogue jouable à cette identité et à une impression de référence.

Compléter les défis par un identifiant stable, une unicité par couple date/mode, une échéance et une version des règles. Ajouter une session anonyme, une participation unique par couple session/défi, et les essais ordonnés associés. Les essais stockent la proposition, la date et la clé d’idempotence ; les statistiques, distinguées par mode et avec/sans indice, sont calculées depuis ces données ou des agrégats reproductibles.

Conserver la première date historique, la référence d’impression et d’illustration, les mots-clés normalisés et le statut de capacité activée. Persister le nombre d’erreurs, le déblocage et l’utilisation de l’indice, les cartes retirées et la progression visuelle. Une actualisation du catalogue ne modifie pas ces références pendant un défi.

Prévoir des clés étrangères, contraintes d’unicité et index sur les recherches fréquentes. Utiliser des entiers adaptés pour les rangs et compteurs. Garantir la conservation de l’historique lors des mises à jour du catalogue. Les migrations doivent recréer le schéma depuis une base vide ; désactiver la synchronisation automatique et la suppression du schéma en production.

## 6. Batchs et exploitation

| Traitement                  | Fréquence cible                      | Résultat attendu                                                                                      |
| --------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Initialisation              | À la demande                         | Importer les éditions, les cartes puis la sélection jouable, dans cet ordre.                          |
| Rafraîchissement Scryfall   | Périodique, proposition hebdomadaire | Actualiser le catalogue sans doublons ni perte d’historique.                                          |
| Mise à jour de la sélection | Après import réussi                  | Ajouter les cartes éligibles et préserver les choix manuels ; appliquer les retraits hors défi actif. |
| Génération du défi          | Chaque jour, avant son ouverture     | Créer une seule réponse persistante ; reprendre sans la changer après redémarrage.                    |

Conserver la lecture du bulk JSON en streaming et par lots configurables. Chaque traitement doit être relançable, empêcher les exécutions concurrentes et produire un bilan : éléments lus, exclus, insérés, mis à jour, rejetés et durée. Une erreur doit être visible et permettre une reprise contrôlée. Si les imports dépassent la durée acceptable d’une requête HTTP, les exécuter en tâche de fond avec un identifiant de suivi.

Prévoir un rattrapage si l’application était arrêtée à l’heure de génération, des logs exploitables, une alerte sur échec et des sauvegardes PostgreSQL avec restauration vérifiée. Vérifier les conditions d’utilisation de Scryfall et des illustrations, ainsi que les contraintes de ses appels HTTP, avant ouverture publique ; elles ne sont pas auditées dans ce cadrage.

## 7. Méthodologie de test et recette

| Niveau                 | Cas prioritaires                                                                                                                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests unitaires        | Comparaisons exactes/partielles, identité vide et identité différente des couleurs propres, types multiples, valeurs mana ; victoire, essais illimités, abandon, seuil de dix erreurs, tranches de deux ans, mots-clés et capacités activées ; calcul des séries et statistiques. |
| Intégration PostgreSQL | Migrations sur base vide, contraintes, import répété sans doublons, persistance des faces/coûts, transactions et soumissions concurrentes.                                                                                                                                        |
| Tests HTTP             | Réponse cachée, UUID invalide, carte hors catalogue, essai répété, partie terminée, double requête identique, administration protégée.                                                                                                                                            |
| Tests d’import         | Petit jeu de données local déterministe, fichier invalide, panne distante, lot partiellement échoué et relance. Simuler Scryfall pour les tests courants.                                                                                                                         |
| Tests navigateur       | Recherche au clavier et sur mobile, victoire/abandon, affichage des indices, erreur réseau, rechargement et changement de jour.                                                                                                                                                   |
| Automatisation         | Installation reproductible, contrôles TypeScript, lint sans modification, tests et builds en intégration continue.                                                                                                                                                                |

La recette du MVP doit démontrer qu’un joueur peut terminer une partie, la retrouver après rechargement et consulter des statistiques cohérentes. Deux joueurs doivent partager le même défi, leurs essais doivent rester distincts et aucune réponse ne doit être révélée avant la fin. Un redémarrage ou une double exécution du batch ne doit pas changer la carte du jour. Le jeu reste disponible en cas de panne Scryfall avec un catalogue déjà alimenté.

Compléter la recette avec : carte proposée indisponible après rechargement ; doublon simultané compté une seule fois ; aide indisponible à neuf erreurs et disponible à dix ; réduction conservant toujours la cible et stable après rechargement ; bornes 2001/2002 ; référence historique absente du catalogue initial ; images multiples à la première date ; texte d’ambiance absent ou contenant le nom. Pour les modes visuels, vérifier des paliers monotones, la reprise exacte de la progression et l’absence de miniatures dans les suggestions.

## 8. Ordre de réalisation

1. Rétablir les contrôles techniques, les migrations et un démarrage reproductible.
2. Finaliser le défi quotidien et la comparaison serveur sur quelques cartes de test.
3. Brancher l’interface complète et la reprise de session.
4. Ajouter les statistiques et le partage.
5. Fiabiliser les imports, protéger l’administration et valider la recette avant publication.
6. Ajouter les modes zoom et flou sur le socle commun de sessions et de propositions.

Décisions restant à confirmer : fuseau de renouvellement, noms anglais ou français, pertinence du catalogue orienté Commander, durée d’exclusion des réponses récentes, départage des premières impressions simultanées, variante lore et paliers des modes visuels. Pour limiter le travail initial, les noms anglais et les cartes simples déjà importables constituent une base cohérente.

## 9. Tests navigateur Playwright

La suite `test/browser` utilise Playwright avec Chromium desktop et mobile. Elle lance un serveur Vite dédié et simule les appels API : aucune écriture dans PostgreSQL ni appel réel à Scryfall. Commandes : `npm run test:browser` et `npm run test:browser:ui`. Installer Chromium avec `npx playwright install chromium`. Traces et captures sont conservées en cas d’échec.

Les premiers scénarios couvrent recherche, soumission par clic et clavier, catalogue vide, navigation 404 et thème. Ajouter avec le moteur de jeu : doublons persistants, dixième erreur et indice, identité couleur différente des couleurs propres, premier artwork standard, reprise et modes visuels. Les mocks valident le front ; les contrats HTTP et tests SQL restent complémentaires.
