# ANALYTICS CERTIFICATION — Phase 3.5

**Fecha:** 2026-11-13
**Arnés:** `scripts/certification/analytics-audit.mjs`
**Evidencia:** `docs/reports/assets/analytics-results.json`
**Fuente:** `lib/analytics.ts` (ejecutado con `window` instrumentado)

---

## 1. Resultado

**9/9 casos PASS.**

| Evento | Destino | Payload verificado | Resultado |
|--------|---------|--------------------|-----------|
| `view_property` | GA4 `view_property` + `view_item`, Meta `ViewContent` | `item_id`, `item_slug`, `item_name`, `value`, `currency=COP` | PASS |
| `select_dates` | GA4 `select_dates` | `property_id`, `check_in`, `check_out`, `nights` | PASS |
| `view_quote` | GA4 `view_quote` | `property_id`, `nights`, `value`, `available` | PASS |
| `start_checkout` | GA4 `start_checkout` + `begin_checkout`, Meta `InitiateCheckout` | `transaction_id`, `value`, `currency` | PASS |
| `payment_started` | GA4 `payment_started` + `add_payment_info`, Meta `AddPaymentInfo` | `transaction_id`, `value`, `payment_provider`, `payment_mode` | PASS |
| `payment_completed` | GA4 `payment_completed` + `purchase`, Meta `Purchase` | `transaction_id`, `value` | PASS |
| `booking_confirmed` | GA4 `booking_confirmed` + `purchase` | `transaction_id`, `value` | PASS |
| `checkout_abandoned` | GA4 `checkout_abandoned` | `transaction_id`, `value`, `reason` | PASS |
| Sin claves configuradas | — | 0 eventos emitidos (no-op) | PASS |

Integridad adicional: **todos los valores del payload son primitivos** (string/number/boolean) — GA4 rechaza objetos.

---

## 2. Deduplicación (verificación de código)

| Evento | Mecanismo | Evidencia |
|--------|-----------|-----------|
| `view_property` | `useRef` en `PropertyViewTracker` | una emisión por montaje |
| `view_quote` | firma `check_in\|check_out\|guests` en `BookingWidget` | no repite en re-render |
| `payment_completed` / `booking_confirmed` | `purchaseTracked` en `CheckoutSuccessClient` | una emisión por reserva |
| `checkout_abandoned` | `paymentStartedRef` + flag local | no se emite si ya se inició pago |

---

## 3. Puntos de emisión

| Evento | Componente | Línea de referencia |
|--------|-----------|---------------------|
| `view_property` | `components/analytics/PropertyViewTracker.tsx` | `analytics.viewProperty` |
| `select_dates` | `components/booking/BookingWidget.tsx` | `handleRangeSelect` |
| `view_quote` | `components/booking/BookingWidget.tsx` | `fetchQuote` |
| `start_checkout` | `components/checkout/CheckoutClient.tsx` | efecto de montaje |
| `payment_started` | `components/checkout/CheckoutClient.tsx` | `startPayment` |
| `payment_completed` | `components/checkout/CheckoutSuccessClient.tsx` | sync confirmado |
| `booking_confirmed` | `components/checkout/CheckoutSuccessClient.tsx` | sync confirmado |
| `checkout_abandoned` | `components/checkout/CheckoutClient.tsx` | `visibilitychange` / desmontaje |

---

## 4. Limitaciones

| # | Limitación | Impacto | Acción |
|---|-----------|---------|--------|
| AN1 | No se validó en GA4 DebugView ni Meta Events Manager | No se verifica recepción real ni atribución | Requiere IDs de staging y acceso a dashboards |
| AN2 | `purchase` se emite dos veces en GA4 (desde `payment_completed` y `booking_confirmed`) | Posible doble conteo de conversiones | Decidir si GA4 debe mapear solo uno; Meta solo recibe `Purchase` una vez |
| AN3 | Sin tests E2E del embudo con backend | No se verificó la secuencia completa en runtime | Ejecutar con API + DB (mock mode) |

> **AN2 es el hallazgo accionable**: se documenta como mejora High. No se corrigió porque la elección de qué evento mapear a `purchase` es una decisión de medición de negocio.

---

## Veredicto

**PASS (código y payloads)** con 9/9 casos.
**PENDIENTE** la verificación en los dashboards de GA4/Meta.
