# TECHNICAL_DECISIONS.md — Architecture Decision Records

**Repository:** `wana-2026` (Elevari hospitality platform)
**Status:** Phase 0 — Canonical Governance Foundation
**Last validated:** Commit `550190a`

## Overview

This document records all significant technical decisions made for the Elevari platform. Each decision includes context, options considered, decision, rationale, and consequences.

**Owner:** Engineering Team
**Phase:** 3E (Complete)

## ADR-001: Next.js 16 + React 19 + TypeScript 6

**Status:** Accepted
**Date:** 2026-01-15

### Context

The Elevari platform needed a modern web framework for server-side rendering, static generation, and API routes. The team evaluated Next.js, Remix, and SvelteKit.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Next.js 16 | App Router, SSR/SSG, API routes, large ecosystem, Vercel deployment | Complexity, vendor lock-in concerns |
| Remix | Nested routing, progressive enhancement, web standards | Smaller ecosystem, less hiring pool |
| SvelteKit | Simple, performant, less boilerplate | Smaller ecosystem, TypeScript support maturing |

### Decision

Use Next.js 16 with App Router, React 19, and TypeScript 6.

### Rationale

- App Router provides SSR/SSG for SEO-critical property pages
- Large talent pool and ecosystem
- Strong TypeScript support

## ADR-002: Fastify 5 for Backend API

**Status:** Accepted
**Date:** 2026-01-15

### Context

The platform needed a high-performance Node.js backend for payment processing, webhooks, and admin APIs separate from Next.js API routes.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Fastify 5 | Fast, schema-based validation, TypeScript support, plugin ecosystem | Smaller community than Express |
| Express | Largest ecosystem, familiar | Slower, less structured |
| NestJS | Opinionated, Angular-like, TypeScript-first | Heavy, steep learning curve |

### Decision

Use Fastify 5 for the backend API service.

### Rationale

- High performance for payment webhooks and high-traffic endpoints
- JSON Schema validation built-in
- Strong TypeScript support
- Plugin architecture for extensibility
- Lightweight compared to NestJS

### Consequences

- Two Node.js services (Next.js + Fastify)
- Need to manage service communication
- Fastify-specific patterns and plugins

## ADR-003: Prisma 6 + PostgreSQL

**Status:** Accepted
**Date:** 2026-01-15

### Context

The platform needed an ORM and relational database for property, booking, user, and payment data.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Prisma 6 | Type-safe, excellent DX, migration system, PostgreSQL support | Runtime overhead, Java-based engine |
| Drizzle ORM | Lightweight, SQL-like, TypeScript-first | Newer, smaller ecosystem |
| TypeORM | Mature, decorator-based, active record | Heavy, complex, performance issues |
| Raw SQL (pg) | Maximum performance, no abstraction | Boilerplate, no type safety |

### Decision

Use Prisma 6 with PostgreSQL as the primary database.

### Rationale

- Type-safe database access
- Excellent developer experience
- Built-in migration system
- Strong PostgreSQL support
- Large community and documentation

## ADR-006: Cloudflare for DNS, CDN, and Security

**Status:** Accepted
**Date:** 2026-01-22

### Context

The platform needed DNS management, CDN, DDoS protection, and SSL/TLS termination.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Cloudflare | DNS, CDN, DDoS, WAF, SSL, edge functions | Single provider dependency |
| AWS CloudFront + Route53 | AWS integration, global edge | More complex setup, higher cost |
| Fastly | High performance, edge compute | Expensive, complex |
| Akamai | Enterprise-grade, global | Very expensive, overkill |

### Decision

Use Cloudflare for DNS, CDN, DDoS protection, WAF, and SSL/TLS.

### Rationale

- All-in-one solution (DNS, CDN, security, SSL)
- Free tier for basic needs, scalable paid tiers
- Easy setup and management
- Global edge network
- WAF and DDoS protection included

### Consequences

- Cloudflare as single point of failure for DNS/CDN
- All traffic routed through Cloudflare
- Provider lock-in for edge services

## ADR-007: Tailwind CSS + shadcn/ui

**Status:** Accepted
**Date:** 2026-01-25

### Context

The platform needed a CSS framework and component library for consistent UI development.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Tailwind CSS + shadcn/ui | Utility-first, copy-paste components, no runtime, TypeScript | Learning curve, large HTML classes |
| Material UI | Comprehensive, Google design system | Heavy, opinionated, bundle size |
| Chakra UI | Accessible, easy to use | Runtime CSS-in-JS, bundle size |
| Headless UI + Tailwind | Unstyled components, flexible | More custom work required |

### Decision

Use Tailwind CSS with shadcn/ui component library.

### Rationale

- Zero runtime CSS (all at build time)
- shadcn/ui components are copy-paste, fully customizable
- Excellent TypeScript support
- Accessible components (Radix UI primitives)
- Small bundle size
- Design system alignment

### Consequences

- Utility class HTML can be verbose
- Component customization required for brand alignment
- Tailwind learning curve for new developers |

## ADR-008: Zod for Schema Validation

**Status:** Accepted
**Date:** 2026-01-25

### Context

The platform needed runtime type validation for API requests, form data, and environment variables.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Zod | TypeScript-first, excellent DX, inference, Fastify integration | Bundle size, learning curve |
| Yup | Popular, form-focused | Larger bundle, less TypeScript integration |
| Joi | Mature, powerful | No TypeScript inference, verbose |
| Superstruct | Simple, TypeScript-first | Smaller ecosystem |

### Decision

Use Zod for schema validation across the platform.

### Rationale

- TypeScript type inference from schemas
- Excellent developer experience
- Fastify plugin support (@fastify/type-provider-zod)
- React Hook Form integration for form validation
- Environment variable validation

### Consequences

- Additional dependency
- Schema maintenance alongside TypeScript types |

## ADR-009: React Hook Form + Zod Resolver

**Status:** Accepted
**Date:** 2026-01-25

### Context

The platform needed form management with validation for booking, checkout, and user forms.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| React Hook Form + Zod | Performant, uncontrolled components, Zod integration | Learning curve |
| Formik | Popular, React community standard | Heavier, re-renders on every change |
| React Final Form | Immutable, performant | Smaller community |
| TanStack Form | Headless, framework-agnostic | Newer, smaller ecosystem |

### Decision

Use React Hook Form with Zod resolver for form management.

### Rationale

- Uncontrolled components (better performance)
- Zod integration for schema validation
- Small bundle size
- Excellent TypeScript support
- Wide adoption and community

### Consequences

- Uncontrolled component pattern (different from controlled)
- Zod schema maintenance |

## ADR-010: Sonner for Toast Notifications

**Status:** Accepted
**Date:** 2026-01-25

### Context

The platform needed a toast notification system for user feedback.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Sonner | Simple, accessible, customizable, lightweight | Single purpose |
| React Hot Toast | Popular, easy to use | Larger bundle |
| Notistack | Material UI integrated | MUI dependency |
| Sonner (shadcn/ui) | Part of shadcn/ui ecosystem | Same as Sonner |

### Decision

Use Sonner for toast notifications.

### Rationale

- Lightweight and accessible
- Easy to use and customize
- Part of shadcn/ui ecosystem
- No heavy dependencies

### Consequences

- Single-purpose library
- Limited to toast notifications |

## Related Documents

- `ARCHITECTURE.md` — System architecture & tech stack
- `DEPENDENCY_MATRIX.md` — Dependency relationships
- `SSOT_REGISTRY.md` — Single source of truth registry
- `EXS_GUIDE.md` — Experience System (tokens, components, a11y)
- `DESIGN_SYSTEM.md` — Design tokens, color, typography, spacing

### Consequences

- Prisma Client runtime overhead
- Migration management required
- Database hosted on AWS RDS PostgreSQL |

## ADR-004: Wompi as Sole Payment Provider

**Status:** Accepted
**Date:** 2026-01-20

### Context

The platform needed a payment processor for Colombian market (COP currency). Bold and Stripe were previously evaluated but removed.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Wompi | Colombian-focused, COP support, Bancolombia integration, local compliance | Single provider, no fallback |
| Bold | Latin American focus, multiple currencies | Removed — deprecated API |
| Stripe | Global, excellent API, documentation | Limited COP support, higher fees for LATAM |

### Decision

Use Wompi as the sole payment provider for COP transactions.

### Rationale

- Native COP currency support
- Colombian market focus (Bancolombia, Nequi, Daviplata)
- Local regulatory compliance
- Lower fees for Colombian transactions
- Direct bank integrations

### Consequences

- Single point of failure for payments
- No multi-currency support (COP only)
- Provider lock-in for Colombian market |

## ADR-005: AWS EC2 + MinIO for Infrastructure

**Status:** Accepted
**Date:** 2026-01-22

### Context

The platform needed hosting for the application, file storage, and infrastructure services.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| AWS EC2 + MinIO | Full control, cost-effective, S3-compatible storage | Self-managed, operational overhead |
| AWS ECS/EKS | Managed containers, scaling | Complex, higher cost |
| Vercel + AWS S3 | Managed, simple | Vendor lock-in, higher cost at scale |
| DigitalOcean Droplets | Simple, cheap | Fewer enterprise features |

### Decision

Use AWS EC2 for application hosting and MinIO for S3-compatible object storage.

### Rationale

- Full control over infrastructure
- Cost-effective for current scale
- MinIO provides S3-compatible API for file storage
- AWS ecosystem familiarity
- Self-hosted reduces vendor lock-in

### Consequences

- Self-managed infrastructure (patching, monitoring, scaling)
- Operational overhead for EC2 and MinIO
- Need for backup and disaster recovery procedures |
- API routes for backend integration
- Vercel deployment alignment

### Consequences

- Next.js-specific patterns (Server Components, Client Components)
- Need to manage Server/Client component boundaries
- Vercel as primary deployment target |