#!/usr/bin/env bash
# List Cloudflare DNS records for the zone, formatted for human reading.
# Usage: ./deploy/scripts/cloudflare-dns-list.sh
# Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
ZONE="${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID is required}"

echo "→ DNS records for zone ${ZONE}"
curl -sS --max-time 30 \
  -H "Authorization: Bearer ${TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE}/dns_records?per_page=50" \
| python3 -c '
import sys, json
d = json.load(sys.stdin)
for r in d.get("result", []):
    proxied = "orange-cloud" if r.get("proxied") else "grey-cloud"
    print(f"  {r["type"]:4} {r["name"]:40} {r["content"]:40} {proxied}")
'