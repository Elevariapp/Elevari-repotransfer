# Waná Infrastructure

Use this file as the entry point for deployment and environment-specific work.

## Official architecture (Elevari Foundation Reboot)

| Layer | Official |
|-------|----------|
| Compute | **AWS EC2** |
| Database | **PostgreSQL** |
| Object storage | **S3-compatible** (MinIO local) |
| Edge / DNS / TLS | **Cloudflare** |
| Payments | **Wompi** (only provider) |
| Extensions | Fly.io · Hugging Face |

**Out of scope (removed):** Vercel · Supabase · Firebase · Netlify.
Stripe and Bold implementations were removed; only the provider abstraction remains.

## Design system & brand (Phase 3)

| Topic | Reference |
|-------|-----------|
| Brand guide, colors, voice, contrast rules | `docs/brand/ELEVARI_BRAND_GUIDE.md` |
| Logo concepts + app icon | `docs/brand/ELEVARI_LOGO_CONCEPTS.md` |
| Design tokens (CSS + TS, light/dark/high-contrast) | `docs/design/TOKEN_SYSTEM.md`, `app/globals.css`, `lib/design-tokens.ts` |
| Components | `docs/design/DESIGN_SYSTEM.md`, `components/ui/` |
| Migration status | `docs/design/UI_MIGRATION_PLAN.md` |
| Conversion analytics events | `docs/design/CONVERSION_GUIDELINES.md` |
| Phase closeout | `docs/PHASE3_CLOSEOUT.md` |

Rule: no hardcoded visual values in components — consume `elevari-*` tokens only.

## Phase 0 stack (current — non-serverless foundation)

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Primary database (official) |
| Redis | 6379 | Queues, rate limits (future workers) |
| MinIO | 9000 / 9001 | Object storage for images/video |
| Waná API | 4000 | Fastify REST API (`api/`) |
| Next.js web | 3000 | Frontend SSR (`output: standalone`) |

### Quick start (local)

```bash
# 1. Infrastructure
npm run docker:infra

# 2. API setup (first time)
cd api && cp .env.example .env && npm install
npm run db:migrate && npm run db:seed

# 3. Run services
npm run api:dev          # API on :4000
npm run dev              # Web on :3000
```

Or all-in-docker: `npm run docker:up`

### API endpoints (v1)

- `GET /health`
- `GET /api/v1/properties`
- `GET /api/v1/properties/:slug`
- `GET /api/v1/properties/:id/availability`
- `POST /api/v1/bookings/quote`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings/:id`
- `POST /api/v1/payments/intent` — Wompi (único proveedor activo)
- `GET /api/v1/payments/:id`
- `GET /api/v1/payments/:id/timeline` — eventos del pago (observabilidad)
- `POST /api/v1/payments/:id/sync` — polling post-redirect
- `POST /api/v1/payments/:id/refund` — admin, full/partial en COP
- `POST /api/v1/payments/:id/mock-complete` — solo `PAYMENTS_MODE=mock`
- `POST /api/v1/payments/:id/mock-fail` — solo `PAYMENTS_MODE=mock`
- `POST /api/v1/webhooks/wompi` — activo
- `POST /api/v1/webhooks/bold` — legacy, deshabilitado
- `POST /api/v1/webhooks/stripe` — legacy, deshabilitado
- `POST /api/v1/auth/register` · `POST /api/v1/auth/login` · `GET /api/v1/auth/me`

### Auth (JWT)

- Header: `Authorization: Bearer <token>`
- Cookie web: `wana_token` (middleware protege `/host`, `/account`, `/admin`)
- Demo: `guest@wana.local`, `host@wana.local`, `admin@wana.local` / `wana12345`

### Pagos (Fase 2 — Wompi-first)

| Proveedor | Estado | Env vars |
|-----------|--------|----------|
| **Wompi** | **Activo** (COP, Colombia + internacional) | `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET` (4 vars; entorno derivado del prefijo de la llave) — ver `.env.wompi.example` |
| **Bold** | En repo, oculto y deshabilitado | `PAYMENTS_BOLD_ENABLED=false` |
| **Stripe** | En repo, oculto y deshabilitado | `PAYMENTS_STRIPE_ENABLED=false` |
| **Mock** | Local/staging sin keys | `PAYMENTS_MODE=mock` en `api/.env` |

- Startup validation: si Wompi está habilitado y falta cualquier `WOMPI_*`, la API no arranca (error claro).
- Cobro siempre en **COP**; clientes internacionales ven USD de referencia (quote congelado, `fx_quotes`).
- Disclosure obligatorio para checkout internacional (texto ES/EN, hash, timestamp) — `api/src/lib/payments/disclosure.ts`.
- Gate legal: `FX_INTL_CHECKOUT_ENABLED=true` requiere `LEGAL_SIGNOFF_REF` — ver `legal-review-pack.md`.
- Webhooks Wompi: firma verificada (`signature:integrity` / checksum de eventos), dedupe, validación de monto, idempotencia.
- Refunds: full/partial en COP, sin re-tasar FX; registro en `payment_refunds`.

Webhook en producción: apuntar Wompi a `https://tu-dominio/api/v1/webhooks/wompi`.
Ciclo de vida completo documentado en `docs/PAYMENTS.md`.

### Media (Fase 3 — MinIO)

| Endpoint | Uso |
|----------|-----|
| `POST /api/v1/media/upload` | Multipart: `property_id`, `file` + header `X-Host-Id` |
| `GET /api/v1/media/property/:id` | Lista media de propiedad |
| `DELETE /api/v1/media/:id` | Eliminar (host) |
| `GET /api/v1/host/:hostId/properties` | Dashboard anfitrión |

Requiere MinIO (`npm run docker:infra`). Imágenes → WebP + thumbnails (sharp). Videos → MP4/WebM directo.

### Marketing (Fase 4)

| Componente | Ubicación |
|------------|-----------|
| GA4 + Meta Pixel + GTM | `components/analytics/MarketingScripts.tsx` |
| Eventos cliente | `lib/analytics.ts` — view_item, begin_checkout, purchase |
| SEO | `app/sitemap.ts`, `app/robots.ts`, `PropertyJsonLd` |
| Email confirmación | API `marketing.ts` — Resend o log en dev |
| Meta CAPI (server) | API al confirmar pago — `META_PIXEL_ID`, `META_ACCESS_TOKEN` |

Web env: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_SITE_URL`

### Facturación Alegra (Fase 6B)

| Endpoint | Uso |
|----------|-----|
| Auto post-pago | `invoicing.ts` — emite factura COP al confirmar pago |
| `GET /api/v1/admin/invoices/pending` | Lista facturas pendientes/fallidas (admin JWT) |
| `POST /api/v1/admin/invoices/:id/retry` | Reintento manual |

Env: `ALEGRA_EMAIL`, `ALEGRA_API_TOKEN`. Sin credenciales → `pending_invoices` para procesamiento posterior. Pagos USD (Stripe internacional) no facturan en Alegra.

### Database

- Schema: `api/prisma/schema.prisma`
- Migrations: `api/prisma/migrations/`
- Unified model: `properties` (replaces legacy `domos` + `properties` split)

## Legacy stack (removed Jul 2026)

- Supabase client, server actions, Next `/api/*` stubs — **eliminados**; usar solo Fastify `/api/v1`
- **Netlify:** eliminado (fuera de arquitectura); producción usa Docker en EC2
- **Pagos mock:** checkout vía `wanaApi` + API Fastify

## Environment

- Web: copy `.env.example` → `.env.local`
- API: copy `api/.env.example` → `api/.env`
- `NEXT_PUBLIC_API_URL=http://localhost:4000`

## Deployment (production)

- **Guía principal:** `deploy/DEPLOYMENT_PRODUCTION.md`
- Stack: `docker compose -f docker-compose.prod.yml --env-file .env.production up -d`
- Template env: `deploy/.env.production.example`
- Backups: `deploy/scripts/backup-db.sh`
- Cloudflare CDN in front of Nginx + MinIO
- Roadmap: `ROADMAP.md`

## Health checks

- API: `curl http://localhost:4000/health`
- Web: `app/health/`, `app/heartbeat/`

## Agent rule

For deployment tasks, start here. For booking/payment work, use the new API + Prisma schema first.
