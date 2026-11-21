#!/usr/bin/env bash
# Refresh Cloudflare IP ranges: nginx real-IP include + ufw rules (80/443 only from Cloudflare).
# Run on the server as root:  sudo ./deploy/scripts/update-cloudflare-ips.sh
# Safe to re-run; SSH (22) is never touched.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
CONF="$ROOT/deploy/nginx/cloudflare-ips.conf"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

curl -fsS https://www.cloudflare.com/ips-v4 > "$TMP.v4"
curl -fsS https://www.cloudflare.com/ips-v6 > "$TMP.v6"

{
  echo "# Cloudflare IP ranges — restore the real client IP behind the proxy."
  echo "# Source: https://www.cloudflare.com/ips/ (refresh with deploy/scripts/update-cloudflare-ips.sh)"
  { cat "$TMP.v4"; echo; cat "$TMP.v6"; echo; } | sed '/^$/d' | while read -r cidr; do echo "set_real_ip_from $cidr;"; done
  echo "real_ip_header CF-Connecting-IP;"
} > "$CONF"
echo "nginx include updated: $CONF"

if [[ "${SKIP_UFW:-}" != "1" ]] && command -v ufw >/dev/null 2>&1; then
  # Drop the open 80/443 rules, then allow only Cloudflare ranges.
  ufw delete allow 80/tcp >/dev/null 2>&1 || true
  ufw delete allow 443/tcp >/dev/null 2>&1 || true
  { ufw status numbered | grep -E "Cloudflare" || true; } | tac | sed -E 's/^\[ *([0-9]+)\].*/\1/' | while read -r n; do
    yes | ufw delete "$n" >/dev/null 2>&1 || true
  done
  { cat "$TMP.v4"; echo; cat "$TMP.v6"; echo; } | sed '/^$/d' | while read -r cidr; do
    ufw allow proto tcp from "$cidr" to any port 80,443 comment 'Cloudflare' >/dev/null
  done
  ufw reload >/dev/null
  echo "ufw: 80/443 restricted to Cloudflare ($(ufw status | grep -c Cloudflare || true) rules)"
fi

rm -f "$TMP.v4" "$TMP.v6"
