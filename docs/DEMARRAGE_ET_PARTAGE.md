# Démarrer MTGdle et le partager temporairement

Les commandes s’exécutent à la racine du dépôt. Elles utilisent les dépendances déjà installées et les fichiers `.env` existants. PostgreSQL doit être lancé et le catalogue Classic déjà préparé. Sur une nouvelle installation, suivre [le guide du premier jet](PREMIER_JET.md), puis exécuter `npm run prepare:classic` une fois.

## Jouer et développer sur son PC

```sh
npm run start:local
```

La commande compile les types partagés, lance l’API et le serveur de développement React avec rechargement automatique, puis affiche l’adresse locale. Elle utilise `BACK_API_PORT` et `FRONT_API_PORT` du `.env` ; sans configuration, les ports sont 3000 et 5173. L’adresse utilise `localhost` pour conserver les cookies locaux existants. Le frontend transmet ses requêtes `/api` vers l’API sur le même ordinateur.

`npm run dev:classic` reste un alias du même démarrage. `Ctrl+C` arrête les services lancés par cette commande.

## Envoyer un lien à un ami

```sh
npm run start:distant
```

La commande :

1. Vérifie que ses ports sont libres et prépare `cloudflared`.
2. Compile les types partagés et une version de production du frontend dans `packages/front/dist-shared`.
3. Lance une API sur `127.0.0.1:3003`, avec les batchs planifiés et la synchronisation destructive de schéma désactivés.
4. Sert le jeu et les seules routes Classic autorisées derrière `http://127.0.0.1:5180`.
5. Ouvre un Quick Tunnel Cloudflare et affiche **« Lien à partager : https://…trycloudflare.com »**.

Il suffit de copier ce lien à son ami. Aucun compte Cloudflare, nom de domaine ou réglage de la box n’est nécessaire. Le lien est public pour quiconque le possède. Le PC, PostgreSQL et le terminal doivent rester ouverts. `Ctrl+C` arrête le tunnel, le serveur de partage et son API ; sous Windows, répondre `O` si npm demande de terminer le programme de commandes. L’adresse change au prochain démarrage.

Le mode distant peut fonctionner en même temps que le mode local grâce à ses ports distincts. Il utilise **la même base locale** : les visiteurs ont leurs sessions anonymes propres et leurs essais alimentent les statistiques locales. Aucune partie n’est réinitialisée au démarrage ou à l’arrêt.

Le serveur distant sert uniquement les fichiers compilés et transmet les appels de jeu suivants : `GET /api/classic/today`, `GET /api/classic/:day/art` et `POST /api/classic/:day/{guesses,hint,abandon}`. Les sources, le serveur Vite, Swagger et les routes d’import/administration ne sont pas partagés. Les cookies de session restent HttpOnly et deviennent Secure quand le tunnel utilise HTTPS. L’API n’accepte les en-têtes du proxy local que dans ce démarrage explicite.

## Client Cloudflare

La commande utilise `cloudflared` s’il est déjà installé dans le PATH, ou le chemin indiqué dans `CLOUDFLARED_PATH`. Sinon, sous Windows x64 et Linux x64/ARM64, elle télécharge la version officielle **2026.10.6** et vérifie son SHA-256 avant utilisation. Le binaire reste dans `.tools/cloudflared/`, exclu de Git ; il n’y a pas d’installation globale. Le premier lancement nécessite donc un accès à GitHub. Sur les autres plateformes, installer [cloudflared](https://developers.cloudflare.com/tunnel/downloads/) dans le PATH avant de relancer.

Références : [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/), [publication officielle et empreintes](https://github.com/cloudflare/cloudflared/releases/tag/2026.10.6).

## Changer les ports de partage

Exemple PowerShell, dans le terminal du démarrage :

```powershell
$env:SHARE_PORT = '5181'
$env:SHARE_API_PORT = '3004'
npm run start:distant
```

Un port occupé provoque un arrêt explicite avant de lancer les services. La commande ne coupe aucun programme préexistant. Ces deux variables peuvent aussi être placées dans le `.env` local.

Le mode distant est destiné aux essais entre amis. Il ne remplace pas le déploiement permanent sur un hébergeur.

## Vérifications

Les tests d’intégration du proxy (`classic.preview.ti.spec.ts`) couvrent les cookies, la séparation des sessions, les requêtes JSON, les images, les erreurs API, les routes interdites, les fichiers hors racine, les corps trop volumineux et les ports IPv4/IPv6 déjà occupés. Les scénarios Playwright utilisent désormais l’API relative `/api`. Les deux démarrages et un accès HTTPS public réel ont également été vérifiés, sans soumettre de proposition dans la base locale.

Validation : 29 tests unitaires, 25 tests d’intégration (dont six pour le partage et les ports), 34 scénarios Playwright ; TypeScript et lint des fichiers modifiés validés. Le tunnel de vérification est arrêté après les essais.
