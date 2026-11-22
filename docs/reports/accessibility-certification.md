# ACCESSIBILITY CERTIFICATION — Phase 3.5

**Fecha:** 2026-11-13
**Herramientas:** axe-core 4.x (WCAG 2.0/2.1/2.2 A+AA) + Lighthouse 12 + pruebas de interacción Playwright
**Arnés:** `scripts/certification/a11y-audit.mjs`
**Evidencia:** `docs/reports/assets/a11y-results.json`, `focus-skip-link.jpg`, `mobile-menu-open.jpg`, `login-validation.jpg`

---

## 1. Resultado axe-core

| Métrica | Antes | Después |
|---------|-------|---------|
| Ejecuciones (7 rutas × 2 viewports) | 14 | 14 |
| Violaciones | **8** (todas `serious`) | **0** |
| Tipos de violación | `color-contrast`, `label-content-name-mismatch` | — |

### Correcciones aplicadas

| Regla | Detalle | Fix |
|-------|---------|-----|
| `color-contrast` | Subtítulo del chip activo: `#5C6B65` sobre `#2F6B4F` = 1.12 | Texto blanco en estado activo (6.29:1) |
| `label-content-name-mismatch` | Logo con `aria-label` que no contenía el texto visible | Nombre accesible desde el contenido + `sr-only` |
| `skip-link` (Lighthouse) | `/auth/login` no tenía `#contenido` porque `AuthShell` está en `components/` | `id="contenido"` añadido |

---

## 2. Pruebas de interacción

| Prueba | Resultado | Evidencia |
|--------|-----------|-----------|
| Skip link con primer Tab | **PASS** — visible en `top: 16px`, outline `2px solid rgb(47,107,79)` | `focus-skip-link.jpg` |
| Orden de tabulación | **PASS** — 12 elementos, todos con `outline` visible | `a11y-results.json → tabOrder` |
| Menú móvil | **PASS** — `aria-expanded=true`, panel visible, **Escape cierra** y devuelve foco | `mobile-menu-open.jpg` |
| Movimiento reducido | **PASS** — `animation-duration: 1e-05s`, `scroll-behavior: auto` | JSON |
| Validación de formularios | **PASS** — 2 campos `aria-invalid`, 2 `role="alert"` en español | `login-validation.jpg` |
| Diálogos | **PASS (código)** — `Modal` y lightbox: `role="dialog"`, `aria-modal`, Escape, scroll lock, flechas | `components/ui/Modal.tsx`, `PropertyGallery.tsx` |

> Nota: la validación nativa del navegador sigue reportando `validationMessage` (el formulario usa `noValidate` para suprimir la UI nativa en inglés); la UI propia es la que se muestra y anuncia.

---

## 3. Lighthouse Accessibility

| Página | Antes | Después |
|--------|-------|---------|
| `/` | 100 | **100** |
| `/legal/accessibility` | 100 | **100** |
| `/auth/login` | 98 (skip-link) | **100** |

**Objetivo ≥95: CUMPLIDO.**

---

## 4. Contraste verificado (WCAG 2.2 AA)

| Combinación | Ratio | Uso |
|-------------|-------|-----|
| Slate / Ivory | 12.10 | Texto principal |
| Blanco / Forest | 6.29 | CTA, header |
| Slate / Amber | 6.39 | Botón acento |
| Forest / Ivory | 5.73 | Enlaces |
| Muted / Ivory | 5.10 | Texto secundario |
| Amber / Ivory | 1.89 | **Solo decorativo** (prohibido como texto) |

---

## 5. Implementado en esta fase

- Skip link global en las 18 vistas con `<main>` (`app/*` + `AuthShell`).
- Foco visible global (`:focus-visible`, 2 px forest, offset 2 px).
- `prefers-reduced-motion` respetado.
- Formularios con `label` explícito, `aria-invalid`, `aria-describedby`, `role="alert"`.
- Chips de rol con `aria-pressed`.
- Toasts con `role="status"` y `aria-live="polite"`.

---

## 6. Hallazgos abiertos (no bloqueantes)

| # | Severidad | Hallazgo | Acción sugerida |
|---|-----------|----------|-----------------|
| A1 | Media | Sin prueba con lector de pantalla real (NVDA/VoiceOver) | Ejecutar antes de go-live |
| A2 | Baja | Videos de propiedades sin subtítulos si el anfitrión no los aporta | Guía de publicación accesible |
| A3 | Baja | El `<main>` de páginas con backend (checkout/detalle) no se pudo auditar en runtime | Repetir axe con backend activo |

---

## Veredicto

**PASS** — 0 violaciones axe en 14 ejecuciones, Lighthouse Accessibility 100 en las 3 páginas medidas, todas las pruebas de interacción superadas.
