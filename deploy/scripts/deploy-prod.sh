#!/usr/bin/env bash
# Build y arranque del stack de producción
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="${ENV_FILE:-.env.production}"

echo "=== Waná — deploy producción ==="

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: falta $ENV_FILE"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker no instalado"
  exit 1
fi

echo "→ Validando variables..."
ENV_FILE="$ROOT/$ENV_FILE" "$ROOT/deploy/scripts/validate-env.sh" || {
  echo ""
  echo "Corrige .env.production antes de continuar (o usa PAYMENTS_MODE=mock solo para staging)."
  read -r -p "¿Continuar de todos modos? [y/N] " ans
  [[ "$ans" =~ ^[yY]$ ]] || exit 1
}

echo "→ Build imágenes..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

echo "→ Arrancando servicios..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo "→ Esperando health..."
sleep 8

if curl -sf "http://localhost/health" >/dev/null 2>&1; then
  echo "✓ API health OK (vía nginx localhost)"
else
  echo "⚠ Health check falló en localhost — revisa logs:"
  echo "  docker compose -f $COMPOSE_FILE logs --tail=50 api web nginx"
fi

echo ""
echo "=== Deploy completado ==="
echo "Verifica: curl http://localhost/health"
echo "Logs: docker compose -f $COMPOSE_FILE logs -f"
