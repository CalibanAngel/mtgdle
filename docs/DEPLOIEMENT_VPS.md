# MTGdle sur un VPS avec Docker

Installation : `/opt/mtgdle`. Configuration secrète : `.env.production` (mode 600, jamais dans Git).
Le fichier Compose de développement est conservé. La production utilise explicitement `compose.production.yaml`.

## Architecture

- Nginx sert le build React et transmet seulement les routes Classic du jeu.
- L'API NestJS tourne sous Node.js 24, avec un utilisateur non privilégié.
- PostgreSQL 17 conserve ses données dans le volume Docker `mtgdle_pgdata`.
- Seul le port HTTP de Nginx est publié. PostgreSQL et l'API ne sont pas publiés.
- Les conteneurs redémarrent avec Docker. Les journaux sont limités à trois fichiers de 10 Mo par service.
- Les tâches historiques et la synchronisation automatique du schéma sont désactivées.

Docker est installé depuis son dépôt officiel : https://docs.docker.com/engine/install/ubuntu/.

## Commandes courantes

```bash
cd /opt/mtgdle
sudo docker compose --env-file .env.production -f compose.production.yaml ps
sudo docker compose --env-file .env.production -f compose.production.yaml logs --tail=100 api web
sudo docker compose --env-file .env.production -f compose.production.yaml restart api web
```

Ne jamais utiliser `down -v` : cela supprimerait la base.

## Installation de la version de développement

```bash
cp .env.production.sample .env.production
chmod 600 .env.production
# Remplacer le mot de passe d'exemple par une valeur aléatoire avant de continuer.
mkdir -p data backups
sudo chown 1000:1000 data
sudo docker compose --env-file .env.production -f compose.production.yaml build
sudo docker compose --env-file .env.production -f compose.production.yaml up -d postgres
sudo docker compose --env-file .env.production -f compose.production.yaml run --rm api node dist/batches/main.js database:sync
sudo docker compose --env-file .env.production -f compose.production.yaml run --rm --no-deps -v /opt/mtgdle/data:/data:rw api node dist/batches/main.js scryfall:download
sudo docker compose --env-file .env.production -f compose.production.yaml run --rm api node dist/batches/main.js scryfall:import
sudo docker compose --env-file .env.production -f compose.production.yaml run --rm api node dist/batches/main.js classic:prepare
sudo docker compose --env-file .env.production -f compose.production.yaml up -d --wait
```

Le projet est en développement : le batch `database:sync` synchronise le schéma directement à partir des modèles TypeORM, Classic compris. Il n'y a pas de migration Classic manuelle. Cette opération explicite peut modifier le schéma lorsque les modèles changent ; les données de cette version peuvent être repeuplées. La synchronisation automatique au démarrage reste désactivée.

Le service Scryfall existant accepte l'ancien tableau JSON et le fichier JSONL compressé. Le batch `scryfall:download` réutilise ce service et la configuration `SCRYFALL_BULK_FILE`. Le fichier de données n'est pas embarqué dans les images.

L'import est une opération d'administration. Le batch `scryfall:import` et la route existante `/scryfall/import/all` appellent le même service Nest. Le catalogue est préparé après l'import. Les données et les parties du poste de développement ne sont pas transférées. Voir [les batchs et droits d'administration](BATCHS_ET_ADMINISTRATION.md).

Le contrôle de santé Docker appelle `/health/database`, via le service `HealthApiService` et son indicateur PostgreSQL existants. `/health` conserve le diagnostic complet, Scryfall compris. Aucun service de readiness séparé n'est utilisé.

Le répertoire `data` doit être accessible en lecture par l'UID 1000 du conteneur. Pour exécuter le téléchargement avec l'utilisateur du conteneur, ce répertoire doit également lui être accessible en écriture.

## Sauvegardes

```bash
sudo bash /opt/mtgdle/deploy/backup.sh
sudo install -m 644 deploy/mtgdle-backup.service deploy/mtgdle-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mtgdle-backup.timer
sudo systemctl list-timers mtgdle-backup.timer
```

Une sauvegarde PostgreSQL au format custom est créée quotidiennement vers 04:00 Europe/Paris et conservée 14 jours. Son catalogue est vérifié avec `pg_restore --list`. Elle reste sur le VPS : prévoir une copie hors du serveur pour protéger les données d'une perte du VPS.

Pour restaurer, arrêter l'API et le frontend, sauvegarder l'état courant, puis restaurer le dump sélectionné avec `pg_restore` dans une base vide. Tester une restauration dans une base séparée avant de remplacer la production.

## CI et publication des images

Le workflow `ci.yml` s'exécute sur les pull requests et les commits de `master` :

1. Installation via le lockfile Bun, compilation des types, de l'API et du frontend.
2. Tests unitaires et d'intégration sur une base PostgreSQL de test dédiée.
3. Tests navigateur Chromium, ordinateur et mobile.
4. Construction des deux images Docker.
5. Sur `master` uniquement, publication de `ghcr.io/calibanangel/mtgdle-api:<SHA>` et `ghcr.io/calibanangel/mtgdle-web:<SHA>`.

Les images sont étiquetées avec le SHA complet du commit. Le token fourni par GitHub ne dispose de `packages: write` que dans le job de publication. Aucun accès SSH n'est nécessaire pour la CI.

Références : https://bun.sh/guides/runtime/cicd et https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions.

## Déploiement depuis GitHub, à activer après validation

Le workflow `deploy.yml` est désactivé tant que la variable de dépôt `DEPLOY_ENABLED` n'est pas `true`. Son déclenchement est manuel depuis `master`, pour un SHA complet dont les images ont déjà été publiées.

Préparer l'environnement GitHub `production`, avec revue obligatoire si disponible, et ses secrets : `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`. Utiliser une nouvelle clé dédiée à la CI ; ne pas recopier la clé personnelle de configuration dans GitHub. La clé d'hôte est vérifiée strictement, à partir d'une empreinte contrôlée indépendamment.

Le compte distant doit être autorisé à exécuter `sudo -n /opt/mtgdle/deploy/release.sh <SHA>`. Avant de lui donner ce droit, rendre le script et les fichiers qu'il exécute non modifiables par ce compte et restreindre la clé SSH à la commande de déploiement. Ne pas ajouter ce compte au groupe Docker : ce groupe donne des privilèges équivalents à root.

Les packages GHCR peuvent rester privés : le job transmet son `GITHUB_TOKEN` temporaire, avec `packages: read`, sur l'entrée standard de SSH. Le script utilise une configuration Docker temporaire, supprimée après les téléchargements et en cas d'échec. Aucun token personnel ni identifiant de registre permanent n'est installé sur le VPS. Les packages doivent autoriser l'accès du dépôt qui exécute le workflow.

La commande SSH autorisée est `sudo -n /opt/mtgdle/deploy/release.sh <SHA> --registry-token-stdin`. Le compte dédié `mtgdle-deploy` utilise une clé avec `restrict` et une commande forcée qui valide ce format et le SHA. Il ne dispose pas d'un shell libre ni d'un accès au groupe Docker. Le script, le wrapper SSH, le fichier Compose et leurs répertoires parents appartiennent à root et ne sont pas modifiables par ce compte.

Le déploiement télécharge les images, sauvegarde la base, change les références d'images, puis attend les contrôles de santé. Nginx est redémarré pour résoudre la nouvelle adresse de l'API ; une requête à `/api/classic/today` vérifie ensuite la chaîne proxy/API/base. En cas d'échec, il restaure les anciennes références d'images. Le déploiement des images ne synchronise pas le schéma : pendant le développement, utiliser explicitement `database:sync` quand les modèles évoluent.

## Domaine et HTTPS

L'installation initiale fonctionne sur l'adresse IP en HTTP. Les cookies ne sont alors pas chiffrés en transit.

Une fois le domaine acheté : créer un enregistrement DNS A vers l'IPv4 du VPS, puis ajouter un frontal HTTPS (par exemple Caddy). Ne créer un AAAA que si le service est également configuré et vérifié en IPv6.

Lors de l'ajout d'un frontal HTTPS, adapter explicitement la chaîne de confiance du proxy et les en-têtes `X-Forwarded-Proto` : la configuration actuelle de Nginx utilise son propre protocole HTTP et n'accepte pas les en-têtes fournis par les visiteurs. Vérifier ensuite que le cookie de session est bien `Secure` et que le renouvellement du certificat fonctionne.
