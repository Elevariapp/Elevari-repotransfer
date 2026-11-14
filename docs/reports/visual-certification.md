# VISUAL CERTIFICATION — Phase 3.5

**Fecha:** 2026-11-13
**Herramienta:** Playwright 1.61 + Chrome del sistema (headless)
**Arnés:** `scripts/certification/visual-audit.mjs`
**Evidencia cruda:** `docs/reports/assets/visual-metrics.json` · capturas en `docs/reports/assets/visual/`

---

## Alcance ejecutado

| Viewport | Rutas | Capturas |
|----------|-------|----------|
| 360×800 | 9 | 9 |
| 390×844 | 9 | 9 |
| 768×1024 | 9 | 9 |
| 1024×768 | 9 | 9 |
| 1366×768 | 9 | 9 |
| 1440×900 | 9 | 9 |
| 1920×1080 | 9 | 9 |
| **Total** | | **63** |

Rutas: `/`, `/properties` (estado de error de API), `/legal/faq`, `/legal/privacy`, `/legal/terms`, `/legal/accessibility`, `/auth/login`, `/auth/register`, `/404`.

---

## Resultados automáticos

| Métrica | Resultado |
|---------|-----------|
| Combinaciones medidas | 63 |
| Scroll horizontal (overflow) | **0 fallos** |
| Imágenes sin `alt` | **0** (59 imágenes evaluadas) |
| Controles interactivos sin nombre accesible | **0** |
| Vistas con exactamente un `h1` | **63/63** |
| `lang="es"` en `<html>` | **63/63** |
| Respuestas 200 / 404 esperadas | 56 / 7 |
| Errores de navegación | 0 |

---

## Hallazgos y correcciones

| # | Severidad | Hallazgo | Estado |
|---|-----------|----------|--------|
| V1 | Alta (conversión) | En 390×844 la barra de búsqueda del hero comenzaba en y=835 (fuera del viewport); el CTA "Buscar" quedaba en y=1054. | **Corregido** — hero móvil compacto (badges y scroll-hint ocultos bajo `sm`, `pt-14`, campos de 52 px). Ahora: hero 753 px, barra 513→778, botón 720→772 (visible completo). |
| V2 | Media | Subtítulo del chip de categoría activo con contraste 1.12 (gris sobre verde). | **Corregido** — texto blanco cuando el chip está activo. |
| V3 | Baja | Enlaces del footer con opacidades no estándar (`/82`, `/12`). | **Corregido** — normalizadas a `/80` y `/10`. |
| V4 | Baja | El wordmark no aportaba nombre accesible coherente con el texto visible. | **Corregido** — nombre construido desde el contenido + `sr-only`. |

---

## Limitaciones de la certificación visual

Las siguientes pantallas **no pudieron renderizarse** en este entorno porque dependen de PostgreSQL + API Fastify + MinIO (no hay Docker ni base de datos disponible):

- Detalle de propiedad (`/properties/[slug]`)
- Galería / lightbox
- Booking widget con cotización
- Checkout (`/checkout/[bookingId]`)
- Pago y confirmación
- Dashboard de anfitrión y panel admin

**Estado:** PENDIENTE DE QA VISUAL CON BACKEND. No se certifican como PASS.

Verificación estática realizada sobre esos componentes: sin overflow estructural (grids responsive), `alt` en imágenes de galería, diálogos con `role="dialog"`, objetivos táctiles ≥44 px.

---

## Veredicto

**PASS (parcial)** para las 9 rutas medidas en 7 viewports.
**PENDIENTE** para las 6 pantallas que requieren backend.

## Reproducir

```bash
npm run build && npm run start
node scripts/certification/visual-audit.mjs
```
