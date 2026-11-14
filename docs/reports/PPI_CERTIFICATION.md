# PPI CERTIFICATION — Pre-Production Infrastructure Sprint

**Fecha:** 2026-11-13
**Build:** `b-main` · typecheck 0 · build 30 rutas

---

## PPI-1 — Complete Design System Adoption

| Métrica | Valor |
|---------|-------|
| Primitivas disponibles | 9 (`Button`, `ButtonLink`, `IconButton`, `Card`, `Input`, `Badge`, `Modal`, `PriceBreakdown`, `Toast`) |
| Archivos que importan `components/ui` | 15 |
| Controles convertidos en este sprint | Gallery CTA, flechas de galería (móvil), CTAs de auth, CTA de reserva, 404 |
| `<button>` nativos restantes | 66 (47 en superficies de producto) |

**Estado: PARCIAL.** No existe una primitiva equivalente para *image tiles* de galería, *list options* de búsqueda ni *steppers* compactos; esos controles siguen siendo específicos y consumen tokens. Los CTA de acción sí usan primitivas.

**Condición para 100%:** crear `MediaTile`, `ListOption` y `Stepper` en `components/ui` y migrar los 47 botones de producto. Documentado como condición de Phase 4.

---

## PPI-2 — Content Security Policy

| Fase | Resultado |
|------|-----------|
| Report-only (6 rutas) | header presente · **0 violaciones** |
| Enforce (6 rutas) | header presente · **0 violaciones** |
| Regresión visual/accesibilidad | 63 combos sin overflow · axe 0 · 3 temas axe 0 |

Política aplicada (`next.config.ts`):

- `default-src 'self'`, `base-uri 'self'`, `object-src 'none'`, `frame-ancestors 'none'`
- `form-action 'self' https://checkout.wompi.co https://sandbox.wompi.co`
- `script-src`: self + inline (bootstrap Next) + GTM/GA + Meta + Turnstile + Google Identity
- `style-src`: self + inline + Google
- `img-src`: self, data:, blob:, https: (media S3/Cloudflare)
- `connect-src`: self + GA + Meta + Turnstile + Google
- `frame-src`: Turnstile + Google + DoubleClick
- `worker-src 'self' blob:`, `manifest-src 'self'`, `upgrade-insecure-requests`

**Estado: CSP CERTIFIED** (report-only validado y promovido a enforce sin violaciones). `CSP_ENFORCE=0` permite volver a report-only para depurar.

Evidencia: `docs/reports/assets/csp-results.json`.

---

## PPI-3 — Storage Certification

| Control | Estado |
|---------|--------|
| Bucket público de media | Configurado (`mc anonymous set download`) |
| Bucket privado para documentos | **Script nuevo** (`storage-hardening.sh`) |
| Versionado | **Script nuevo** (ambos buckets) |
| Lifecycle | **Script nuevo** (multipart + versiones no actuales + retención) |
| Backups de objetos | `mc mirror` documentado (pendiente de ejecución) |
| Verificación en runtime | **NO EJECUTADA** (sin MinIO/S3) |

**Estado: STORAGE NOT CERTIFIED.** El hardening está codificado y es idempotente, pero requiere ejecución contra el bucket real y evidencia de `mc anonymous get` / `mc version info`.

---

## PPI-4 — Observability Certification

Implementado y verificado end-to-end:

| Componente | Evidencia |
|-----------|-----------|
| Captura de `window.error` y `unhandledrejection` | `ObservabilityProvider` |
| Endpoint de ingesta `POST /api/observability` | Rechaza cuerpo inválido con **400** |
| Reenvío a proveedor (`OBSERVABILITY_WEBHOOK_URL`) | Receptor local recibió el payload |
| Error boundary global | `app/global-error.tsx` (reporta + reintentar) |
| Logs estructurados API | Pino con request id y redacción |

Payload recibido (extracto): `{"source":"web","message":"ppi4-observability-probe","route":"/","level":"error","tags":{"source":"unhandledrejection"}}`

**Estado: OBSERVABILITY CERTIFIED (pipeline).** La entrega a un proveedor real (Sentry/uptime/alertas) requiere DSN y configuración externa → pendiente operacional.

---

## PPI-5 — Recovery Certification

| Elemento | Estado |
|----------|--------|
| Backup con checksum + retención | Script listo (`backup-db.sh`) |
| Restore verificado con `--yes` y conteos | Script listo (`restore-db.sh`) |
| RTO / RPO medidos | **NO EJECUTADO** (sin PostgreSQL) |

**Estado: RECOVERY NOT CERTIFIED.** Requiere ejecución real y registro de tiempos.

---

## PPI-6 — Load & Scale Certification

Prueba ejecutada con **autocannon** contra el servidor Next (capa web), 8 s por nivel.

| Ruta | Conexiones | RPS | p50 | p99 | Errores |
|------|-----------|-----|-----|-----|---------|
| home | 100 | 1.524 | 60 ms | 148 ms | 0 |
| home | 250 | 2.155 | 115 ms | 161 ms | 0 |
| home | 500 | 2.188 | 256 ms | 4.392 ms | 2.419 |
| home | 1.000 | 1.653 | 808 ms | 7.352 ms | 14.713 |
| legal | 100 | 2.014 | 43 ms | 85 ms | 0 |
| legal | 250 | 2.532 | 98 ms | 947 ms | 146 |
| legal | 500 | 2.238 | 277 ms | 5.465 ms | 2.347 |
| legal | 1.000 | 1.387 | 928 ms | 7.429 ms | 17.582 |

**Lectura:** el proceso Next único satura alrededor de **2.200 rps**; por encima de ~250 conexiones aparecen resets (0 respuestas 5xx). El cuello de botella es el proceso único y el backlog de sockets, no la aplicación.

**Estado: SCALE PARTIALLY CERTIFIED (web tier).** Falta medir API + PostgreSQL y validar escalado horizontal (múltiples instancias + balanceador).

Evidencia: `docs/reports/assets/load-results.json`.
