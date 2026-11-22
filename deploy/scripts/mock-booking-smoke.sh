#!/usr/bin/env bash
# Smoke test flujo reserva completo (mock, sin keys Wompi)
# Requiere API en marcha con PAYMENTS_MODE=mock y seed aplicado.
#
# Uso:
#   BASE_URL=http://localhost:4000 ./deploy/scripts/mock-booking-smoke.sh
#   BASE_URL=http://164.92.241.30 ./deploy/scripts/mock-booking-smoke.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4000}"
EMAIL="${SMOKE_EMAIL:-guest@wana.local}"
PASSWORD="${SMOKE_PASSWORD:-wana12345}"
SMOKE_AUTH_SECRET="${SMOKE_AUTH_SECRET:-}"

echo "=== Waná mock booking smoke ($BASE_URL) ==="

health=$(curl -sf "$BASE_URL/health" || true)
if [[ -z "$health" ]]; then
  echo "✗ API no responde en $BASE_URL/health"
  exit 1
fi
echo "✓ Health OK"

login_url="$BASE_URL/api/v1/auth/login"
login_headers=(-H 'Content-Type: application/json')
if [[ -n "$SMOKE_AUTH_SECRET" ]]; then
  login_url="$BASE_URL/api/v1/auth/smoke-login"
  login_headers+=(-H "X-Smoke-Secret: $SMOKE_AUTH_SECRET")
  echo "→ Login vía smoke-login (Turnstile bypass)"
fi

login_resp=$(curl -sf -X POST "$login_url" \
  "${login_headers[@]}" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}") || {
  echo "✗ Login falló"
  echo "  Tip: si staging usa Turnstile, define SMOKE_AUTH_SECRET en API y pásalo al script:"
  echo "  SMOKE_AUTH_SECRET=... BASE_URL=... npm run go-live:smoke:mock"
  exit 1
}

TOKEN=$(echo "$login_resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "✓ Login OK"

PROP=$(curl -sf "$BASE_URL/api/v1/properties?limit=1")
PROPERTY_ID=$(echo "$PROP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])")
SLUG=$(echo "$PROP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['slug'])")
echo "✓ Property: $SLUG"

CHECK_IN=$(python3 -c "from datetime import date,timedelta; print(date.today()+timedelta(days=21))")
CHECK_OUT=$(python3 -c "from datetime import date,timedelta; print(date.today()+timedelta(days=23))")
IDEM="smoke_$(date +%s)_$RANDOM"

quote=$(curl -sf -X POST "$BASE_URL/api/v1/bookings/quote" \
  -H 'Content-Type: application/json' \
  -d "{\"property_id\":\"$PROPERTY_ID\",\"check_in\":\"$CHECK_IN\",\"check_out\":\"$CHECK_OUT\",\"guests\":1}")

available=$(echo "$quote" | python3 -c "import sys,json; print(json.load(sys.stdin).get('available', False))")
if [[ "$available" != "True" && "$available" != "true" ]]; then
  echo "⚠ Fechas no disponibles ($CHECK_IN → $CHECK_OUT), probando +7 días…"
  CHECK_IN=$(python3 -c "from datetime import date,timedelta; print(date.today()+timedelta(days=28))")
  CHECK_OUT=$(python3 -c "from datetime import date,timedelta; print(date.today()+timedelta(days=30))")
fi

book_resp=$(curl -sf -X POST "$BASE_URL/api/v1/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"property_id\":\"$PROPERTY_ID\",\"check_in\":\"$CHECK_IN\",\"check_out\":\"$CHECK_OUT\",\"guests\":1,\"idempotency_key\":\"$IDEM\"}")

BOOKING_ID=$(echo "$book_resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['booking']['id'])")
echo "✓ Booking creado: $BOOKING_ID"

pay_resp=$(curl -sf -X POST "$BASE_URL/api/v1/payments/intent" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"booking_id\":\"$BOOKING_ID\",\"idempotency_key\":\"pay_${IDEM}\",\"return_url\":\"http://localhost/checkout/success\"}")

PAYMENT_ID=$(echo "$pay_resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['payment_id'])")
echo "✓ Payment intent: $PAYMENT_ID"

curl -sf -X POST "$BASE_URL/api/v1/payments/$PAYMENT_ID/mock-complete" \
  -H "Authorization: Bearer $TOKEN" >/dev/null
echo "✓ Mock payment complete"

final=$(curl -sf "$BASE_URL/api/v1/bookings/$BOOKING_ID" -H "Authorization: Bearer $TOKEN")
STATUS=$(echo "$final" | python3 -c "import sys,json; print(json.load(sys.stdin)['booking']['status'])")

if [[ "$STATUS" == "confirmed" ]]; then
  echo "=== ✓ Smoke OK — booking confirmed ==="
  exit 0
fi

echo "✗ Estado final: $STATUS (esperado: confirmed)"
exit 1
