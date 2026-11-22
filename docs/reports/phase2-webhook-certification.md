# PHASE 2 · WS6 — WEBHOOK CERTIFICATION

**Fecha:** 2026-11-13
**Evidencia ejecutada:** `foundation-logic-results.json` → suite `webhook-signature` (8/8 PASS)

## Pipeline

```
POST /api/v1/webhooks/wompi
  → verify signature (SHA-256)
  → dedupe (sha256(transactionId:status:timestamp))
  → lookup payment (reference | externalId)
  → validate amount
  → validate currency
  → confirm / fail
  → record payment_event
```

## Pruebas ejecutadas (criptografía real)

| Caso | Esperado | Resultado |
|------|----------|-----------|
| Firma válida | `true` | **PASS** |
| Monto alterado | `false` | **PASS** |
| Estado alterado | `false` | **PASS** |
| Secreto incorrecto | `false` | **PASS** |
| `signature.properties` ausente | `false` | **PASS** |
| `timestamp` ausente | `false` | **PASS** |
| Sin config Wompi (por defecto) | `false` | **PASS (endurecido)** |
| Sin config + `ALLOW_UNSIGNED_WEBHOOKS=true` | `true` | **PASS** |

## Validaciones en ruta

| Validación | Implementación | Resultado |
|------------|----------------|-----------|
| Firma | `verifyWompiWebhook` → 401 | PASS |
| Deduplicación | `dedupe_key` en `payment_events` | PASS |
| Monto | comparación con `charge_amount_minor` → 409 | PASS |
| Moneda | comparación con `payment.currency` → 409 | **PASS (añadido)** |
| Pago desconocido | 404 + log de advertencia | PASS |
| Replay | dedupe por `transactionId:status:timestamp` | PASS |
| Idempotencia de confirmación | `alreadyProcessed` | PASS |
| Rate limit | Webhooks exentos (allowlist) | **RIESGO** |

## Hallazgos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| W1 | Media | Webhooks sin rate limit (DoS por volumen) | Límite específico por IP en nginx/API |
| W2 | Media | Replay protegido por dedupe de BD, no por ventana temporal | Añadir validación de `timestamp` (±5 min) |
| W3 | Baja | Sin alerta cuando aumenta `webhook_amount_mismatch` | Métrica + alerta |

## Veredicto

**PASS (criptográfico y lógica)** — la verificación de firma y la detección de manipulación están demostradas por ejecución, no por inspección.
