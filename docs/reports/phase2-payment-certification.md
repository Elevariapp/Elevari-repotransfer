# PHASE 2 · WS5 — PAYMENTS CERTIFICATION

**Fecha:** 2026-11-13 · **Proveedor:** Wompi (único activo)

## Matriz de estados y resultados

| Escenario | Mecanismo | Resultado |
|-----------|-----------|-----------|
| Pago iniciado | `POST /payments/intent` → checkout URL firmado | PASS (código) |
| Pago aprobado | webhook `APPROVED` → `confirmPaymentSuccess` | PASS (código + firma verificada) |
| Pago fallido | `markPaymentFailed`, reserva intacta | PASS (código) |
| Pago rechazado (`DECLINED/ERROR/VOIDED`) | sync → `failed` | PASS (código) |
| Pago expirado | Job de expiración de reservas pendientes | PASS (código, no ejecutado) |
| Pago duplicado | `payment.status === succeeded` → `alreadyProcessed` | PASS (código) |
| Pago aprobado tras cancelación | `refund_required = true` | PASS (código) |
| Transacción real sandbox/producción | Requiere credenciales | **NO EJECUTADO** |

## Integración con el proveedor

| Elemento | Verificación | Resultado |
|----------|--------------|-----------|
| URL de checkout | `checkout.wompi.co` con `public-key`, `amount-in-cents`, `currency`, `reference`, `signature:integrity` | PASS (código) |
| Firma de integridad | `sha256(reference + amount + currency + integritySecret)` | PASS (código) |
| Sync por referencia | `GET /transactions?reference=` | PASS (código) |
| Entorno | Derivado del prefijo de la llave | PASS (ejecutado) |
| Config parcial | Aborta el arranque | **PASS (ejecutado)** |
| Llaves mezcladas | Aborta el arranque | **PASS (ejecutado)** |

## Montos y moneda

| Verificación | Resultado |
|--------------|-----------|
| Cargo siempre en COP | PASS |
| Monto en centavos (enteros) | PASS (`money.ts`) |
| Monto del webhook == monto congelado | PASS (código) |
| Moneda del webhook == moneda del pago | **PASS (añadido)** |

## Hallazgos

| # | Severidad | Hallazgo |
|---|-----------|----------|
| PM1 | **Alta** | Sin transacción real verificada (sandbox o producción) |
| PM2 | Media | `syncWompiPayment` no compara el monto devuelto con el esperado antes de confirmar (el webhook sí lo hace) |
| PM3 | Baja | Sin reintentos con backoff en el sync |

## Veredicto

**PASS (integración y lógica)** / **NO CERTIFICADO (E2E)** — PM1 es bloqueante para producción.
