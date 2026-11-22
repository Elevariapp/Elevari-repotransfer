# PHASE 2 · WS1 — API CONTRACT CERTIFICATION

**Fecha:** 2026-11-13 · **Modo:** inventario y revisión del contrato (sin API en ejecución)

## Inventario de rutas (prefijo `/api/v1`)

| Grupo | Rutas | Auth |
|-------|-------|------|
| Health | `GET /health` | pública |
| Propiedades | `GET /properties`, `GET /properties/:slug` | pública |
| Reservas | `POST /bookings/quote`, `POST /bookings`, `GET /bookings/:id`, `POST /bookings/:id/cancel` | mixta (JWT en mutaciones) |
| Pagos | `POST /payments/intent`, `POST /payments/:id/sync`, `GET /payments/:id/timeline`, `POST /payments/:id/refund` | JWT (+ admin en refund) |
| Webhooks | `POST /webhooks/wompi` | firma |
| Media | `POST /media/upload`, `GET /media/property/:id`, `DELETE /media/:id` | JWT host |
| Host | `GET /host/:hostId/properties` | JWT host |
| Admin | `GET /admin/*`, `POST /admin/invoices/:id/retry` | JWT admin |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me` | mixta |

## Contrato verificado

| Elemento | Implementación | Resultado |
|----------|----------------|-----------|
| Validación de entrada | Zod en cada ruta | PASS |
| Errores | `{ error, code?, details? }` consistente | PASS |
| Paginación | `limit`/`offset` con límites | PASS |
| Autenticación | JWT Bearer (`authenticate`) | PASS |
| Autorización | Rol verificado en servidor (host/admin) | PASS |
| Idempotencia | `idempotency_key` obligatoria en reservas y pagos | PASS |
| Versionado | Prefijo `/api/v1` | PASS |
| Compatibilidad | Sin deprecaciones aún | N/A |
| CORS | Allowlist explícita | PASS |
| Rate limit | 120/min global | PASS |

## Pruebas ejecutadas sobre el contrato

| Prueba | Resultado |
|--------|-----------|
| Idempotency key de otra reserva → 409 | PASS (código) |
| Monto de reserva inválido → 400 | PASS (código) |
| Refund sin rol admin → 403 | PASS (código) |
| Webhook sin firma → 401 | PASS (código + test criptográfico) |
| Webhook con monto alterado → 409 | PASS (código + test) |
| Webhook con moneda distinta → 409 | **PASS (añadido)** |

## Hallazgos

| # | Severidad | Hallazgo |
|---|-----------|----------|
| API1 | Media | Sin OpenAPI/Swagger publicado |
| API2 | Baja | Sin cabecera de versión en respuestas |
| API3 | Media | Sin pruebas de contrato automatizadas (schemas) en CI |

## Veredicto

**PASS (contrato)** — rutas, validación, auth, autorización e idempotencia verificadas por código y 50 aserciones ejecutadas. Falta documentación OpenAPI.
