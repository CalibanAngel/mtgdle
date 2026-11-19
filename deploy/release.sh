#!/usr/bin/env bash
# Install this reviewed script on the VPS before enabling CD.
set -euo pipefail
if [ "$#" -ne 1 ] || [[ ! "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'Usage: release.sh <40-character Git commit SHA>' >&2
  exit 2
fi
cd /opt/mtgdle
exec 9>/var/lock/mtgdle-deploy.lock
flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
umask 077
api_image="ghcr.io/calibanangel/mtgdle-api:$1"
web_image="ghcr.io/calibanangel/mtgdle-web:$1"
docker pull "$api_image"
docker pull "$web_image"
bash deploy/backup.sh
previous="backups/env-before-$1-$(date -u +%Y%m%dT%H%M%SZ)"
cp .env.production "$previous"
sed '/^API_IMAGE=/d; /^WEB_IMAGE=/d' .env.production > .env.production.next
printf 'API_IMAGE=%s\nWEB_IMAGE=%s\n' "$api_image" "$web_image" >> .env.production.next
mv .env.production.next .env.production
if ! docker compose --env-file .env.production -f compose.production.yaml up -d --no-build --wait --wait-timeout 180; then
  cp "$previous" .env.production
  docker compose --env-file .env.production -f compose.production.yaml up -d --no-build --wait --wait-timeout 180
  echo 'Deployment failed; previous images restored. Database was preserved.' >&2
  exit 1
fi
echo "Deployed commit $1"
