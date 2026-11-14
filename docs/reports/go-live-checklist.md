# GO-LIVE CHECKLIST — Phase 3.5

**Fecha:** 2026-11-13
**Criterio:** PASS (verificado con evidencia) · FAIL (no verificado o bloqueado) · N/A

| # | Item | Estado | Evidencia / motivo | Owner |
|---|------|--------|--------------------|-------|
| 1 | Dominio | **FAIL** | `eleveri.app` referenciado en código; no verificable desde el repositorio (DNS/registrador) | Infraestructura |
| 2 | SSL | **FAIL** | Requiere acceso al servidor/Cloudflare | Infraestructura |
| 3 | Entorno de producción | **FAIL** | No existe `.env.production`; `docker-compose.prod.yml` presente pero no ejecutado | Infraestructura |
| 4 | Llaves Wompi | **FAIL** | Sin credenciales en el entorno; no se ejecutó transacción | Negocio + Infra |
| 5 | URL de webhook | **FAIL** | No configurada en dashboard Wompi | Negocio |
| 6 | Migraciones de base de datos | **FAIL** | Sin PostgreSQL disponible; `api:migrate` no ejecutado | Infraestructura |
| 7 | Analítica | **PASS (código)** / **FAIL (config)** | 9/9 payloads PASS; sin `NEXT_PUBLIC_GA_MEASUREMENT_ID` ni Pixel ID reales | Marketing |
| 8 | Logging | **PASS** | Logs estructurados, redacción y request id implementados | Desarrollo |
| 9 | Accesibilidad | **PASS** | 0 violaciones axe; Lighthouse a11y 100 | Desarrollo |
| 10 | Documentación | **PASS** | `docs/brand`, `docs/design`, `docs/reports`, `PHASE3_CLOSEOUT` | Desarrollo |
| 11 | Reembolsos | **PASS (código)** / **FAIL (e2e)** | Bug de sobre-reembolso corregido; sin prueba real | Desarrollo + Ops |
| 12 | Flujo de reserva | **FAIL (e2e)** | Requiere API + DB; no ejecutado | Desarrollo + QA |
| 13 | Flujo de pago | **FAIL (e2e)** | Requiere Wompi sandbox + webhook público | Desarrollo + QA |
| 14 | Monitoreo (Sentry/uptime) | **FAIL** | No configurado | Infraestructura |
| 15 | Backups | **FAIL** | Sin verificación de backups ni restauración | Infraestructura |
| 16 | Recuperación ante incidentes | **FAIL** | Runbooks existen (`deploy/`, `INFRASTRUCTURE.md`) pero sin prueba de rollback | Infraestructura |

---

## Resumen

| Estado | Cantidad |
|--------|----------|
| PASS | 3 (logging, accesibilidad, documentación) |
| PASS parcial (código sí, operación no) | 2 (analítica, reembolsos) |
| FAIL | 11 |

---

## Bloqueantes para go-live

1. Llaves Wompi de producción + transacción real verificada.
2. URL de webhook pública y verificación de checksum con evento real.
3. Base de datos migrada y respaldo verificado.
4. Dominio + SSL activos.
5. Monitoreo, alertas y backups operativos.
6. Flujo completo de reserva/pago probado end-to-end en staging.

---

## Items que requieren acción humana (no código)

| Acción | Responsable |
|--------|-------------|
| Provisionar secretos (`WOMPI_*`, `RESEND_API_KEY`, `META_*`, `GA4`) | Infraestructura + Negocio |
| Configurar webhook en Wompi | Negocio |
| Ejecutar migraciones y seed en staging/producción | Infraestructura |
| Configurar Sentry/uptime/alertas | Infraestructura |
| Probar restauración de backup | Infraestructura |
| Signoff legal de checkout internacional | Legal |
| Validar cuenta Wompi (KYC) para producción | Negocio |
