# GO_LIVE_CHECKLIST.md — Go-Live Execution Checklist

**Repository:** `wana-2026` (Elevari hospitality platform)
**Status:** Phase 0 — Canonical Governance Foundation
**Last validated:** Commit `550190a`

## Overview

This document defines the go-live execution checklist for the Elevari platform. It covers the step-by-step process for promoting code to production, including pre-go-live validation, go-live execution, and post-go-live verification.

**Owner:** Release Engineering Team
**Phase:** 3E (Complete)

## Go-Live Timeline

| Phase | Timing | Owner | Description |
|-------|--------|-------|-------------|
| T-7 days | 1 week before | Release Eng | Final pre-go-live review |
| T-3 days | 3 days before | QA | Final regression testing |
| T-1 day | 1 day before | DevOps | Infrastructure readiness check |
| T-0 hours | Go-live day | Release Eng | Execute go-live procedure |
| T+1 hour | Post-go-live | Engineering | Smoke testing |
| T+24 hours | Day after | DevOps | Stability review |

## Pre-Go-Live Validation (T-7 to T-1)

| Item | Status | Owner | Due | Notes |
|------|--------|-------|-----|-------|
| All PRE_PRODUCTION_CHECKLIST items complete | Pending | Release Eng | T-7 | See PRE_PRODUCTION_CHECKLIST.md |
| All PRODUCTION_READINESS items complete | Pending | DevOps | T-7 | See PRODUCTION_READINESS.md |
| Staging mirror of production verified | Pending | DevOps | T-3 | Same instance types, config |
| Load test completed (1000 concurrent users) | Pending | Engineering | T-3 | k6 or similar |
| Database migration tested on staging | Pending | Engineering | T-3 | Up and down migrations |
| Rollback procedure reviewed | Pending | DevOps | T-2 | Documented and tested |
| On-call rotation confirmed | Pending | DevOps | T-2 | PagerDuty schedule |
| Communication plan approved | Pending | Product | T-1 | Stakeholder notification |
| Support team briefed | Pending | Support | T-1 | Incident response procedures |

## Go-Live Execution (T-0)

| Step | Action | Owner | Status | Notes |
|------|--------|-------|--------|-------|
| 1 | Freeze code deployments | Release Eng | Pending | No merges to main |
| 2 | Verify staging health | DevOps | Pending | /health, /ready endpoints |
| 3 | Take application maintenance mode | DevOps | Pending | Brief downtime window |
| 4 | Run database migrations | Engineering | Pending | Prisma migrate deploy |
| 5 | Deploy application to production | DevOps | Pending | Blue-green or rolling |
| 6 | Verify production health | DevOps | Pending | /health, /ready responding |
| 7 | Disable maintenance mode | DevOps | Pending | Application live |
| 8 | Smoke test critical paths | QA | Pending | Search, booking, payment |
| 9 | Verify Wompi webhook endpoints | Engineering | Pending | Webhook signatures valid |
| 10 | Confirm monitoring alerts active | DevOps | Pending | PagerDuty, Slack |

## Post-Go-Live Verification (T+1 to T+24)

| Item | Status | Owner | Due | Notes |
|------|--------|-------|-----|-------|
| Smoke test passed | Pending | QA | T+1 | Critical user journeys |
| Error rate < 0.1% | Pending | Engineering | T+1 | Sentry, application logs |
| API response time < 200ms (p95) | Pending | Engineering | T+1 | Under production load |
| Database connections stable | Pending | DevOps | T+1 | Connection pool healthy |
| Wompi payment test transaction | Pending | QA | T+1 | Sandbox or production COP |
| Email notifications delivered | Pending | QA | T+1 | Booking confirmations |
| Log aggregation working | Pending | DevOps | T+1 | Centralized logs flowing |
| Alerting rules triggered correctly | Pending | DevOps | T+1 | Test alert |
| 24-hour stability review | Pending | DevOps | T+24 | No regressions |

## Rollback Plan

### Rollback Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Error rate > 1% | 5 minutes | Initiate rollback |
| API response time > 2s (p95) | 10 minutes | Initiate rollback |
| Payment failures > 5% | Immediate | Initiate rollback |
| Database connection exhaustion | Immediate | Initiate rollback |
| Critical security vulnerability | Immediate | Initiate rollback + incident |

### Rollback Procedure

| Step | Action | Owner | Estimated Time |
|------|--------|-------|----------------|
| 1 | Enable maintenance mode | DevOps | 2 minutes |
| 2 | Revert application to previous version | DevOps | 5 minutes |
| 3 | Revert database migration (if applicable) | Engineering | 10 minutes |
| 4 | Verify previous version health | DevOps | 5 minutes |
| 5 | Disable maintenance mode | DevOps | 2 minutes |
| 6 | Notify stakeholders | Release Eng | 5 minutes |

### Rollback Decision Matrix

| Scenario | Rollback? | Notes |
|----------|-----------|-------|
| Minor UI bug | No | Hotfix in next deploy |
| Non-critical API error | No | Monitor, fix in next deploy |
| Payment processing broken | Yes | Immediate rollback |
| Data corruption | Yes | Immediate rollback + incident |
| Security vulnerability | Yes | Immediate rollback + incident |

## Communication Plan

### Stakeholder Notifications

| Audience | Channel | Timing | Owner |
|----------|---------|--------|-------|
| Engineering team | Slack #engineering | T-1, T+0, T+24 | Release Eng |
| Product team | Slack #product | T-1, T+0 | Product Owner |
| Support team | Slack #support | T-1, T+0 | Support Lead |
| Executive team | Email | T-1, T+0 | Engineering Lead |
| Customers | In-app banner | T+0 (if downtime) | Product |

### Go-Live Announcement Template

```
Subject: Elevari Platform Go-Live — [Date]

The Elevari platform will go live on [date] at [time] UTC.
Expected downtime: [X] minutes.
Contact: [on-call engineer] via [PagerDuty/Slack].
```

## Related Documents

- `PRE_PRODUCTION_CHECKLIST.md` — Pre-production validation steps
- `PRODUCTION_READINESS.md` — Production readiness criteria
- `AUDIT_STATUS.md` — Security and compliance audit status
- `SECURITY_BASELINE.md` — Security baseline requirements
- `PERFORMANCE_BASELINE.md` — Performance baseline metrics
- `ARCHITECTURE.md` — System architecture & tech stack