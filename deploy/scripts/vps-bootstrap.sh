#!/usr/bin/env bash
# Bootstrap Ubuntu VPS para Waná (Docker + clone repo)
# Ejecutar EN EL SERVIDOR como root o con sudo:
#   curl -fsSL ... | bash   OR   ./vps-bootstrap.sh
set -euo pipefail

REPO_URL="${REPO_URL:-}"
INSTALL_DIR="${INSTALL_DIR:-/opt/wana}"

echo "=== Waná VPS Bootstrap ==="

if [[ $EUID -ne 0 ]]; then
  echo "Ejecuta con sudo o como root"
  exit 1
fi

apt-get update -qq
apt-get install -y -qq ca-certificates curl git

if ! command -v docker >/dev/null 2>&1; then
  echo "→ Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

if [[ -n "$REPO_URL" && ! -d "$INSTALL_DIR" ]]; then
  echo "→ Clonando repo en $INSTALL_DIR..."
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

if [[ -d "$INSTALL_DIR" ]]; then
  cd "$INSTALL_DIR"
  chmod +x deploy/scripts/*.sh 2>/dev/null || true
  echo "→ Directorio: $INSTALL_DIR"
  echo ""
  echo "Siguiente:"
  echo "  1. Copia .env.staging: scp .env.staging user@vps:$INSTALL_DIR/.env.staging"
  echo "  2. STAGING_HOST=TU_IP ./deploy/scripts/deploy-staging.sh"
  echo "  3. ./deploy/scripts/verify-health.sh"
else
  echo "Copia el proyecto a $INSTALL_DIR o define REPO_URL"
fi

echo "=== Bootstrap completado ==="
