# PHASE 1 · WS5 — UX CERTIFICATION

**Fecha:** 2026-11-13
**Evidencia:** 63 capturas (7 viewports) + métricas automáticas

## Cobertura medida

| Viewport | Rutas | Overflow | Alt faltante | Controles sin nombre |
|----------|-------|----------|--------------|----------------------|
| 360×800 | 9 | 0 | 0 | 0 |
| 390×844 | 9 | 0 | 0 | 0 |
| 768×1024 | 9 | 0 | 0 | 0 |
| 1024×768 | 9 | 0 | 0 | 0 |
| 1366×768 | 9 | 0 | 0 | 0 |
| 1440×900 | 9 | 0 | 0 | 0 |
| 1920×1080 | 9 | 0 | 0 | 0 |

## Flujos verificados

| Flujo | Verificación | Resultado |
|-------|--------------|-----------|
| Home → búsqueda | Barra visible sin scroll en 390×844 (top 513, CTA 720) | **PASS** |
| Búsqueda → resultados | Query string construida con ciudad/huéspedes/fechas | PASS (código) |
| Resultados → detalle | `PropertyCard` enlaza por slug | PASS |
| Detalle → reserva | Widget con calendario, cotización y CTA | PASS (código) |
| Checkout | Stepper, desglose, aviso de moneda | PASS (código) |
| Confirmación | Estado real + próximos pasos | PASS (código) |
| 404 | Marca + 2 CTAs + ayuda | **PASS (rediseñado)** |
| Legal | Ritmo editorial y jerarquía | **PASS (mejorado)** |

## Manejo de errores

| Caso | Comportamiento |
|------|----------------|
| API caída en listado | Panel `role="alert"` con acción de reintento/volver |
| Fechas inválidas | Mensaje inline + `role="alert"` |
| Fechas no disponibles | Aviso ámbar con sugerencia |
| Login inválido | Errores por campo con `aria-invalid` + resumen |
| Pago fallido | Toast de error + estado de reserva sin confirmar |

## Hallazgos

| # | Severidad | Hallazgo | Estado |
|---|-----------|----------|--------|
| U1 | Alta | Búsqueda fuera del viewport en móvil | **Corregido** |
| U2 | Media | Validación nativa en inglés | **Corregido** |
| U3 | Media | Sin ordenación/paginación visible en listado | Abierto |
| U4 | Baja | Sin swipe en galería móvil | Abierto |
| U5 | Baja | Detalle/checkout no medidos sin backend | Bloqueado |

## Veredicto

**PASS (medido)** en las 9 rutas estáticas; **PENDIENTE** en las pantallas que dependen de API/DB.
