# PHASE 1 · WS6 — ACCESSIBILITY CERTIFICATION

**Fecha:** 2026-11-13 · **Objetivo:** ≥ 95

## Resultado

| Herramienta | Alcance | Resultado |
|-------------|---------|-----------|
| axe-core (WCAG 2.0/2.1/2.2 A+AA) | 7 rutas × 2 viewports = 14 ejecuciones | **0 violaciones** |
| Lighthouse Accessibility | home / legal / login | **100 / 100 / 100** |
| Skip link | primer Tab | PASS (visible, outline 2 px forest) |
| Orden de foco | 12 elementos | PASS (todos con outline) |
| Diálogo (menú móvil) | abrir/Escape | PASS (cierra y devuelve foco) |
| Movimiento reducido | `prefers-reduced-motion` | PASS (1e-05 s, scroll auto) |
| Validación de formularios | login vacío | PASS (2 `aria-invalid`, 2 `role="alert"`) |
| Lectura con lector de pantalla | NVDA/VoiceOver | **NO EJECUTADO** |

## Correcciones aplicadas en el programa

| Regla | Antes | Después |
|-------|-------|---------|
| `color-contrast` (chip activo) | 1.12 | 6.29 |
| `label-content-name-mismatch` (logo) | fallo | PASS |
| `skip-link` (auth) | fallo | PASS |
| Menú móvil con Escape | no cerraba | cierra + foco |
| Validación de formularios | nativa EN | inline ES + ARIA |

## Cobertura por criterio

| Criterio | Estado |
|----------|--------|
| 1.4.3 Contraste (mínimo) | PASS |
| 2.1.1 Teclado | PASS |
| 2.4.1 Evitar bloques | PASS (skip link) |
| 2.4.7 Foco visible | PASS |
| 2.5.8 Tamaño de objetivo (mín. 24 px) | PASS (44 px) |
| 3.3.1 Identificación de errores | PASS |
| 3.3.3 Sugerencia de error | PASS |
| 4.1.2 Nombre, rol, valor | PASS |
| 2.2.2 Pausar/Detener | PASS (reduced motion) |

## Pendiente

| # | Item | Motivo |
|---|------|--------|
| A1 | Lectura con NVDA/VoiceOver | Requiere sesión manual |
| A2 | Checkout y detalle con datos reales | Sin backend |
| A3 | Subtítulos en videos de anfitriones | Depende de contenido |

## Veredicto

**PASS** — objetivo ≥95 cumplido con 100 en las tres páginas medidas y 0 violaciones axe.
