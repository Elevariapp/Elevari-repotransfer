# Waná Go-Live — Shared Audit Reference

Use this when **production-expert**, **product-communications**, or **product-sales-marketing** run a coordinated gap analysis before live public sales.

## Master document map

| Document | Production | Comms | Sales/Marketing |
|----------|:----------:|:-----:|:---------------:|
| `deploy/GO_LIVE_CHECKLIST.md` | ✅ primary | skim | skim |
| `docs/PLATFORM_STATUS_CHECKLIST.md` | ✅ primary | ✅ primary | ✅ primary |
| `INFRASTRUCTURE.md` | ✅ primary | — | skim (Fase 4) |
| `ROADMAP.md` | ✅ | ✅ | ✅ |
| `deploy/DEPLOYMENT_PRODUCTION.md` | ✅ | — | — |
| `knowledge/*` | — | ✅ primary | ✅ |
| `lib/analytics.ts` | — | — | ✅ primary |

## Current known gaps (update after each audit)

Source: `docs/PLATFORM_STATUS_CHECKLIST.md` — post staging `164.92.241.30`

### Production (P0 blockers)
- HTTPS / dominio `wana.co` — not live
- Pagos live — `PAYMENTS_MODE=mock`
- Alegra — no credentials (validate-env now **requires** keys when `PAYMENTS_MODE=live`)
- Backups — script exists, cron not confirmed
- ✅ P0-09 double-booking EXCLUDE constraint + property lock
- ✅ P0-10–12 auth booking/payment + cancel guard
- ✅ P0-13 cancellation policy API (moderate tiers)
- ✅ P0-14 legacy Supabase routes disabled (410)
- ✅ P0-18 middleware JWT verify + admin/host roles
- ✅ P0-19 demo accounts blocked in production login

### Communications (P0)
- Legal copy — static pages exist; final lawyer review pending
- FAQ — update for live Bold/Stripe payment methods
- Email confirmación — depends on `RESEND_API_KEY`

### Sales / Marketing (P0)
- Cannot run paid acquisition until production P0 cleared
- GA4 / Meta Pixel / CAPI env vars likely unset in prod
- OG images per property — partial (P2 in platform checklist)

## Recommended orchestration

When user asks for full go-live readiness:

1. **production-expert** → Production Gap Report (blockers first)
2. **product-communications** → Comms Gap Report (aligned to actual product state)
3. **product-sales-marketing** → GTM Gap Report (sequenced after P0 production)

Merge into single executive summary:

```markdown
# Waná Launch Readiness — Executive Summary

**Verdict:** [Not ready / Soft launch ready / Public launch ready]

## Top 5 blockers (all domains)
1. ...

## This week (parallel workstreams)
- Production: ...
- Comms: ...
- Marketing: ...

## Launch date recommendation
[Date or "blocked until P0 resolved"]
```

## Commands (all agents)

```bash
npm run go-live:validate:staging
./deploy/scripts/validate-env.sh
BASE_URL=http://164.92.241.30 ./deploy/scripts/verify-health.sh
```
