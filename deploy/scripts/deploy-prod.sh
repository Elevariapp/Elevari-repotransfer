#!/usr/bin/env bash
# Build y arranque del stack de producción
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="${ENV_FILE:-.env.production}"

echo "=== Elevari — deploy producción ==="

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
  exit 1
}

echo "→ Build imágenes..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

echo "→ Arrancando servicios..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo "→ Esperando health (máx 120s)..."
MAX_RETRIES=24
RETRY_INTERVAL=5
for i in $(seq 1 "$MAX_RETRIES"); do
  if curl -sf "http://localhost/health" >/dev/null 2>&1; then
    echo "✓ API health OK (vía nginx localhost)"
    break
  fi
  if [[ "$i" -eq "$MAX_RETRIES" ]]; then
    echo "✗ API health check falló después de $((MAX_RETRIES * RETRY_INTERVAL))s"
    echo "  Revisa logs: docker compose -f $COMPOSE_FILE logs --tail=50 api web nginx"
    exit 1
  fi
  sleep "$RETRY_INTERVAL"
done

# WhatsApp bot health check
echo "→ Verificando WhatsApp bot health..."
for i in $(seq 1 "$MAX_RETRIES"); do
  if curl -sf "http://localhost/bot/health" >/dev/null 2>&1; then
    echo "✓ WhatsApp bot health OK"
    break
  fi
  if [[ "$i" -eq "$MAX_RETRIES" ]]; then
    echo "✗ WhatsApp bot health check falló después de $((MAX_RETRIES * RETRY_INTERVAL))s"
    echo "  Revisa logs: docker compose -f $COMPOSE_FILE logs --tail=50 whatsapp-bot"
    exit 1
  fi
  sleep "$RETRY_INTERVAL"
done

echo ""
echo "=== Deploy completado ==="
echo "Verifica: curl http://localhost/health"
echo "Logs: docker compose -f $COMPOSE_FILE logs -f"
