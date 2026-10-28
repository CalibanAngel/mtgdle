# Validation de la branche de stabilisation

Le 28 octobre 2026, sur `codex/stabilisation-tests-dependances`.

## Corrections effectuées

- Chemins des tests adaptés au monorepo ; Jest privilégie les sources TypeScript aux anciens fichiers générés et résout les types partagés depuis les sources.
- Fixtures d'éditions et mocks de configuration remis à jour ; remplacement des tests du starter par des contrôles des routes actuelles.
- Interface d'ajout manuel exportée, conservation de l'instance `Card` dans le mapper split, retour du mixin de logger.
- Alignement du package partagé sur sa compilation CommonJS et correction du script de build API.
- Configuration ESLint partagée : point d'entrée `.mjs`, chemin Windows correct et exclusion des artefacts générés. Front : globals navigateur, contrôle des dépendances des hooks et séparation lint/autofix.
- Paramètre `SCHEDULE_ENABLED=false` ajouté pour inspecter l'application sans exécuter le cron.

## Résultats

| Contrôle                | Résultat                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Tests unitaires         | 10 suites, 20 tests réussis.                                                                                                 |
| Contrats HTTP           | 1 suite, 2 tests réussis, sans connexion à PostgreSQL.                                                                       |
| TypeScript API et front | Réussite.                                                                                                                    |
| Compilation API         | Réussite via `tsc -p packages/api/tsconfig.json`.                                                                            |
| Build Vite              | Réussite ; avertissement sur un chunk de plus de 500 kB.                                                                     |
| Lint front              | 0 erreur, 59 avertissements.                                                                                                 |
| Lint API sources        | 151 erreurs et 5 avertissements : 110 erreurs de formatage, 41 erreurs de typage non sûr. Dette restante, contrôle non vert. |
| Démarrage local         | API et front démarrés ; PostgreSQL existant accessible.                                                                      |
| Lecture du catalogue    | 472 cartes jouables, 210 éditions.                                                                                           |
| Navigateur              | Page rendue et recherche « Path » retournant Path to Exile, Loran of the Third Path et Path of Ancestry. Aucun essai soumis. |

Les nouveaux tests couvrent les lots complets et incomplets, le flux vide, l'arrêt sur erreur de stockage, la sélection manuelle vide, les résultats d'insertion, le seuil automatique, l'échec sur catalogue vide et la validation HTTP des UUID. Ils ne prétendent pas couvrir un moteur de comparaison encore inexistant.

Restent à ajouter lors de leur implémentation : tests du gameplay, statistiques et sauvegarde de session. Les tests d'intégration SQL, migrations et idempotence réelle des imports demandent une base de test dédiée ; ils n'ont pas été exécutés sur la base locale existante. Aucun import ni migration n'a été lancé.

## Commandes

Depuis la racine : `npm test`, `npm run test:http`, `npm run test:cov`, `npm run build:api`. Pour le lint, lancer `npm run lint` dans le package concerné. Le front propose aussi `npm run lint:fix`, explicitement modificateur.

Pour le démarrage API d'inspection sous PowerShell, après compilation de `shared-types` :

```powershell
$env:DATABASE_SYNCHRONIZE='false'
$env:DATABASE_DROP_SCHEMA='false'
$env:SCHEDULE_ENABLED='false'
$env:TS_NODE_PREFER_TS_EXTS='true'
Set-Location packages/api
node -r ts-node/register/transpile-only -r tsconfig-paths/register src/main.ts
```

Les valeurs imposées concernent le processus lancé ; les fichiers `.env` n'ont pas été modifiés. La base existante n'a reçu aucune écriture métier pendant les vérifications.

Le [plan de mise à jour](PLAN_MISE_A_JOUR.md) décrit la suite pour Node, Bun et les dépendances. Les runtimes globaux n'ont pas été mis à jour durant cette stabilisation.
