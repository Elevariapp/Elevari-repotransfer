# PHASE 1 · WS2 — RESERVATION LIFECYCLE CERTIFICATION

**Fecha:** 2026-11-13
**Evidencia ejecutada:** `docs/reports/assets/foundation-logic-results.json` (booking-state, 8 casos)

## Máquina de estados

```
draft → pending_payment → confirmed → checked_in → completed
   ↘           ↘              ↘            ↘
              cancelled      cancelled    cancelled
```

## Transiciones permitidas (ejecutadas contra el código real)

| Desde | Hacia | Resultado |
|-------|-------|-----------|
| draft | pending_payment | PASS |
| pending_payment | confirmed | PASS |
| confirmed | checked_in | PASS |
| checked_in | completed | PASS |
| draft / pending_payment / confirmed / checked_in | cancelled | PASS (código) |

## Transiciones rechazadas (ejecutadas)

| Intento | Resultado |
|---------|-----------|
| confirmed → completed (sin check-in) | PASS (rechazada) |
| completed → confirmed | PASS (rechazada) |
| cancelled → confirmed | PASS (rechazada) |
| `assertTransition` inválida | PASS (lanza error) |

## Reglas de negocio verificadas

| Regla | Evidencia |
|-------|-----------|
| Solo un pago `succeeded` confirma la reserva | `confirm-payment.ts` + payment-state (PASS) |
| Pago fallido nunca confirma | `markPaymentFailed` no toca `booking.status` (PASS) |
| Pago aprobado sobre reserva cancelada | Marca `refund_required` y no confirma (PASS) |
| Cancelación libera disponibilidad | `availabilityBlock.deleteMany` en transacción (PASS código) |
| Eventos de auditoría por transición | `bookingEvent` con `fromStatus`/`toStatus` (PASS) |

## No ejecutado

| Prueba | Motivo |
|--------|--------|
| Ciclo real con base de datos | Sin PostgreSQL |
| Expiración de reservas pendientes (job) | Requiere runtime |
| Check-in / check-out reales | Requieren datos y fechas |

## Veredicto

**PASS (lógica)** — 8/8 aserciones ejecutadas sobre el código de producción. El ciclo completo con persistencia queda pendiente de staging.
