#!/usr/bin/env bash
# Cloud Agent install phase for Waná (wana-2026).
# Idempotent: installs system deps, JS deps, generates the Prisma client,
# provisions the local Postgres role/db, and applies migrations + seed data.
# Safe to run repeatedly and against a cached/snapshotted filesystem.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PG_VERSION=16
DB_NAME=wana
DB_USER=wana
DB_PASSWORD=wana_dev_password
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"

echo "==> [1/6] System dependencies (PostgreSQL ${PG_VERSION})"
if ! command -v psql >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    "postgresql-${PG_VERSION}" postgresql-contrib
fi

echo "==> [2/6] Ensure PostgreSQL cluster is running"
sudo pg_ctlcluster "$PG_VERSION" main start >/dev/null 2>&1 || true
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then break; fi
  sleep 1
done

echo "==> [3/6] Provision database role and database (idempotent)"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -c "ALTER ROLE ${DB_USER} CREATEDB;" >/dev/null

echo "==> [4/6] Generate local env files if missing"
if [ ! -f api/.env ]; then
  cp .cursor/env-templates/api.env api/.env
  echo "    created api/.env"
fi
if [ ! -f .env.local ]; then
  cp .cursor/env-templates/web.env.local .env.local
  echo "    created .env.local"
fi

echo "==> [5/6] Install JS dependencies"
npm ci
( cd api && npm ci && npx prisma generate )

echo "==> [6/6] Apply migrations and seed demo data"
( cd api && DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy )
( cd api && DATABASE_URL="$DATABASE_URL" npm run db:seed )

echo "==> Install complete."
