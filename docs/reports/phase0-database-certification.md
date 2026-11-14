# PHASE 0 · WS2 — DATABASE CERTIFICATION

**Fecha:** 2026-11-13 · **Modo:** revisión de migraciones y modelo (sin instancia PostgreSQL)

## Inventario de migraciones

| # | Migración | Contenido |
|---|-----------|-----------|
| 1 | `20260625000000_init` | users, properties, media, bookings, payments, reviews, enums, FKs e índices |
| 2 | `20260625120000_add_password_hash` | credenciales |
| 3 | `20260625140000_add_invoicing` | `pending_invoices` |
| 4 | `20260716180000_availability_no_overlap` | `btree_gist` + `EXCLUDE` anti-solapamiento |
| 5 | `20260719190000_ota_calendar_sync` | feeds OTA + bloqueos por canal |
| 6 | `20261114000000_phase2_wompi` | `payment_refunds`, `payment_events`, `fx_quotes` |

## Integridad

| Control | Evidencia | Resultado |
|---------|-----------|-----------|
| Unicidad de email | `users_email_key` | PASS |
| Unicidad de slug | `properties_slug_key` | PASS |
| Idempotencia de reservas | `bookings_idempotency_key_key` (UNIQUE) | PASS |
| Idempotencia de pagos | `payments_idempotency_key_key` (UNIQUE) | PASS |
| Anti doble reserva | `EXCLUDE USING gist (property_id WITH =, daterange(start,end,'[)') WITH &&)` | **PASS** |
| Rango válido | `CHECK (end_date > start_date)` | PASS |
| FKs con política explícita | RESTRICT en bookings/payments; CASCADE en media/eventos | PASS |
| Índices de consulta caliente | property+status, booking+status, payment+created_at, correlation_id | PASS |
| Transacciones | `confirmPaymentSuccess` y cancelación usan `prisma.$transaction` | PASS (código) |
| Rollback de migraciones | Prisma `migrate resolve` documentado; sin prueba ejecutada | **BLOCKED** |
| Migración ejecutada | `api:migrate` requiere Postgres | **BLOCKED** |
| Rendimiento de consultas | Requiere `EXPLAIN ANALYZE` con datos | **BLOCKED** |

## Hallazgos

| # | Severidad | Hallazgo |
|---|-----------|----------|
| D1 | Media | No hay script de `prisma migrate resolve` documentado para rollback de una migración fallida |
| D2 | Baja | `availability_blocks` excluye solapes por `property_id`, no por unidad (no existe modelo de unidades) — coherente con el alcance actual |

## Veredicto

**NO CERTIFICADO (runtime)** — el diseño de integridad es **sólido** (incluye anti doble reserva a nivel de base de datos). La ejecución de migraciones, seeds y pruebas de rendimiento requiere una instancia PostgreSQL.
