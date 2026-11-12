# ADR-001: Canonical architecture

- **Status:** accepted baseline, derived from repository implementation and the accepted Phase 0 facts.
- **Decision scope:** current architecture only; this ADR does not introduce new services or business rules.

## Decision

The canonical application stack is:

- **Web:** Next.js App Router, React, TypeScript.
- **API:** Fastify REST API under `api/`, with `/api/v1` routes.
- **Persistence:** PostgreSQL accessed through Prisma; schema and migrations live under `api/prisma/`.
- **Supporting services:** Redis and MinIO, operated in the existing Docker Compose topology.
- **Deployment:** containerized services behind Nginx; AWS and Cloudflare configuration is external to this repository and must be verified by the operator.
- **Payments currently implemented:** Stripe and Bold, plus local/staging mock behavior. Wompi is not implemented.

The API owns authorization and transactional booking/payment state. Web clients consume the API and must not become a second source of business truth.

## Legacy guidance

`README_ADMIN.md` describes direct Supabase access, Supabase RLS, and legacy Next API routes. That guidance conflicts with the active Fastify/Prisma implementation and is **legacy, not an instruction for new work**. Admin functionality currently implemented in this repository uses Fastify routes and JWT role checks. This ADR records the precedence; it does not assert that every historical Supabase artifact has been removed.

## Evidence in this repository

- `INFRASTRUCTURE.md` describes Fastify, Prisma/PostgreSQL, Redis, MinIO, Next.js, and Docker.
- `api/src/app.ts` registers Fastify REST route modules under `/api/v1`.
- `api/prisma/schema.prisma` is the current Prisma data model.
- `docker-compose.yml`, `docker-compose.staging.yml`, and `docker-compose.prod.yml` describe local, staging, and production container topologies.
- `api/src/lib/payments/router.ts` and `api/src/routes/payments.ts` implement Bold and Stripe provider paths.

## Consequences

- New architecture documentation should follow this ADR unless a later, approved ADR supersedes it.
- Do not use `README_ADMIN.md` as authority for new Admin data access.
- Do not describe Wompi as implemented.
- Do not claim AWS/Cloudflare configuration or production readiness based solely on repository configuration.
- Functional changes to payments, bookings, price, or cancellation behavior require their own scoped implementation and validation.

## Known validation boundary

This ADR establishes the code/configuration architecture. It does not claim builds, database migrations, external provider transactions, backups/restores, AWS, or Cloudflare were tested in a live environment.
