#!/usr/bin/env bash
# Purge Cloudflare cache for elevari.live after a successful production deploy.
#
# Required env:
#   CLOUDFLARE_API_TOKEN   - Cloudflare API token with Zone:Cache purge permission
#   CLOUDFLARE_ZONE_ID     - Zone ID for elevari.live (find in Cloudflare dashboard -> Overview)
#   CLOUDFLARE_DOMAIN      - Domain to purge (default: elevari.live)
#
# Behavior:
#   - Purges everything (safest after a deploy; assets + HTML are all stale)
#   - Fails fast with the real reason when the token is rejected (code 10000)
#   - Falls back to purging specific known URLs if "purge everything" is not allowed
#   - Exits 0 on success, non-zero on failure (CI will fail the deploy job)
set -euo pipefail

DOMAIN="${CLOUDFLARE_DOMAIN:-elevari.live}"
TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required (Settings -> Secrets and variables -> Actions)}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID is required (Cloudflare -> elevari.live -> Overview -> Zone ID)}"

API="https://api.cloudflare.com/client/v4/zones/${ZONE_ID}"

# Print the Cloudflare error payload for a failed response, so an invalid or
# expired token is reported as "Authentication error" instead of a wall of
# identical per-URL failures.
report_error() {
  printf '%s' "$1" | python3 -c '
import sys, json
raw = sys.stdin.read()
try:
    data = json.loads(raw)
except ValueError:
    print(raw[:300])
    sys.exit(0)
for err in data.get("errors") or []:
    print("code %s: %s" % (err.get("code"), err.get("message")))
'
}

echo "-> Purging Cloudflare cache for ${DOMAIN} (zone ${ZONE_ID})"

# Option 1: Purge Everything (fastest, clears HTML + assets + edge cache)
response=$(curl -sS --max-time 60 -X POST "${API}/purge_cache" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}')

success=$(printf '%s' "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('success') else 'false')" 2>/dev/null || echo "false")

if [ "$success" = "true" ]; then
  echo "OK Cloudflare cache purged (purge_everything)"
  exit 0
fi

# An authentication failure will never succeed on retry - fail fast with the
# real reason instead of repeating the same request for every URL.
auth_error=$(printf '%s' "$response" | python3 -c '
import sys, json
try:
    data = json.load(sys.stdin)
except ValueError:
    sys.exit(0)
for err in data.get("errors") or []:
    if err.get("code") == 10000:
        print(err.get("message") or "Authentication error")
        break
' 2>/dev/null || true)

if [ -n "$auth_error" ]; then
  echo "FAIL Cloudflare rejected the API token: ${auth_error}"
  echo "  -> Check the CLOUDFLARE_API_TOKEN secret: it must be a valid token with"
  echo "     Zone -> Cache Purge permission for zone ${ZONE_ID}."
  report_error "$response"
  exit 1
fi

# Option 2: Fallback - purge specific URLs one by one
echo "WARN purge_everything not allowed or failed; purging known URLs individually"
errors=0
for url in \
  "https://${DOMAIN}/" \
  "https://${DOMAIN}/auth/login" \
  "https://${DOMAIN}/auth/register" \
  "https://${DOMAIN}/app" \
  "https://${DOMAIN}/properties" \
  "https://${DOMAIN}/health" \
  "https://${DOMAIN}/robots.txt" \
  "https://${DOMAIN}/sitemap.xml" \
  "https://www.${DOMAIN}/" \
  "https://app.${DOMAIN}/" \
  "https://api.${DOMAIN}/health"; do
  resp=$(curl -sS --max-time 30 -X POST "${API}/purge_cache" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"files\":[\"${url}\"]}")
  ok=$(printf '%s' "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('success') else 'false')" 2>/dev/null || echo "false")
  if [ "$ok" = "true" ]; then
    echo "  OK purged ${url}"
  else
    echo "  FAIL failed to purge ${url}: $(printf '%s' "$resp" | head -c 200)"
    errors=$((errors + 1))
  fi
done

if [ "$errors" -gt 0 ]; then
  echo "FAIL ${errors} URL(s) failed to purge"
  exit 1
fi

echo "OK All known URLs purged"