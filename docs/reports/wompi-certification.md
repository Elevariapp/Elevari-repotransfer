# WOMPI CERTIFICATION — Phase 3.5 (incluye REFUNDS)

**Fecha:** 2026-11-13
**Modo:** validación estática + aritmética de precios ejecutada. **Sin credenciales Wompi ni base de datos disponibles** en este entorno.
**Evidencia adicional:** `docs/reports/assets/money-fees-results.json` (5/5 PASS)

---

## 1. Resumen de ejecución

| Prueba | Método | Resultado |
|--------|--------|-----------|
| Aritmética base + tarifa = total | Ejecución real de `lib/tax-logic.ts` | **PASS (5/5)** |
| Transición de estados de pago | Revisión de `payment-state.ts` | **PASS (código)** |
| Transición de estados de reserva | Revisión de `booking-state.ts` | **PASS (código)** |
| Idempotencia de creación de pago | Revisión de `payments.ts` (`idempotency_key`, 409 cross-booking) | **PASS (código)** |
| Consistencia de monto en webhook | Revisión de `webhooks/wompi` | **PASS (código)** |
| Consistencia de moneda en webhook | Revisión + **fix aplicado** | **PASS (código, corregido)** |
| Firma de integridad (checkout) | Revisión `sha256(reference+amount+currency+secret)` | **PASS (código)** |
| Checksum de webhook | Revisión `sha256(props+timestamp+eventSecret)` | **PASS (código)** |
| Deduplicación de webhooks | `dedupe_key` persistido en `payment_events` | **PASS (código)** |
| Confirmación de reserva solo con PAID | `confirmPaymentSuccess` exige `succeeded` | **PASS (código)** |
| Pago fallido nunca confirma | `markPaymentFailed` no toca la reserva | **PASS (código)** |
| Pago aprobado sobre reserva cancelada | Marca `refund_required` y no confirma | **PASS (código)** |
| **Transacción real end-to-end** | Requiere llaves + webhook público | **NO EJECUTADO** |

---

## 2. Bug crítico encontrado y corregido

### Sobre-reembolso en reembolsos parciales

`refundWompiPayment` llamaba a `POST /transactions/{id}/void`, endpoint de Wompi que **reembolsa el 100% de la transacción y no acepta monto**. Se usaba también para reembolsos parciales, lo que habría devuelto más dinero del debido mientras la base registraba `partially_refunded` por el monto parcial (descuadre financiero).

**Corrección aplicada** (`api/src/lib/payments/wompi-provider.ts`, `api/src/lib/refund-payment.ts`):

```ts
if (params.amountMinor < params.fullAmountMinor) {
  return { refunded: false, pendingManual: true,
    reason: 'Partial refunds are not supported by the Wompi void API — process the partial amount manually in the Wompi dashboard' };
}
```

Resultado: los reembolsos parciales quedan en `pending_manual` (con registro en `payment_refunds`) en lugar de ejecutar un void total.

---

## 3. Refunds (Workstream 6)

| Caso | Comportamiento verificado | Resultado |
|------|--------------------------|-----------|
| Reembolso total | `void` + `payment.status=refunded` + evento `refund_refunded` | PASS (código) |
| Reembolso parcial | **Ahora** `pending_manual` (antes: void total) | PASS (corregido) |
| Suma de reembolsos > cobrado | Bloqueado: `Refund exceeds original charged amount` | PASS |
| Reembolso sin `externalId` | `pending_manual` con motivo | PASS |
| Sincronización de reserva | Reserva no cambia de estado; se registra `payment_refund` | PASS (código) |
| Trazabilidad | `payment_events` con `correlationId`, `refundId`, monto y `partial` | PASS |
| Reembolso real en sandbox | Requiere credenciales | NO EJECUTADO |

---

## 4. Evidencia de transacciones

| Dato | Valor |
|------|-------|
| Booking IDs | No disponibles (sin BD) |
| Payment IDs | No disponibles (sin BD) |
| Webhook evidence | No disponible (sin endpoint público) |
| Confirmation evidence | No disponible |

---

## 5. Riesgos abiertos

| # | Riesgo | Acción requerida |
|---|--------|------------------|
| W1 | No se ejecutó una transacción real ni en sandbox | Ejecutar con llaves `pub_test_`/`prv_test_` y registrar IDs en `verification-log.md` |
| W2 | El webhook requiere URL pública | Configurar en dashboard Wompi y verificar checksum con evento real |
| W3 | Reembolsos parciales son manuales por limitación del proveedor | Definir procedimiento operativo y SLA |
| W4 | `payment.metadata.webhook_raw` almacena el evento completo | Revisar retención y datos personales (ver observability) |

---

## Veredicto

**PASS (código y lógica)** con un bug crítico corregido.
**FAIL (end-to-end)** — no certificable sin credenciales, base de datos y webhook público.

**Este punto es bloqueante para producción.**
