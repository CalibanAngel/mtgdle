# MTGdle — Cahier des charges léger

Version de cadrage du 28 octobre 2026, établie à partir du dépôt.

Complément technique : [plan de mise à jour de Node.js, Bun et des dépendances](PLAN_MISE_A_JOUR.md).

Ce document décrit la cible d’une première version jouable (MVP). Les règles proposées ci-dessous sont des choix de cadrage à valider, pas des fonctionnalités déjà réalisées. L’état réel du code figure dans [l’état des lieux](ETAT_DES_LIEUX.md).

## 1. Objectif et périmètre

Créer un jeu web quotidien inspiré de Wordle et de Pokédle : retrouver une carte Magic: The Gathering grâce aux indices obtenus après chaque proposition. Le jeu doit être utilisable sur ordinateur et mobile, sans compte obligatoire.

Le MVP comprend : une carte commune à tous chaque jour, une recherche avec autocomplétion, un tableau de comparaison, une fin de partie, une reprise après rechargement, des statistiques personnelles et un partage sans révéler la réponse.

Les comptes utilisateurs, classements, modes illimités, archives jouables et modes « illustration » ou « texte de carte » sont des évolutions possibles, hors MVP.

## 2. Gameplay proposé

### Catalogue et défi quotidien

- Conserver au départ le périmètre actuel : cartes de layout `normal`, issues des éditions `expansion`, `core`, `commander` et `masters`.
- Constituer le catalogue jouable à partir des cartes importées : sélection automatique de rang EDHREC inférieur ou égal à 500, complétée par une sélection manuelle. Le rang mesure ici une popularité orientée Commander ; ce choix pourra évoluer selon le public.
- Une carte logique ne doit apparaître qu’une fois dans la recherche. Retenir une impression de référence pour ses caractéristiques d’édition et son illustration ; documenter la règle de sélection.
- Tirer une réponse commune par jour. Proposition : renouvellement à minuit dans le fuseau `Europe/Paris`, avec date et heure du prochain défi renvoyées par le serveur.
- Ne pas retirer une carte du catalogue au milieu d’un défi. Éviter les répétitions récentes ; la fenêtre d’exclusion reste à définir selon la taille du catalogue.

### Déroulement

1. Le joueur ouvre la page et consulte une explication courte des règles.
2. Il recherche une carte par son nom et confirme sa proposition. La sélection seule ne consomme pas d’essai.
3. Le serveur valide la carte et renvoie les comparaisons avec la réponse du jour.
4. Le tableau conserve les essais dans leur ordre de soumission et explique les indices.
5. La bonne carte déclenche la victoire. Proposition MVP : dix essais maximum, puis révélation de la réponse en cas de défaite ; un abandon explicite est possible.
6. Le résultat indique le nombre d’essais, permet le partage et annonce le prochain défi.

Le nombre d’essais et le fuseau sont des paramètres proposés. Une carte déjà jouée, une requête invalide ou une erreur réseau ne consomme pas d’essai. Après victoire, défaite ou abandon, les nouvelles propositions sont refusées. Un défi expiré ne reçoit plus d’essai ; une partie inachevée expire sans être comptée comme une partie terminée.

### Indices de comparaison

| Critère MVP          | Règle proposée                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Couleurs             | Vert si ensembles identiques, orange si intersection non vide, rouge sinon. Deux ensembles vides correspondent. Utiliser les couleurs, distinctes de l’identité couleur. |
| Types principaux     | Comparer les ensembles de types (`Creature`, `Artifact`, etc.) avec la même règle ; séparer les supertypes et sous-types.                                                |
| Valeur de mana       | Égalité ou flèche indiquant si la valeur recherchée est supérieure ou inférieure.                                                                                        |
| Rareté               | Correspondance exacte avec l’impression de référence.                                                                                                                    |
| Édition de référence | Correspondance exacte ; ne pas laisser entendre qu’il s’agit nécessairement de la première édition historique.                                                           |

Exemple : pour une proposition blanche de valeur de mana 2 et une cible blanche et bleue de valeur 4, les couleurs sont partielles et la flèche mana pointe vers le haut. Seule l’identité de la carte détermine la victoire, même si tous les critères affichés correspondent.

Force, endurance, loyauté, mots-clés et identité couleur peuvent être ajoutés ensuite. Ils nécessitent des règles explicites pour les valeurs absentes ou non numériques (`*`, `X`). Les états doivent être compréhensibles par texte ou icônes, sans dépendre uniquement de la couleur.

### Sauvegarde et statistiques

Créer une session de jeu anonyme, identifiée par un cookie opaque, et conserver côté serveur les propositions et le résultat de chaque défi. Le navigateur peut garder un cache pour améliorer la reprise ; le serveur reste l’autorité sur les essais et la victoire.

Afficher : parties terminées, victoires, taux de victoire, série quotidienne actuelle et record, répartition du nombre d’essais gagnants. Une défaite ou une journée manquée interrompt la série ; une simple visite ne compte pas comme partie terminée. Un résultat ne doit être compté qu’une fois. Les statistiques restent liées au navigateur tant qu’aucun compte n’existe et peuvent être perdues si son identifiant est effacé.

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

| Méthode et route proposée                         | Responsabilité                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `GET /game/today`                                 | Identifiant du défi, date, limite d’essais, expiration et état de la session ; aucune réponse anticipée.        |
| `GET /playable-cards`                             | Noms et identifiants autorisés, illustrations éventuelles ; filtrage serveur à ajouter si le catalogue grandit. |
| `POST /game/:gameId/guesses`                      | Corps `{ cardId, requestId }` ; validation et enregistrement d’un essai, retour des indices et du nouvel état.  |
| `POST /game/:gameId/abandon`                      | Termine la partie et autorise la révélation.                                                                    |
| `GET /stats/me`                                   | Statistiques de la session anonyme.                                                                             |
| `GET /health`                                     | État de l’application et des dépendances ; distinguer la disponibilité du jeu de celle de l’import Scryfall.    |
| Routes d’administration d’import et de génération | Lancer un traitement et consulter son bilan ; accès protégé.                                                    |

La soumission doit vérifier l’existence du défi, son état, l’appartenance de la carte au catalogue et les doublons. Un même `requestId` rejoué renvoie le même résultat. Une transaction empêche deux soumissions concurrentes de dépasser la limite. Prévoir des erreurs stables : 400 invalide, 404 introuvable, 409 conflit ou partie terminée, 429 limitation de débit. Documenter précisément la réponse à chaque cas.

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

Compléter les défis par un identifiant stable, une date unique, une échéance et une version des règles. Ajouter une session anonyme, une participation unique par couple session/défi, et les essais ordonnés associés. Les essais stockent la proposition, la date et la clé d’idempotence ; les statistiques sont calculées depuis ces données ou des agrégats reproductibles.

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

| Niveau                 | Cas prioritaires                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests unitaires        | Comparaisons exactes/partielles, incolore, types multiples, valeurs mana ; victoire, limite, abandon ; calcul des séries et statistiques.                 |
| Intégration PostgreSQL | Migrations sur base vide, contraintes, import répété sans doublons, persistance des faces/coûts, transactions et soumissions concurrentes.                |
| Tests HTTP             | Réponse cachée, UUID invalide, carte hors catalogue, essai répété, partie terminée, double requête identique, administration protégée.                    |
| Tests d’import         | Petit jeu de données local déterministe, fichier invalide, panne distante, lot partiellement échoué et relance. Simuler Scryfall pour les tests courants. |
| Tests navigateur       | Recherche au clavier et sur mobile, victoire/défaite, affichage des indices, erreur réseau, rechargement et changement de jour.                           |
| Automatisation         | Installation reproductible, contrôles TypeScript, lint sans modification, tests et builds en intégration continue.                                        |

La recette du MVP doit démontrer qu’un joueur peut terminer une partie, la retrouver après rechargement et consulter des statistiques cohérentes. Deux joueurs doivent partager le même défi, leurs essais doivent rester distincts et aucune réponse ne doit être révélée avant la fin. Un redémarrage ou une double exécution du batch ne doit pas changer la carte du jour. Le jeu reste disponible en cas de panne Scryfall avec un catalogue déjà alimenté.

## 8. Ordre de réalisation

1. Rétablir les contrôles techniques, les migrations et un démarrage reproductible.
2. Finaliser le défi quotidien et la comparaison serveur sur quelques cartes de test.
3. Brancher l’interface complète et la reprise de session.
4. Ajouter les statistiques et le partage.
5. Fiabiliser les imports, protéger l’administration et valider la recette avant publication.

Décisions produit à confirmer : dix essais ou un autre format, fuseau de renouvellement, noms anglais ou français, pertinence du catalogue orienté Commander et durée d’exclusion des réponses récentes. Pour limiter le travail initial, les noms anglais et les cartes simples déjà importables constituent une base cohérente.
