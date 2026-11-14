# Pagos — Fase 2 (Wompi-first)

Estado: implementado y validado en mock/staging. Wompi es el **único proveedor activo**.
Bold y Stripe permanecen en el repositorio, ocultos y deshabilitados.

## Pricing (MVP — sin motor de impuestos)

```
BASE_AMOUNT + PLATFORM_FEE = TOTAL_AMOUNT
```

- Sin INC, sin parafiscal, sin IVA, sin desglose de impuestos al cliente.
- Platform fee **15%** por defecto, configurable con `PLATFORM_FEE_PERCENT`.
- Label al huésped: **"Tarifa de Servicio Elevari"**.
- Persistido en `bookings.fees_breakdown`: `base_amount`, `platform_fee_percent`,
  `platform_fee_amount`, `total_amount` (+ alias legacy `total_charge_to_guest`, `subtotal`).
- Código: `api/src/lib/fees.ts` — espejo web `lib/tax-logic.ts`.

## Ciclo de vida booking → pago → confirmación

```
Property → Booking (pending_payment) → FX Quote (locked)
  → [international] Disclosure (explicit accept)
  → Wompi Checkout (hosted, COP)
  → Webhook /webhooks/wompi  o  POST /payments/:id/sync
  → Payment PAID → Booking CONFIRMED
  → (opcional) Refund COP → PARTIALLY_REFUNDED / REFUNDED
```

- Un pago exitoso **confirma** la reserva.
- Un pago fallido **nunca** confirma la reserva.
- Booking y pago siempre sincronizados (transacciones Prisma + state machines).

## State machines

**Payment:** `pending → processing → succeeded → partially_refunded → refunded`
(terminales: `failed`, `cancelled`, `refunded`). Solo `succeeded` (PAID) confirma bookings.
Código: `api/src/lib/payments/payment-state.ts`.

**Booking:** `draft → pending_payment → confirmed → checked_in → completed` / `cancelled`.
Código: `api/src/lib/booking-state.ts`.

## Wompi

- Checkout: hosted web checkout con firma de integridad
  `sha256(reference + amountInCents + currency + integritySecret)`.
- Sync: `GET /v1/transactions?reference=<idempotency_key>`.
- Webhook: checksum `sha256(concat(properties) + timestamp + eventsSecret)`;
  eventos `transaction.updated`; dedupe por hash `transactionId+status+timestamp`;
  validación de monto contra el charge congelado.
- Refunds: API `void` para full; si el método no lo soporta → `pending_manual`
  con registro en `payment_refunds`.
- Código: `api/src/lib/payments/wompi-provider.ts`.
- Config: `.env.wompi.example` es la única fuente de verdad (`WOMPI_*`).

## FX engine

- CO → COP directo (charge = display).
- Internacional → display USD (informativo), **charge COP** (autoritativo).
- Quotes persistidos en `fx_quotes`: montos en minor units, tasa, fuente,
  `locked_at`, `expires_at` (TTL `FX_QUOTE_TTL_MINUTES`, default 15).
- Tasa: `FX_COP_USD_RATE` (ops). Código: `api/src/lib/payments/fx.ts`.

## Disclosure (internacional)

- Si `display_currency=USD`, `POST /payments/intent` responde `428 DISCLOSURE_REQUIRED`
  con el texto (ES/EN), versión y hash SHA-256.
- El pago falla si no hay aceptación; se persiste versión, locale, hash y timestamp
  en `fx_quotes.disclosure_*`.
- El cobro en COP es autoritativo; el USD mostrado es informativo.
- Código: `api/src/lib/payments/disclosure.ts`.

## Legal gate

`FX_INTL_CHECKOUT_ENABLED` (default `false`) + `LEGAL_SIGNOFF_REF`.
Sin ambos, checkout internacional → `403 INTERNATIONAL_CHECKOUT_BLOCKED`.
Ver `legal-review-pack.md`. El checkout doméstico COP no se bloquea.

## Refunds

- Full y partial, siempre en **COP**, nunca re-tasados con FX nuevo.
- `payment_refunds` guarda: monto, monto original, tasa original, referencia del proveedor.
- No se puede reembolsar más del monto cargado original.
- Endpoint: `POST /api/v1/payments/:id/refund` (admin).
- Código: `api/src/lib/refund-payment.ts`.

## Idempotencia y duplicados

- `payments.idempotency_key` UNIQUE — reintentos devuelven el intent existente.
- Webhooks deduplicados vía `payment_events` (tipo `webhook_applied` + `dedupe_key`).
- Doble confirmación es no-op (`alreadyProcessed`).
- Un pago `succeeded` no se puede re-confirmar ni duplicar booking.

## Observabilidad

- `payment_events`: timeline por pago/booking/quote/refund con `correlation_id`.
- `GET /api/v1/payments/:id/timeline`.
- Métricas como eventos: `fx_quote_shown`, `fx_disclosure_accepted`,
  `payment_paid_international`, `payment_failed_international`,
  `refund_requested`, `refund_refunded`, `webhook_amount_mismatch`.

## Startup validation

Si `PAYMENTS_WOMPI_ENABLED=true` y falta cualquier `WOMPI_*`, la API **no arranca**
(error explícito). El entorno se deriva del prefijo de la llave (`pub_prod_`/`pub_test_`);
llaves pública y privada de ambientes distintos abortan el arranque.
Código: `api/src/lib/payments/config.ts`.

## Verificación externa

`verification-log.md` rastrea hechos VERIFIED/UNVERIFIED/CONTRADICTED.
CI falla si queda algún CONTRADICTED (`deploy/scripts/check-verification-log.sh`).

## Modo mock (staging/local)

`PAYMENTS_MODE=mock` → checkout simulado, `POST /payments/:id/mock-complete` y
`/mock-fail` disponibles. Smoke: `./deploy/scripts/mock-booking-smoke.sh`.
