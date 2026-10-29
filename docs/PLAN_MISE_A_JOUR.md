# Plan de mise à jour — 28 octobre 2026

## Cadre

Travail réalisé sur `codex/stabilisation-tests-dependances`, issue de `feat/add-game`. Les anciennes branches sont conservées : certaines références distantes ont disparu, mais cela ne suffit pas à justifier leur suppression. Les documents et corrections restent dans la nouvelle branche de travail, sans publication distante automatique.

Ce plan prévoit les mises à jour ; il ne signifie pas que les runtimes globaux ou toutes les dépendances ont déjà été mis à niveau.

## Versions et trajectoire

- Node local observé : **24.11.1**. Première étape : dernier correctif de la branche 24 LTS, puis évaluation séparée de Node 26 avec tests et builds. La page officielle des releases consultée mentionne **24.22.1** ; revérifier au moment d'exécuter la mise à jour. [Releases Node](https://github.com/nodejs/node/releases).
- Bun : absent du PATH de cette session, malgré des dépendances installées et des lockfiles Bun. Installer une version stable explicite et la consigner dans `packageManager` ; la page officielle consultée affiche **1.4.4**. [Bun](https://bun.sh/).
- Conserver Node comme runtime API et Bun comme gestionnaire de workspaces pour cette première étape. Migrer le runtime API vers Bun serait un changement distinct.

## Lots de migration

| Lot                       | Travail                                                                                                                                                                             | Validation et retour arrière                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1. Socle reproductible    | Choisir une version Node et Bun explicite, documenter l'installation Windows, garder un unique lockfile racine versionné ; déclarer chaque dépendance dans son package utilisateur. | Installation propre avec lockfile figé dans un checkout séparé ; retour aux versions et lockfile précédents. |
| 2. Correctifs compatibles | Mettre à jour les patchs/minors des versions majeures actuelles, par famille : Nest/TypeORM/pg, React/HeroUI, Vite/TypeScript, Jest/ESLint.                                         | Tests, contrôles de types et build après chaque famille ; commit distinct et réversible.                     |
| 3. Outillage              | Aligner TypeScript dans les workspaces, vérifier les peer dependencies de Jest/ts-jest et ESLint/plugins, consolider les scripts CI.                                                | Tests unitaires et HTTP, lint sans autofix, build partagé puis API et front.                                 |
| 4. Majeures               | Évaluer React, Vite, Nest et TypeORM individuellement à partir de leurs guides officiels ; ne pas grouper les changements majeurs.                                                  | Comparaison du rendu, démarrage et tests sur une base de test indépendante.                                  |
| 5. Node suivant           | Évaluer Node 26 après stabilisation du lot Node 24 ; ne pas déduire son statut réel uniquement du calendrier prévisionnel.                                                          | Même matrice de validation sur les deux runtimes, puis choix explicite.                                      |

Avant chaque lot, relever les versions réellement installées et les nouvelles versions disponibles avec le gestionnaire retenu. Examiner les changements incompatibles et les avis de sécurité ; ne pas exécuter une mise à jour générale aveugle. Une vérification mensuelle et un traitement rapide des correctifs de sécurité applicables suffisent pour ce projet.

## Base locale et exécution

Les tests courants utilisent des doubles ou de petits flux JSON, jamais les données personnelles de développement. Les tests de migrations/imports avec écritures doivent utiliser une base jetable dédiée. Une mise à niveau PostgreSQL est hors de ce plan de dépendances JavaScript et nécessite sa propre sauvegarde et répétition de restauration.

Pour une inspection du prototype existant, imposer `DATABASE_SYNCHRONIZE=false`, `DATABASE_DROP_SCHEMA=false` et `SCHEDULE_ENABLED=false`. Le dernier paramètre permet désormais de neutraliser le cron sans changer les données. Ne lancer aucun import ni génération quotidienne pendant cette inspection.

## Règles de lint vérifiées

Corriger les chemins Windows avec `fileURLToPath`, faire pointer le package partagé vers sa configuration `.mjs`, et exclure les fichiers générés de l'analyse. Le lint normal doit être en lecture seule ; l'autofix doit disposer d'une commande distincte. Côté React, déclarer les globals navigateur et conserver le contrôle des dépendances des hooks. Garder les tests dans le périmètre des contrôles plutôt que les exclure par principe.

Les avertissements de style existants doivent être traités dans un lot dédié pour conserver des diffs relisibles. Ne pas désactiver les règles de sûreté des promesses ou les erreurs TypeScript pour obtenir artificiellement une exécution verte.
