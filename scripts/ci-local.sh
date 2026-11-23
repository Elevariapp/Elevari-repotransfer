#!/usr/bin/env bash
# Mirrors .github/workflows/ci.yml locally. Usage:
#   ./scripts/ci-local.sh            # fast: typechecks + env/log gates + bot check
#   ./scripts/ci-local.sh --full     # also runs the real builds (api + web)
#   ./scripts/ci-local.sh --lockfiles  # also verifies lockfiles with npm 10 (what CI uses)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FULL=0
LOCKS=0
for arg in "$@"; do
  [[ "$arg" == "--full" ]] && FULL=1 && LOCKS=1
  [[ "$arg" == "--lockfiles" ]] && LOCKS=1
done

failures=()
step() {
  local name="$1"; shift
  echo ""
  echo "━━ $name"
  if "$@"; then echo "✓ $name"; else echo "✗ $name"; failures+=("$name"); fi
}

ensure_deps() { [[ -d "$1/node_modules" ]] || (cd "$1" && npm ci --no-audit --no-fund); }

if [[ $LOCKS -eq 1 ]]; then
  # CI runs Node 22 + npm 10: a lockfile written by npm 11 can fail `npm ci` there.
  for d in . api mobile elevari-bot; do
    step "lockfile in sync: $d" bash -c "cd '$d' && npx -y npm@10 ci --dry-run --ignore-scripts >/dev/null"
  done
fi

ensure_deps .
ensure_deps mobile
ensure_deps api

step "web typecheck" npx tsc --noEmit --incremental false
step "mobile typecheck" bash -c "cd mobile && npm run typecheck"
step "api typecheck" bash -c "cd api && npx tsc --noEmit"

step "staging env template" bash -c '
  tmp=$(mktemp); cp deploy/.env.staging.example .env.staging
  sed -i.bak "s/change_me_jwt_min_32_chars/ci_staging_jwt_secret_min_32_chars_x/g; s/^POSTGRES_PASSWORD=change_me$/POSTGRES_PASSWORD=staging_pg_password_123/; s/change_me_minio/staging_minio_secret_123/g" .env.staging
  STAGING=1 ./deploy/scripts/validate-env.sh >/dev/null; rc=$?
  rm -f .env.staging .env.staging.bak "$tmp"; exit $rc'
step "verification log" ./deploy/scripts/check-verification-log.sh verification-log.md
step "bot syntax" bash -c "cd elevari-bot && node --check src/index.js && node --check src/config/index.js"

if docker compose version >/dev/null 2>&1; then
  step "compose config (prod)" bash -c '
    created=0; [[ -f .env.production ]] || { cp deploy/.env.production.example .env.production; created=1; }
    docker compose -f docker-compose.prod.yml --env-file .env.production config -q; rc=$?
    [[ $created -eq 1 ]] && rm -f .env.production; exit $rc'
else
  echo "○ docker compose no disponible — se omite compose config"
fi

if [[ $FULL -eq 1 ]]; then
  step "api build" bash -c "cd api && npm run build"
  step "web build" env NEXT_PUBLIC_API_URL=http://localhost:4000 NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
    JWT_SECRET=ci_jwt_secret_min_32_chars_for_build_only npm run build
fi

echo ""
if [[ ${#failures[@]} -gt 0 ]]; then
  echo "✗ Fallaron: ${failures[*]}"
  exit 1
fi
echo "✓ Todo OK — seguro para push"
