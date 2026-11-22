#!/usr/bin/env bash
# Smoke: auth API + Resend (forgot-password + booking confirmation)
set -euo pipefail

BASE_URL="${BASE_URL:-http://eleveri.app}"
SMOKE_AUTH_SECRET="${SMOKE_AUTH_SECRET:-}"
EMAIL="${SMOKE_EMAIL:-guest@wana.local}"
PASSWORD="${SMOKE_PASSWORD:-wana12345}"

pass=0
fail=0

ok() { echo "✓ $1"; pass=$((pass + 1)); }
bad() { echo "✗ $1"; fail=$((fail + 1)); }

json_field() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d$1)"
}

echo "=== Waná auth + Resend smoke ($BASE_URL) ==="

if ! curl -sf "$BASE_URL/health" >/dev/null; then
  echo "✗ API health unreachable"
  exit 1
fi
ok "Health"

if [[ -z "$SMOKE_AUTH_SECRET" ]]; then
  echo "✗ SMOKE_AUTH_SECRET required"
  exit 1
fi

smoke_login() {
  local role_email="$1"
  curl -sf -X POST "$BASE_URL/api/v1/auth/smoke-login" \
    -H 'Content-Type: application/json' \
    -H "X-Smoke-Secret: $SMOKE_AUTH_SECRET" \
    -d "{\"email\":\"$role_email\",\"password\":\"$PASSWORD\"}"
}

for account in guest@wana.local host@wana.local admin@wana.local; do
  resp=$(smoke_login "$account") || { bad "smoke-login $account"; continue; }
  token=$(echo "$resp" | json_field "['token']")
  role=$(echo "$resp" | json_field "['user']['role']")
  me=$(curl -sf "$BASE_URL/api/v1/auth/me" -H "Authorization: Bearer $token")
  me_email=$(echo "$me" | json_field "['user']['email']")
  if [[ "$me_email" == "$account" ]]; then
    ok "smoke-login + /me → $account ($role)"
  else
    bad "/me mismatch for $account"
  fi
done

guest_token=$(smoke_login "$EMAIL" | json_field "['token']")

change_resp=$(curl -sf -X POST "$BASE_URL/api/v1/auth/change-password" \
  -H "Authorization: Bearer $guest_token" \
  -H 'Content-Type: application/json' \
  -d '{"password":"wana12345"}') || true
if echo "$change_resp" | grep -q '"success":true'; then
  ok "change-password (idempotent reset to demo pass)"
else
  bad "change-password"
fi

forgot_code=$(curl -s -o /tmp/forgot.json -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/forgot-password" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\"}")
if [[ "$forgot_code" == "200" ]]; then
  ok "forgot-password → 200 (Resend triggered)"
elif [[ "$forgot_code" == "503" ]]; then
  bad "forgot-password → 503 (Resend failed — revisa RESEND_API_KEY / dominio)"
  cat /tmp/forgot.json
else
  bad "forgot-password → HTTP $forgot_code"
  cat /tmp/forgot.json
fi

invalid_reset=$(curl -s -o /tmp/reset.json -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/reset-password" \
  -H 'Content-Type: application/json' \
  -d '{"token":"invalid.token.here","password":"newpass12345"}')
if [[ "$invalid_reset" == "400" ]]; then
  ok "reset-password rejects invalid token"
else
  bad "reset-password expected 400, got $invalid_reset"
fi

login_no_turnstile=$(curl -s -o /tmp/login.json -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
if [[ "$login_no_turnstile" == "400" ]]; then
  ok "login UI requires Turnstile (400 without token)"
else
  bad "login without Turnstile → $login_no_turnstile (expected 400)"
fi

protected=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/auth/me")
if [[ "$protected" == "401" ]]; then
  ok "/me without token → 401"
else
  bad "/me without token → $protected"
fi

echo ""
echo "=== Resumen: $pass OK, $fail FAIL ==="
[[ "$fail" -eq 0 ]]
