# Outillage de développement et de test

Ces utilitaires peuvent être utilisés par une personne, une CI ou un agent. Ils ne contiennent pas les traitements métier de l'application.

- `dev/` : lancement local du jeu, proxy d'aperçu, vérification des ports et tunnel de partage temporaire. Utiliser `npm run start:local` et `npm run start:distant` depuis la racine.
- `testing/init-classic-test.cjs` : crée une base PostgreSQL dédiée dont le nom se termine obligatoirement par `_classic_test`. Ne supprime aucune base.

Les traitements Scryfall et catalogue se trouvent dans l'API Nest. Voir [les batchs et droits d'administration](../docs/BATCHS_ET_ADMINISTRATION.md). Les commandes d'infrastructure du VPS sont dans `deploy/`.
