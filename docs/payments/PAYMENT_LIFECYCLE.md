# Payment lifecycle (Phase 2)

## Provider policy

- COP: Wompi is primary when its public key and integrity secret are configured; Bold is the COP fallback. If neither is configured, intent creation fails clearly.
- USD: Stripe only. The API rejects non-USD Stripe transactions; COP is never converted using a configured or implicit exchange rate.
- `PAYMENTS_MODE=mock`: mock payment path is used; do not treat it as provider certification or production settlement.
- Wompi integration uses Colombian Web Checkout. Checkout integrity is computed server-side; event signature validation follows the Wompi event `signature.properties` + timestamp + event-secret checksum contract. The event is not accepted as settlement proof without server-side transaction lookup.

## State consistency

A provider callback or status sync may confirm a booking only when the payment provider reports an approved/succeeded transaction and the associated booking is still payable. Duplicate success callbacks are idempotent through the persisted payment state. Failed, pending, or unverified callbacks must not confirm bookings.

## Configuration

Wompi: `WOMPI_ENVIRONMENT` (`sandbox` by default), `WOMPI_API_BASE_URL` (optional override), `WOMPI_CHECKOUT_BASE_URL` (optional override), `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, and `WOMPI_EVENTS_SECRET`.

Never expose private, integrity, or event secrets to the frontend. `WOMPI_PRIVATE_KEY` is used only for refunds. Checkout URLs use the public key and a SHA-256 integrity signature built from the unique reference, integer `amount-in-cents`, `COP`, and integrity secret.

## Endpoints

- `POST /api/v1/payments/intent` creates a provider checkout/intent, with database idempotency key.
- `GET /api/v1/payments/:id` retrieves a payment for its guest or admin.
- `POST /api/v1/payments/:id/sync` asks the provider for current status; redirect parameters alone never confirm.
- `POST /api/v1/webhooks/wompi`, `/bold`, `/stripe` receive provider events.
- Cancellation/refund requests preserve payment and booking history; Bold refund availability is subject to Bold account/API support.

## Production checks

Use Wompi sandbox credentials and test successful, declined, pending, duplicate-event, and mismatched-amount/reference scenarios before enabling live checkout. Also test Stripe USD and Bold fallback in their appropriate environments. Verify refunds against each provider's current API/account capabilities. External provider dashboards, secrets, and real settlement have not been verified by this document.
