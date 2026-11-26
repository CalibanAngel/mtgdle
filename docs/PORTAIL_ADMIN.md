# Portail d’administration

Adresse de production : `https://mtgdle.calibanangel.fr/admin`.

Le portail fournit quatre vues :

- **Vue d’ensemble** : santé PostgreSQL/Scryfall via `HealthApiService`, activité du jeu sur trente jours et raccourcis.
- **Statistiques** : sessions, joueurs ayant proposé, victoires, abandons, nombre de propositions et indices utilisés sur 7, 30 ou 90 jours. Les jours suivent le fuseau Europe/Paris. Un même joueur sur deux jours compte comme deux participations ; il ne s’agit pas de visiteurs uniques. Les sessions sans proposition sont distinguées des joueurs actifs.
- **Opérations** : vérification/préparation du catalogue, téléchargement et import Scryfall, import d’éditions ou d’une carte, sélection automatique/manuelle des cartes jouables. Les mêmes services Nest sont utilisés par le portail, les routes et les batchs. Les mutations demandent confirmation et un seul traitement peut tourner à la fois depuis le portail.
- **Base de données** : dix tables applicatives autorisées, nombre de lignes, recherche littérale, tri, pagination et détail JSON d’une ligne. Lecture seule : aucun éditeur SQL, écriture ou suppression. Les valeurs volumineuses sont prévisualisées dans la liste et accessibles dans le détail.

## Connexion

Un compte est configuré par `ADMIN_USERNAME` (par défaut `admin`) et `ADMIN_PASSWORD_HASH`. Aucun compte joueur ni système de rôles n’est ajouté. Sans hash, la connexion au portail est désactivée. `ADMIN_API_TOKEN` reste une identité technique Bearer indépendante pour l’outillage existant ; le portail ne demande et ne conserve pas ce token.

Le mot de passe est dérivé avec scrypt et un sel aléatoire de 16 octets. Il n’est stocké ni dans Git, ni en clair dans l’environnement serveur, ni dans le stockage du navigateur. La session opaque est conservée côté serveur pendant huit heures. Le cookie est `HttpOnly`, `SameSite=Strict`, limité à `/api/admin`, et `Secure` en production. Une déconnexion révoque la session ; un redémarrage de l’API termine les sessions existantes. La connexion est refusée sans HTTPS en production. Les mutations utilisant le cookie exigent le même origin et un en-tête de requête dédié. Les tentatives de connexion sont limitées dans Nest et dans Nginx.

Pour préparer ou remplacer le mot de passe sur le VPS, générer le hash avec le batch Nest :

```bash
cd /opt/mtgdle
read -rsp 'Nouveau mot de passe admin (12 caractères minimum) : ' admin_password
echo
printf '%s' "$admin_password" | sudo docker compose --env-file .env.production -f compose.production.yaml run --rm --no-deps -T api node dist/batches/main.js admin:password
unset admin_password
```

Copier uniquement la ligne `ADMIN_PASSWORD_HASH='scrypt$…'` obtenue dans `/opt/mtgdle/.env.production`, avec ses guillemets simples pour protéger les `$` de l’interpolation Compose. Conserver le mot de passe choisi dans un gestionnaire de mots de passe. Le fichier `.env.production` doit rester mode 600 et ne doit jamais être commité. Recréer le conteneur API avec la commande Compose habituelle ; redémarrer ensuite Nginx pour qu’il résolve la nouvelle adresse de l’API.

En développement, utiliser `VITE_API_URL=/api` et le proxy Vite existant : le portail et ses appels API doivent partager la même origine.

## Traitements et données

Ordre conseillé pour une source neuve : télécharger le snapshot, importer, puis préparer le catalogue. La vérification du catalogue utilise `prepare(true)` et n’écrit pas. L’API accède désormais au volume `data` en lecture/écriture pour le téléchargement autorisé ; le répertoire doit appartenir à l’UID 1000 du conteneur.

La réponse de démarrage d’un traitement contient immédiatement son identifiant. Le navigateur suit son état sans garder une connexion HTTP ouverte pendant l’import. Les vingt dernières tâches sont conservées en mémoire de l’instance API : un redémarrage interrompt la tâche en cours et efface cet historique. Le portail n’expose pas la synchronisation de schéma, la restauration d’une sauvegarde ni un terminal.

Les accès de lecture et les agrégations se trouvent dans `AdminRepository`, avec les autres repositories TypeORM. Aucun SQL n’est écrit dans les services ou contrôleurs. Les paramètres de recherche sont liés ; les tables et colonnes proviennent exclusivement des modèles autorisés. Les bornes des requêtes sont validées (50 lignes par page maximum et 90 jours de statistiques maximum).

Les contrats frontend/API sont exportés par `@mtgdle/shared-types`. Les DTO Nest portent les annotations Swagger ; le mot de passe de connexion est documenté comme champ d’écriture uniquement. Le proxy autorise `/api/admin` et continue de filtrer les anciennes routes de mutation hors de ce namespace. Les endpoints de données exigent une session ou le token technique ; les endpoints d’entrée/sortie de session appliquent leurs propres contrôles.
