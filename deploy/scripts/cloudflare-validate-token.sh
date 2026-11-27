#!/usr/bin/env bash
# Validate Cloudflare API token by making a simple API call.
#
# Required env:
#   CLOUDFLARE_API_TOKEN   - Cloudflare API token
#   CLOUDFLARE_ZONE_ID     - Zone ID for the domain
#
# Behavior:
#   - Makes a simple API call to verify the token is valid
#   - Exits 0 if token is valid, non-zero otherwise
#   - Prints the real Cloudflare error message on failure

set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID is required}"

# Secrets pasted from a browser or a file often carry a trailing newline or a
# stray space, which turns a valid zone id into an "Invalid zone identifier".
TOKEN="$(printf '%s' "${TOKEN}" | tr -d '[:space:]')"
ZONE_ID="$(printf '%s' "${ZONE_ID}" | tr -d '[:space:]')"

if ! printf '%s' "${ZONE_ID}" | grep -qE '^[0-9a-f]{32}$'; then
  echo "WARN CLOUDFLARE_ZONE_ID is not 32 lowercase hex characters, so it is probably not a zone id"
fi

echo "-> Validating Cloudflare API token for zone ${ZONE_ID}"

# Step 1: is the token itself active? This endpoint works for any API token,
# whatever its permissions, so it separates "bad token" from "bad zone/scope".
verify=$(curl -sS --max-time 30 \
  -H "Authorization: Bearer ${TOKEN}" \
  "https://api.cloudflare.com/client/v4/user/tokens/verify" 2>&1)
token_status=$(printf '%s' "$verify" | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('result') or {}).get('status') or 'invalid')" 2>/dev/null || echo "invalid")

if [ "$token_status" = "active" ]; then
  echo "OK token is active; checking access to the zone"
  echo "   If the next check fails, the token is fine but CLOUDFLARE_ZONE_ID is"
  echo "   wrong or the token lacks Zone permissions for that zone."
else
  echo "FAIL CLOUDFLARE_API_TOKEN is not an active API token (status: ${token_status})"
  echo "   Create a new API token in Cloudflare -> My Profile -> API Tokens."
  echo "   It must be an API Token, not the Global API Key."
fi

# Make a simple API call to get zone info - this will fail with auth error if token is invalid
response=$(curl -sS --max-time 30 \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}" 2>&1)

# Check if the response indicates success
success=$(printf '%s' "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('success') else 'false')" 2>/dev/null || echo "false")

if [ "$success" = "true" ]; then
  echo "OK Cloudflare API token is valid"
  exit 0
fi

# Token is invalid - extract and display the error
printf '%s' "$response" | python3 -c '
import sys, json
raw = sys.stdin.read()
try:
    data = json.loads(raw)
except ValueError:
    print("Cloudflare returned a non-JSON response:", raw[:500])
    sys.exit(1)

errors = data.get("errors") or []
if errors:
    for err in errors:
        print("Cloudflare API error %s: %s" % (err.get("code"), err.get("message")))
else:
    print("Cloudflare API reported success=false:", raw[:500])
'

# The lookup failed even though the token is active: either the token lacks
# permissions for that zone or CLOUDFLARE_ZONE_ID is wrong. Zone ids are not
# secret, so list the zones this token can see to show the value to use.
echo "   -> Zones visible to this token (use the id for ${CLOUDFLARE_DOMAIN:-elevari.live}):"
zones=$(curl -sS --max-time 30 \
  -H "Authorization: Bearer ${TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?per_page=50" 2>&1 || true)
printf '%s' "$zones" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
except ValueError:
    print("      (Cloudflare did not return JSON)")
    raise SystemExit(0)
if not data.get("success"):
    errors = data.get("errors") or []
    msg = ", ".join("%s: %s" % (e.get("code"), e.get("message")) for e in errors) or "unknown error"
    print("      (cannot list zones: %s)" % msg)
    print("      Token needs Zone -> Zone Read at least.")
    raise SystemExit(0)
rows = data.get("result") or []
if not rows:
    print("      (this token cannot see any zone)")
for zone in rows:
    print("      %s -> %s" % (zone.get("name"), zone.get("id")))
'
exit 1