# Premier jet du mode classique — 29 octobre 2026

## Ce qui est jouable

- Un défi commun par jour, renouvelé à minuit Europe/Paris, créé à la première ouverture et conservé après redémarrage.
- Recherche parmi 472 cartes logiques, sélection puis confirmation explicite.
- Sept comparaisons : identité couleur, valeur de mana, types principaux, première édition, tranche de deux ans, mots-clés, présence d’une capacité activée.
- Essais illimités, sans réutilisation d’une carte. Historique conservé en base et retrouvé via un cookie de session HttpOnly.
- Indice volontaire après dix erreurs : suppression aléatoire de la moitié des choix encore disponibles, en conservant toujours la réponse. L’indice est stable après rechargement.
- Victoire, abandon confirmé, révélation et copie d’un résultat partageable sans le nom de la réponse.
- Interface adaptée au mobile avec tableau défilant horizontalement et navigation de recherche au clavier.

## Préparer et lancer

Les dépendances installées et PostgreSQL doivent être disponibles. Les paramètres de connexion viennent des fichiers `.env` racine puis `packages/api/.env`, avec priorité aux variables du processus. Le script utilise le fichier bulk Scryfall local déjà présent ; `SCRYFALL_BULK_FILE` permet de spécifier un autre chemin.

```powershell
# Validation sans écriture
node scripts/prepare-classic.cjs --check

# Migration additive et préparation du catalogue
npm run prepare:classic

# API + front, avec compilation des types partagés
npm run dev:classic
```

Le lancement utilise les ports des fichiers d’environnement. Pour changer les ports dans une session PowerShell :

```powershell
$env:BACK_API_PORT='3002'
$env:FRONT_API_PORT='5176'
npm run dev:classic
```

Ouvrir alors `http://localhost:5176`. Le script désactive systématiquement la synchronisation automatique du schéma, sa suppression et les anciens cron. Le nouveau défi utilise une génération à la demande, sans dépendre de l’ancien modèle `game`.

La préparation ajoute uniquement `classic_catalogue`, `classic_daily` et `classic_progress`. Elle ne modifie aucune table d’origine. Les catalogues quotidiens sont des instantanés : rafraîchir le catalogue ne change pas la réponse ni les indices d’un défi déjà ouvert. Les nouvelles tables sont volontairement absentes des anciennes entités TypeORM ; ne pas activer `dropSchema`.

## API utilisée

| Route                        | Fonction                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `GET /classic/today`         | Ouvrir/reprendre la session ; choix publics et essais, sans réponse anticipée.  |
| `POST /classic/:day/guesses` | Corps `{ cardId, requestId }`, deux UUID ; proposition atomique et idempotente. |
| `POST /classic/:day/hint`    | Débloquer l’aide après dix erreurs ; appels répétés sans nouveau tirage.        |
| `POST /classic/:day/abandon` | Terminer la partie et révéler la réponse.                                       |

Les écritures verrouillent la progression en transaction. Une double soumission ne compte qu’une fois, une carte retirée par l’indice est refusée et une journée expirée n’accepte plus d’essais. Les anciennes routes `/game` sont conservées pour compatibilité mais ne sont pas utilisées par cette interface.

## Tests et vérifications

```powershell
npm run test:unit
npm run test:browser

# Base SQL séparée : jamais DATABASE_NAME
$env:CLASSIC_TEST_DATABASE='mtgdle_classic_test'
node scripts/init-classic-test.cjs
npm run test:integration
```

La suite SQL refuse les noms de base sans suffixe `_classic_test` et refuse explicitement la base de développement. Elle ne vide que les trois tables de cette base dédiée. Sans `CLASSIC_TEST_DATABASE`, les tests SQL sont explicitement ignorés ; les autres TI HTTP restent exécutés. Le script d’initialisation crée la base si nécessaire et ne supprime aucune base.

Les tests Playwright simulent l’API. Ils vérifient sur ordinateur et mobile les propositions, le clavier, les erreurs réseau, le rechargement, les doublons masqués, l’indice, la victoire et l’abandon. Les TI SQL couvrent la concurrence, l’idempotence, les sessions distinctes, la conservation du défi, les essais au-delà de dix et la préservation de la cible après l’indice.

## Limites connues et suite

Les dates et images viennent des premières impressions anglaises papier présentes dans le **snapshot bulk local**. Le filtre exclut les promos, full art, borderless, showcase et extended art ; la référence est départagée de façon stable par identifiant. Cela ne constitue pas encore une certification exhaustive de la première sortie mondiale : certaines premières éditions ou variantes peuvent manquer du snapshot. Le classement de chaque artwork mérite une validation éditoriale.

La détection des capacités activées repose sur le texte sans rappels ni capacités accordées entre guillemets, complété par une liste de mots-clés activés. Les cas particuliers nécessiteront des corrections manuelles. Les types et mots-clés sont affichés en anglais ; la comparaison des mots-clés donne pour l’instant un résultat global, sans surligner chaque mot commun.

Le premier jet ne comprend pas encore les statistiques personnelles agrégées, les séries, l’indice lore, l’évitement des réponses récentes, les modes zoom/flou, la gestion éditoriale du catalogue ni la protection des anciennes routes d’administration. Il reste destiné au développement local. Les snapshots utilisent la version 1 des règles ; une évolution des règles doit prévoir leur versionnement.

La base de développement contient seulement les nouvelles tables et une session d’essai utilisée pour la vérification dans le navigateur ; les cartes, éditions et anciennes parties sont préservées. Les tests d’écriture utilisent la base dédiée.

## Bilan de recette

La commande `test:all` a été exécutée avec `CLASSIC_TEST_DATABASE=mtgdle_classic_test` : 25 TU et 12 TI réussis, puis 17 scénarios Playwright réussis et un scénario de thème ignoré sur mobile (contrôle absent de la navigation mobile existante). Les contrôles TypeScript et les builds API/front réussissent. Le build front conserve un avertissement sur un chunk de plus de 500 kB. Le nouveau code serveur et le composant de jeu passent leur lint ; cela ne résout pas la dette de lint préexistante du reste du dépôt.

Une vérification réelle dans le navigateur a également confirmé le chargement des 472 cartes, la comparaison de Path to Exile, son retrait des choix et la récupération de cet essai après rechargement.
