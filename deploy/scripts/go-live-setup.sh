#!/usr/bin/env bash
# Paso 1 local: infra + migraciones + validación
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
cd "$ROOT"

echo "=== Waná — Go-Live Setup (paso 1) ==="

if command -v docker >/dev/null 2>&1; then
  echo "→ Iniciando postgres, redis, minio..."
  docker compose up -d postgres redis minio minio-init
  echo "→ Esperando postgres..."
  sleep 5
else
  echo "⚠ Docker no disponible. Asegúrate de que PostgreSQL esté en localhost:5432"
fi

echo "→ Ejecutando migraciones..."
cd api
if npx prisma migrate deploy; then
  echo "✓ Migraciones aplicadas"
else
  echo "✗ Migraciones fallaron — ¿postgres corriendo?"
  exit 1
fi

cd "$ROOT"

if [[ -f .env.production ]]; then
  echo "→ Validando .env.production..."
  ./deploy/scripts/validate-env.sh || true
else
  echo "⚠ Crea .env.production (ya debería existir en raíz del proyecto)"
fi

echo ""
echo "=== Paso 1 completado ==="
echo "Siguiente: rellena keys en .env.production (paso 2)"
echo "Checklist: deploy/GO_LIVE_CHECKLIST.md"
