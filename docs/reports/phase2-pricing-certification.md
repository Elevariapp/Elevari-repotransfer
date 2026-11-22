# PHASE 2 · WS3 — PRICING CERTIFICATION

**Fecha:** 2026-11-13
**Evidencia:** `docs/reports/assets/money-fees-results.json` (5/5 PASS)

## Modelo

```
BASE_AMOUNT + PLATFORM_FEE (15%) = TOTAL_AMOUNT
```

- Sin IVA, sin INC, sin parafiscal, sin líneas de impuesto al cliente.
- Etiqueta: **"Tarifa de Servicio Elevari"**.
- `PLATFORM_FEE_PERCENT` configurable; default 15.

## Casos ejecutados

| Caso | Entrada | Esperado | Resultado |
|------|---------|----------|-----------|
| Base 1.000.000 @15% | 1.000.000 | fee 150.000 · total 1.150.000 · host 850.000 | **PASS** |
| Redondeo | 333.333 | fee 49.999,95 · total 383.332,95 · invariante exacta | **PASS** |
| Base 0 | 0 | fee 0 · total 0 | **PASS** |
| Fee 0% | 100 | fee 0 · total 100 | **PASS** |
| Default 15% web/API | — | ambos espejos coherentes | **PASS** |

## Verificaciones adicionales

| Verificación | Resultado |
|--------------|-----------|
| `base + fee === total` (tolerancia 0.01) | PASS |
| Redondeo a 2 decimales | PASS |
| Espejo web (`lib/tax-logic.ts`) vs API (`api/src/lib/fees.ts`) | PASS |
| Unidades menores enteras en frontera de proveedor (`money.ts`) | PASS (código) |
| Persistencia por reserva (`base_amount`, `platform_fee_*`, `total_amount`) | PASS (esquema) |

## Hallazgos

| # | Severidad | Hallazgo |
|---|-----------|----------|
| PR1 | Baja | Los cálculos usan `number` (double); seguro a estos montos, pero conviene validar con property-based tests |
| PR2 | Baja | Sin prueba de montos extremos (> 1e12) |

## Veredicto

**PASS** — aritmética verificada por ejecución y espejos coherentes.
