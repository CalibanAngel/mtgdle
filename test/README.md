# Conventions de tests

| Catégorie             | Suffixe        | Emplacement     | Commande                          |
| --------------------- | -------------- | --------------- | --------------------------------- |
| Unitaire (TU)         | `.spec.ts`     | `test/src/`     | `npm run test:unit` ou `npm test` |
| Intégration (TI)      | `.ti.spec.ts`  | `test/src/`     | `npm run test:integration`        |
| Navigateur Playwright | `.e2e.spec.ts` | `test/browser/` | `npm run test:browser`            |

Les configurations sélectionnent ces catégories séparément : les TU excluent explicitement les suffixes TI et navigateur. Playwright ne découvre que les `.e2e.spec.ts` de son dossier. `npm run test:all` exécute les trois catégories successivement et s’arrête au premier échec.

Un TU isole une fonction ou un service, avec des doubles pour ses dépendances. Un TI vérifie l’assemblage de plusieurs composants : les routes HTTP Nest avec leurs pipes, ou le service de santé avec HttpModule, Terminus et un serveur distant simulé par Nock. Le test de santé est donc classé en intégration même s’il n’utilise pas PostgreSQL.

Les TI actuels ne nécessitent aucune base locale. Les futurs tests SQL doivent utiliser une base jetable dédiée, jamais la base de développement. Les tests Playwright démarrent leur propre front et interceptent les appels API ; ils n’utilisent ni Nest ni PostgreSQL. Installer Chromium avec `npx playwright install chromium` avant leur première exécution.

`npm run test:cov` produit la couverture des TU dans `coverage/unit/`, et `npm run test:integration:cov` celle des TI dans `coverage/integration/`. L’ancienne commande `test:http` reste un alias de compatibilité vers les TI ; préférer `test:integration` pour les nouveaux usages. La configuration historique `test/jest-e2e.json` est remplacée par `jest.integration.config.ts`.
