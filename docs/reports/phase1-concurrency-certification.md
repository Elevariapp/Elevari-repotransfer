# PHASE 1 · WS4 — CONCURRENCY & DOUBLE-BOOKING CERTIFICATION

**Fecha:** 2026-11-13 · **Modo:** revisión de diseño + evidencia de esquema (sin base de datos)

## Estado

**NO EJECUTADO en runtime.** Las pruebas de concurrencia requieren PostgreSQL (bloqueos y transacciones reales).

## Defensas existentes (verificadas en esquema y código)

| Capa | Defensa | Evidencia |
|------|---------|-----------|
| Base de datos | `EXCLUDE USING gist (property_id WITH =, daterange(start_date, end_date, '[)') WITH &&)` | migración `20260716180000_availability_no_overlap` |
| Base de datos | `CHECK (end_date > start_date)` | misma migración |
| Base de datos | `UNIQUE (idempotency_key)` en `bookings` | migración init |
| Aplicación | `createBookingWithAvailabilityBlock` en una transacción | `api/src/routes/bookings.ts` |
| Aplicación | `isAvailabilityConflictError` → 409 controlado | `bookings.ts` |
| Aplicación | Reintento con la misma `idempotency_key` devuelve la reserva existente | `bookings.ts` |

## Semántica de fechas

`[start, end)` — el día de check-out queda libre para el siguiente huésped. Coherente entre base de datos y aplicación.

## Escenarios a validar (pendientes)

| # | Escenario | Resultado esperado | Estado |
|---|-----------|--------------------|--------|
| 1 | Dos sesiones reservan las mismas fechas | 1 confirmada + 1 rechazada (409) | BLOCKED |
| 2 | 10 reservas simultáneas sobre la misma propiedad/fechas | Exactamente 1 confirmada | BLOCKED |
| 3 | Reserva adyacente (check-out = check-in) | Permitida | BLOCKED |
| 4 | Reserva solapada por 1 día | Rechazada | BLOCKED |
| 5 | Reintento con misma idempotency key | Devuelve la misma reserva, sin duplicar | BLOCKED |
| 6 | Cancelación + re-reserva inmediata | Disponibilidad liberada y reutilizable | BLOCKED |

## Riesgo residual

| # | Riesgo | Detalle | Mitigación |
|---|--------|---------|-----------|
| CC1 | **Alto (no verificado)** | La protección existe en esquema, pero no se ha demostrado bajo carga real | Ejecutar escenarios 1–6 en staging |
| CC2 | Medio | `EXCLUDE` puede degradar escrituras con alta concurrencia | Medir en prueba de carga |
| CC3 | Bajo | No hay cola de reservas ni bloqueo optimista explícito | Evaluar si la contención lo exige |

## Veredicto

**NO CERTIFICADO** — el diseño es correcto y la restricción de base de datos es la adecuada, pero la certificación de concurrencia exige ejecución real. No se puede declarar "sin doble reserva" solo por inspección.
