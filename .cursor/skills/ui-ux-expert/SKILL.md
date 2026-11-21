---
name: ui-ux-expert
description: >-
  Elevari UI/UX design expert for Airbnb-style hospitality flows. Use when polishing
  layouts, improving responsiveness, auditing buttons/links, design system work,
  booking/checkout UX, host dashboards, or mentions @Design, UI/UX, or visual polish.
---

# Elevari UI/UX Expert

Diseña y refina la experiencia huésped/anfitrión con estándar **Airbnb + identidad Elevari** (naturaleza, premium accesible, Colombia).

## Design system (obligatorio)

| Token | Valor | Uso |
|-------|-------|-----|
| `elevari-forest` | `#1B4332` | CTAs primarios, links activos |
| `elevari-forest-light` | `#2D6A4F` | hover primario |
| `elevari-cream` | `#FDFBF7` | fondo página |
| `elevari-sand` | `#F4F1EA` | cards vacías, placeholders |
| Font display | DM Serif Display | títulos hero, H1–H2 |
| Font body | Inter | UI, párrafos |

**Clases de proyecto:** `elevari-container`, `elevari-card`, `elevari-btn-primary`, `elevari-btn-ghost`, `elevari-section-title` — definidas en `app/globals.css`.

**Referencias:** `tailwind.config.ts`, `app/layout.tsx`, `components/PropertyCard.tsx`, `components/search/SearchHero.tsx`.

## Principios UX (Elevari)

1. **Transparencia de precio** — total visible antes de pagar; desglose en checkout.
2. **Mobile-first** — booking widget sticky en desktop; full-width en móvil.
3. **Un CTA principal por vista** — evitar dos botones verdes compitiendo.
4. **Feedback inmediato** — `react-hot-toast` en acciones async; estados loading/disabled.
5. **Confianza** — ratings, ciudad, fotos grandes, copy en español claro.
6. **Flujo corto** — explorar → fechas → checkout → confirmación (≤ 4 pantallas).

## Áreas prioritarias

| Área | Archivos clave | Objetivo |
|------|----------------|----------|
| Home | `app/page.tsx`, `SearchHero.tsx` | Hero + destacados + CTA |
| Listado | `app/properties/page.tsx`, `PropertyCard.tsx` | Grid responsive, lazy images |
| Detalle | `app/properties/[slug]/`, `PropertyGallery`, `BookingWidget` | Galería + reserva |
| Checkout | `app/checkout/`, `CheckoutClient.tsx` | Pagos Bold/Stripe/mock |
| Auth | `app/auth/*`, `Header.tsx` | Login JWT, redirect |
| Host | `app/host/`, `MediaUploader.tsx` | Dashboard + media API |
| Global | `Header.tsx`, `Footer.tsx` | Nav, mobile menu, links válidos |

## Responsive checklist

- [ ] Breakpoints: `sm` 640, `md` 768, `lg` 1024 — probar cada flujo crítico
- [ ] Header: menú hamburguesa en `< md` (si no existe, implementar)
- [ ] Property grid: 1 col móvil → 2 `sm` → 3–4 `lg`
- [ ] Booking widget: debajo de galería en móvil, sidebar en `lg`
- [ ] Checkout: botones Bold/Stripe apilados en móvil
- [ ] Touch targets ≥ 44px en botones primarios
- [ ] Sin scroll horizontal en 375px width

## Auditoría de botones y links

Al revisar o implementar UI:

1. **Rastrear** cada `<Link>`, `<button>`, `onClick` en la página tocada.
2. **Clasificar:** API Fastify (`elevariApi`) vs código legacy eliminado.
3. **Legacy sin Supabase** → migrar a API o deshabilitar con mensaje claro (no 404 silencioso).
4. **Verificar** `middleware.ts` para rutas protegidas (`/host`, `/account`, `/admin`).
5. Documentar hallazgos en `DOMAIN_STATUS.md`.

## Patrones Airbnb a replicar

- Cards con imagen 4:3, precio/noche, rating
- Sticky booking card en detalle
- Stepper visual en checkout (resumen → pago → confirmación)
- Empty states con ilustración o CTA
- Skeleton loaders en listados (opcional, alta prioridad en perceived performance)

## Anti-patrones (evitar)

- Mezclar estilos legacy (`bg-slate-50 rounded-[32px]`) con `elevari-*` en la misma vista
- Botones decorativos sin acción (fechas hero sin date picker)
- `framer-motion` en listados masivos (peso bundle)

## Workflow del agente

1. Leer vista actual + componentes hijos.
2. Comparar con design system y flujo huésped.
3. Implementar cambios **mínimos y coherentes** — no rediseñar todo de golpe.
4. Probar rutas: móvil 375px + desktop 1280px mentalmente o con checklist.
5. Actualizar checklist de plataforma si se arregla o rompe funcionalidad.

## Coordinación con otros skills

- Pagos/checkout → `booking-engine-expert`
- Deploy/perf infra → `elevari-architect` + `INFRASTRUCTURE.md`
- Marketing/SEO → `marketing-strategist`

## Assets

- Checklist vivo: `DOMAIN_STATUS.md`
- Estado deploy: `GO_LIVE_CHECKLIST.md`, `ROADMAP.md`
