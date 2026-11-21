# Despliegue de producción

Última validación: 2026-11-21 · rama chore/elevari-production

Guía de referencia del stack de `docker-compose.prod.yml` en el servidor Hetzner (`/opt/elevari`). Solo producción; no hay staging. Procedimientos operativos (bootstrap del servidor, deploy, rollback, backups, rotación, DNS): [docs/RUNBOOK.md](../docs/RUNBOOK.md). Estado de lanzamiento: [GO_LIVE_CHECKLIST.md](../GO_LIVE_CHECKLIST.md).

## Arquitectura

```
Internet → Cloudflare → nginx (:80 redirige a HTTPS salvo /health · :443 Origin Certificate)
   elevari.live        → web :3000 (/) · api :4000 (/api/*, /health)
   www.elevari.live    → 301 a elevari.live
   media.elevari.live  → minio :9000 (/elevari-media/*, GET/HEAD)
red interna: postgres · redis · minio
```

Un solo dominio, sin subdominio `api`. Detalle: [ARCHITECTURE.md](../ARCHITECTURE.md), [INFRASTRUCTURE.md](../INFRASTRUCTURE.md).

## Archivos

| Archivo | Uso |
|---------|-----|
| `docker-compose.prod.yml` | Stack de producción |
| `deploy/nginx/nginx.conf`, `deploy/nginx/cloudflare-ips.conf` | Proxy, TLS, IP real tras Cloudflare |
| `deploy/.env.production.example` | Plantilla de variables (copiar a `.env.production`, nunca commitear) |
| `/etc/ssl/elevari/origin.pem`, `origin.key` | Origin Certificate de Cloudflare, solo en el servidor |
| `deploy/scripts/validate-env.sh` | Validación estricta del env de producción |
| `deploy/scripts/deploy-prod.sh` | Validar, construir y levantar el stack |
| `deploy/scripts/verify-health.sh` | Verificación posterior al despliegue |
| `deploy/scripts/backup-db.sh`, `restore-db.sh` | Backup y restauración de PostgreSQL |

## Variables críticas (solo nombres; valores en el servidor)

| Variable | Notas |
|----------|-------|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Base de datos |
| `JWT_SECRET` | ≥ 32 caracteres; lo usan la API y la web |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL` | `https://elevari.live` (sin `/api/v1`); build-time; el build de `web` falla si faltan |
| `PUBLIC_SITE_URL`, `CORS_ORIGIN` | `https://elevari.live` |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_PUBLIC_URL` | Bucket `elevari-media`; URL pública `https://media.elevari.live/elevari-media` |
| `PAYMENTS_MODE=live`, `PAYMENTS_WOMPI_ENABLED=true` | `mock` está prohibido en producción (salvo `ALLOW_MOCK_PAYMENTS=true` para humo interno) |
| `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`, `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Llaves `pub_prod_` / `prv_prod_` |
| `ALEGRA_EMAIL`, `ALEGRA_API_TOKEN` | Facturación |
| `RESEND_API_KEY`, `RESEND_FROM` | `Elevari <reserve@elevari.live>` |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Obligatorios; la API no arranca sin el secret |
| `DISABLE_DEMO_ACCOUNTS=true` | Exigido por `validate-env.sh` |
| `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | Analítica (build-time) |
| `ANDROID_SHA256_CERT_FINGERPRINTS`, `ANDROID_PACKAGE_NAME` | Sirven `/.well-known/assetlinks.json` |

`validate-env.sh` falla si faltan llaves de Wompi `prod_`, Alegra, Resend o Turnstile.

## Build y arranque

```bash
cd /opt/elevari
./deploy/scripts/validate-env.sh
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

La API ejecuta `prisma migrate deploy` al iniciar y aborta en producción sin `JWT_SECRET` ≥ 32 caracteres, sin `TURNSTILE_SECRET_KEY` o con `PAYMENTS_MODE=mock`.

Datos iniciales (una vez): `npm run create-admin` y `npm run seed:property` dentro del contenedor `api` (ver RUNBOOK §1). El seed demo (`db:seed`) nunca se usa en producción.

## Verificación

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
curl -s http://localhost/health
curl -sI https://elevari.live/health
```

## Webhook de pagos

Wompi → `https://elevari.live/api/v1/webhooks/wompi` (se configura en el panel de Wompi con el secret de eventos).

## Facturación (Alegra)

Al confirmarse un pago en COP la API emite la factura en Alegra; si falla, queda en `pending_invoices` y un admin puede reintentar con `POST /api/v1/admin/invoices/{id}/retry` (listar: `GET /api/v1/admin/invoices/pending`), siempre con el token de un usuario admin.

## Problemas frecuentes

| Problema | Qué revisar |
|----------|-------------|
| API no arranca | Logs de `api`: `JWT_SECRET`, `TURNSTILE_SECRET_KEY`, `PAYMENTS_MODE` |
| `/health` con `degraded` | Postgres: `docker compose ... logs postgres`, `DATABASE_URL` |
| Build de `web` falla | `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` definidos; errores de TypeScript |
| Webhook 401 | `WOMPI_EVENTS_SECRET` incorrecto |
| Imágenes no cargan | `MINIO_PUBLIC_URL`, bucket público, host `media` en nginx |
| 525/526 en Cloudflare | Origin Certificate en `/etc/ssl/elevari/` y modo SSL de Cloudflare |
