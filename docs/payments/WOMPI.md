# Wompi sandbox and production configuration

Use Wompi Colombia's **payment gateway Web Checkout**, not its payouts API. Wompi is the primary Colombian (COP) provider, with Bold as fallback.

## Variables

- `WOMPI_ENVIRONMENT=sandbox|production` (default sandbox)
- `WOMPI_API_BASE_URL` (optional; defaults to `https://sandbox.wompi.co/v1` in sandbox and `https://production.wompi.co/v1` in production)
- `WOMPI_CHECKOUT_BASE_URL` (optional; defaults to the Wompi Web Checkout URL)
- `WOMPI_PUBLIC_KEY`
- `WOMPI_PRIVATE_KEY` (server-only; required for refund calls)
- `WOMPI_INTEGRITY_SECRET` (server-only; signs checkout parameters)
- `WOMPI_EVENTS_SECRET` (server-only; validates event checksum)

Set sandbox credentials in staging. Production credentials must be stored in the production secret manager and must never be committed.

The backend creates the hosted checkout URL with COP `amount-in-cents`, unique payment reference, redirect URL, public key, and integrity signature. After redirect/webhook, the backend queries Wompi's transaction endpoint and validates provider status, reference, currency, and amount before confirmation. Webhook signatures are verified using the checksum properties named in the incoming event, its timestamp, and the configured event secret.

Wompi test credentials and refund behavior should be validated against the current official Colombia documentation and the merchant account before enabling production.
