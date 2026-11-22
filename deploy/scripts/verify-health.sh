#!/usr/bin/env bash
# Verificación post-deploy (staging o prod)
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost}"
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expect="${3:-}"

  if response=$(curl -sf -o /tmp/wana_check_body -w "%{http_code}" "$url" 2>/dev/null); then
    if [[ -n "$expect" && "$response" != "$expect" ]]; then
      echo "✗ $name — HTTP $response (esperado $expect)"
      FAIL=1
    else
      echo "✓ $name — HTTP $response"
    fi
  else
    echo "✗ $name — sin respuesta en $url"
    FAIL=1
  fi
}

echo "=== Waná — verify health ($BASE_URL) ==="
echo ""

check "API health" "$BASE_URL/health" "200"
check "Web properties" "$BASE_URL/properties" "200"
check "API properties" "$BASE_URL/api/v1/properties" "200"
check "Sitemap" "$BASE_URL/sitemap.xml" "200"
check "Robots" "$BASE_URL/robots.txt" "200"

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "=== Todas las verificaciones pasaron ==="
  exit 0
else
  echo "=== Algunas verificaciones fallaron ==="
  exit 1
fi
