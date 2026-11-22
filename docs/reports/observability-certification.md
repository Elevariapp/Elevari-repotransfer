# OBSERVABILITY CERTIFICATION — Phase 3.5

**Fecha:** 2026-11-13
**Alcance:** logs estructurados, correlación, redacción de secretos, eventos de dominio.

---

## 1. Matriz de eventos

| Evento requerido | Dónde se registra | Estado |
|------------------|-------------------|--------|
| Booking Created | `bookingEvent` + `recordBookingEvent` | PASS (código) |
| Booking Updated | `bookingEvent` en transiciones | PASS (código) |
| Payment Started | `payment_events` (`payment_created`/`payment_started`) | PASS (código) |
| Payment Confirmed | `payment_events` (`payment_paid`) | PASS (código) |
| Payment Failed | `payment_events` (`payment_failed`) | PASS (código) |
| Payment Refunded | `payment_events` (`refund_refunded`) | PASS (código) |
| Webhook Received | `payment_events` (`webhook_received`) | PASS (código) |
| Webhook Processed | `payment_events` (`webhook_applied`) | PASS (código) |
| Booking Confirmed | `bookingEvent` `pending_payment → confirmed` | PASS (código) |
| Quote Generated | `recordPaymentEvent`/logs de cotización | PASS (código) |
| Analytics Events | `lib/analytics.ts` → GA4/Meta | PASS (9/9 payloads) |

> Verificación estática: no hay base de datos ni API en ejecución en este entorno, por lo que no se pudieron leer logs reales.

---

## 2. Correlación

| Antes | Después |
|-------|---------|
| Fastify `logger: true` sin `genReqId` | `genReqId` usa `x-request-id` entrante o genera UUID |
| Sin `requestIdHeader` | `requestIdHeader: 'x-request-id'` |
| `correlationId` propio en eventos de pago | Se mantiene; **pendiente** enlazarlo al request id |

**Hallazgo O1 (Media):** los eventos de pago generan su propio `correlationId` con `newCorrelationId()`, pero no lo vinculan al `req.id` de Fastify. Hoy se puede rastrear el pago, no la petición HTTP que lo originó.

**Recomendación:** pasar `request.id` a `recordPaymentEvent` en las rutas.

---

## 3. Redacción de secretos

| Elemento | Estado |
|----------|--------|
| `Authorization` header | **Redactado** (`[redacted]`) |
| `Cookie` header | **Redactado** |
| `Set-Cookie` | **Redactado** |
| `x-wompi-signature` | **Redactado** |
| Llaves Wompi en logs | No se registran (solo modo/entorno) |
| Contraseñas/tokens en logs | No se registran |

---

## 4. Datos personales

| Hallazgo | Severidad | Estado |
|----------|-----------|--------|
| `sendEmail` registraba `to`, `text` y `html` completos en desarrollo | Media | **Corregido** — se enmascara el email y se omiten cuerpos |
| `payment.metadata.webhook_raw` guarda el evento Wompi completo | Baja | Documentado; revisar retención y minimización |
| `console.log('[invoicing] Alegra invoice issued', { bookingId, invoiceId })` | — | Aceptable (sin PII) |

---

## 5. Niveles y formato

- `LOG_LEVEL` configurable (default `info`).
- Formato JSON de Pino (Fastify) — compatible con agregadores (Loki/Datadog/CloudWatch).
- Sin logger centralizado ni alertas configuradas: **fuera del repositorio** (infraestructura).

---

## 6. Gaps restantes

| # | Gap | Prioridad |
|---|-----|-----------|
| O1 | `correlationId` de pago no enlazado a `req.id` | Media |
| O2 | Sin agregador ni alertas (Sentry/uptime) | Alta (infra) |
| O3 | Sin retención definida para `webhook_raw` | Media (legal/ops) |

---

## Veredicto

**PASS (código)** con mejoras aplicadas en redacción y correlación.
**PENDIENTE** la verificación con infraestructura real de logs y alertas.
