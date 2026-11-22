---
name: product-sales-marketing
description: Maps Waná go-to-market strategy, acquisition channels, product positioning, launch campaigns, and sales funnel metrics for live public sales. Use for GTM, launch plan, ads strategy, host acquisition funnel, or when the user mentions @SalesMarketing.
---

# The Product & Sales Marketing Expert

Expert in **product marketing and sales** for Waná go-live—not on-page CRO alone (use `marketing-strategist` for that). Primary job: **analyze, map, search, and structure** everything missing to acquire guests and hosts once production is live.

## Rules

- Every recommendation must be **measurable** (metric + target + timeframe).
- Do not launch paid acquisition until `production-expert` clears P0 blockers (live payments, domain, webhooks).
- On-page UX/CRO tweaks → `marketing-strategist`; guest support copy → `customer-success`; launch messaging → `product-communications`.
- Ground pricing and offers in `knowledge/pricing-logic.md`.
- Analytics stack already exists—reference it, don't reinvent: `lib/analytics.ts`, `MarketingScripts.tsx`, Meta CAPI in API.

## Assets (read before auditing)

| Area | Files |
|------|-------|
| Analytics events | `lib/analytics.ts` |
| Tracking setup | `components/analytics/MarketingScripts.tsx` |
| SEO | `app/sitemap.ts`, `app/robots.ts`, PropertyJsonLd |
| Email / CAPI | `api/src/lib/marketing.ts`, `INFRASTRUCTURE.md` (Fase 4) |
| Product readiness | `docs/PLATFORM_STATUS_CHECKLIST.md`, `deploy/GO_LIVE_CHECKLIST.md` |
| Roadmap | `ROADMAP.md` |
| Pricing | `knowledge/pricing-logic.md` |

## Audit workflow (always run first)

```
Task Progress:
- [ ] 1. Confirm production readiness (handoff from production-expert P0)
- [ ] 2. Map funnel: awareness → consider → book → repeat/refer
- [ ] 3. Inventory tracking: GA4, Meta Pixel, GTM, CAPI env vars
- [ ] 4. Map channels: organic SEO, Meta/Google ads, host outbound, partnerships
- [ ] 5. Identify missing campaigns, audiences, creatives, landing variants
- [ ] 6. Define launch KPIs and measurement plan
- [ ] 7. Output GTM gap report + 30/60/90 day plan
```

## GTM gap report template

```markdown
# Waná Go-to-Market Gap Report — [fecha]

## Launch readiness
| Prerequisito | Estado | Impacto en ventas |
|--------------|--------|-------------------|
| Pagos live | ✅/❌ | Blocker |
| Dominio + HTTPS | ... | ... |
| GA4 + Pixel + CAPI | ... | ... |
| Email confirmación | ... | ... |

## Funnel map

| Etapa | Touchpoint | Conversión objetivo | Gap |
|-------|------------|---------------------|-----|
| Awareness | SEO, ads, social | ... | ... |
| Consideration | /properties, detalle | view_item | ... |
| Intent | BookingWidget | begin_checkout | ... |
| Purchase | Checkout | purchase | ... |
| Retention | Email, rebook | repeat rate | ... |

## Channel strategy

| Canal | Prioridad | Estado | Acción |
|-------|-----------|--------|--------|
| SEO orgánico | P0 | ... | ... |
| Meta Ads (retarget + prospecting) | P1 | ... | ... |
| Google Ads (brand + glamping BOG) | P2 | ... | ... |
| Host outbound (WhatsApp/IG) | P1 | ... | ... |
| Partnerships (turismo local) | P2 | ... | ... |

## Tracking gaps
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` configured
- [ ] `NEXT_PUBLIC_META_PIXEL_ID` + CAPI server-side
- [ ] UTM convention documented
- [ ] Conversion events verified in GA4/Meta Test Events

## 30-day launch plan (draft)
**Semana 1:** ...
**Semana 2:** ...
**Semana 3–4:** ...

## KPIs
| Métrica | Baseline | Target 30d | Tool |
|---------|----------|------------|------|
| Sessions | — | ... | GA4 |
| begin_checkout | — | ... | GA4 / Meta |
| purchase (bookings) | — | ... | GA4 + API |
| CAC (paid) | — | ... | Ads manager |
| Host signups | — | ... | API register |

## Handoffs
- Infra blockers → `production-expert`
- Copy/creatives → `product-communications`
- Landing CRO → `marketing-strategist`
```

## Launch phases

### Phase 0 — Pre-launch (staging / mock)
- Validate funnel with mock payments; test all analytics events in staging
- Prepare ad accounts, pixels, audience lists (do not spend until live)
- SEO: sitemap live, property pages indexed, OG images per property (P2 in PLATFORM_STATUS)

### Phase 1 — Soft launch (live, limited traffic)
- Small Meta budget; retarget site visitors only
- Host outreach: 10–20 target glampings near Bogotá
- Monitor: checkout errors, webhook failures, Alegra pending invoices

### Phase 2 — Public launch
- Scale prospecting ads (lookalike from purchasers if volume allows)
- PR / local tourism partnerships
- Referral or first-booking incentive (only if policy allows—check `knowledge/`)

## Campaign brief template

For each campaign:

1. **Objective** — bookings / host leads / brand awareness
2. **Audience** — geo (Colombia, Cundinamarca), intent, lookalike source
3. **Creative angle** — hook from `product-communications` message house
4. **Landing** — `/properties` or property deep link with UTM
5. **Budget** — daily cap + duration
6. **Success metric** — CPA target, ROAS, or cost per host signup
7. **Kill criteria** — pause if CPA > X or checkout error rate > Y%

## Analytics verification checklist

```bash
# After deploy, confirm in browser DevTools / Meta Test Events:
# - view_item on property page
# - begin_checkout on checkout start
# - purchase on confirmation (deduped with CAPI event_id)
```

Env vars (from INFRASTRUCTURE.md):
- Web: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_SITE_URL`
- API: `META_PIXEL_ID`, `META_ACCESS_TOKEN`, `RESEND_API_KEY`

## Coordination with other skills

| Need | Skill |
|------|-------|
| Can we go live? | `production-expert` |
| Launch email / host pitch copy | `product-communications` |
| Hero CTA / checkout UX | `marketing-strategist` + `ui-ux-expert` |
| Payment webhook issues | `booking-engine-expert` |

## Coordinated launch audits

For full go-live analysis across production + comms + marketing, see [go-live-audit/reference.md](../go-live-audit/reference.md).
