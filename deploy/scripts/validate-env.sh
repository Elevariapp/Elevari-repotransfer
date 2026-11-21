#!/usr/bin/env bash
# Valida .env.production antes del deploy (solo producción).
# Uso: validate-env.sh            -> $ROOT/.env.production
#      ENV_FILE=/ruta validate-env.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${RED}✗ No existe $ENV_FILE${NC}"
  echo "  Copia: cp deploy/.env.production.example .env.production"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

errors=0
warnings=0

check_required() {
  local name="$1"
  local value="${2:-}"
  if [[ -z "$value" ]]; then
    echo -e "${RED}✗ REQUERIDO vacío: $name${NC}"
    errors=$((errors + 1))
  elif [[ "$value" == *change_me* || "$value" == *CHANGE_ME* || "$value" == *PENDING* ]]; then
    echo -e "${RED}✗ $name todavía tiene un valor de plantilla/pendiente (change_me / PENDING)${NC}"
    errors=$((errors + 1))
  else
    echo -e "${GREEN}✓ $name${NC}"
  fi
}

fail() {
  echo -e "${RED}✗ $1${NC}"
  errors=$((errors + 1))
}

echo "=== Elevari — validación [production] $ENV_FILE ==="
echo ""

echo "--- Core ---"
check_required POSTGRES_PASSWORD "${POSTGRES_PASSWORD:-}"
check_required JWT_SECRET "${JWT_SECRET:-}"
check_required MINIO_SECRET_KEY "${MINIO_SECRET_KEY:-}"
check_required NEXT_PUBLIC_SITE_URL "${NEXT_PUBLIC_SITE_URL:-}"
check_required NEXT_PUBLIC_API_URL "${NEXT_PUBLIC_API_URL:-}"
check_required CORS_ORIGIN "${CORS_ORIGIN:-}"

if [[ -n "${JWT_SECRET:-}" && ${#JWT_SECRET} -lt 32 ]]; then fail "JWT_SECRET debe tener al menos 32 caracteres"; fi
if [[ "${NEXT_PUBLIC_API_URL:-}" == *"/api/v1"* ]]; then fail "NEXT_PUBLIC_API_URL no debe incluir /api/v1"; fi
if [[ "${NEXT_PUBLIC_SITE_URL:-}" != https://* ]]; then fail "NEXT_PUBLIC_SITE_URL debe usar https"; fi
if [[ "${NEXT_PUBLIC_API_URL:-}" == *localhost* || "${NEXT_PUBLIC_SITE_URL:-}" == *localhost* ]]; then fail "Las URLs públicas no pueden apuntar a localhost"; fi
if [[ "${DISABLE_DEMO_ACCOUNTS:-}" != "true" ]]; then fail "DISABLE_DEMO_ACCOUNTS debe ser true"; fi

echo ""
echo "--- Pagos (Wompi) ---"
if [[ "${PAYMENTS_MODE:-}" != "live" ]]; then
  if [[ "${PAYMENTS_MODE:-}" == "mock" && "${ALLOW_MOCK_PAYMENTS:-}" == "true" ]]; then
    echo -e "${YELLOW}⚠ PAYMENTS_MODE=mock con ALLOW_MOCK_PAYMENTS=true: SOLO pruebas internas, nunca con tráfico público${NC}"
    warnings=$((warnings + 1))
  else
    fail "PAYMENTS_MODE debe ser live en producción (valor actual: ${PAYMENTS_MODE:-sin definir})"
  fi
else
  if [[ "${PAYMENTS_WOMPI_ENABLED:-false}" != "true" ]]; then fail "PAYMENTS_WOMPI_ENABLED=true es obligatorio (Wompi es el único proveedor)"; fi
  check_required WOMPI_PUBLIC_KEY "${WOMPI_PUBLIC_KEY:-}"
  check_required WOMPI_PRIVATE_KEY "${WOMPI_PRIVATE_KEY:-}"
  check_required WOMPI_EVENTS_SECRET "${WOMPI_EVENTS_SECRET:-}"
  check_required WOMPI_INTEGRITY_SECRET "${WOMPI_INTEGRITY_SECRET:-}"
  if [[ "${WOMPI_PUBLIC_KEY:-}" != pub_prod_* ]]; then fail "WOMPI_PUBLIC_KEY debe empezar con pub_prod_ en producción"; fi
  if [[ "${WOMPI_PRIVATE_KEY:-}" != prv_prod_* ]]; then fail "WOMPI_PRIVATE_KEY debe empezar con prv_prod_ en producción"; fi
  if [[ -n "${NEXT_PUBLIC_WOMPI_PUBLIC_KEY:-}" && "${WOMPI_PUBLIC_KEY:-}" != "${NEXT_PUBLIC_WOMPI_PUBLIC_KEY:-}" ]]; then
    fail "WOMPI_PUBLIC_KEY y NEXT_PUBLIC_WOMPI_PUBLIC_KEY deben coincidir"
  fi
  if [[ "${FX_INTL_CHECKOUT_ENABLED:-false}" == "true" && -z "${LEGAL_SIGNOFF_REF:-}" ]]; then
    fail "FX_INTL_CHECKOUT_ENABLED=true requiere LEGAL_SIGNOFF_REF (ver legal-review-pack.md)"
  fi
fi

echo ""
echo "--- Facturación (Alegra) ---"
if [[ "${PAYMENTS_MODE:-}" == "live" ]]; then
  check_required ALEGRA_EMAIL "${ALEGRA_EMAIL:-}"
  check_required ALEGRA_API_TOKEN "${ALEGRA_API_TOKEN:-}"
  if [[ "${ALEGRA_INVOICE_STATUS:-}" != "open" ]]; then
    echo -e "${YELLOW}⚠ ALEGRA_INVOICE_STATUS no es 'open': no se crean facturas en Alegra (quedan pendientes). Activar tras habilitar la facturación electrónica DIAN${NC}"
    warnings=$((warnings + 1))
  fi
else
  echo -e "${YELLOW}⚠ Alegra no se valida fuera de PAYMENTS_MODE=live${NC}"
fi

echo ""
echo "--- Correo y antibots ---"
check_required RESEND_API_KEY "${RESEND_API_KEY:-}"
check_required RESEND_FROM "${RESEND_FROM:-}"
if [[ "${TURNSTILE_DISABLED:-}" == "true" || "${NEXT_PUBLIC_TURNSTILE_DISABLED:-}" == "true" ]]; then
  fail "Turnstile no puede estar desactivado en producción"
else
  check_required TURNSTILE_SECRET_KEY "${TURNSTILE_SECRET_KEY:-}"
  check_required NEXT_PUBLIC_TURNSTILE_SITE_KEY "${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}"
fi

echo ""
echo "--- Analítica ---"
if [[ -z "${NEXT_PUBLIC_GTM_ID:-}" && -z "${NEXT_PUBLIC_GA_MEASUREMENT_ID:-}" ]]; then
  echo -e "${YELLOW}⚠ sin GTM ni GA4${NC}"
  warnings=$((warnings + 1))
fi

echo ""
echo "=== Resumen: $errors error(es), $warnings advertencia(s) ==="

if [[ $errors -gt 0 ]]; then
  exit 1
fi
exit 0
