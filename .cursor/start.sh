#!/usr/bin/env bash
# Cloud Agent start phase for Waná (wana-2026).
# Per-boot reconciliation: (re)start the Postgres daemon (processes do not
# survive into a fresh pod booted from a snapshot) and make sure the schema
# and demo data exist. All steps are idempotent and the script returns.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PG_VERSION=16
DB_NAME=wana
DB_USER=wana
DB_PASSWORD=wana_dev_password
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

echo "==> Starting PostgreSQL cluster"
sudo pg_ctlcluster "$PG_VERSION" main start >/dev/null 2>&1 || true
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

# Guarantee role + database exist (in case the cluster is fresh).
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

echo "==> Applying migrations + seed (idempotent)"
( cd api && DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy )
( cd api && DATABASE_URL="$DATABASE_URL" npm run db:seed )

echo "==> Start reconciliation complete. Postgres is ready on localhost:5432."
