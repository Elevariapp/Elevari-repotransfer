# PERFORMANCE CERTIFICATION — Phase 3.5

**Fecha:** 2026-11-13
**Herramienta:** Lighthouse 12 (mobile, throttling simulado), Chrome headless
**Build:** producción (`npm run build && npm run start`)
**Evidencia:** `docs/reports/assets/lighthouse-{home,legal,login}.json`

---

## 1. Resultados finales

| Página | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
|--------|-------------|---------------|----------------|-----|-----|-----|-----|
| `/` (home) | **91** | **100** | **100** | **100** | 3.5 s | 30–40 ms | 0 |
| `/legal/accessibility` | **100** | **100** | **100** | **100** | 0.9 s | 30 ms | 0 |
| `/auth/login` | **100** | **100** | **100** | **100** | 0.9 s | 40 ms | 0 |

Home medida 3 veces consecutivas: **91 / 91 / 91** (estable).

**Objetivos:** Performance ≥90 ✅ · Accessibility ≥95 ✅ · Best Practices ≥95 ✅ · SEO ≥90 ✅

---

## 2. Antes / después

| Métrica (home) | Antes | Después |
|----------------|-------|---------|
| Performance | 82 | **91** |
| LCP | 4.4 s | 3.5 s |
| TBT | 180–220 ms | **30–40 ms** |
| Imagen LCP | `background-image` CSS (no descubrible, sin optimizar) | `next/image` con `priority`, `fetchpriority=high`, `sizes` |
| JS de calendario | En el bundle inicial | Carga diferida al abrir fechas |
| Wrapper de plantilla | `framer-motion` en todas las rutas | Passthrough sin JS |
| Tamaño del hero en móvil | 1184 px de alto (búsqueda fuera del viewport) | 753 px (búsqueda visible) |

---

## 3. Correcciones aplicadas

1. **LCP descubrible y optimizado** — el hero usaba `style={{backgroundImage}}`; ahora `next/image` con `fill`, `priority`, `fetchPriority="high"`, `sizes="100vw"`.
2. **Bug de configuración de imágenes** — se usaba `quality={72}` sin declarar `images.qualities`, lo que devolvía **HTTP 400** en producción. Se declaró `qualities: [60, 72, 75]`.
3. **deviceSizes** alineados con los valores estándar de Next (`640, 750, 828, 1080, 1200, 1920`).
4. **Calendario diferido** — `react-day-picker` se carga solo al abrir el panel de fechas (`next/dynamic`, `ssr:false`).
5. **Plantilla sin animación** — `app/template.tsx` ya no envuelve todas las páginas en `framer-motion`.
6. **Hero móvil compacto** — menos altura inicial, menos trabajo de pintado, CTA visible.

---

## 4. Riesgos residuales

| # | Riesgo | Detalle | Mitigación |
|---|--------|---------|-----------|
| P1 | **LCP 3.5 s en móvil simulado** | La imagen del hero es la limitante: la fuente es 880×1024 y se muestra a pantalla completa. Lighthouse usa 4G lento simulado. | Generar un hero landscape ≥1600 px y servirlo por CDN, o reducir `quality` a 50 y reevaluar |
| P2 | JavaScript heredado | ~14 KiB de polyfills (framework) | No accionable sin cambiar de framework |
| P3 | JS no usado | ~55 KiB previamente detectado; reducido tras diferir el calendario | Reevaluar en la siguiente ronda |
| P4 | Páginas con datos reales | Home se midió sin destacados (API no disponible) | Repetir Lighthouse con backend activo y datos |

---

## 5. Presupuesto de performance (propuesto)

| Métrica | Objetivo |
|---------|----------|
| LCP (móvil 4G) | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
| TBT | < 200 ms |
| Peso de imagen LCP | < 60 KB |

---

## Veredicto

**PASS** en las 4 categorías para las 3 páginas medidas.
**RIESGO MEDIO** por LCP de 3.5 s en la home: cumple el umbral de score pero no el umbral "good" de Core Web Vitals. Requiere decisión de activo de marca (hero de mayor resolución).
