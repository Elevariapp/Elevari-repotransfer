# PHASE 2 · WS2 — BOOKING INTEGRITY CERTIFICATION

**Fecha:** 2026-11-13

## Controles verificados

| Control | Implementación | Resultado |
|---------|----------------|-----------|
| Creación transaccional | `createBookingWithAvailabilityBlock` en una transacción | PASS |
| Bloqueo de disponibilidad | Fila en `availability_blocks` por reserva | PASS |
| Anti-solapamiento | `EXCLUDE` gist en base de datos | PASS (esquema) |
| Idempotencia | `idempotency_key` UNIQUE + devolución de la existente | PASS |
| Conflicto controlado | `isAvailabilityConflictError` → 409 | PASS |
| Liberación al cancelar | `availabilityBlock.deleteMany` dentro de transacción | PASS |
| Sincronización con pago | Solo `confirmPaymentSuccess` cambia a `confirmed` | PASS |
| Auditoría | `bookingEvent` por transición | PASS |

## Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `draft → pending_payment` permitido | PASS |
| `pending_payment → confirmed` permitido | PASS |
| `confirmed → completed` bloqueado | PASS |
| `cancelled → confirmed` bloqueado | PASS |
| Pago fallido no confirma | PASS (código) |
| Pago aprobado sobre cancelada → `refund_required` | PASS (código) |

## No ejecutado

| Prueba | Motivo |
|--------|--------|
| Creación real con persistencia | Sin PostgreSQL |
| Carrera de reservas simultáneas | Sin PostgreSQL |
| Expiración de pendientes | Requiere job en runtime |

## Hallazgos

| # | Severidad | Hallazgo | Acción |
|---|-----------|----------|--------|
| B1 | Alta | Integridad de reservas no probada bajo concurrencia real | Ver `phase1-concurrency-certification.md` |
| B2 | Media | Sin job de reconciliación de reservas/pagos huérfanos | Añadir tarea periódica |
| B3 | Baja | Sin modelo de unidades (solo por propiedad) | Fase futura si aplica |

## Veredicto

**PASS (código)** / **NO CERTIFICADO (runtime)** — la integridad está diseñada y probada a nivel de lógica; falta ejecución con base de datos.
