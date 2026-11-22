# Verification Log — Phase 2 (Wompi Payments)

External facts used by the payment platform. Each entry has a status:

- **VERIFIED** — confirmed against the provider's official documentation or a live sandbox test.
- **UNVERIFIED** — implemented from best available knowledge; must be confirmed before go-live.
- **CONTRADICTED** — found to be false. **Production-enabled code may not depend on CONTRADICTED facts.**

| # | Fact | Status | Date | Evidence / action required |
|---|------|--------|------|----------------------------|
| 1 | Wompi hosted checkout URL format `https://checkout.wompi.co/p/?public-key=…&currency=COP&amount-in-cents=…&reference=…&signature:integrity=…&redirect-url=…` | UNVERIFIED | 2026-11-14 | URL generated with production key and all params (local test 2026-11-14); Wompi-side acceptance must be confirmed with first real checkout from a network with Wompi access (this sandbox blocks egress to wompi.co) |
| 2 | Integrity signature = `sha256(reference + amountInCents + currency + integritySecret)` | UNVERIFIED | 2026-11-14 | 64-char hex signature generated per intent; confirm server acceptance on first real checkout |
| 3 | Webhook checksum = `sha256(concat(properties values) + timestamp + eventsSecret)` | UNVERIFIED | 2026-11-14 | Confirm with first real webhook delivery; signature mismatch → 401 (safe default) |
| 4 | Transaction lookup `GET /v1/transactions?reference=…` with `Authorization: Bearer <private_key>` | UNVERIFIED | 2026-11-14 | Blocked by sandbox egress; verify from CI/VPS with `curl -H "Authorization: Bearer $WOMPI_PRIVATE_KEY" "https://production.wompi.co/v1/transactions?reference=probe"` |
| 5 | Transaction status `APPROVED` means paid; `DECLINED`/`ERROR`/`VOIDED` mean failed | UNVERIFIED | 2026-11-14 | Confirm full Wompi status list in docs |
| 6 | Full refund via `POST /v1/transactions/{id}/void`; partial refunds may require dashboard | UNVERIFIED | 2026-11-14 | Code falls back to `pending_manual` if API rejects — safe; confirm availability per payment method |
| 7 | Sandbox base `https://sandbox.wompi.co/v1`, production `https://production.wompi.co/v1` | UNVERIFIED | 2026-11-14 | DNS blocked in this sandbox; verify from CI/VPS |
| 8 | Production public keys start with `pub_prod_` | VERIFIED | 2026-11-14 | Real production credentials loaded 2026-11-14; startup validation accepted them (pub_prod_ prefix confirmed) |
| 9 | FX rate source for COP/USD is ops-controlled env `FX_COP_USD_RATE` | VERIFIED | 2026-11-14 | Internal decision; rate tracked per quote in `fx_quotes.rate_source` |
| 10 | Production end-to-end: intent → checkout → webhook → booking confirmed | UNVERIFIED | — | Requires first real Wompi payment from a network with Wompi access + public webhook URL |
| 11 | Startup validation with production Wompi credentials: API boots in live mode only when all WOMPI_* present | VERIFIED | 2026-11-14 | Boot log 2026-11-14: `mode=live wompi=enabled … wompi_env=production`; fail-fast tested with partial config (startup aborts) |
| 12 | Live intent creation produces checkout URL without contacting Wompi servers (no charge created) | VERIFIED | 2026-11-14 | Local live-mode intent 2026-11-14: provider=wompi, mode=live, checkout host checkout.wompi.co, signature present, FX quote persisted |

## How to update

1. Verify the fact against official Wompi documentation or a sandbox test.
2. Change status to VERIFIED (add evidence) or CONTRADICTED (fix the code).
3. Commit with the code change that resolves the contradiction.

**CI gate:** `deploy/scripts/check-verification-log.sh` fails the build if any
CONTRADICTED fact remains while `PAYMENTS_MODE=live` configuration is present.
