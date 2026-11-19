# Batchs Nest et administration

## Organisation

Le métier appartient à l'API Nest, en TypeScript. Le CLI n'ouvre aucun serveur HTTP : `NestFactory.createApplicationContext(BatchModule)` charge la configuration, le DataSource et les services injectés, exécute le traitement puis ferme les connexions. Les tâches planifiées de l'API web ne sont pas chargées.

| Commande | Service utilisé | Effet |
| --- | --- | --- |
| `database:sync` | DataSource configuré par l'API | Crée ou actualise le schéma de développement à partir de tous les modèles TypeORM enregistrés. |
| `scryfall:download` | `ScryfallBulkDataService` et son DAO | Télécharge le snapshot vers le chemin configuré. Conversion JSONL/gzip en streaming ; remplace le fichier seulement après succès. |
| `scryfall:import` | `BulkApiService.importAll` | Exécute le même import que la route HTTP existante, depuis le snapshot local. |
| `classic:prepare` | `ClassicCatalogueService.prepare` | Prépare le catalogue et enrichit les médias des défis existants en conservant les réponses et les parties. |

`classic:prepare --check` parcourt les données sans écrire. La préparation du catalogue ne modifie jamais le schéma.

Les modèles Classic suivent la même architecture que les autres modèles : classes TypeScript, `EntitySchema`, repositories et services Nest. `ClassicCatalogueRepository` porte les lectures et écritures du catalogue ; `ClassicRepository` porte les transactions, les accès aux défis et les verrous sur les progressions. Aucun SQL n'est écrit dans les services Classic.

## Sur le poste de développement

Depuis la racine, avec les fichiers `.env` habituels et PostgreSQL démarré :

```bash
npm run build:shared-types
npm run build:api
npm run batch -- database:sync
npm run batch -- scryfall:download
npm run batch -- scryfall:import
npm run batch -- classic:prepare --check
npm run prepare:classic
```

Pendant cette phase de développement, `database:sync` remplace la gestion des migrations. Le schéma est défini par les modèles, et les données peuvent être repeuplées avec les batchs d'import et de préparation. La commande peut changer le schéma et les données concernées par une modification de modèle : elle est volontairement explicite. La synchronisation automatique au démarrage reste désactivée. Après modification du code TypeScript des batchs, recompiler l'API. Le raccourci historique `prepare:classic` appelle le batch Nest.

Dans Docker, le JavaScript compilé se trouve dans `packages/api/dist/batches`, comme celui du serveur API. Aucune dépendance à ts-node n'est nécessaire dans les images runtime. Voir [le déploiement VPS](DEPLOIEMENT_VPS.md) pour les commandes Docker.

## Santé du service

Le contrôle de santé réutilise `HealthApiService` et les indicateurs Terminus existants. `GET /health` conserve le diagnostic complet PostgreSQL et Scryfall ; `GET /health/database` réutilise seulement l'indicateur PostgreSQL pour Docker. Une panne de Scryfall ne doit pas empêcher le jeu de servir le catalogue déjà importé. Aucun service de readiness ni requête SQL de santé séparée n'est nécessaire.

## Routes d'administration

Le projet n'a pas encore de comptes administrateurs ni d'authentification des joueurs. La protection mise en place est une identité technique d'administration : un token Bearer à configurer dans `ADMIN_API_TOKEN` (au moins 32 caractères). Le token doit rester dans l'environnement serveur, jamais dans le frontend ni dans Git.

- Token absent : administration HTTP désactivée, réponse 403.
- Token manquant ou incorrect côté requête : réponse 401, sans lancer le traitement.
- Token correct : accès aux opérations protégées par `@AdminOnly()` et `AdminGuard`.

Les opérations protégées sont l'import global Scryfall, les imports/créations de cartes et d'éditions, l'ajout de cartes jouables et `POST /admin/catalogue/prepare?check=true|false`. Cette dernière route et le batch utilisent le même `ClassicCatalogueService`.

Cette identité technique ne constitue pas un système de comptes et de rôles utilisateurs. Un futur système d'authentification pourra remplacer le guard en conservant les services métier.

Le proxy public actuel conserve sa liste de routes de jeu autorisées. Les routes d'administration sont donc aussi filtrées par Nginx. Pour les utiliser, passer par un tunnel SSH ; ne transmettre le token sur Internet qu'après configuration de HTTPS. Les batchs, exécutés directement sur le serveur, n'utilisent pas le token HTTP.

## Infrastructure et outillage

- `deploy/` : commandes Linux pour Docker, sauvegardes et déploiement. Elles ne portent aucune règle du jeu.
- `tools/dev/` : démarrage local, aperçu et tunnel temporaire.
- `tools/testing/` : création d'une base dédiée aux tests SQL.

Les fichiers `.cjs` de `tools/` sont des utilitaires Node pour les développeurs et les agents ; ils ne sont ni chargés par Nest ni embarqués dans l'image runtime de l'API.

Les types de santé partagés sont définis dans `packages/shared-types/src/health.interface.ts`, exportés par le point d'entrée `@mtgdle/shared-types`. Le frontend importe les contrats via ce package, sans accéder à ses fichiers `dist` ni redéfinir les types dans un service frontend.
