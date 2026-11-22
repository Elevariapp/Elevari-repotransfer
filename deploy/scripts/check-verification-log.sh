#!/usr/bin/env bash
# Fails if verification-log.md contains CONTRADICTED facts while live payments
# configuration exists. Production-enabled code may not depend on
# CONTRADICTED facts.
set -euo pipefail

LOG_FILE="${1:-verification-log.md}"

if [[ ! -f "$LOG_FILE" ]]; then
  echo "✗ $LOG_FILE not found"
  exit 1
fi

# Count only table rows: "| … | CONTRADICTED | … |"
real=$(grep -cE '^\|.*\|[[:space:]]*CONTRADICTED[[:space:]]*\|' "$LOG_FILE" || true)

if [[ "$real" -gt 0 ]]; then
  echo "✗ verification-log.md has $real CONTRADICTED fact(s)."
  echo "  Production-enabled code may not depend on CONTRADICTED facts."
  echo "  Resolve them before go-live."
  exit 1
fi

echo "✓ verification-log.md clean (no CONTRADICTED facts)"
