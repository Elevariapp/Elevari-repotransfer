#!/usr/bin/env bash
# Validate .env.production or .env.staging before deployment.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
if [[ "${1:-}" == "--staging" || "${STAGING:-}" == "1" ]]; then
  ENV_FILE="${ENV_FILE:-$ROOT/.env.staging}"
  MODE_LABEL="staging"
else
  ENV_FILE="${ENV_FILE:-$ROOT/.env.production}"
  MODE_LABEL="production"
fi

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${RED}✗ No existe $ENV_FILE${NC}"
  echo "  Copia el template de entorno correspondiente y completa sus valores."
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a
errors=0; warnings=0
check_required() { local name="$1" value="${2:-}"; if [[ -z "$value" ]]; then echo -e "${RED}✗ REQUERIDO vacío: $name${NC}"; errors=$((errors + 1)); else echo -e "${GREEN}✓ $name${NC}"; fi; }
check_optional() { local name="$1" value="${2:-}"; if [[ -z "$value" ]]; then echo -e "${YELLOW}○ opcional vacío: $name${NC}"; warnings=$((warnings + 1)); else echo -e "${GREEN}✓ $name${NC}"; fi; }

echo "=== Waná — validación [$MODE_LABEL] $ENV_FILE ==="
check_required POSTGRES_PASSWORD "${POSTGRES_PASSWORD:-}"
check_required JWT_SECRET "${JWT_SECRET:-}"
check_required NEXT_PUBLIC_SITE_URL "${NEXT_PUBLIC_SITE_URL:-}"
check_required NEXT_PUBLIC_API_URL "${NEXT_PUBLIC_API_URL:-}"
check_required CORS_ORIGIN "${CORS_ORIGIN:-}"
if [[ -n "${JWT_SECRET:-}" && ${#JWT_SECRET} -lt 32 ]]; then echo -e "${RED}✗ JWT_SECRET debe tener al menos 32 caracteres${NC}"; errors=$((errors + 1)); fi
if [[ "${NEXT_PUBLIC_API_URL:-}" == *"/api/v1"* ]]; then echo -e "${RED}✗ NEXT_PUBLIC_API_URL no debe incluir /api/v1${NC}"; errors=$((errors + 1)); fi
if [[ "${NEXT_PUBLIC_SITE_URL:-}" != https://* ]]; then echo -e "${YELLOW}○ NEXT_PUBLIC_SITE_URL no usa https${NC}"; warnings=$((warnings + 1)); fi

if [[ "${PAYMENTS_MODE:-}" == "live" ]]; then
  check_required WOMPI_ENV "${WOMPI_ENV:-}"
  if [[ "${WOMPI_ENV:-}" != "sandbox" && "${WOMPI_ENV:-}" != "production" ]]; then echo -e "${RED}✗ WOMPI_ENV debe ser sandbox o production${NC}"; errors=$((errors + 1)); fi
  check_required WOMPI_PUBLIC_KEY "${WOMPI_PUBLIC_KEY:-}"
  check_required WOMPI_PRIVATE_KEY "${WOMPI_PRIVATE_KEY:-}"
  check_required WOMPI_EVENTS_SECRET "${WOMPI_EVENTS_SECRET:-}"
  check_required WOMPI_INTEGRITY_SECRET "${WOMPI_INTEGRITY_SECRET:-}"
  check_required BOLD_API_KEY "${BOLD_API_KEY:-}"
  check_required BOLD_WEBHOOK_SECRET "${BOLD_WEBHOOK_SECRET:-}"
  check_required STRIPE_SECRET_KEY "${STRIPE_SECRET_KEY:-}"
  check_required STRIPE_PUBLISHABLE_KEY "${STRIPE_PUBLISHABLE_KEY:-}"
  check_required STRIPE_WEBHOOK_SECRET "${STRIPE_WEBHOOK_SECRET:-}"
  check_required NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}"
  check_required ALEGRA_EMAIL "${ALEGRA_EMAIL:-}"
  check_required ALEGRA_API_TOKEN "${ALEGRA_API_TOKEN:-}"
elif [[ "${PAYMENTS_MODE:-}" == "mock" ]]; then
  echo -e "${GREEN}✓ PAYMENTS_MODE=mock${NC}"
else
  echo -e "${RED}✗ PAYMENTS_MODE debe ser live o mock${NC}"
  errors=$((errors + 1))
fi

check_optional RESEND_API_KEY "${RESEND_API_KEY:-}"
check_optional NEXT_PUBLIC_GA_MEASUREMENT_ID "${NEXT_PUBLIC_GA_MEASUREMENT_ID:-}"
echo "=== Resumen: $errors error(es), $warnings advertencia(s) ==="
[[ "$errors" -eq 0 ]]
