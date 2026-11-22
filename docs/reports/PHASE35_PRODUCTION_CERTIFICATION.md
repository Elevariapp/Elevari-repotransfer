# PHASE 3.5 — PRODUCTION CERTIFICATION

**Producto:** Elevari (web)
**Fecha:** 2026-11-13
**Modo:** EXECUTE · VALIDATE · CERTIFY · FIX
**Build certificado:** `b-main` — build de producción `EXIT=0`, 30 rutas, typecheck limpio.

---

## 1. EXECUTIVE SUMMARY

Se certificaron 12 workstreams. **Lo que pudo ejecutarse se ejecutó con evidencia real** (Playwright, axe-core, Lighthouse, arneses de Node sobre el código de producción); **lo que depende de infraestructura externa se documentó como bloqueante**, no como aprobado.

Resultado global: **NOT PRODUCTION READY**.

La aplicación web está en buen estado de calidad de producto:

- 0 violaciones axe en 14 ejecuciones (WCAG 2.2 AA).
- Lighthouse: home **91/100/100/100**; legal **100/100/100/100**; login **100/100/100/100**.
- 0 overflow horizontal en 63 combinaciones ruta × viewport.
- 9/9 payloads de analítica y 5/5 invariantes de precio verificados por ejecución.
- Bug crítico de **sobre-reembolso** corregido, más un **HTTP 400** de imágenes y un **bloqueo de conversión móvil**.

Lo que impide certificar producción no es el código: es la ausencia de credenciales, base de datos, dominio/SSL, webhook público y monitoreo. Sin una transacción real, el flujo de pago no puede certificarse.

---

## 2. EVIDENCE INVENTORY

| Evidencia | Ruta |
|-----------|------|
| Certificación visual | `docs/reports/visual-certification.md` |
| Certificación de accesibilidad | `docs/reports/accessibility-certification.md` |
| Certificación de performance | `docs/reports/performance-certification.md` |
| Certificación de analítica | `docs/reports/analytics-certification.md` |
| Certificación Wompi + refunds | `docs/reports/wompi-certification.md` |
| Certificación de observabilidad | `docs/reports/observability-certification.md` |
| Certificación UX | `docs/reports/ux-certification.md` |
| Assets de marca | `docs/reports/brand-assets-certification.md` |
| Hardening técnico | `docs/reports/technical-hardening.md` |
| Checklist go-live | `docs/reports/go-live-checklist.md` |
| 63 capturas (7 viewports) | `docs/reports/assets/visual/` |
| Métricas de layout | `docs/reports/assets/visual-metrics.json` |
| axe (14 ejecuciones) | `docs/reports/assets/a11y-results.json` |
| Focus / menú / validación | `docs/reports/assets/*.jpg` |
| Lighthouse (3 páginas) | `docs/reports/assets/lighthouse-{home,legal,login}.json` |
| Analítica (9 casos) | `docs/reports/assets/analytics-results.json` |
| Precios (5 casos) | `docs/reports/assets/money-fees-results.json` |
| Arneses reproducibles | `scripts/certification/*` |

---

## 3. FIXED ISSUES

| # | Severidad | Problema | Corrección | Commit |
|---|-----------|----------|------------|--------|
| 1 | **Crítica (financiera)** | Reembolsos parciales ejecutaban `void` total en Wompi (devolvía de más) | Guard: parcial → `pending_manual` | `6c85ea7` |
| 2 | **Crítica (conversión)** | Búsqueda del hero fuera del viewport en móvil | Hero móvil compacto: visible completa en 390×844 | `75f16db` |
| 3 | Alta (funcional) | `quality={72}` sin `qualities` → HTTP 400 en imágenes | `images.qualities` configurado | `75f16db` |
| 4 | Alta (a11y) | Contraste 1.12 en chip activo | Texto blanco (6.29) | `1d17551` |
| 5 | Alta (a11y) | Nombre accesible del logo no contenía el texto visible | Nombre desde contenido + `sr-only` | `1d17551` |
| 6 | Alta (a11y) | Skip link sin destino en login/registro | `id="contenido"` en `AuthShell` | `1d17551` |
| 7 | Media (a11y) | Menú móvil no cerraba con Escape | Escape + foco gestionado + `aria-controls` | `1d17551` |
| 8 | Media (a11y) | Validación nativa en inglés, sin `aria-invalid` | Validación inline ES + `role="alert"` | `1d17551` |
| 9 | Media (perf) | LCP no descubrible (background CSS) y framer-motion global | `next/image` priority + template sin JS | `75f16db` |
| 10 | Media (perf) | Calendario en bundle inicial | Carga diferida | `75f16db` |
| 11 | Media (seguridad) | `remotePatterns` http wildcard | Wildcard http eliminado | este commit |
| 12 | Media (observabilidad) | Logs con PII en email mock | Enmascarado | `796b91b` |
| 13 | Media (observabilidad) | Logs sin request id ni redacción | `genReqId` + `redact` | `796b91b` |
| 14 | Media (pagos) | Webhook no validaba moneda | Validación + evento de mismatch | `6c85ea7` |
| 15 | Baja (tooling) | `next lint` eliminado en Next 16 | `npm run typecheck` | `c94a3aa` |
| 16 | Baja (tooling) | TS5101 por `baseUrl` | `ignoreDeprecations` | `c94a3aa` |
| 17 | Baja (branding) | Faltaban PNG de icono | 16→1024 + Apple touch | `3bda489` |

**17 problemas corregidos**, 6 commits.

---

## 4. REMAINING ISSUES

| # | Área | Issue | Severidad | Bloqueante |
|---|------|-------|-----------|------------|
| R1 | Pagos | Flujo Wompi end-to-end no ejecutado (sin llaves ni webhook público) | Crítica | **Sí** |
| R2 | Datos | Sin base de datos migrada/seed; detalle, checkout, host y admin no renderizables | Crítica | **Sí** |
| R3 | Infra | Dominio, SSL y entorno de producción no verificados | Crítica | **Sí** |
| R4 | Ops | Sin monitoreo, alertas ni backups verificados | Alta | **Sí** |
| R5 | Legal | Signoff de checkout internacional pendiente | Alta | **Sí** |
| R6 | Medición | `purchase` duplicado en GA4 (`payment_completed` + `booking_confirmed`) | Media | No |
| R7 | Perf | LCP 3.5 s en home móvil (fuente del hero 880×1024) | Media | No |
| R8 | A11y | Sin prueba con lector de pantalla real | Media | No |
| R9 | Observabilidad | `correlationId` de pago no enlazado a `req.id` | Media | No |
| R10 | Datos | `webhook_raw` completo en `payment.metadata` (retención/PII) | Media | No |
| R11 | Deuda | 163 clases `wana-*`, `Modal/Input/Badge/Toast` sin uso, `middleware/rate-limit.ts` muerto | Baja | No |
| R12 | Config | `NEXT_IGNORE_TYPE_ERRORS` puede desactivar el chequeo de tipos | Media | No |

---

## 5. PRODUCTION RISKS

Riesgos que **solo pueden cerrarse con acción humana/externa**:

| # | Riesgo | Impacto | Acción | Owner |
|---|--------|---------|--------|-------|
| P1 | Sin transacción real verificada | No se sabe si el dinero llega y confirma | Ejecutar pago en sandbox y luego producción; registrar IDs en `verification-log.md` | Negocio + Dev |
| P2 | Webhook no configurado | Reservas pagadas podrían no confirmarse | Configurar URL pública y validar checksum con evento real | Negocio |
| P3 | Sin base de datos productiva | La app no opera | Provisionar Postgres, ejecutar migraciones y seed | Infra |
| P4 | Sin dominio/SSL | No hay URL pública | DNS + certificado + Cloudflare | Infra |
| P5 | Sin backups ni monitoreo | Un incidente es irrecuperable/silencioso | Configurar backups, restauración probada, Sentry/uptime | Infra |
| P6 | Sin signoff legal internacional | Riesgo regulatorio en checkout USD | Aprobación legal (`legal-review-pack.md`) | Legal |
| P7 | Cuenta Wompi sin validar para producción | Cobros rechazados | Completar KYC con Wompi | Negocio |

---

## 6. RECOMMENDATIONS

### High
1. Provisionar secretos y base de datos; ejecutar `api:migrate` + `api:seed`.
2. Ejecutar el flujo completo en sandbox con `PAYMENTS_MODE=mock` y luego con llaves `pub_test_`.
3. Configurar webhook público y verificar firma con un evento real.
4. Definir un único evento `purchase` para GA4.
5. Sustituir la imagen del hero por una fuente landscape ≥1600 px.

### Medium
6. Enlazar `correlationId` de pago con `req.id`.
7. Añadir Sentry + uptime + alertas de webhook fallido.
8. Definir retención de `webhook_raw`.
9. Prueba con NVDA/VoiceOver en checkout y galería.
10. Validar logo Horizon con usuarios.

### Low
11. Migrar clases legacy `wana-*` → `elevari-*`.
12. Adoptar `Modal/Input/Badge/Toast` en admin y auth.
13. Exportar favicon `.ico`.
14. Eliminar `middleware/rate-limit.ts` o cablearlo.

---

## 7. GO-LIVE DECISION

# ❌ NOT PRODUCTION READY

**Fundamento:** el código está certificado en calidad (accesibilidad, performance, analítica, precios y hardening), pero **no existe evidencia de una transacción real, ni de base de datos, dominio/SSL, webhook, backups o monitoreo**. Certificar producción sin esos elementos sería una afirmación sin evidencia.

### Blockers exactos

| # | Blocker | Remediación | Owner | Criterio de cierre |
|---|---------|-------------|-------|--------------------|
| B1 | Sin llaves Wompi productivas | Cargar `WOMPI_*`, validar prefijos (`pub_prod_`/`prv_prod_`), `PAYMENTS_MODE=live` | Negocio + Infra | `validate-env.sh` en verde + pago aprobado |
| B2 | Sin webhook público | Configurar `https://<dominio>/api/v1/webhooks/wompi` | Negocio | Evento real con `webhook_applied` |
| B3 | Sin base de datos | Provisionar Postgres y ejecutar migraciones/seed | Infra | `/health` OK y datos visibles |
| B4 | Sin dominio/SSL | DNS + certificado | Infra | HTTPS 200 en `/` |
| B5 | Sin backups/monitoreo | Backups diarios + restauración probada + Sentry/uptime | Infra | Restore documentado y alertas activas |
| B6 | Sin signoff legal | Aprobación de `legal-review-pack.md` | Legal | `LEGAL_SIGNOFF_REF` definido |
| B7 | Flujo E2E no probado | Reserva → pago → webhook → confirmación → refund | Dev + QA | Evidencia con booking/payment IDs |

Cuando B1–B7 estén cerrados, la recomendación cambia a **PRODUCTION READY** sin cambios de código adicionales obligatorios.

---

## 8. FINAL RESPONSE SUMMARY

| Item | Resultado |
|------|-----------|
| Certification Result | **NOT PRODUCTION READY** (código PASS, operación FAIL) |
| Evidence Generated | 10 reportes + 63 capturas + 6 JSON de resultados + 2 capturas de interacción |
| Fixes Applied | 17 (incluye 1 crítico financiero y 1 crítico de conversión) |
| Remaining Risks | 7 externos (P1–P7) + 12 internos no bloqueantes |
| Go-Live Checklist | 3 PASS · 2 PASS parcial · 11 FAIL |

