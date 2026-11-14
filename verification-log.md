# Verification Log — Phase 2 (Wompi Payments)

External facts used by the payment platform. Each entry has a status:

- **VERIFIED** — confirmed against the provider's official documentation or a live sandbox test.
- **UNVERIFIED** — implemented from best available knowledge; must be confirmed before go-live.
- **CONTRADICTED** — found to be false. **Production-enabled code may not depend on CONTRADICTED facts.**

| # | Fact | Status | Date | Evidence / action required |
|---|------|--------|------|----------------------------|
| 1 | Wompi hosted checkout URL format `https://checkout.wompi.co/p/?public-key=…&currency=COP&amount-in-cents=…&reference=…&signature:integrity=…&redirect-url=…` | UNVERIFIED | 2026-11-14 | Confirm against Wompi web-checkout docs before live |
| 2 | Integrity signature = `sha256(reference + amountInCents + currency + integritySecret)` | UNVERIFIED | 2026-11-14 | Confirm exact concatenation order in Wompi docs |
| 3 | Webhook checksum = `sha256(concat(properties values) + timestamp + eventsSecret)` | UNVERIFIED | 2026-11-14 | Confirm against Wompi events/webhooks docs |
| 4 | Transaction lookup `GET /v1/transactions?reference=…` with `Authorization: Bearer <private_key>` | UNVERIFIED | 2026-11-14 | Confirm endpoint + auth scheme in Wompi API docs |
| 5 | Transaction status `APPROVED` means paid; `DECLINED`/`ERROR`/`VOIDED` mean failed | UNVERIFIED | 2026-11-14 | Confirm full Wompi status list |
| 6 | Full refund via `POST /v1/transactions/{id}/void`; partial refunds may require dashboard | UNVERIFIED | 2026-11-14 | Confirm refund API availability for our payment methods |
| 7 | Sandbox base `https://sandbox.wompi.co/v1`, production `https://production.wompi.co/v1` | UNVERIFIED | 2026-11-14 | Confirm base URLs |
| 8 | Production public keys start with `pub_prod_` | UNVERIFIED | 2026-11-14 | Confirm key format; startup validation depends on this |
| 9 | FX rate source for COP/USD is ops-controlled env `FX_COP_USD_RATE` | VERIFIED | 2026-11-14 | Internal decision; rate tracked per quote in `fx_quotes.rate_source` |
| 10 | Sandbox end-to-end: intent → checkout → webhook → booking confirmed | UNVERIFIED | — | Run in Wompi sandbox with test keys before go-live |

## How to update

1. Verify the fact against official Wompi documentation or a sandbox test.
2. Change status to VERIFIED (add evidence) or CONTRADICTED (fix the code).
3. Commit with the code change that resolves the contradiction.

**CI gate:** `deploy/scripts/check-verification-log.sh` fails the build if any
CONTRADICTED fact remains while `PAYMENTS_MODE=live` configuration is present.
