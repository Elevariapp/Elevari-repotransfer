#!/usr/bin/env bash
# Pre-live deploy con mock payments (sin keys)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE="${ENV_FILE:-.env.staging}"

echo "=== Waná — Pre-live staging (sin keys) ==="

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: falta $ENV_FILE"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker no instalado. Instala Docker Desktop y reintenta."
  exit 1
fi

# Si despliegas en VPS con IP, pásala: STAGING_HOST=1.2.3.4 ./deploy/scripts/deploy-staging.sh
if [[ -n "${STAGING_HOST:-}" ]]; then
  echo "→ Configurando URLs para $STAGING_HOST"
  sed -i.bak "s|http://localhost|http://${STAGING_HOST}|g" "$ENV_FILE"
  export NEXT_PUBLIC_SITE_URL="http://${STAGING_HOST}"
  export NEXT_PUBLIC_API_URL="http://${STAGING_HOST}"
fi

echo "→ Validando staging env..."
ENV_FILE="$ROOT/$ENV_FILE" STAGING=1 "$ROOT/deploy/scripts/validate-env.sh"

# Liberar disco/RAM de builds anteriores (no borra volúmenes de DB)
echo "→ Limpiar cache Docker builder..."
docker builder prune -f 2>/dev/null || true

# Builds Next en VPS pequeños suelen OOM — swap temporal si hace falta
if ! swapon --show 2>/dev/null | grep -q '/swapfile'; then
  if [[ ! -f /swapfile ]]; then
    echo "→ Creando swap 2GB para build web..."
  fi
  if [[ ! -f /swapfile ]]; then
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile 2>/dev/null || true
fi

echo "→ Build API..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build api

echo "→ Build Web..."
build_web() {
  if [[ "${BUILD_NO_CACHE:-}" == "1" ]]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache web
  else
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build web
  fi
}
attempt=1
until build_web; do
  if [[ $attempt -ge 3 ]]; then
    echo "Error: build web falló tras 3 intentos"
    exit 1
  fi
  echo "   Reintentando build web ($attempt/3)..."
  attempt=$((attempt + 1))
  sleep 5
done

echo "→ Limpiar imágenes Docker huérfanas..."
docker image prune -f 2>/dev/null || true

echo "→ Up..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo "→ Esperando API y Web (healthchecks)..."
deadline=120
elapsed=0
while [[ $elapsed -lt $deadline ]]; do
  api_ok=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps api --format '{{.Health}}' 2>/dev/null | head -1)
  web_ok=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps web --format '{{.Health}}' 2>/dev/null | head -1)
  if [[ "$api_ok" == "healthy" && "$web_ok" == "healthy" ]]; then
    echo "   API y Web healthy"
    break
  fi
  sleep 3
  elapsed=$((elapsed + 3))
done

echo "→ Reiniciar nginx (refrescar upstreams tras recreate)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart nginx

echo "→ Seed (primera vez)..."
sleep 10
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api npx prisma db seed 2>/dev/null || true

echo "→ Verificando..."
sleep 5
BASE_URL="${BASE_URL:-http://localhost}" "$ROOT/deploy/scripts/verify-health.sh"

echo ""
echo "=== Pre-live staging listo ==="
echo "Abre: http://localhost/properties"
echo "Login demo: guest@wana.local / wana12345"
echo "Flujo: reserva → checkout → pago mock"
echo ""
echo "Cuando tengas keys: copia a .env.production y npm run go-live:deploy"
