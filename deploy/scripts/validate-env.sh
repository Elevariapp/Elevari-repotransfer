#!/usr/bin/env bash
# Valida .env.production o .env.staging antes del deploy
# Uso: validate-env.sh          → .env.production
#      STAGING=1 validate-env.sh → .env.staging (sin keys)
#      validate-env.sh --staging → .env.staging
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"

if [[ "${1:-}" == "--staging" || "${STAGING:-}" == "1" ]]; then
  ENV_FILE="${ENV_FILE:-$ROOT/.env.staging}"
  MODE_LABEL="staging (pre-live, sin keys)"
else
  ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
  MODE_LABEL="production"
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ ! -f "$ENV_FILE" ]]; then
  echo "${RED}✗ No existe $ENV_FILE${NC}"
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
    echo "${RED}✗ REQUERIDO vacío: $name${NC}"
    errors=$((errors + 1))
  else
    echo "${GREEN}✓ $name${NC}"
  fi
}

check_optional() {
  local name="$1"
  local value="${2:-}"
  if [[ -z "$value" ]]; then
    echo "${YELLOW}○ opcional vacío: $name${NC}"
    warnings=$((warnings + 1))
  else
    echo "${GREEN}✓ $name${NC}"
  fi
}

echo "=== Waná — validación [$MODE_LABEL] $ENV_FILE ==="
echo ""

echo "--- Core ---"
check_required POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
check_required JWT_SECRET "$JWT_SECRET"
check_required NEXT_PUBLIC_SITE_URL "$NEXT_PUBLIC_SITE_URL"
check_required NEXT_PUBLIC_API_URL "$NEXT_PUBLIC_API_URL"
check_required CORS_ORIGIN "$CORS_ORIGIN"

if [[ "${JWT_SECRET:-}" != "" && ${#JWT_SECRET} -lt 32 ]]; then
  echo "${RED}✗ JWT_SECRET debe tener al menos 32 caracteres${NC}"
  errors=$((errors + 1))
fi

if [[ "${NEXT_PUBLIC_API_URL:-}" == *"/api/v1"* ]]; then
  echo "${RED}✗ NEXT_PUBLIC_API_URL no debe incluir /api/v1${NC}"
  errors=$((errors + 1))
fi

if [[ "${NEXT_PUBLIC_SITE_URL:-}" != https://* ]]; then
  echo "${YELLOW}○ NEXT_PUBLIC_SITE_URL no usa https (ok en staging)${NC}"
  warnings=$((warnings + 1))
fi

echo ""
echo "--- Pagos (Phase 2 — Wompi-first) ---"
if [[ "${PAYMENTS_MODE:-}" == "live" ]]; then
  if [[ "${PAYMENTS_WOMPI_ENABLED:-false}" == "true" ]]; then
    check_required WOMPI_ENV "$WOMPI_ENV"
    check_required WOMPI_PUBLIC_KEY "$WOMPI_PUBLIC_KEY"
    check_required WOMPI_PRIVATE_KEY "$WOMPI_PRIVATE_KEY"
    check_required WOMPI_EVENTS_SECRET "$WOMPI_EVENTS_SECRET"
    check_required WOMPI_INTEGRITY_SECRET "$WOMPI_INTEGRITY_SECRET"
    check_required NEXT_PUBLIC_WOMPI_PUBLIC_KEY "$NEXT_PUBLIC_WOMPI_PUBLIC_KEY"
    if [[ "${WOMPI_ENV:-}" == "production" && "${WOMPI_PUBLIC_KEY:-}" != pub_prod_* ]]; then
      echo "${RED}✗ WOMPI_ENV=production pero WOMPI_PUBLIC_KEY no es pub_prod_*${NC}"
      errors=$((errors + 1))
    fi
    if [[ "${WOMPI_PUBLIC_KEY:-}" != "${NEXT_PUBLIC_WOMPI_PUBLIC_KEY:-}" ]]; then
      echo "${RED}✗ WOMPI_PUBLIC_KEY y NEXT_PUBLIC_WOMPI_PUBLIC_KEY deben coincidir${NC}"
      errors=$((errors + 1))
    fi
  elif [[ "${PAYMENTS_BOLD_ENABLED:-false}" == "true" || "${PAYMENTS_STRIPE_ENABLED:-false}" == "true" ]]; then
    echo "${YELLOW}○ Proveedor legacy habilitado (Bold/Stripe) — valida sus keys manualmente${NC}"
    warnings=$((warnings + 1))
  else
    echo "${RED}✗ PAYMENTS_MODE=live sin proveedor habilitado (PAYMENTS_WOMPI_ENABLED=true requerido)${NC}"
    errors=$((errors + 1))
  fi

  # International converted checkout gate
  if [[ "${FX_INTL_CHECKOUT_ENABLED:-false}" == "true" && -z "${LEGAL_SIGNOFF_REF:-}" ]]; then
    echo "${RED}✗ FX_INTL_CHECKOUT_ENABLED=true requiere LEGAL_SIGNOFF_REF (ver legal-review-pack.md)${NC}"
    errors=$((errors + 1))
  fi
elif [[ "${PAYMENTS_MODE:-}" == "mock" ]]; then
  echo "${GREEN}✓ PAYMENTS_MODE=mock (pre-live OK, sin keys)${NC}"
else
  echo "${YELLOW}○ PAYMENTS_MODE=${PAYMENTS_MODE:-unset}${NC}"
  warnings=$((warnings + 1))
fi

echo ""
echo "--- Alegra ---"
if [[ "${PAYMENTS_MODE:-}" == "live" ]]; then
  check_required ALEGRA_EMAIL "$ALEGRA_EMAIL"
  check_required ALEGRA_API_TOKEN "$ALEGRA_API_TOKEN"
else
  check_optional ALEGRA_EMAIL "$ALEGRA_EMAIL"
  check_optional ALEGRA_API_TOKEN "$ALEGRA_API_TOKEN"
fi

echo ""
echo "--- Marketing ---"
check_optional RESEND_API_KEY "$RESEND_API_KEY"
check_optional NEXT_PUBLIC_GA_MEASUREMENT_ID "$NEXT_PUBLIC_GA_MEASUREMENT_ID"

echo ""
echo "=== Resumen: $errors error(es), $warnings advertencia(s) ==="

if [[ $errors -gt 0 ]]; then
  exit 1
fi

exit 0
