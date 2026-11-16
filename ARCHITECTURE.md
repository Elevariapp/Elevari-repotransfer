# ARCHITECTURE.md — System Architecture & Tech Stack

**Repository:** `wana-2026` (Elevari hospitality platform)
**Status:** Phase 0 — Canonical Governance Foundation
**Last validated:** Commit `550190a`

## Overview

Elevari is a hospitality platform with two deployable units:

1. **Web (Next.js)** — Customer-facing website, host dashboard, admin UI, booking flow, checkout
2. **API (Fastify)** — Backend services: auth, bookings, payments, properties, media, analytics, financial, health

The two units communicate via HTTP/REST. The web app calls the API on port 4000. The API connects to PostgreSQL (port 5432) and MinIO (ports 9000/9001).

## Tech Stack

### Web (Next.js App Router)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.2.6 | App Router, standalone output |
| React | React | 19.2.6 | Server Components + `"use client"` |
| Language | TypeScript | 6.0.3 | Strict mode |
| Styling | Tailwind CSS | 4.3.0 | Design tokens via CSS variables |
| Forms | React Hook Form | — | Validation with Zod |
| State | Zustand / React Query | — | Client state & server cache |
| HTTP client | fetch (native) | — | API calls to Fastify backend |
| Testing | Vitest / Playwright | — | Unit + E2E |

### API (Fastify)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Fastify | 5.2.1 | High-performance Node.js HTTP |
| Language | TypeScript | 6.0.3 | Strict mode |
| ORM | Prisma | 6.3.1 | PostgreSQL client, migrations |
| Database | PostgreSQL | — | Port 5432 |
| Auth | JWT (jsonwebtoken) | — | Bearer token + `wana_token` cookie |
| Payments | Wompi SDK / REST | — | Only active provider |
| Email | Resend | — | Transactional emails |
| Scheduling | node-cron | — | Background jobs |
| Validation | Zod | — | Request schema validation |

### Infrastructure

| Component | Technology | Details |
|-----------|-----------|---------|
| Compute | AWS EC2 | Web + API hosts |
| Database | PostgreSQL | Port 5432, managed on EC2 |
| Object Storage | MinIO (S3-compatible) | Ports 9000 (API) / 9001 (Console) |
| Edge / DNS / TLS | Cloudflare | DNS, SSL/TLS, CDN |
| Container | Docker | Docker Compose for local dev |
| CI/CD | GitHub Actions | Build, test, deploy |

### Removed / Deprecated

- Vercel — removed from infrastructure
- Supabase — removed (PostgreSQL on EC2 instead)
- Firebase — removed
- Netlify — removed
- Bold / Stripe — removed from payments (Wompi only)

## Directory Layout

```
wana-2026/
├── app/                 # Next.js App Router (web)
│   ├── account/         # Guest account pages
│   ├── admin/           # Admin dashboard
│   ├── auth/            # Login, register, password reset
│   ├── become-host/     # Host onboarding
│   ├── checkout/        # Booking checkout flow
│   ├── guides/          # Host/guest guides
│   ├── health/          # Health check endpoints
│   ├── heartbeat/       # Heartbeat monitoring
│   ├── host/            # Host dashboard (protected)
│   ├── legal/           # Legal pages (terms, privacy)
│   ├── properties/      # Property listing & detail
│   ├── [slug]/          # Dynamic property routes
│   ├── api/             # API route handlers (Next.js)
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   ├── robots.ts        # Robots.txt
│   └── sitemap.ts       # Sitemap generation
├── components/          # React components (shared)
│   ├── ui/              # Base UI components (buttons, inputs, etc.)
│   ├── analytics/       # Analytics dashboard components
│   ├── booking/         # Booking flow components
│   ├── brand/           # Brand components (logo, colors)
│   ├── catalog/         # Property catalog components
│   ├── checkout/        # Checkout components
│   ├── conversion/      # Conversion tracking components
│   ├── home/            # Home page components
│   ├── host/            # Host dashboard components
│   ├── layout/          # Layout components (header, footer)
│   ├── observability/   # Observability components
│   ├── search/          # Search components
│   ├── theme/           # Theme provider & toggle
│   └── account/, admin/, auth/  # Feature-specific components
├── lib/                 # Client-side shared libraries
│   ├── analytics/       # Client-side analytics (compiled JS)
│   ├── conversion/      # Conversion event tracking
│   └── seo/             # SEO audit utilities
├── content/             # Content files (SEO collections, MDX)
├── tests/               # Test suites
├── api/                 # Fastify backend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── analytics/     # attribution, occupancy, revenue, property-performance
│   │   │   ├── payments/      # Wompi provider, config, disclosure, fx, money
│   │   │   ├── email-templates/  # Resend email templates
│   │   │   ├── ical/          # iCalendar generation
│   │   │   ├── prisma.ts      # Prisma client singleton
│   │   │   └── fees.ts        # Fee calculation logic
│   │   ├── routes/
│   │   │   ├── auth.ts        # Authentication routes
│   │   │   ├── bookings.ts    # Booking CRUD
│   │   │   ├── payments.ts    # Payment processing
│   │   │   ├── properties.ts  # Property management
│   │   │   ├── media.ts       # Media upload (MinIO)
│   │   │   ├── admin.ts       # Admin routes
│   │   │   ├── analytics.ts   # Analytics endpoints
│   │   │   ├── financial.ts   # Financial reporting
│   │   │   ├── health.ts      # Health checks
│   │   │   └── host.ts        # Host-specific routes
│   │   ├── plugins/           # Fastify plugins
│   │   ├── jobs/              # Background jobs (cron)
│   │   └── index.ts           # App entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Prisma migrations
│   ├── dist/                  # Compiled output
│   ├── package.json
│   └── tsconfig.json
├── docs/                # Existing domain docs (brand, design, reports)
├── deploy/              # Docker Compose, env templates, deploy scripts
├── scripts/             # Automation scripts
├── e2e/                 # Playwright E2E tests
├── knowledge/           # Knowledge base
├── types/               # Shared TypeScript types
├── wana-monolith/       # Legacy monolith (deprecated, do not use)
├── package.json         # Root (web) package.json
└── tsconfig.json
```

## Data Flow

### Booking Flow

1. Guest browses properties → `GET /api/v1/properties` (API)
2. Guest selects property & dates → `GET /api/v1/properties/:id` (API)
3. Guest initiates checkout → `POST /api/v1/bookings` (API) → creates booking in `pending` status
4. Payment intent created → `POST /api/v1/payments/intent` → Wompi checkout URL
5. Guest pays on Wompi hosted checkout → Wompi webhook → `POST /api/v1/webhooks/wompi`
6. Webhook verifies signature → updates booking to `confirmed` → payment to `succeeded`
7. Confirmation email sent via Resend

### Authentication Flow

1. Guest/host logs in → `POST /api/v1/auth/login` → returns JWT
2. JWT stored in `wana_token` cookie (httpOnly, secure)
3. Middleware checks cookie on protected routes (`/host`, `/account`, `/admin`)
4. API validates JWT on `Authorization: Bearer <token>` header

### Payment Flow (Wompi)

1. `getPaymentsConfig()` reads env vars, validates Wompi keys
2. `createWompiIntent()` builds checkout URL with integrity signature (SHA-256)
3. Guest redirected to `https://checkout.wompi.co/p/?...`
4. Wompi posts webhook → `verifyWompiWebhook()` validates signature
5. `syncWompiPayment()` fetches transaction status from Wompi API
6. Booking/payment records updated in PostgreSQL

## Security Boundaries

- **API port 4000** — Not exposed directly to internet; accessed via Cloudflare
- **Web port 3000** — Exposed via Cloudflare TLS
- **PostgreSQL port 5432** — Internal only, not exposed
- **MinIO ports 9000/9001** — Internal only
- **JWT** — Short-lived access tokens, refresh via cookie rotation
- **Wompi webhooks** — Signature verification mandatory (no unsigned webhooks in staging/prod)
- **Environment variables** — Never committed; `.env.wompi.example` template provided

## Related Documents

- `INFRASTRUCTURE.md` — Deployment & infrastructure details
- `DOMAIN_STATUS.md` — Per-domain implementation status
- `DEPENDENCY_MATRIX.md` — Module & service dependencies
- `TECHNICAL_DECISIONS.md` — Architecture Decision Records
- `SECURITY_BASELINE.md` — Security controls & baseline