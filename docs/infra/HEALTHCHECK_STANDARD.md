# Healthcheck standard

This repository depends on several services. Health validation must be explicit and reproducible.

## Canonical checks

### API

The API exposes a health endpoint:

- `GET /health`
- implemented in `api/src/routes/health.ts`

Expected behavior:

- returns HTTP `200` when the app can respond
- includes service metadata and database connectivity state
- indicates whether Turnstile is required

### PostgreSQL

The repository uses PostgreSQL via Prisma and Docker Compose.

Canonical runtime health check:

- `pg_isready -U <user> -d <database>`

This is the health check used in `docker-compose.yml` and `docker-compose.staging.yml`.

### Redis

Canonical runtime health check:

- `redis-cli ping`

Expected response: `PONG`

### MinIO / object storage

The MinIO service is used for media uploads and retrieval.

Canonical runtime health check:

- `mc ready local`

This is the pattern in the repository Docker Compose configuration.

### Nginx / reverse proxy

The deployment topology includes Nginx in front of the Next.js web app and Fastify API.

Operational expectation:

- Nginx must pass requests to `web:3000` and `api:4000`
- `/health` should be reachable through the proxy layer
- `/api/*` should route to the API without gateway failures

## Dependency contract

A service is considered healthy only if:

- the process is running
- the dependency responds successfully to its native health probe
- the application endpoint responds without runtime startup failures

## Production standards

- API health should be checked before traffic is advertised as healthy.
- Database, Redis, and storage services should be treated as critical dependencies.
- Failures should be observable in logs and container health status.
- Health checks must be included in compose configuration so startup order and readiness are reproducible.

## Repository status

The repository already contains the key health checks for the platform layer. This standard formalizes the expected behavior and keeps deployment validation consistent with current Docker and Fastify implementation.
