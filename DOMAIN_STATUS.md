# DOMAIN_STATUS.md — Per-Domain Implementation Status

**Repository:** `wana-2026` (Elevari hospitality platform)
**Status:** Phase 0 — Canonical Governance Foundation
**Last validated:** Commit `550190a`

## Domain Status Summary

| Domain | Status | Phase | Notes |
|--------|--------|-------|-------|
| Payments (Wompi) | Complete | 2 | Wompi-only provider, full flow implemented |
| Media (MinIO) | Complete | 3 | Image/video gallery, S3-compatible storage |
| Experience System (EXS) | Complete | 3E | Design tokens, components, a11y AA |
| Marketing | Complete | 4 | GA4, Meta Pixel, SEO, emails, CAPI |
| Analytics | Complete | 2/4 | Attribution, occupancy, revenue, property-performance |
| Auth (JWT) | Complete | 1 | Login, register, protected routes, demo accounts |
| Bookings | Complete | 1 | CRUD, status flow, payment linkage |
| Properties | Complete | 1 | CRUD, search, media association |
| Admin UI | Partial | 6 | Basic admin routes, needs full dashboard |
| Ops & Billing | Partial | 6 | Alegra integration, messaging, search |
| Mobile Apps | Planned | 5 | Expo/React Native, not started |
| Website Production Ready | Planned | 1 | Performance, SEO, accessibility gaps |

## Phase 0 — Canonical Governance Foundation (In Progress)

| Document | Status |
|----------|--------|
| ELEVARI_MASTER_EXECUTION_GUIDE.md | Drafting |
| ARCHITECTURE.md | Drafting |
| DOMAIN_STATUS.md | Drafting |
| DEPENDENCY_MATRIX.md | Drafting |
| SSOT_REGISTRY.md | To create |
| EXS_GUIDE.md | To create |
| DESIGN_SYSTEM.md | To create |
| UX_PATTERNS.md | To create |
| UI_COMPONENT_LIBRARY.md | To create |
| BRAND_SYSTEM.md | To create |
| ACCESSIBILITY_GUIDE.md | To create |
| TECHNICAL_DECISIONS.md | To create |

## Phase 1 — Website Production Ready (Planned)

### Web App (Next.js)

| Feature | Status | Details |
|---------|--------|---------|
| Home page | Complete | Hero, property catalog, CTA |
| Property detail | Complete | Gallery, booking form, amenities |
| Search | Complete | Filters, dates, guests, location |
| Booking flow | Complete | Dates → guest details → payment |
| Checkout | Complete | Wompi integration, disclosure |
| Auth | Complete | Login, register, password reset |
| Guest account | Complete | Bookings, profile |
| Host dashboard | Partial | Property management, booking view |
| Admin UI | Partial | Basic routes, needs full dashboard |
| Legal pages | Complete | Terms, privacy, cookie policy |
| Health endpoints | Complete | `/health`, `/heartbeat` |
| SEO | Partial | Sitemap, robots, meta tags |
| Performance | Not assessed | No baseline established |
| Accessibility | Not assessed | No WCAG audit |

### API (Fastify)

| Feature | Status | Details |
|---------|--------|---------|
| Auth routes | Complete | Login, register, logout, me |
| Booking routes | Complete | CRUD, status transitions |
| Payment routes | Complete | Intent, webhook, refund |
| Property routes | Complete | CRUD, search, media |
| Media routes | Complete | Upload to MinIO, signed URLs |
| Analytics routes | Complete | Attribution, occupancy, revenue |
| Financial routes | Complete | Reporting, exports |
| Admin routes | Partial | User management, property oversight |
| Health routes | Complete | Liveness, readiness |

## Phase 2 — Payments (Wompi) (Complete)

| Component | Status | Details |
|-----------|--------|---------|
| Config validation | Complete | Fail-fast on missing Wompi_* vars |
| Environment derivation | Complete | From key prefix (pub_prod_/prv_prod_) |
| Checkout intent | Complete | Wompi hosted checkout URL |
| Webhook handling | Complete | Signature verify, dedupe, validate, apply |
| Refunds | Complete | Full via void API, partial → pending_manual |
| Disclosure | Complete | ES/EN, SHA-256 hash, timestamp |
| FX quotes | Complete | COP charge, USD reference |
| Money handling | Complete | Minor units (centavos), assertions |
| Startup validation | Complete | Rejects mismatched key environments |

## Phase 3 — Media (MinIO) (Complete)

| Component | Status | Details |
|-----------|--------|---------|
| MinIO storage | Complete | S3-compatible, ports 9000/9001 |
| Image upload | Complete | Property images, host photos |
| Video gallery | Complete | Property videos |
| Signed URLs | Complete | Time-limited access |
| Image optimization | Partial | Basic serving, no auto-resize |

## Phase 3E — Experience System (Complete)

| Component | Status | Details |
|-----------|--------|---------|
| Design tokens | Complete | Colors, spacing, typography, shadows |
| Component library | Complete | UI components built on tokens |
| Accessibility | Complete | WCAG AA compliance |
| Theme system | Complete | Light/dark mode support |
| Migration plan | Complete | From legacy to token-based |

## Phase 4 — Marketing (Complete)

| Component | Status | Details |
|-----------|--------|---------|
| GA4 | Complete | Page views, events, ecommerce |
| Meta Pixel | Complete | Page view, purchase events |
| SEO | Complete | Sitemap, robots, meta tags, JSON-LD |
| Email (Resend) | Complete | Booking confirmations, reminders |
| CAPI (Conversions API) | Complete | Server-side event tracking |
| WhatsApp Business | Partial | Integration planned |

## Known Gaps & Regressions (Fixed in 550190a)

1. **Analytics relocation** — Moved from `api/src/lib/analytics/` to `lib/analytics/` (client-side compiled JS)
2. **Wompi clientSecret** — Removed unused `clientSecret` field from config
3. **Prisma imports** — Fixed `@/api/src/lib/prisma` path alias in compiled JS
4. **`"use client"` directive** — Added to client-side components using browser APIs

## Related Documents

- `ARCHITECTURE.md` — System architecture & tech stack
- `DEPENDENCY_MATRIX.md` — Module & service dependencies
- `PRODUCTION_READINESS.md` — Production readiness assessment
- `PERFORMANCE_BASELINE.md` — Performance targets & baselines
- `ACCESSIBILITY_GUIDE.md` — WCAG AA compliance & a11y
| Meta Business | Partial | Integration planned |

## Phase 5 — Mobile Apps (Planned)

| Component | Status | Details |
|-----------|--------|---------|
| Expo/React Native | Not started | No code written |
| Guest app | Not started | Booking, profile, payments |
| Host app | Not started | Property management, messaging |

## Phase 6 — Ops & Billing (Partial)

| Component | Status | Details |
|-----------|--------|---------|
| Admin UI | Partial | Basic routes, needs full dashboard |
| Alegra billing | Partial | Integration planned |
| Messaging | Partial | Host-guest messaging planned |
| Search | Partial | Basic property search, needs advanced filters |
| Financial reporting | Complete | Revenue, occupancy reports |
| Host routes | Complete | Host dashboard data |
| PRODUCTION_READINESS.md | To create |
| PRE_PRODUCTION_CHECKLIST.md | To create |
| GO_LIVE_CHECKLIST.md | To create |
| AUDIT_STATUS.md | To create |
| CERTIFICATION_MATRIX.md | To create |
| SECURITY_BASELINE.md | To create |
| PERFORMANCE_BASELINE.md | To create |