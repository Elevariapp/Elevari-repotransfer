# PHASE 2 · WS4 — FX CERTIFICATION

**Fecha:** 2026-11-13
**Evidencia:** `foundation-logic-results.json` (suites `fx` y `disclosure`)

## Reglas

| Regla | Implementación | Resultado |
|-------|----------------|-----------|
| CO → display COP / charge COP | `fx.ts` | PASS |
| Internacional → display USD / **charge COP** | `fx.ts` | PASS |
| Tasa configurable (`FX_COP_USD_RATE`) | `fx-rate.ts` | PASS |
| Default 4000 COP/USD | `getCopUsdRate` | **PASS (ejecutado)** |
| Tasa inválida (0, NaN) → error | `getCopUsdRate` | **PASS (ejecutado)** |
| TTL default 15 min | `quoteTtlMinutes` | **PASS (ejecutado)** |
| TTL configurable | `FX_QUOTE_TTL_MINUTES` | **PASS (ejecutado)** |
| TTL inválido → fallback 15 | `quoteTtlMinutes` | **PASS (ejecutado)** |
| Moneda no soportada → error | `createFxQuote` | PASS (código) |
| Quote congelado (`lockedAt`, `expiresAt`, `rate`, `rateSource`) | `fx_quotes` | PASS (esquema) |
| Quote expirado → error | `assertQuoteValid` | PASS (código) |
| Quote de otra reserva → error | `assertQuoteValid` | PASS (código) |
| Monto cobrado autoritativo | COP congelado por pago | PASS (código) |

## Disclosure (integridad del hash)

| Verificación | Resultado |
|--------------|-----------|
| Texto ES contiene el monto cobrado y la regla de reembolso | **PASS** |
| Texto EN marca el monto USD como referencia | **PASS** |
| Hash SHA-256 determinista | **PASS** |
| Hash distinto por locale | **PASS** |
| Longitud 64 hex | **PASS** |
| Locale por defecto `es` | **PASS** |

## Hallazgos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| F1 | Media | La tasa es estática (env), no un feed en vivo | Integrar proveedor FX con margen y auditoría |
| F2 | Media | Sin alerta si la tasa cambia bruscamente | Monitorización con umbral |
| F3 | Baja | Sin prueba de expiración con reloj real | Test con `Date` inyectable |

## Veredicto

**PASS (lógica y criptografía del disclosure)**. La fuente de tasa en vivo queda como mejora, no como bloqueo.
