#!/usr/bin/env bash
# Comprueba que cada ruta sirve su propia página: un 200 no basta.
# La portada llegó a servir la página de /app con todos los health checks en verde
# (ver resolve.preferAbsolute en next.config.ts).
# Uso: check-web-routes.sh [base-url]   (por defecto http://localhost)
set -euo pipefail

BASE_URL="${1:-${BASE_URL:-http://localhost}}"
BASE_URL="${BASE_URL%/}"

# Texto del primer <h1> de la ruta; vacío si la página no tiene.
heading() {
  local html
  if ! html=$(curl -fsS --max-time 20 "$BASE_URL$1"); then
    echo "✗ $1 no respondió 200 en $BASE_URL" >&2
    return 1
  fi
  printf '%s' "$html" | tr '\n' ' ' | grep -oE '<h1[^>]*>.*' | sed -E 's/<\/h1>.*//; s/<[^>]*>//g' || true
}

home=$(heading /)
install=$(heading /app)

if [[ -n "$home" && "$home" == "$install" ]]; then
  echo "✗ La portada (/) está sirviendo la página de /app: \"$home\""
  exit 1
fi

echo "✓ / → \"${home:-sin h1}\""
echo "✓ /app → \"${install:-sin h1}\""
