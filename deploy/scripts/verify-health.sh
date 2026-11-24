#!/usr/bin/env bash
# Verificación post-deploy (staging o prod)
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost}"
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expect="${3:-}"

  if response=$(curl -sf -o /tmp/elevari_check_body -w "%{http_code}" "$url" 2>/dev/null); then
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

echo "=== Elevari — verify health ($BASE_URL) ==="
echo ""

check "API health" "$BASE_URL/health" "200"
check "Web properties" "$BASE_URL/properties" "200"
check "API properties" "$BASE_URL/api/v1/properties" "200"
check "Sitemap" "$BASE_URL/sitemap.xml" "200"
check "Robots" "$BASE_URL/robots.txt" "200"
check "Login page" "$BASE_URL/auth/login" "200"
check "Register page" "$BASE_URL/auth/register" "200"

# A controlled invalid request proves that Cloudflare and nginx reach the auth API.
# It creates no account and attempts no real login.
check_auth_endpoint() {
  local name="$1"
  local endpoint="$2"
  local body code
  body=$(mktemp)
  code=$(curl -sS --max-time 30 -o "$body" -w "%{http_code}" \
    -H "Content-Type: application/json" --data '{}' "$BASE_URL$endpoint" || true)
  if [[ "$code" == "400" ]] && grep -q '"error":"Invalid body"' "$body"; then
    echo "✓ $name — HTTP 400 validation response"
  else
    echo "✗ $name — expected the API validation response, got HTTP $code"
    FAIL=1
  fi
  rm -f "$body"
}

check_auth_endpoint "Login API" "/api/v1/auth/login"
check_auth_endpoint "Register API" "/api/v1/auth/register"

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "=== Todas las verificaciones pasaron ==="
  exit 0
else
  echo "=== Algunas verificaciones fallaron ==="
  exit 1
fi
