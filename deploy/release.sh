#!/usr/bin/env bash
# Install this reviewed script on the VPS before enabling CD.
set -euo pipefail
if [ "$#" -lt 1 ] || [ "$#" -gt 2 ] || [[ ! "$1" =~ ^[0-9a-f]{40}$ ]] || [[ ${2:-} != '' && ${2:-} != '--registry-token-stdin' ]]; then
  echo 'Usage: release.sh <40-character Git commit SHA> [--registry-token-stdin]' >&2
  exit 2
fi
cd /opt/mtgdle
exec 9>/var/lock/mtgdle-deploy.lock
flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
umask 077
api_image="ghcr.io/calibanangel/mtgdle-api:$1"
web_image="ghcr.io/calibanangel/mtgdle-web:$1"
if [[ ${2:-} == '--registry-token-stdin' ]]; then
  registry_config=$(mktemp -d)
  trap 'rm -rf -- "$registry_config"' EXIT
  docker --config "$registry_config" login ghcr.io -u calibanangel --password-stdin
  docker --config "$registry_config" pull "$api_image"
  docker --config "$registry_config" pull "$web_image"
  rm -rf -- "$registry_config"
  trap - EXIT
else
  docker pull "$api_image"
  docker pull "$web_image"
fi
bash deploy/backup.sh
previous="backups/env-before-$1-$(date -u +%Y%m%dT%H%M%SZ)"
cp .env.production "$previous"
sed '/^API_IMAGE=/d; /^WEB_IMAGE=/d' .env.production > .env.production.next
printf 'API_IMAGE=%s\nWEB_IMAGE=%s\n' "$api_image" "$web_image" >> .env.production.next
mv .env.production.next .env.production
compose=(docker compose --env-file .env.production -f compose.production.yaml)
activate_release() {
  "${compose[@]}" up -d --no-build --wait --wait-timeout 180 || return 1
  # Nginx must resolve the API again after its container has been replaced.
  "${compose[@]}" restart web || return 1
  "${compose[@]}" up -d --no-build --wait --wait-timeout 180 || return 1
  for attempt in $(seq 1 15); do
    if "${compose[@]}" exec -T web wget -q -O /dev/null http://127.0.0.1:8080/api/classic/today; then
      if [[ -n $("${compose[@]}" ps -q caddy) ]]; then
        if "${compose[@]}" exec -T caddy sh -c 'wget -q -T 10 -O /dev/null "https://${PUBLIC_HOST}/api/classic/today"'; then
          return 0
        fi
      else
        return 0
      fi
    fi
    sleep 2
  done
  return 1
}
if ! activate_release; then
  cp "$previous" .env.production
  activate_release
  echo 'Deployment failed; previous images restored. Database was preserved.' >&2
  exit 1
fi
echo "Deployed commit $1"
