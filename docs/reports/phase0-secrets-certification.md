# PHASE 0 · WS4 — SECRETS CERTIFICATION

**Fecha:** 2026-11-13

## Inventario de variables (por dominio)

| Dominio | Variables | Obligatorias |
|---------|-----------|--------------|
| Base de datos | `DATABASE_URL` | Sí |
| Auth | `JWT_SECRET`, `TURNSTILE_*` | Sí / opcional |
| Pagos | `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`, `PAYMENTS_MODE` | Sí en live |
| FX | `FX_COP_USD_RATE`, `FX_QUOTE_TTL_MINUTES`, `FX_INTL_CHECKOUT_ENABLED`, `LEGAL_SIGNOFF_REF` | Opcional |
| Storage | `MINIO_*` | Sí |
| Email | `RESEND_API_KEY`, `RESEND_FROM` | Opcional |
| Marketing | `META_PIXEL_ID`, `META_ACCESS_TOKEN`, `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Opcional |
| Facturación | `ALEGRA_EMAIL`, `ALEGRA_API_TOKEN` | Opcional |
| Redis | `REDIS_URL` | Sí en prod |
| Webhooks | `ALLOW_UNSIGNED_WEBHOOKS` | **Nunca en prod** |

## Controles verificados

| Control | Resultado |
|---------|-----------|
| Credenciales versionadas | **0** (escaneo de `sk_live_`, `prv_prod_`, `AKIA`, claves PEM, `AIza`) |
| `.env` en repositorio | **No**; solo `.env.example` y `.env.wompi.example` con placeholders |
| Validación fail-fast de Wompi | PASS — faltantes, prefijo inválido y llaves de entornos mezclados abortan el arranque |
| Entorno derivado de la llave | PASS (`pub_prod_`/`pub_test_`) |
| Separación por entorno | PASS — `deploy/.env.production.example` y `.env.staging.example` |
| Rotación | Procedimiento no documentado | GAP |
| Mínimo privilegio (DB) | Un único usuario de aplicación | GAP |
| Logs con secretos | PASS — redacción de `authorization`, `cookie`, `set-cookie`, `x-wompi-signature` |
| Webhooks sin firma | PASS — ahora requiere `ALLOW_UNSIGNED_WEBHOOKS=true` explícito |

## Hallazgos

| # | Severidad | Hallazgo | Acción |
|---|-----------|----------|--------|
| K1 | Media | Sin procedimiento de rotación de `JWT_SECRET` (invalidaría sesiones) | Documentar ventana y despliegue escalonado |
| K2 | Media | Un solo rol de base de datos para app y migraciones | Separar `app` y `migrator` |
| K3 | Baja | `NEXT_PUBLIC_*` expone IDs de analítica por diseño | Aceptado |
| K4 | Media | `JWT_SECRET` de desarrollo incluido en compose dev | Aceptado solo en local; nunca reutilizar |

## Veredicto

**PASS (repositorio)** — no hay secretos filtrados y la validación de configuración es estricta. La rotación y el mínimo privilegio de base de datos quedan como acción de infraestructura.
