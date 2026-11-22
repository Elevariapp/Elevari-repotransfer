# PRE_PRODUCTION_CHECKLIST.md — Pre-Production Checklist

**Repository:** `wana-2026` (Elevari hospitality platform)
**Status:** Phase 0 — Canonical Governance Foundation
**Last validated:** Commit `550190a`

## Overview

This document defines the pre-production checklist for the Elevari platform. All items must be completed and verified before code is promoted to the production environment.

**Owner:** Release Engineering Team
**Phase:** 3E (Complete)

## Pre-Production Validation

### Code Quality

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| TypeScript strict mode | Pending | Engineering | No `any` types, strict null checks |
| ESLint passing | Pending | Engineering | Zero errors, warnings reviewed |
| Prettier formatting | Pending | Engineering | Consistent code style |
| Unit test coverage ≥ 80% | Pending | Engineering | Critical paths covered |
| Integration tests passing | Pending | Engineering | API + database integration |
| E2E tests passing | Pending | Engineering | Critical user journeys |
| No console.log in production code | Pending | Engineering | Remove debug statements |
| No TODO/FIXME in critical paths | Pending | Engineering | Address or ticket created |

### Security Validation

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| Dependency audit (npm audit) | Pending | Engineering | No critical/high vulnerabilities |
| SAST scan passing | Pending | Security | Static analysis clean |
| Secret scanning clean | Pending | Security | No secrets in code |
| Environment variables validated | Pending | Engineering | Zod schema validation |
| CORS configured correctly | Pending | Engineering | Restricted origins only |
| CSP headers configured | Pending | Engineering | Content Security Policy |
| Rate limiting implemented | Pending | Engineering | API and auth endpoints |
| Input validation on all endpoints | Pending | Engineering | Zod schemas on all routes |
| Authentication middleware | Pending | Engineering | Protected routes require auth |
| Authorization checks | Pending | Engineering | Role-based access control |

### Performance Validation

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| Lighthouse score ≥ 90 (mobile) | Pending | Engineering | Performance category |
| Lighthouse score ≥ 90 (desktop) | Pending | Engineering | Performance category |
| Core Web Vitals passing | Pending | Engineering | LCP, FID, CLS thresholds |
| Image optimization verified | Pending | Engineering | WebP, lazy loading |
| Bundle size within budget | Pending | Engineering | Initial JS < 500KB |
| API response time < 200ms (p95) | Pending | Engineering | Under load |
| Database queries optimized | Pending | Engineering | No N+1 queries, indexed |
| Caching headers configured | Pending | Engineering | Static assets cached |

### Functional Validation

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| Property search and filtering | Pending | QA | All filter combinations |
| Property detail page | Pending | QA | Images, pricing, availability |
| Booking flow (dates, guests) | Pending | QA | End-to-end booking |
| Payment integration (Wompi) | Pending | QA | Sandbox mode, COP currency |
| User registration and login | Pending | QA | Auth flow, password reset |
| User profile management | Pending | QA | Edit profile, preferences |
| Admin dashboard access | Pending | QA | Role-based access |
| Admin property management | Pending | QA | CRUD operations |
| Admin booking management | Pending | QA | View, cancel, modify |
| Email notifications | Pending | QA | Booking confirmation, reminders |
| SMS notifications (if applicable) | Pending | QA | Booking updates |

### Accessibility Validation

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| WCAG 2.1 AA audit | Pending | Accessibility | Automated + manual |
| Keyboard navigation | Pending | Accessibility | All interactive elements |
| Screen reader testing | Pending | Accessibility | NVDA, VoiceOver |
| Color contrast verification | Pending | Accessibility | 4.5:1 normal, 3:1 large |
| Focus visible indicators | Pending | Accessibility | All interactive elements |
| Alt text on images | Pending | Accessibility | Informative images |
| Form labels and error messages | Pending | Accessibility | Associated labels |
| Skip to content link | Pending | Accessibility | First focusable element |

### Compatibility Validation

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| Chrome (latest) | Pending | QA | Windows, macOS |
| Firefox (latest) | Pending | QA | Windows, macOS |
| Safari (latest) | Pending | QA | macOS, iOS |
| Edge (latest) | Pending | QA | Windows |
| Mobile Chrome (Android) | Pending | QA | Various devices |
| Mobile Safari (iOS) | Pending | QA | Various devices |
| Tablet layouts | Pending | QA | iPad, Android tablets |
| Responsive breakpoints | Pending | QA | All screen sizes |

### Data Validation

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| Database migrations tested | Pending | Engineering | Up and down migrations |
| Seed data loaded | Pending | Engineering | Test data in staging |
| PII handling verified | Pending | Engineering | Encryption, masking |
| Data retention configured | Pending | Engineering | GDPR compliance |
| Backup strategy documented | Pending | DevOps | Automated, tested |

### Deployment Validation

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| CI/CD pipeline green | Pending | DevOps | All tests pass |
| Staging deployment successful | Pending | DevOps | Mirror of production |
| Rollback procedure tested | Pending | DevOps | Documented and verified |
| Health check endpoints | Pending | Engineering | /health, /ready responding |
| Environment variables set | Pending | DevOps | Production values |
| DNS configured | Pending | DevOps | Cloudflare records |
| SSL certificate valid | Pending | DevOps | Cloudflare SSL |

### Monitoring & Alerting

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| Error tracking configured | Pending | Engineering | Sentry DSN set |
| Uptime monitoring | Pending | DevOps | Status page active |
| Log aggregation | Pending | DevOps | Centralized logs |
| Alerting rules configured | Pending | DevOps | PagerDuty/Slack |
| Dashboard created | Pending | DevOps | Grafana/Prometheus |
| Health check monitoring | Pending | DevOps | Synthetic checks |

### Documentation

| Item | Status | Verified By | Notes |
|------|--------|-------------|-------|
| API documentation | Pending | Engineering | OpenAPI/Swagger |
| Runbooks for common issues | Pending | DevOps | Incident response |
| Deployment runbook | Pending | DevOps | Step-by-step guide |
| On-call rotation | Pending | DevOps | Schedule published |
| Contact list | Pending | DevOps | Engineering, security, legal |

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Engineering Lead | | | |
| QA Lead | | | |
| Security Lead | | | |
| DevOps Lead | | | |
| Product Owner | | | |

## Related Documents

- `PRODUCTION_READINESS.md` — Production readiness criteria
- `GO_LIVE_CHECKLIST.md` — Go-live execution checklist
- `AUDIT_STATUS.md` — Security and compliance audit status
- `SECURITY_BASELINE.md` — Security baseline requirements
- `PERFORMANCE_BASELINE.md` — Performance baseline metrics
- `ARCHITECTURE.md` — System architecture & tech stack