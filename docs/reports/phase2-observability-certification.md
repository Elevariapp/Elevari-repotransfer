# PHASE 2 · WS9 — OBSERVABILITY CERTIFICATION

**Fecha:** 2026-11-13

## Eventos de dominio

| Evento | Registro | Resultado |
|--------|----------|-----------|
| Booking Created | `bookingEvent` | PASS |
| Booking Updated | `bookingEvent` (transiciones) | PASS |
| Payment Started | `payment_events` | PASS |
| Payment Confirmed | `payment_events` (`payment_paid`) | PASS |
| Payment Failed | `payment_events` (`payment_failed`) | PASS |
| Payment Refunded | `payment_events` (`refund_*`) | PASS |
| Webhook Received | `payment_events` | PASS |
| Webhook Processed | `payment_events` (`webhook_applied`) | PASS |
| Webhook Amount/Currency Mismatch | `payment_events` | **PASS (añadido)** |
| Booking Confirmed | `bookingEvent` | PASS |
| Quote Generated | `payment_events` / logs | PASS |
| Analytics Events | GA4/Meta (9/9 payloads) | PASS |

## Correlación

| Control | Antes | Después |
|---------|-------|---------|
| Request ID | inexistente | `genReqId` + `x-request-id` |
| Propagación desde nginx | no | `X-Request-Id $request_id` |
| Correlation ID de pago | propio (`newCorrelationId`) | propio (sin enlazar a `req.id`) |
| Timeline por pago | `GET /payments/:id/timeline` | PASS |

## Logs

| Control | Resultado |
|---------|-----------|
| Estructurados (Pino/JSON) | PASS |
| Nivel configurable (`LOG_LEVEL`) | PASS |
| Redacción de `authorization`/`cookie`/`set-cookie`/`x-wompi-signature` | **PASS (nuevo)** |
| Sin secretos | PASS (escaneo) |
| Sin PII en logs de email | **PASS (corregido)** |
| Error tracking (Sentry) | **GAP** |
| Alertas | **GAP** |

## Hallazgos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| O1 | Media | `correlationId` de pago no enlazado a `req.id` | Pasar `request.id` a `recordPaymentEvent` |
| O2 | Alta | Sin Sentry/uptime/alertas | Provisionar (infraestructura) |
| O3 | Media | Sin retención definida para `webhook_raw` | Política de retención |

## Veredicto

**PASS (código)** — cobertura de eventos completa y logs seguros. La operación (alertas, error tracking) requiere infraestructura.
