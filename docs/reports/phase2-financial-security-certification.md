# PHASE 2 · WS8 — FINANCIAL SECURITY CERTIFICATION

**Fecha:** 2026-11-13

## Amenazas y controles

| Amenaza | Vector | Control | Resultado |
|---------|--------|---------|-----------|
| Evento duplicado | Reenvío del mismo webhook | `dedupe_key` (tx:status:timestamp) | PASS |
| Replay attack | Reenvío con timestamp distinto | dedupe + firma; **sin ventana temporal** | PARCIAL |
| Manipulación de monto | Webhook alterado | Firma SHA-256 + comparación de monto | **PASS (ejecutado)** |
| Manipulación de estado | Webhook alterado | Firma invalida el payload | **PASS (ejecutado)** |
| Webhook sin firma | Endpoint público | 401 salvo opt-in explícito | **PASS (endurecido)** |
| Moneda distinta | Webhook manipulado | Comparación con `payment.currency` | **PASS (añadido)** |
| Estado inválido | Secuencia de pagos | Máquina de estados (15/15) | PASS |
| Fallo del proveedor | Timeout/5xx | Sync manual + estado pendiente | PASS (parcial) |
| Recuperación tras timeout | Reintento del cliente | `idempotency_key` | PASS |
| Sobre-reembolso | Refund parcial | Guard + suma de reembolsos | **PASS (corregido)** |
| Doble cobro | Dos `intent` para la misma reserva | `idempotency_key` UNIQUE | PASS |
| Confirmación sin pago | Forzar estado | Solo `succeeded` confirma | PASS |

## Escenarios ejecutados

- 8/8 pruebas de firma y manipulación (criptografía real).
- 15/15 transiciones de pago.
- Guard de reembolso parcial.

## Hallazgos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| FS1 | Media | Sin ventana temporal en webhooks (replay fuera de dedupe) | Rechazar `timestamp` > 5 min |
| FS2 | Media | Sin alertas ante picos de `webhook_amount_mismatch` | Métrica + alerta |
| FS3 | Media | Sin reconciliación diaria pagos↔reservas | Job de conciliación |
| FS4 | Baja | Sin límite de importe por transacción | Regla de negocio + validación |

## Veredicto

**PASS (controles críticos)** — manipulación, duplicados, doble cobro y sobre-reembolso están cubiertos y probados. Replay temporal y conciliación quedan como mejoras.
