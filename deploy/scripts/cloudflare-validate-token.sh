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

echo "-> Validating Cloudflare API token for zone ${ZONE_ID}"

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
exit 1