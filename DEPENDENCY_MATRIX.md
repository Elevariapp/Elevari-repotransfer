# DEPENDENCY_MATRIX.md — Module & Service Dependencies

**Repository:** `wana-2026` (Elevari hospitality platform)
**Status:** Phase 0 — Canonical Governance Foundation
**Last validated:** Commit `550190a`

---

## Internal Dependencies (Within Repo)

### Web App → API

| Web Module | Calls API Endpoint | Protocol | Notes |
|------------|-------------------|----------|-------|
| `app/auth/` | `POST /api/v1/auth/login` | HTTP/REST | JWT auth |
| `app/auth/` | `POST /api/v1/auth/register` | HTTP/REST | User registration |
| `app/checkout/` | `POST /api/v1/bookings` | HTTP/REST | Create booking |
| `app/checkout/` | `POST /api/v1/payments/intent` | HTTP/REST | Payment intent |
| `app/properties/` | `GET /api/v1/properties` | HTTP/REST | List properties |
| `app/properties/` | `GET /api/v1/properties/:id` | HTTP/REST | Property detail |
| `app/host/` | `GET /api/v1/host/properties` | HTTP/REST | Host properties |
| `app/account/` | `GET /api/v1/account/bookings` | HTTP/REST | Guest bookings |
| `app/admin/` | `GET /api/v1/admin/*` | HTTP/REST | Admin routes |
| `app/api/` | `GET /api/v1/health` | HTTP/REST | Health check |

### API → External Services

| API Module | External Service | Protocol | Purpose |
|------------|-----------------|----------|---------|
| `api/src/lib/payments/` | Wompi API | HTTPS REST | Checkout, webhook, refund, sync |
| `api/src/lib/email-templates/` | Resend | HTTPS REST | Transactional email |
| `api/src/lib/prisma/` | PostgreSQL | TCP (port 5432) | Primary database |
| `api/src/routes/media.ts` | MinIO | S3-compatible HTTP | Object storage (ports 9000/9001) |
| `api/src/jobs/` | node-cron | In-process | Background scheduled jobs |

### Client-Side Libraries → External

| Client Module | External Service | Protocol | Purpose |
|---------------|-----------------|----------|---------|
| `lib/conversion/analytics.ts` | window.dataLayer | Browser API | GTM data layer push |
| `components/analytics/MarketingScripts.tsx` | GA4, Meta Pixel | JS SDK | Marketing tracking |
| `components/analytics/MarketingScripts.tsx` | Conversions API | HTTPS REST | Server-side events |

---

## Internal Module Dependencies (API)

```
api/src/index.ts
├── api/src/lib/prisma.ts              # Prisma client (singleton)
├── api/src/lib/payments/config.ts     # Wompi config (env vars)
├── api/src/lib/payments/wompi-provider.ts  # Wompi API client
│   └── api/src/lib/payments/config.ts
│   └── api/src/lib/payments/money.ts  # Minor unit helpers
├── api/src/lib/payments/disclosure.ts # FX disclosure text/hash
├── api/src/lib/payments/fx.ts         # FX quote logic
├── api/src/lib/fees.ts                # Platform fee (15%) calculation
├── api/src/lib/analytics/             # Analytics engines
│   ├── attribution-engine.ts
│   ├── occupancy-engine.ts
│   ├── revenue-engine.ts
│   └── property-performance-engine.ts
├── api/src/routes/
│   ├── auth.ts        → prisma, jwt
│   ├── bookings.ts    → prisma, payments
│   ├── payments.ts    → payments config, wompi-provider
│   ├── properties.ts  → prisma, media
│   ├── media.ts       → MinIO client
│   ├── admin.ts       → prisma
│   ├── analytics.ts   → analytics engines
│   ├── financial.ts   → prisma
│   ├── health.ts      → prisma (DB ping)
│   └── host.ts        → prisma
├── api/src/plugins/     # Fastify plugins (auth, cors, etc.)
└── api/src/jobs/        # Cron jobs (reports, cleanup)
```

---

## Internal Module Dependencies (Web)

```
app/layout.tsx
├── components/layout/     # Header, footer, navigation
├── components/theme/      # Theme provider (light/dark)
├── components/brand/      # Logo, brand colors
├── components/ui/         # Base UI (button, input, card, etc.)
├── components/analytics/  # AnalyticsDashboard, MarketingScripts
│   └── lib/conversion/    # Conversion event tracking
├── components/catalog/    # Property cards, grid
├── components/checkout/   # Checkout form, payment UI
├── components/booking/    # Booking flow components
├── components/search/     # Search form, filters
├── components/home/       # Home page sections
├── components/host/       # Host dashboard components
├── components/account/    # Guest account components
├── components/admin/      # Admin dashboard components
└── components/observability/  # Health, heartbeat UI
```

---

## External Service Dependencies

| Service | Purpose | Env Vars | Criticality |
|---------|---------|----------|-------------|
| Wompi | Payment processing | WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET | Critical |
| PostgreSQL | Primary database | DATABASE_URL | Critical |
| MinIO | Object storage | MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY | High |
| Resend | Transactional email | RESEND_API_KEY | High |
| Cloudflare | DNS, TLS, CDN | CLOUDFLARE_API_TOKEN | High |
| AWS EC2 | Compute | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY | High |
| GA4 | Analytics | GA_MEASUREMENT_ID | Medium |
| Meta Pixel | Advertising | META_PIXEL_ID | Medium |
| Alegra | Billing/accounting | ALEGRA_API_KEY | Medium (planned) |
| WhatsApp Business | Messaging | WHATSAPP_TOKEN | Medium (planned) |

---

## Dependency Rules

1. **No circular dependencies** — Modules must form a DAG
2. **API is the only DB access layer** — Web app never connects directly to PostgreSQL
3. **Payments config is singleton** — `getPaymentsConfig()` caches after first call
4. **Prisma client is singleton** — `prisma.ts` exports a single instance
5. **Wompi is the only payment provider** — No fallback to Bold/Stripe
6. **Environment variables validated at startup** — Fail-fast on missing critical vars

---

## Related Documents

- `ARCHITECTURE.md` — System architecture & tech stack
- `SSOT_REGISTRY.md` — Single Source of Truth registry
- `SECURITY_BASELINE.md` — Security controls & baseline
- `INFRASTRUCTURE.md` — Deployment & infrastructure details