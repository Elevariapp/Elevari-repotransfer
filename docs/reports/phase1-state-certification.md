# PHASE 1 · WS3 — STATE MACHINE CERTIFICATION

**Fecha:** 2026-11-13
**Fuente:** `api/src/lib/payments/payment-state.ts`, `api/src/lib/booking-state.ts`
**Ejecución:** 23 aserciones reales (`foundation-logic-audit.mjs`)

## Payment state machine — 15/15 PASS

| Verificación | Resultado |
|--------------|-----------|
| `pending → processing / succeeded / failed` | PASS |
| `processing → succeeded` | PASS |
| `succeeded → partially_refunded` | PASS |
| `partially_refunded → refunded` | PASS |
| `failed → succeeded` bloqueado | PASS |
| `refunded → succeeded` bloqueado | PASS |
| `succeeded → pending` bloqueado | PASS |
| Terminales: `failed`, `refunded` | PASS |
| `isPaidStatus`: solo `succeeded`/`partially_refunded`/`refunded` | PASS |
| Idempotencia (`succeeded → succeeded`) no lanza | PASS |
| Transición inválida lanza error | PASS |

## Booking state machine — 8/8 PASS

Cubierto en `phase1-reservation-certification.md`.

## Duplicados y acciones repetidas

| Escenario | Mecanismo | Resultado |
|-----------|-----------|-----------|
| Doble webhook del mismo evento | `dedupe_key` en `payment_events` | PASS (código) |
| Doble confirmación de pago | `payment.status === 'succeeded'` → `alreadyProcessed` | PASS (código) |
| Doble creación de reserva | `idempotency_key` UNIQUE + 409 cross-booking | PASS (código) |
| Doble reembolso | Suma de `payment_refunds` vs monto original | PASS (código) |

## Estados huérfanos / consistencia

| Riesgo | Control |
|--------|---------|
| Pago `succeeded` con reserva `cancelled` | `refund_required` + evento `confirmed_after_cancel` |
| Reserva `confirmed` sin pago | Imposible: solo `confirmPaymentSuccess` la confirma |
| Bloqueo de disponibilidad sin reserva | FK `availability_blocks.booking_id` con `ON DELETE SET NULL` |

## No ejecutado

- Carreras reales entre transacciones (ver WS4).
- Reconciliación automática de estados inconsistentes (no existe job).

## Veredicto

**PASS (lógica)** — máquinas de estado correctas, transiciones ilegales bloqueadas y operaciones idempotentes por diseño.
