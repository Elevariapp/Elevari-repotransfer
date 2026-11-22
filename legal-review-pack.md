# Legal Review Pack — International Converted Checkout

> **This document does NOT provide legal advice and does NOT claim compliance.**
> It packages the implementation facts and open questions for review by
> qualified counsel before enabling international converted checkout.

**Gate:** `FX_INTL_CHECKOUT_ENABLED` (default `false`) + `LEGAL_SIGNOFF_REF`.
International converted checkout (display USD, charge COP) stays blocked until
both are set. Domestic COP checkout remains active regardless.

## 1. Disclosure texts shown to international customers

### Spanish (es)

> Se te cobrará **{charge COP}**. El valor **{display USD}** es solo de referencia,
> calculado con una tasa de **{rate} COP por USD**. Cotización generada el
> **{lockedAt}** y válida hasta el **{expiresAt}**. El monto cobrado en COP es el
> valor oficial. Los reembolsos se emiten en COP por el monto original cobrado.

### English (en)

> You will be charged **{charge COP}**. The amount **{display USD}** is a
> reference only, based on an exchange rate of **{rate} COP per USD**. Quote
> generated at **{lockedAt}** and valid until **{expiresAt}**. The charged COP
> amount is authoritative. Refunds are issued in COP for the original charged
> amount.

Source: `api/src/lib/payments/disclosure.ts` (`DISCLOSURE_VERSION = fx-disclosure-v1`).

## 2. Refund texts / policy

- Refunds are issued **in COP**, equal to (a portion of) the **original charged
  amount**. Never repriced using new FX rates.
- Stored per refund: refund amount (minor units), original amount (minor
  units), original quote rate, provider refund reference
  (`payment_refunds` table).
- Cancellation policy tiers (flexible / moderate / strict):
  `api/src/lib/cancellation-policy.ts`, aligned with `knowledge/policies.txt`.

## 3. Flow description

```
Property → Booking (pending_payment) → FX Quote (locked, 15 min TTL)
  → Disclosure (intl only, explicit accept, hash stored)
  → Wompi Checkout (COP, integrity signature)
  → Webhook / sync → Payment PAID → Booking CONFIRMED
  → (optional) Refund in COP → Payment PARTIALLY_REFUNDED/REFUNDED
```

- Charge currency is always **COP**. Display currency may be USD
  (informational only).
- The charged COP amount is authoritative and frozen at quote time.
- Disclosure acceptance stored: version, locale, SHA-256 hash of the exact
  text shown, acceptance timestamp (`fx_quotes.disclosure_*` columns).

## 4. Data retention summary

| Data | Where | Purpose |
|------|-------|---------|
| FX quotes (rate, amounts, timestamps) | `fx_quotes` | Audit of frozen charge amount |
| Disclosure acceptance (version, locale, hash, ts) | `fx_quotes.disclosure_*` | Proof of explicit consent |
| Payment timeline events | `payment_events` | End-to-end traceability |
| Refund records | `payment_refunds` | Refund audit (amounts, rate, provider ref) |
| Provider raw payloads | `payments.metadata`, `payment_attempts.raw` | Reconciliation |

No card data touches our servers — Wompi hosted checkout handles PAN data.

## 5. Open legal questions for counsel

1. Is the disclosure text sufficient under Colombian consumer protection
   rules (SIC) for cross-border card charges converted to COP?
2. Must the USD reference amount include a disclaimer about the customer's
   bank applying its own FX/conversion fees?
3. Are there Colombian FX/foreign-exchange regulations (Banco de la
   República) affecting charging international cards in COP?
4. Refund-in-COP policy: any requirement to refund in the currency the
   customer was debited by their bank?
5. Data retention periods required for payment/quote/disclosure records
   under Colombian law (habeas data, tax).
6. Should terms of service include an FX conversion clause referencing the
   quote rate source?

## 6. How to enable after signoff

```bash
# .env.production
LEGAL_SIGNOFF_REF=<reference to counsel signoff, e.g. ticket/doc id>
FX_INTL_CHECKOUT_ENABLED=true
```

Without both, `POST /api/v1/payments/intent` with `display_currency=USD`
returns `403 INTERNATIONAL_CHECKOUT_BLOCKED`.
