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
if ! ENV_FILE="$ROOT/$ENV_FILE" "$ROOT/deploy/scripts/validate-env.sh"; then
  echo ""
  echo "Corrige .env.production antes de continuar."
  # Sin TTY (CI/SSH no interactivo) nunca se continúa con una validación fallida
  if [[ -t 0 && "${FORCE_DEPLOY:-}" != "1" ]]; then
    read -r -p "¿Continuar de todos modos? [y/N] " ans
    [[ "$ans" =~ ^[yY]$ ]] || exit 1
  elif [[ "${FORCE_DEPLOY:-}" != "1" ]]; then
    exit 1
  fi
fi

echo "→ Build imágenes (web, api, bot)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

echo "→ Arrancando servicios..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

echo "→ Esperando health (hasta 120s)..."
wait_for() {
  local name="$1" url="$2"
  for _ in $(seq 1 24); do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "✓ $name OK ($url)"
      return 0
    fi
    sleep 5
  done
  echo "✗ $name no respondió en $url"
  return 1
}

failed=0
wait_for "API" "http://localhost/health" || failed=1
wait_for "Web" "http://localhost/" || failed=1
wait_for "WhatsApp bot" "http://localhost/bot/health" || failed=1

if [[ $failed -ne 0 ]]; then
  echo "Logs: docker compose -f $COMPOSE_FILE logs --tail=50 api web bot nginx"
  docker compose -f "$COMPOSE_FILE" logs --tail=30 api web bot nginx || true
  exit 1
fi

# Libera imágenes huérfanas de builds anteriores (no toca volúmenes)
docker image prune -f >/dev/null 2>&1 || true

echo ""
echo "=== Deploy completado ==="
echo "Logs: docker compose -f $COMPOSE_FILE logs -f"
