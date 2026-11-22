#!/usr/bin/env bash
# Deploy Waná staging al Droplet vía SSH
set -euo pipefail

DROPLET_IP="${DROPLET_IP:-164.92.241.30}"
DROPLET_USER="${DROPLET_USER:-root}"
REMOTE_DIR="/opt/wana"
ROOT="$(cd "$(dirname "$0")/../../" && pwd)"

echo "=== Waná — remote deploy → $DROPLET_USER@$DROPLET_IP ==="

rsync -az --delete \
  --exclude node_modules --exclude .next --exclude api/node_modules --exclude .git \
  "$ROOT/" "$DROPLET_USER@$DROPLET_IP:$REMOTE_DIR/"

scp "$ROOT/.env.staging" "$DROPLET_USER@$DROPLET_IP:$REMOTE_DIR/.env.staging"

ssh "$DROPLET_USER@$DROPLET_IP" "DROPLET_IP=$DROPLET_IP bash -s" <<'REMOTE'
set -euo pipefail
cd /opt/wana

if ! command -v docker >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl git
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

chmod +x deploy/scripts/*.sh
export BASE_URL="http://${DROPLET_IP}"
export BUILD_NO_CACHE=1
./deploy/scripts/deploy-staging.sh
REMOTE

echo "=== Deploy remoto completado ==="
echo "http://${DROPLET_IP}/properties"
