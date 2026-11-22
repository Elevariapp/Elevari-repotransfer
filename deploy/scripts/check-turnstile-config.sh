#!/usr/bin/env bash
# Verifica configuración Turnstile (sin exponer secrets)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.staging}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ No existe $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

echo "=== Eleveri — Turnstile config ==="
echo ""

if [[ "${TURNSTILE_DISABLED:-}" == "1" || "${NEXT_PUBLIC_TURNSTILE_DISABLED:-}" == "1" ]]; then
  echo "Estado: DESACTIVADO (bypass staging)"
  echo "  TURNSTILE_DISABLED=${TURNSTILE_DISABLED:-0}"
  echo "  NEXT_PUBLIC_TURNSTILE_DISABLED=${NEXT_PUBLIC_TURNSTILE_DISABLED:-0}"
  echo ""
  echo "Login funciona SIN captcha. Para activar Turnstile:"
  echo "  1. Pega Site Key + Secret Key nuevas en .env.staging"
  echo "  2. Borra TURNSTILE_DISABLED y NEXT_PUBLIC_TURNSTILE_DISABLED"
  echo "  3. Cloudflare Turnstile → hostnames: eleveri.app, www.eleveri.app"
  echo "  4. npm run go-live:remote"
  exit 0
fi

if [[ -z "${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}" || -z "${TURNSTILE_SECRET_KEY:-}" ]]; then
  echo "✗ Turnstile activo pero faltan keys en .env.staging"
  exit 1
fi

echo "Estado: ACTIVO"
echo "  Site key: ${NEXT_PUBLIC_TURNSTILE_SITE_KEY:0:12}…"
echo "  Secret: configurada (${#TURNSTILE_SECRET_KEY} chars)"
echo ""
echo "Hostnames requeridos en Cloudflare Turnstile:"
echo "  • eleveri.app"
echo "  • www.eleveri.app"
echo ""
echo "Tras deploy, verifica: curl -s https://eleveri.app/health | grep turnstile_required"
