# PRODUCTION_READINESS — Preparación para producción

Última validación: 2026-11-21 · rama chore/elevari-production

Resumen del estado frente a los criterios de lanzamiento. La lista accionable y con casillas está en [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md).

## Veredicto

La plataforma está técnicamente lista; el lanzamiento público depende de pasos externos y gated: llaves live de Wompi, credenciales de Alegra, cutover DNS, `full (strict)`, publicación en Google Play y rotación de credenciales.

## Criterios

| Área | Criterio | Estado |
|------|----------|--------|
| Código | Typecheck sin errores (web, API, móvil) y `next build` OK | Gate obligatorio antes de cada push |
| Contenedores | `docker compose -f docker-compose.prod.yml --env-file <env> build` OK | Gate obligatorio |
| Android | `bundleRelease` firmado con llave de subida | Gate obligatorio |
| Documentación | `npm run docs:lint` sin errores | Gate obligatorio |
| Servidor | Hardening, Docker, swap, backups | Hecho |
| Datos | Backup diario + Hetzner Backups; restauración documentada | Hecho (probar restauración periódicamente) |
| Edge | Cloudflare: TLS, WAF, rate limit, Turnstile | Hecho |
| Edge | DNSSEC activo | Pendiente (propagación) |
| Tráfico | DNS A apuntando al servidor | Pendiente (cutover) |
| TLS origen | nginx 443 con Origin Certificate | Hecho |
| TLS origen | Cloudflare en `full (strict)` | Pendiente (cutover) |
| Datos iniciales | `create-admin` y `seed:property` ejecutados | Pendiente |
| Pagos | Llaves live Wompi + webhook | Pendiente |
| Facturación | Credenciales Alegra | Pendiente |
| Correo | Resend verificado, remitente `reserve@elevari.live` | Hecho |
| Analítica | GTM + GA4 | Hecho (verificar eventos tras el cutover) |
| Android | Play Internal testing → Producción; huella en `assetlinks.json` | Pendiente |
| SEO | Search Console, Safe Browsing, Bing, Business Profile | Pendiente |
| Seguridad | Rotación de credenciales expuestas | Pendiente |
| Operación | Monitoreo externo de `/health` | Pendiente |

## Rendimiento y accesibilidad

Líneas base y objetivos: [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md) y [ACCESSIBILITY_GUIDE.md](ACCESSIBILITY_GUIDE.md). Auditorías: `npm run test:cert` y `npm run test:domain`.

## Riesgos conocidos

| Riesgo | Mitigación |
|--------|------------|
| Servidor único | Backups de Hetzner + `pg_dump` diario; rollback por git (RUNBOOK) |
| Hechos de Wompi sin verificar en real (`verification-log.md`) | Primer pago y webhook reales de bajo monto tras cargar llaves live |
| Variables `NEXT_PUBLIC_*` fijadas en build | Reconstruir `web` al cambiarlas |
| Push móvil deshabilitado (sin `projectId` EAS real ni endpoint de registro) | Ver [ROADMAP.md](ROADMAP.md) |
| Credenciales expuestas durante el montaje | Rotar tras el go-live ([docs/HANDOVER.md](docs/HANDOVER.md)) |

## Documentos relacionados

[SECURITY_BASELINE.md](SECURITY_BASELINE.md) · [INFRASTRUCTURE.md](INFRASTRUCTURE.md) · [docs/RUNBOOK.md](docs/RUNBOOK.md)
