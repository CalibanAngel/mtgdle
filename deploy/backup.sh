#!/usr/bin/env bash
set -euo pipefail
cd /opt/mtgdle
umask 077
mkdir -p backups
backup="backups/mtgdle-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose --env-file .env.production -f compose.production.yaml exec -T postgres pg_dump -U mtgdle -d mtgdle -Fc > "${backup}.tmp"
test -s "${backup}.tmp"
docker compose --env-file .env.production -f compose.production.yaml exec -T postgres pg_restore --list < "${backup}.tmp" > /dev/null
mv "${backup}.tmp" "$backup"
find /opt/mtgdle/backups -maxdepth 1 -type f -name 'mtgdle-*.dump' -mtime +14 -delete
printf 'Backup verified: %s\n' "$backup"
