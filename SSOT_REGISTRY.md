# SSOT_REGISTRY.md — Single Source of Truth Registry

**Repository:** `wana-2026` (Elevari hospitality platform)
**Status:** Phase 0 — Canonical Governance Foundation
**Last validated:** Commit `550190a`

---

## Purpose

This registry defines the authoritative source for every domain in the repository. When code and documentation disagree, the SSOT wins. All 19 canonical documents reference this registry to avoid duplication and drift.

---

## Canonical Documents (Phase 0)

| Document | SSOT For | Owner | Location |
|----------|----------|-------|----------|
| ELEVARI_MASTER_EXECUTION_GUIDE.md | Execution rules, phase structure, governance | Platform Team | Repo root |
| ARCHITECTURE.md | System architecture, tech stack, directory layout | Platform Team | Repo root |
| DOMAIN_STATUS.md | Per-domain implementation status | Platform Team | Repo root |
| DEPENDENCY_MATRIX.md | Module & service dependencies | Platform Team | Repo root |
| SSOT_REGISTRY.md | This registry | Platform Team | Repo root |
| EXS_GUIDE.md | Experience System (design tokens, components, a11y) | Design Team | Repo root |
| DESIGN_SYSTEM.md | Design tokens, color, typography, spacing | Design Team | Repo root |
| UX_PATTERNS.md | UX patterns, flows, interaction guidelines | Design Team | Repo root |
| UI_COMPONENT_LIBRARY.md | Component inventory, usage, props | Design Team | Repo root |
| BRAND_SYSTEM.md | Brand identity, logo, colors, voice | Brand Team | Repo root |
| ACCESSIBILITY_GUIDE.md | WCAG AA compliance, a11y testing | Accessibility Team | Repo root |
| TECHNICAL_DECISIONS.md | Architecture Decision Records (ADRs) | Platform Team | Repo root |
| PRODUCTION_READINESS.md | Production readiness criteria | Platform Team | Repo root |
| PRE_PRODUCTION_CHECKLIST.md | Pre-production verification checklist | Platform Team | Repo root |
| GO_LIVE_CHECKLIST.md | Go-live / launch checklist | Platform Team | Repo root |
| AUDIT_STATUS.md | Security & compliance audit status | Security Team | Repo root |
| CERTIFICATION_MATRIX.md | Certifications & compliance mapping | Security Team | Repo root |
| SECURITY_BASELINE.md | Security controls & baseline | Security Team | Repo root |
| PERFORMANCE_BASELINE.md | Performance targets & baselines | Platform Team | Repo root |

---

## Data SSOTs

| Domain | SSOT Source | Location | Format |
|--------|------------|----------|--------|
| Database schema | Prisma schema | `api/prisma/schema.prisma` | `.prisma` |
| Payment config | Wompi config module | `api/src/lib/payments/config.ts` | TypeScript |
| Design tokens | CSS variables / tokens | `app/globals.css` + `components/theme/` | CSS + TS |
| Brand assets | Brand guide | `docs/brand/` | Various |
| SEO config | Sitemap + robots | `app/robots.ts`, `app/sitemap.ts` | TypeScript |
| Environment template | Env example | `.env.example` (root + api/) | Shell/env |
| API routes | Fastify route definitions | `api/src/routes/*.ts` | TypeScript |
| Web routes | Next.js App Router | `app/**/page.tsx`, `app/**/layout.tsx` | TypeScript/TSX |

---

## Code SSOTs

| Domain | SSOT Source | Location | Notes |
|--------|------------|----------|-------|
| Auth (JWT) | `api/src/routes/auth.ts` + middleware | `api/src/` | JWT + cookie |
| Payments | `api/src/lib/payments/` | `api/src/lib/payments/` | Wompi only |
| Bookings | `api/src/routes/bookings.ts` | `api/src/routes/` | CRUD + status |
| Properties | `api/src/routes/properties.ts` | `api/src/routes/` | CRUD + search |
| Media | `api/src/routes/media.ts` | `api/src/routes/` | MinIO upload |
| Analytics | `api/src/lib/analytics/` | `api/src/lib/analytics/` | Attribution, occupancy, revenue |
| Client analytics | `lib/analytics/` | `lib/analytics/` | Compiled JS (browser) |
| Conversion | `lib/conversion/analytics.ts` | `lib/conversion/` | dataLayer events |
| SEO audit | `lib/seo/audit.ts` | `lib/seo/` | SEO utilities |
| Email templates | `api/src/lib/email-templates/` | `api/src/lib/email-templates/` | Resend templates |
| Fees | `api/src/lib/fees.ts` | `api/src/lib/` | 15% platform fee |
| iCalendar | `api/src/lib/ical/` | `api/src/lib/ical/` | .ics generation |

---

## Dependency SSOTs

| Domain | SSOT Source | Location |
|--------|------------|----------|
| Web dependencies | `package.json` (root) | Repo root |
| API dependencies | `api/package.json` | `api/` |
| TypeScript config | `tsconfig.json` (root + api) | Repo root + `api/` |
| Tailwind config | `tailwind.config.ts` | Repo root |
| Next.js config | `next.config.ts` | Repo root |
| Fastify config | `api/src/index.ts` | `api/src/` |
| Docker Compose | `docker-compose.yml` | `deploy/` |
| CI/CD | `.github/workflows/` | Repo root |

---

## Rules

1. **One SSOT per domain** — Never duplicate source of truth across files
2. **Update SSOT before code** — If a domain changes, update the SSOT first
3. **Cross-reference, don't duplicate** — Other docs reference SSOTs by path
4. **No placeholders** — Every SSOT must have real content, not TBD
5. **Version with code** — SSOTs are committed alongside code changes

---

## Related Documents

- `ARCHITECTURE.md` — System architecture & tech stack
- `DEPENDENCY_MATRIX.md` — Module & service dependencies
- `DOMAIN_STATUS.md` — Per-domain implementation status
- `TECHNICAL_DECISIONS.md` — Architecture Decision Records