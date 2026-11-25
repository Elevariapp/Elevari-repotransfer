#!/usr/bin/env bash
# Purge Cloudflare cache for elevari.live after a successful production deploy.
#
# Required env:
#   CLOUDFLARE_API_TOKEN   - Cloudflare API token with Zone:Cache purge permission
#   CLOUDFLARE_ZONE_ID     - Zone ID for elevari.live (find in Cloudflare dashboard → Overview)
#   CLOUDFLARE_DOMAIN      - Domain to purge (default: elevari.live)
#
# Behavior:
#   - Purges everything (safest after a deploy; assets + HTML are all stale)
#   - Falls back to purging specific known URLs if "purge everything" is not allowed
#   - Exits 0 on success, non-zero on failure (CI will fail the deploy job)
set -euo pipefail

DOMAIN="${CLOUDFLARE_DOMAIN:-elevari.live}"
TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required (Settings → Secrets and variables → Actions)}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID is required (Cloudflare → elevari.live → Overview → Zone ID)}"

API="https://api.cloudflare.com/client/v4/zones/${ZONE_ID}"

echo "→ Purging Cloudflare cache for ${DOMAIN} (zone ${ZONE_ID})"

# Option 1: Purge Everything (fastest, clears HTML + assets + edge cache)
response=$(curl -sS --max-time 60 -X POST "${API}/purge_cache" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}')

success=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('success') else 'false')" 2>/dev/null || echo "false")

if [ "$success" = "true" ]; then
  echo "✓ Cloudflare cache purged (purge_everything)"
  exit 0
fi

# Option 2: Fallback — purge specific URLs one by one
echo "⚠ purge_everything not allowed or failed; purging known URLs individually"
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
  ok=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('success') else 'false')" 2>/dev/null || echo "false")
  if [ "$ok" = "true" ]; then
    echo "  ✓ purged ${url}"
  else
    echo "  ✗ failed to purge ${url}: $(echo "$resp" | head -c 200)"
    errors=$((errors + 1))
  fi
done

if [ "$errors" -gt 0 ]; then
  echo "✗ ${errors} URL(s) failed to purge"
  exit 1
fi

echo "✓ All known URLs purged"