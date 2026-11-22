# ELEVARI — Master Execution Guide

**Repository:** `wana-2026` (Elevari hospitality platform)
**Branch:** `b-main`
**Latest commit:** `550190a` — Fix 4 regressions (analytics relocation, Wompi clientSecret, Prisma imports, `"use client"`)
**Status:** Phase 0 — Canonical Governance Foundation (in progress)

## Purpose

This document is the single entry point for all execution on the Elevari repository. It defines the governance model, phase structure, documentation hierarchy, and the rule that **no feature work begins until Phase 0 canonical documentation is complete and validated.**

Every agent, script, and human contributor must read this guide before making changes.

## Governance Model

### Canonical Documentation Hierarchy

All governance documents live in the repo root. They are the Single Source of Truth (SSOT) for their respective domains. No implementation detail may contradict a canonical doc without first updating the doc.

| Document | Domain | Status |
|----------|--------|--------|
| `ELEVARI_MASTER_EXECUTION_GUIDE.md` | Master execution & governance | Drafting |
| `ARCHITECTURE.md` | System architecture & tech stack | To create |
| `DOMAIN_STATUS.md` | Per-domain implementation status | To create |
| `DEPENDENCY_MATRIX.md` | Module & service dependencies | To create |
| `SSOT_REGISTRY.md` | Single Source of Truth registry | To create |
| `EXS_GUIDE.md` | Experience System guide | To create |
| `DESIGN_SYSTEM.md` | Design tokens & component rules | To create |
| `UX_PATTERNS.md` | UX patterns & conventions | To create |
| `UI_COMPONENT_LIBRARY.md` | Component inventory & usage | To create |
| `BRAND_SYSTEM.md` | Brand identity, colors, voice | To create |
| `ACCESSIBILITY_GUIDE.md` | WCAG AA compliance & a11y | To create |
| `TECHNICAL_DECISIONS.md` | Architecture Decision Records | To create |
| `PRODUCTION_READINESS.md` | Production readiness assessment | To create |
| `PRE_PRODUCTION_CHECKLIST.md` | Pre-production checklist | To create |
| `GO_LIVE_CHECKLIST.md` | Go-live checklist | To create |
| `AUDIT_STATUS.md` | Current audit status | To create |
| `CERTIFICATION_MATRIX.md` | Certification matrix | To create |
| `SECURITY_BASELINE.md` | Security controls & baseline | To create |
| `PERFORMANCE_BASELINE.md` | Performance targets & baselines | To create |

### Phase Structure

| Phase | Name | Status | Primary Deliverable |
|-------|------|--------|---------------------|
| 0 | Canonical Governance Foundation | **In Progress** | All 19 governance docs |
| 1 | Website Production Ready | Planned | Production-ready web |
| 2 | Payments (Wompi) | Complete | Wompi-only payments |
| 3 | Media (MinIO) | Complete | Image/video gallery |
| 3E | Experience System | Complete | Design tokens, components, a11y AA |
| 4 | Marketing | Complete | GA4, Meta Pixel, SEO, emails, CAPI |
| 5 | Mobile Apps | Planned | Expo/React Native |
| 6 | Ops & Billing | Partial | Admin UI, Alegra, messaging, search |

### Execution Rule

> **No feature work begins until Phase 0 is complete.** All 19 canonical documents must exist, be populated with implementation-accurate content (no placeholders), and be cross-referenced before any Priority 1 work starts.

## Repository Layout

```
wana-2026/                          # Repo root (Next.js web + shared)
├── app/                            # Next.js App Router pages
│   ├── account/, auth/, checkout/, host/, properties/
│   ├── admin/, guides/, health/, heartbeat/, legal/
│   ├── [slug]/, become-host/, api/
│   ├── layout.tsx, page.tsx, robots.ts, sitemap.ts
├── components/                     # React components
│   ├── ui/, analytics/, catalog/, checkout/, conversion/
│   ├── booking/, brand/, home/, host/, layout/, observability/
│   ├── search/, theme/, account/, admin/, auth/
├── lib/                            # Client-side shared libraries
│   ├── analytics/, conversion/, seo/
├── content/                        # Content files (SEO collections, etc.)
├── tests/                          # Test suites
├── api/                            # Fastify backend (NestJS-style)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── analytics/          # attribution, occupancy, revenue, property-performance
│   │   │   ├── payments/           # Wompi provider, config, disclosure, fx, money
│   │   │   ├── email-templates/, ical/, prisma.ts
│   │   │   └── fees.ts
│   │   ├── routes/                 # auth, bookings, payments, properties, media, admin, analytics, financial, health, host
│   │   ├── plugins/, jobs/
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── dist/                       # Build output
│   ├── package.json
│   └── tsconfig.json
├── docs/                           # Existing domain docs (brand, design, reports, archive)
├── deploy/                         # Docker Compose, env templates, scripts
├── scripts/                        # Automation scripts
├── e2e/                            # Playwright E2E tests
├── knowledge/                      # Knowledge base
├── types/                          # Shared TypeScript types
├── wana-monolith/                  # Legacy monolith (deprecated)
├── package.json                    # Root (web) package.json
└── tsconfig.json
```

## Key Implementation Facts (SSOT)

These facts are extracted from the actual codebase and must be reflected in all canonical docs:

### Payments (Phase 2 — Complete)

- **Provider:** Wompi is the ONLY active provider. Bold and Stripe implementations removed; only provider abstraction remains.
- **Config:** 4 env vars — `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`
- **Environment derivation:** From key prefix (`pub_prod_*`/`prv_prod_*` = production, `pub_test_*`/`prv_test_*` = sandbox)
- **Startup validation:** Fail-fast if Wompi enabled but any `WOMPI_*` missing; keys must match environments
- **Currency:** Always COP (minor units/centavos). International customers see USD reference but are charged COP.
- **Pricing:** `BASE_AMOUNT + PLATFORM_FEE (15%) = TOTAL_AMOUNT`. Label: "Tarifa de Servicio Elevari"
- **Disclosure:** Mandatory for international checkout (ES/EN), SHA-256 hash, timestamp acceptance
- **Refunds:** Full via Wompi void API; partial falls back to `pending_manual`
- **Webhook:** Verify signature → dedupe → validate amount → apply → persist (`/api/v1/webhooks/wompi`)

### Analytics (Relocated in commit 550190a)

- **API engines:** `api/src/lib/analytics/` — attribution-engine.ts, occupancy-engine.ts, revenue-engine.ts, property-performance-engine.ts
- **Client lib:** `lib/analytics/` — compiled JS counterparts
- **Routes:** `api/src/routes/analytics.ts`
- **Components:** `components/analytics/` — AnalyticsDashboard.tsx, PropertyJsonLd.tsx, MarketingScripts.tsx

### Auth (JWT)

- Header: `Authorization: Bearer <token>`
- Cookie: `wana_token` (middleware protects `/host`, `/account`, `/admin`)

## How to Use This Guide

1. **Before any change:** Read the relevant canonical doc(s) for the domain you're touching.
2. **If a doc is missing or outdated:** Update it first, then implement.
3. **If code contradicts a doc:** The doc wins — update the code or update the doc (with justification).
4. **Phase transitions:** Only move to the next phase when all docs for the current phase are complete and validated.

## Next Steps (Phase 0 → Phase 1)

1. Complete all 19 canonical documents (this guide + 18 domain docs)
2. Cross-reference all docs (each doc references related docs)
3. Validate no placeholders remain
4. Commit Phase 0 docs as a single atomic commit
5. Proceed to Priority 1: Website Production Ready

## Related Documents

- `ROADMAP.md` — Product roadmap (phases 0–6)
- `INFRASTRUCTURE.md` — Deployment & infrastructure guide
- `COMMANDS.md` — Agent command triggers
- `verification-log.md` — Wompi payment verification facts
- `legal-review-pack.md` — Legal signoff requirements
- `docs/brand/` — Brand guide, logo concepts
- `docs/design/` — Design tokens, design system, migration plan
- Demo: `guest@wana.local`, `host@wana.local`, `admin@wana.local` / `wana12345`

### Infrastructure

- **Compute:** AWS EC2
- **Database:** PostgreSQL (port 5432)
- **Object storage:** S3-compatible MinIO (ports 9000/9001)
- **Edge/DNS/TLS:** Cloudflare
- **API:** Fastify on port 4000
- **Web:** Next.js standalone on port 3000
- **Removed:** Vercel, Supabase, Firebase, Netlify