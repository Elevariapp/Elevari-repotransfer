#!/usr/bin/env bash
# Restore a PostgreSQL backup into the production/staging compose stack.
# Usage: ./deploy/scripts/restore-db.sh backups/wana_YYYYmmdd_HHMMSS.sql.gz [--yes]
# Requires an explicit --yes flag: restore is destructive for the target database.
set -euo pipefail

BACKUP_FILE="${1:-}"
CONFIRM="${2:-}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup.sql.gz> [--yes]" >&2
  exit 1
fi

if [ "$CONFIRM" != "--yes" ]; then
  echo "Refusing to restore without --yes (this overwrites the target database)." >&2
  exit 1
fi

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"

# shellcheck disable=SC1090
source "$ENV_FILE"

# 1. Verify checksum when available.
if [ -f "${BACKUP_FILE}.sha256" ]; then
  sha256sum -c "${BACKUP_FILE}.sha256" --status || {
    echo "Checksum verification failed for ${BACKUP_FILE}" >&2
    exit 1
  }
  echo "Checksum OK"
fi

# 2. Restore.
gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

# 3. Verify critical tables are readable and non-empty where expected.
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "SELECT 'bookings=' || count(*) FROM bookings; SELECT 'payments=' || count(*) FROM payments; SELECT 'payment_events=' || count(*) FROM payment_events;"

echo "Restore completed from ${BACKUP_FILE}"
