#!/usr/bin/env bash
# Verifica configuración Turnstile (sin exponer secrets)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ No existe $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

echo "=== Elevari — Turnstile config ==="
echo ""

if [[ "${TURNSTILE_DISABLED:-}" == "1" || "${NEXT_PUBLIC_TURNSTILE_DISABLED:-}" == "1" ]]; then
  echo "Estado: DESACTIVADO (no permitido en producci?n)"
  echo "  TURNSTILE_DISABLED=${TURNSTILE_DISABLED:-0}"
  echo "  NEXT_PUBLIC_TURNSTILE_DISABLED=${NEXT_PUBLIC_TURNSTILE_DISABLED:-0}"
  echo ""
  echo "Login funciona SIN captcha. Para activar Turnstile:"
  echo "  1. Pega Site Key + Secret Key nuevas en .env.production"
  echo "  2. Borra TURNSTILE_DISABLED y NEXT_PUBLIC_TURNSTILE_DISABLED"
  echo "  3. Cloudflare Turnstile → hostnames: elevari.live, www.elevari.live"
  echo "  4. Reconstruir la imagen web (docker compose build web && up -d) ? las NEXT_PUBLIC_* se incrustan al compilar"
  exit 0
fi

if [[ -z "${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}" || -z "${TURNSTILE_SECRET_KEY:-}" ]]; then
  echo "✗ Turnstile activo pero faltan keys en .env.production"
  exit 1
fi

echo "Estado: ACTIVO"
echo "  Site key: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY:0:12}…"
echo "  Secret: configurada (${#TURNSTILE_SECRET_KEY} chars)"
echo ""
echo "Hostnames requeridos en Cloudflare Turnstile:"
echo "  • elevari.live"
echo "  • elevari.live"
echo ""
echo "Tras deploy, verifica: curl -s https://elevari.live/health | grep turnstile_required"
