> HISTÓRICO — no canónico. Ver ARCHITECTURE.md / docs/HANDOVER.md

# CERTIFICATION_MATRIX.md — Certification Requirements Matrix

**Repository:** `elevari-2026` (Elevari hospitality platform)
**Status:** Phase 0 — Canonical Governance Foundation
**Last validated:** Commit `550190a`

## Overview

This document defines the certification requirements matrix for the Elevari platform. It tracks all required certifications, compliance frameworks, and their current status.

**Owner:** Security & Compliance Team
**Phase:** 3E (Complete)

## Certification Matrix

| Certification | Framework | Scope | Status | Owner | Target Date | Evidence |
|---------------|-----------|-------|--------|-------|-------------|----------|
| WCAG 2.1 AA | Accessibility | Web application | Pending | Accessibility | 2026-04-20 | Audit report |
| Colombian Habeas Data | Data protection | PII processing | Pending | Legal | 2026-06-20 | Compliance cert |
| PCI DSS SAQ A | Payment security | Wompi integration | Pending | Security | 2026-06-20 | SAQ document |
| ISO 27001 | Information security | ISMS | Not started | Security | 2026-12-01 | Certificate |
| SOC 2 Type II | Security & availability | Platform | Not started | Security | 2027-03-01 | Report |
| GDPR | Data protection | EU users (if applicable) | Not started | Legal | 2027-06-01 | Compliance cert |

## Compliance Requirements by Domain

### Data Protection & Privacy

| Requirement | Regulation | Status | Owner | Notes |
|-------------|------------|--------|-------|-------|
| User consent capture | Habeas Data (CO) | Pending | Legal | Cookie consent, terms acceptance |
| Right to access personal data | Habeas Data (CO) | Pending | Engineering | Data export endpoint |
| Right to rectification | Habeas Data (CO) | Pending | Engineering | Profile edit endpoint |
| Right to deletion (right to be forgotten) | Habeas Data (CO) | Pending | Engineering | Account deletion endpoint |
| Data breach notification (72 hours) | Habeas Data (CO) | Pending | Legal/Engineering | Incident response plan |
| Data protection officer designation | Habeas Data (CO) | Pending | Legal | DPO appointed and registered |
| Privacy policy in Spanish | Habeas Data (CO) | Pending | Legal | Colombian Spanish version |
| Data retention schedule | Habeas Data (CO) | Pending | Engineering | Automated deletion |
| Cross-border transfer safeguards | Habeas Data (CO) | Pending | Legal | Wompi, AWS processor agreements |

### Payment Security

| Requirement | Standard | Status | Owner | Notes |
|-------------|----------|--------|-------|-------|
| No card data stored | PCI DSS | Complete | Engineering | Wompi handles all card data |
| Wompi webhook signature verification | PCI DSS / Wompi | Pending | Engineering | Verify webhook authenticity |
| TLS 1.3 for all payment data | PCI DSS | Complete | Engineering | Cloudflare SSL |
| SAQ A eligibility | PCI DSS | Pending | Security | Wompi as redirect provider |
| Quarterly vulnerability scan | PCI DSS | Pending | Security | Approved scanning vendor |

### Accessibility

| Requirement | Standard | Status | Owner | Notes |
|-------------|----------|--------|-------|-------|
| Perceivable content | WCAG 2.1 AA | Pending | Accessibility | Alt text, color contrast, captions |
| Operable interface | WCAG 2.1 AA | Pending | Accessibility | Keyboard navigation, focus indicators |
| Understandable content | WCAG 2.1 AA | Pending | Accessibility | Labels, error messages, language |
| Robust compatibility | WCAG 2.1 AA | Pending | Accessibility | Screen reader, assistive tech |

### Information Security

| Requirement | Standard | Status | Owner | Notes |
|-------------|----------|--------|-------|-------|
| Information security policy | ISO 27001 | Not started | Security | Documented ISMS |
| Risk assessment methodology | ISO 27001 | Not started | Security | Annual risk assessment |
| Asset inventory | ISO 27001 | Not started | Security | All hardware, software, data |
| Access control policy | ISO 27001 | Not started | Security | Role-based access control |
| Incident management | ISO 27001 | Not started | Security | Incident response procedures |
| Business continuity | ISO 27001 | Not started | Security | BCP and DR plan |

## Certification Timeline

| Quarter | Certifications | Owner |
|---------|---------------|-------|
| Q1 2026 | WCAG 2.1 AA (prep), Habeas Data (prep) | Accessibility, Legal |
| Q2 2026 | WCAG 2.1 AA (audit), Habeas Data (cert), PCI DSS SAQ A | Accessibility, Legal, Security |
| Q3 2026 | ISO 27001 (prep) | Security |
| Q4 2026 | ISO 27001 (audit) | Security |
| Q1 2027 | SOC 2 Type II (prep) | Security |
| Q2 2027 | SOC 2 Type II (audit), GDPR (if applicable) | Security, Legal |

## Evidence Repository

| Certification | Evidence Location | Owner | Last Updated |
|---------------|-------------------|-------|--------------|
| WCAG 2.1 AA | `/docs/compliance/wcag-audit.pdf` | Accessibility | — |
| Habeas Data | `/docs/compliance/habeas-data-cert.pdf` | Legal | — |
| PCI DSS SAQ A | `/docs/compliance/pci-saq-a.pdf` | Security | — |
| ISO 27001 | `/docs/compliance/iso27001-cert.pdf` | Security | — |
| SOC 2 Type II | `/docs/compliance/soc2-report.pdf` | Security | — |

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Security Lead | | | |
| Compliance Officer | | | |
| Legal Counsel | | | |
| Engineering Lead | | | |
| Product Owner | | | |

## Related Documents

- `AUDIT_STATUS.md` — Security and compliance audit status
- `SECURITY_BASELINE.md` — Security baseline requirements
- `PRODUCTION_READINESS.md` — Production readiness criteria
- `PRE_PRODUCTION_CHECKLIST.md` — Pre-production validation steps
- `GO_LIVE_CHECKLIST.md` — Go-live execution checklist
- `ARCHITECTURE.md` — System architecture & tech stack