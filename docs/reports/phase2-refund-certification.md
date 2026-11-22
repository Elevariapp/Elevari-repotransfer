# PHASE 2 · WS7 — REFUND CERTIFICATION

**Fecha:** 2026-11-13
**Evidencia ejecutada:** `foundation-logic-results.json` → `refund.partial.pending_manual` (PASS)

## Matriz

| Caso | Comportamiento | Resultado |
|------|----------------|-----------|
| Reembolso total | `void` en Wompi + `payment.status = refunded` | PASS (código) |
| Reembolso parcial | **`pending_manual`** (no se ejecuta `void`) | **PASS (corregido + ejecutado)** |
| Suma de reembolsos > cobrado | Bloqueado (`Refund exceeds original charged amount`) | PASS (código) |
| Pago no `succeeded` | `skipped` | PASS (código) |
| Monto 0 o negativo | `skipped` | PASS (código) |
| Sin `externalId` | `pending_manual` con motivo | PASS (código) |
| Duplicado | Verificación por suma de `payment_refunds` | PASS (código) |
| Sincronización de pago | `partially_refunded` → `refunded` | PASS (máquina de estados) |
| Sincronización de reserva | Reserva no cambia de estado; se registra evento | PASS (código) |
| Trazabilidad | `payment_events` con `refundId`, monto, `partial` | PASS (código) |
| Reembolso real | Requiere credenciales | **NO EJECUTADO** |

## Bug corregido (crítico)

`refundWompiPayment` usaba `/void` (reembolso del 100%) también para importes parciales, ignorando el monto. Ahora:

```ts
if (params.amountMinor < params.fullAmountMinor) {
  return { refunded: false, pendingManual: true, reason: 'Partial refunds are not supported…' };
}
```

Sin este fix, un reembolso parcial habría devuelto **más dinero del debido** mientras la base registraba un importe menor.

## Hallazgos abiertos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| RF1 | Alta | Los reembolsos parciales son manuales (limitación del proveedor) | Procedimiento operativo + SLA documentado |
| RF2 | Media | Sin reembolso automático cuando el pago llega tras cancelación (`refund_required`) | Job que ejecute el reembolso y notifique |
| RF3 | Media | Sin prueba de reembolso real | Ejecutar en sandbox y registrar IDs |

## Veredicto

**PASS (lógica)** con bug crítico corregido / **NO CERTIFICADO (E2E)**.
