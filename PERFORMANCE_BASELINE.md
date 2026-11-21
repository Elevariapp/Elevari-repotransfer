# PERFORMANCE_BASELINE.md — Performance Baseline Metrics

**Repository:** `elevari-2026` (Elevari hospitality platform)
Última validación: 2026-11-21 · rama chore/elevari-production

## Overview

This document defines the performance baseline metrics for the Elevari platform. All metrics must be met and continuously monitored before and after production launch.

**Owner:** Engineering Team
**Phase:** 3E (Complete)

## Core Web Vitals

| Metric | Threshold | Status | Measurement Tool | Notes |
|--------|-----------|--------|------------------|-------|
| Largest Contentful Paint (LCP) | ≤ 2.5s | Pending | Lighthouse / CrUX | 75th percentile |
| First Input Delay (FID) | ≤ 100ms | Pending | Lighthouse / CrUX | 75th percentile |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | Pending | Lighthouse / CrUX | 75th percentile |
| Interaction to Next Paint (INP) | ≤ 200ms | Pending | Lighthouse / CrUX | 75th percentile |

## Lighthouse Scores

| Category | Threshold (Mobile) | Threshold (Desktop) | Status | Notes |
|----------|-------------------|---------------------|--------|-------|
| Performance | ≥ 90 | ≥ 90 | Pending | Lighthouse CI |
| Accessibility | ≥ 90 | ≥ 90 | Pending | WCAG checks |
| Best Practices | ≥ 90 | ≥ 90 | Pending | Security, PWA |
| SEO | ≥ 90 | ≥ 90 | Pending | Meta tags, crawlability |
| PWA | ≥ 80 | ≥ 80 | Pending | Progressive web app |

## API Performance

| Endpoint | Threshold (p95) | Status | Measurement | Notes |
|----------|-----------------|--------|-------------|-------|
| GET /api/properties | < 200ms | Pending | Fastify metrics | Cached results |
| GET /api/properties/[id] | < 150ms | Pending | Fastify metrics | Property detail |
| POST /api/bookings | < 300ms | Pending | Fastify metrics | Booking creation |
| GET /api/bookings | < 200ms | Pending | Fastify metrics | User bookings |
| POST /api/payments/webhook | < 500ms | Pending | Fastify metrics | Wompi webhook |
| GET /api/users/profile | < 150ms | Pending | Fastify metrics | User profile |
| Authentication (login) | < 300ms | Pending | Fastify metrics | Auth endpoint |
| Authentication (register) | < 500ms | Pending | Fastify metrics | Registration |

## Frontend Performance

| Metric | Threshold | Status | Measurement | Notes |
|--------|-----------|--------|-------------|-------|
| Initial JS bundle size | < 500KB | Pending | webpack / next | Gzipped |
| Total page weight | < 2MB | Pending | Lighthouse | All assets |
| Image optimization | WebP/AVIF | Pending | Next.js Image | Automatic format |
| Lazy loading | All images | Pending | Next.js Image | Below fold |
| Font optimization | < 100KB | Pending | next/font | Self-hosted |
| Time to First Byte (TTFB) | < 600ms | Pending | Lighthouse | Server response |

## Database Performance

| Metric | Threshold | Status | Measurement | Notes |
|--------|-----------|--------|-------------|-------|
| Query response time (p95) | < 100ms | Pending | Prisma / pg | Simple queries |
| Query response time (p99) | < 500ms | Pending | Prisma / pg | Complex queries |
| Connection pool utilization | < 80% | Pending | Prisma / RDS | Active connections |
| Slow queries | 0 | Pending | pg_stat_statements | > 1s queries |
| Missing indexes | 0 | Pending | EXPLAIN ANALYZE | Table scans |
| N+1 queries | 0 | Pending | Prisma logging | Eager loading |

## Infrastructure Performance

| Metric | Threshold | Status | Measurement | Notes |
|--------|-----------|--------|-------------|-------|
| CPU utilization (average) | < 70% | Pending | CloudWatch | EC2 instances |
| Memory utilization (average) | < 80% | Pending | CloudWatch | EC2 instances |
| Disk utilization | < 80% | Pending | CloudWatch | EBS volumes |
| Network latency (intra-region) | < 5ms | Pending | CloudWatch | EC2 to RDS |
| MinIO response time (p95) | < 100ms | Pending | MinIO metrics | Object storage |
| Cloudflare cache hit ratio | > 90% | Pending | Cloudflare analytics | Static assets |

## Load Testing Targets

| Scenario | Concurrent Users | Response Time (p95) | Error Rate | Status |
|----------|-----------------|---------------------|------------|--------|
| Normal load | 500 | < 200ms | < 0.1% | Pending |
| Peak load | 1000 | < 500ms | < 1% | Pending |
| Stress load | 2000 | < 1000ms | < 5% | Pending |
| Spike load | 5000 (burst) | < 2000ms | < 10% | Pending |

## Monitoring & Alerting

| Metric | Alert Threshold | Severity | Owner | Notes |
|--------|-----------------|----------|-------|-------|
| LCP > 4s | > 4s | Warning | Engineering | Poor user experience |
| API p95 > 1s | > 1s | Critical | Engineering | User-facing impact |
| Error rate > 1% | > 1% | Critical | Engineering | Sentry / logs |
| CPU > 85% | > 85% | Warning | DevOps | EC2 instances |
| Memory > 90% | > 90% | Critical | DevOps | EC2 instances |
| Disk > 85% | > 85% | Warning | DevOps | EBS volumes |
| Database connections > 90% | > 90% | Critical | DevOps | RDS connections |

## Performance Budgets

| Resource | Budget | Status | Notes |
|----------|--------|--------|-------|
| Initial HTML | < 50KB | Pending | Compressed |
| CSS | < 100KB | Pending | Gzipped |
| JavaScript | < 500KB | Pending | Gzipped, initial |
| Images (above fold) | < 500KB | Pending | Optimized |
| Web fonts | < 100KB | Pending | Subsetted |
| Third-party scripts | < 200KB | Pending | Wompi, analytics |

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Engineering Lead | | | |
| DevOps Lead | | | |
| Product Owner | | | |

## Related Documents

- `PRODUCTION_READINESS.md` — Production readiness criteria
- `GO_LIVE_CHECKLIST.md` — Go-live execution checklist
- `SECURITY_BASELINE.md` — Security baseline requirements
- `ARCHITECTURE.md` — System architecture & tech stack