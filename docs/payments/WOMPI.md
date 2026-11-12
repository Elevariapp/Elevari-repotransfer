# Wompi environment and payment configuration

`WOMPI_ENV`, `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, and `WOMPI_INTEGRITY_SECRET` are the sole Wompi configuration source. API endpoints are derived only from `WOMPI_ENV`; no alternate environment/base URL variables are read.

- `WOMPI_ENV=sandbox` selects the Wompi sandbox transaction/refund API.
- `WOMPI_ENV=production` selects the production transaction/refund API.
- `WOMPI_PUBLIC_KEY` is used for hosted checkout and transaction lookup.
- `WOMPI_INTEGRITY_SECRET` signs checkout parameters server-side.
- `WOMPI_EVENTS_SECRET` validates webhook checksums.
- `WOMPI_PRIVATE_KEY` is server-only and used for refunds.

When `PAYMENTS_MODE=live`, API startup fails fast if any of the five Wompi settings is missing, or if `WOMPI_ENV` is not `sandbox` or `production`. Mock mode may omit merchant credentials.

For this production/test phase, the environment templates use `https://eleveri.app/` as the site/API origin. Keep that domain until the owner explicitly requests the public-launch domain change. Never commit credentials: populate secret values only in protected runtime environment files.
