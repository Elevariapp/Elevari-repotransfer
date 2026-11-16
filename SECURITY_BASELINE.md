# SECURITY_BASELINE.md — Security Baseline Requirements

**Repository:** `wana-2026` (Elevari hospitality platform)
**Status:** Phase 0 — Canonical Governance Foundation
**Last validated:** Commit `550190a`

## Overview

This document defines the security baseline requirements for the Elevari platform. All requirements must be implemented and verified before production launch.

**Owner:** Security Team
**Phase:** 3E (Complete)

## Network Security

| Requirement | Status | Owner | Implementation | Notes |
|-------------|--------|-------|----------------|-------|
| Cloudflare WAF enabled | Pending | Security | Cloudflare WAF rules | OWASP Top 10 protection |
| DDoS protection | Pending | DevOps | Cloudflare DDoS | Layer 3, 4, 7 protection |
| TLS 1.3 enforced | Pending | DevOps | Cloudflare SSL/TLS | Minimum TLS 1.2, prefer 1.3 |
| HSTS header | Pending | Engineering | Next.js headers | Strict-Transport-Security |
| CORS policy | Pending | Engineering | Next.js middleware | Restricted origins only |
| IP allowlisting (admin) | Pending | DevOps | Cloudflare Access | Admin dashboard access |
| Geographic restrictions | Pending | DevOps | Cloudflare rules | CO-focused, block high-risk regions |

## Application Security

| Requirement | Status | Owner | Implementation | Notes |
|-------------|--------|-------|----------------|-------|
| Authentication middleware | Pending | Engineering | Next.js middleware | Protected routes require auth |
| Authorization (RBAC) | Pending | Engineering | Role-based access | Customer, Admin, SuperAdmin |
| Session management | Pending | Engineering | Secure cookies | HttpOnly, Secure, SameSite |
| Password policy | Pending | Engineering | Zod validation | Min 12 chars, complexity |
| MFA for admin accounts | Pending | Engineering | TOTP or email | Admin and SuperAdmin roles |
| Rate limiting | Pending | Engineering | Fastify rate-limit | API and auth endpoints |
| Input validation | Pending | Engineering | Zod schemas | All API endpoints |
| Output encoding | Pending | Engineering | React auto-escaping | XSS prevention |
| CSRF protection | Pending | Engineering | SameSite cookies | State-changing operations |
| Security headers | Pending | Engineering | Next.js headers | X-Frame-Options, X-Content-Type-Options |

## Data Security

| Requirement | Status | Owner | Implementation | Notes |
|-------------|--------|-------|----------------|-------|
| Encryption at rest | Pending | DevOps | RDS encryption | AES-256 |
| Encryption in transit | Pending | DevOps | TLS 1.3 | All internal/external |
| PII field encryption | Pending | Engineering | Application-level | Email, phone, address |
| Database backup encryption | Pending | DevOps | RDS encrypted backups | Automated daily |
| Secret management | Pending | DevOps | AWS Secrets Manager | No secrets in code |
| Environment variable validation | Pending | Engineering | Zod schema | All required vars validated |
| No hardcoded credentials | Pending | Engineering | Secret scanning | CI/CD secret scan |
| Data retention policy | Pending | Engineering | Automated cleanup | GDPR-compliant |

## Payment Security

| Requirement | Status | Owner | Implementation | Notes |
|-------------|--------|-------|----------------|-------|
| Wompi as sole provider | Complete | Engineering | Wompi SDK | COP currency only |
| No card data stored | Complete | Engineering | Wompi handles cards | PCI DSS scope reduction |
| Webhook signature verification | Pending | Engineering | Wompi signature | Verify webhook authenticity |
| Payment API rate limiting | Pending | Engineering | Fastify rate-limit | Payment endpoints |
| Payment audit logging | Pending | Engineering | Structured logs | All payment events |
| PCI DSS SAQ A scope | Pending | Security | Self-assessment | Wompi redirect provider |

## Infrastructure Security

| Requirement | Status | Owner | Implementation | Notes |
|-------------|--------|-------|----------------|-------|
| EC2 security groups | Pending | DevOps | Least privilege | Required ports only |
| MinIO access control | Pending | DevOps | IAM policies | Bucket-level permissions |
| Database security groups | Pending | DevOps | Least privilege | App servers only |
| SSH key management | Pending | DevOps | AWS Systems Manager | No password auth |
| Patch management | Pending | DevOps | Automated updates | OS and container patches |
| Vulnerability scanning | Pending | DevOps | Container image scan | CI/CD pipeline |
| Backup encryption | Pending | DevOps | RDS encrypted snapshots | Automated daily |
| Cross-region replication | Pending | DevOps | MinIO replication | Disaster recovery |

## Monitoring & Detection

| Requirement | Status | Owner | Implementation | Notes |
|-------------|--------|-------|----------------|-------|
| Error tracking (Sentry) | Pending | Engineering | Sentry DSN | Frontend + backend |
| Log aggregation | Pending | DevOps | Centralized logs | All services |
| Security event alerting | Pending | DevOps | PagerDuty/Slack | Failed logins, anomalies |
| Uptime monitoring | Pending | DevOps | Status page | Synthetic checks |
| Health check endpoints | Pending | Engineering | /health, /ready | Liveness and readiness |
| Audit logging | Pending | Engineering | Structured logs | Auth, admin, payment events |
| SIEM integration | Pending | DevOps | Log forwarding | Future: Splunk/Elastic |

## Vulnerability Management

| Requirement | Status | Owner | Implementation | Notes |
|-------------|--------|-------|----------------|-------|
| Dependency scanning (npm audit) | Pending | DevOps | CI/CD pipeline | Weekly scans |
| SAST scanning | Pending | DevOps | CI/CD pipeline | Static analysis |
| Secret scanning | Pending | DevOps | CI/CD pipeline | GitLeaks/truffleHog |
| Container image scanning | Pending | DevOps | CI/CD pipeline | Docker images |
| Penetration testing | Pending | Security | Third-party | Annual, before launch |
| Responsible disclosure | Pending | Security | security@elevari.com | Contact email |

## Incident Response

| Requirement | Status | Owner | Implementation | Notes |
|-------------|--------|-------|----------------|-------|
| Incident response plan | Pending | Security | Documented | Severity levels, escalation |
| On-call rotation | Pending | DevOps | PagerDuty | 24/7 coverage |
| Incident communication | Pending | Engineering | Status page | Customer notifications |
| Post-incident review | Pending | Engineering | Blameless postmortem | Lessons learned |
| Data breach notification (72h) | Pending | Legal | Habeas Data | Colombian regulation |

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Security Lead | | | |
| Engineering Lead | | | |
| DevOps Lead | | | |
| Product Owner | | | |

## Related Documents

- `AUDIT_STATUS.md` — Security and compliance audit status
- `CERTIFICATION_MATRIX.md` — Certification requirements matrix
- `PRODUCTION_READINESS.md` — Production readiness criteria
- `PRE_PRODUCTION_CHECKLIST.md` — Pre-production validation steps
- `GO_LIVE_CHECKLIST.md` — Go-live execution checklist
- `ARCHITECTURE.md` — System architecture & tech stack