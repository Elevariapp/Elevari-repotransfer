# Environment specification

This document defines the required runtime configuration for the repository as it is implemented today.

## Canonical sources of truth

- `api/.env.example` defines the API environment contract.
- `deploy/.env.staging.example` defines the staging contract used for the pre-live environment.
- `deploy/scripts/validate-env.sh` is the canonical validation script used before deployment.
- `docker-compose.yml`, `docker-compose.staging.yml`, and `docker-compose.prod.yml` define the runtime topology.

## Required startup environment

### Core application

- `NODE_ENV` — runtime mode (`development` or `production`)
- `PORT` — API port, default `4000`
- `HOST` — bind host, default `0.0.0.0`
- `DATABASE_URL` — PostgreSQL connection string for Prisma
- `JWT_SECRET` — JWT signing secret, minimum 32 characters
- `CORS_ORIGIN` — comma-separated list of allowed origins
- `NEXT_PUBLIC_SITE_URL` — public site URL
- `NEXT_PUBLIC_API_URL` — public API URL without `/api/v1`

### Redis

- `REDIS_URL` — Redis connection string

### MinIO / S3 media

- `MINIO_ENDPOINT` — default `localhost`
- `MINIO_PORT` — default `9000`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET` — default `wana-media`
- `MINIO_PUBLIC_URL` — public URL for media files
- `MINIO_USE_SSL` — `true` or `false`

### Payments

- `PAYMENTS_MODE` — `mock` for staging, `live` for production

If `PAYMENTS_MODE=live` then the following are required:

- `BOLD_API_KEY`
- `BOLD_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

If `PAYMENTS_MODE=mock`, the app is expected to operate without live keys.

### Invoicing

- `ALEGRA_EMAIL` and `ALEGRA_API_TOKEN` are required for live production billing flows.
- In staging they may be omitted and the application should remain operational with warnings.

### Marketing / observability

Optional but supported:

- `RESEND_API_KEY`
- `RESEND_FROM`
- `META_PIXEL_ID`
- `META_ACCESS_TOKEN`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `SENTRY_DSN`

## Validation behavior

The deployment validator is the source of truth for required variables and malformed values.

The script enforces:

- required values must be non-empty
- `JWT_SECRET` must be at least 32 characters
- `NEXT_PUBLIC_API_URL` must not include `/api/v1`
- `PAYMENTS_MODE` must be `mock` or `live`
- live payment mode requires provider keys

The script exits non-zero when required values are missing.

## Startup rules

The API must not be started with missing critical runtime environment variables.

In practice:

- `NODE_ENV`, `PORT`, and `HOST` have sane defaults
- `DATABASE_URL` and `JWT_SECRET` are mandatory for meaningful runtime
- `CORS_ORIGIN` must be provided in real deployments
- production deploys must use live provider secrets when charging real payments

## Operational note

This specification documents repository-level requirements only. It does not validate AWS, Cloudflare, DNS, or provider dashboards; those remain operational tasks outside this repository.
