#!/usr/bin/env bash
# Backup PostgreSQL from the production compose stack.
# Adds integrity checksum, minimum-size validation and retention pruning.
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
MIN_BYTES="${BACKUP_MIN_BYTES:-1024}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# shellcheck disable=SC1090
source "$ENV_FILE"

OUTPUT="$BACKUP_DIR/wana_${TIMESTAMP}.sql.gz"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$OUTPUT"

SIZE=$(wc -c < "$OUTPUT" | tr -d ' ')
if [ "$SIZE" -lt "$MIN_BYTES" ]; then
  echo "ERROR: backup is suspiciously small (${SIZE} bytes) — aborting" >&2
  rm -f "$OUTPUT"
  exit 1
fi

sha256sum "$OUTPUT" > "${OUTPUT}.sha256"

# Retention: remove dumps (and checksums) older than RETENTION_DAYS.
find "$BACKUP_DIR" -name 'wana_*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -name 'wana_*.sql.gz.sha256' -type f -mtime "+${RETENTION_DAYS}" -delete

echo "Backup saved: $OUTPUT (${SIZE} bytes)"
echo "Checksum:     ${OUTPUT}.sha256"
echo "Retention:    ${RETENTION_DAYS} days"
