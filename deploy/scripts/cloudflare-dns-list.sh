#!/usr/bin/env bash
# List Cloudflare DNS records for the zone, formatted for human reading.
# Usage: ./deploy/scripts/cloudflare-dns-list.sh
# Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
ZONE="${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID is required}"

echo "-> DNS records for zone ${ZONE}"
response=$(curl -sS --max-time 30 \
  -H "Authorization: Bearer ${TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE}/dns_records?per_page=50")

# Surface the real Cloudflare error instead of crashing with a Python traceback.
# An invalid or expired token answers {"result": null, "success": false,
# "errors": [{"code": 10000, "message": "Authentication error"}]}, and iterating
# that null used to abort with "TypeError: 'NoneType' object is not iterable".
printf '%s' "$response" | python3 -c '
import sys, json

raw = sys.stdin.read()
try:
    data = json.loads(raw)
except ValueError:
    sys.stderr.write("Cloudflare returned a non-JSON response: %s\n" % raw[:500])
    sys.exit(1)

if not data.get("success"):
    errors = data.get("errors") or []
    if errors:
        for err in errors:
            sys.stderr.write(
                "Cloudflare API error %s: %s\n" % (err.get("code"), err.get("message"))
            )
    else:
        sys.stderr.write("Cloudflare API reported success=false: %s\n" % raw[:500])
    sys.exit(1)

for record in data.get("result") or []:
    proxied = "orange-cloud" if record.get("proxied") else "grey-cloud"
    print("  %-4s %-40s %-40s %s" % (record["type"], record["name"], record["content"], proxied))
'