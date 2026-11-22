# Pricing Logic

## Source of truth in code
- Fee calculation (API): `api/src/lib/fees.ts` (`calculateWanaFees`)
- Fee calculation (web mirror): `lib/tax-logic.ts`
- Reservation + payment: `api/src/routes/bookings.ts`, `api/src/routes/payments.ts`

## Model — MVP (Phase 2, single pricing model)

**No active tax engine. No INC. No Parafiscal. No VAT line shown to customers.
No tax breakdown shown to customers.**

```
BASE_AMOUNT + PLATFORM_FEE = TOTAL_AMOUNT
```

- **Base amount** = `price_per_night` × nights.
- **Platform fee** = `base_amount × PLATFORM_FEE_PERCENT` (default **15%**, configurable via env).
- **Total** = base + platform fee — this is the authoritative charge (always COP via Wompi).
- Guest-facing label: **"Tarifa de Servicio Elevari"**.
- Host receives = base − platform fee.

## Persisted per booking (`fees_breakdown` JSON)

- `base_amount`
- `platform_fee_percent`
- `platform_fee_amount`
- `total_amount`
- Aliases for legacy readers: `total_charge_to_guest` (= total_amount), `subtotal` (= base_amount)

## International

Country determines display currency. Customers may see **USD** while being
charged in **COP** through Wompi. The charged COP amount is always
authoritative; the foreign amount is reference only (frozen FX quote in
`fx_quotes`: rate, timestamps, quote id).

## Operational notes
- `PLATFORM_FEE_PERCENT` env var changes the fee without a code change (validated 0–100).
- All monetary calculations must use `calculateWanaFees`; do not duplicate pricing logic.
- Payment amounts cross provider boundaries in integer minor units only.

## For agents
When answering pricing questions for guests, cite this file and `policies.txt`.
For implementation work, read `api/src/lib/fees.ts` directly.
