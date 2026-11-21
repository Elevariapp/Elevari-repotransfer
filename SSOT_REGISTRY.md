# SSOT_REGISTRY — Fuentes de verdad

Última validación: 2026-11-21 · rama chore/elevari-production

Regla: cuando documento y código discrepan, gana la fuente indicada aquí. Un dominio = una fuente. Otros documentos enlazan, no duplican.

## Documentos canónicos

| Documento | Es la fuente de |
|-----------|-----------------|
| [README.md](README.md) | Punto de entrada y mapa de documentación |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura, URLs públicas, flujos |
| [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | Servidor, Docker, Cloudflare, DNS, backups |
| [deploy/DEPLOYMENT_PRODUCTION.md](deploy/DEPLOYMENT_PRODUCTION.md) | Primer despliegue y configuración del servidor |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Operación: deploy, rollback, backups, rotación, incidentes |
| [docs/HANDOVER.md](docs/HANDOVER.md) | Cuentas, IDs, ubicación de secretos, acceso de agentes |
| [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md) | Estado de lanzamiento (hecho vs pendiente) |
| [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) | Criterios de preparación y estado |
| [SECURITY_BASELINE.md](SECURITY_BASELINE.md) | Controles de seguridad y su estado |
| [COMMANDS.md](COMMANDS.md) | Comandos y quality gate |
| [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) | Decisiones (ADR) |
| [DOMAIN_STATUS.md](DOMAIN_STATUS.md) | Estado por dominio |
| [DEPENDENCY_MATRIX.md](DEPENDENCY_MATRIX.md) | Dependencias y servicios externos |
| [ROADMAP.md](ROADMAP.md) | Trabajo posterior al lanzamiento |
| [ELEVARI_MASTER_EXECUTION_GUIDE.md](ELEVARI_MASTER_EXECUTION_GUIDE.md) | Reglas de ejecución y gobernanza |
| [mobile/RELEASE.md](mobile/RELEASE.md) | Build y publicación Android |
| [docs/INTEGRATIONS_KEYS.md](docs/INTEGRATIONS_KEYS.md) | Variables por servicio (sin valores) |
| [docs/RESEND_SETUP.md](docs/RESEND_SETUP.md) | Correo transaccional |
| [docs/PAYMENTS.md](docs/PAYMENTS.md) | Detalle del motor de pagos |
| `BRAND_SYSTEM.md`, `DESIGN_SYSTEM.md`, `UX_PATTERNS.md`, `UI_COMPONENT_LIBRARY.md`, `ACCESSIBILITY_GUIDE.md`, `EXS_GUIDE.md` | Marca, diseño y accesibilidad |

Históricos (no canónicos): `docs/archive/`, `docs/reports/`.

## Fuentes en código y configuración

| Dominio | Fuente |
|---------|--------|
| Esquema de base de datos | `api/prisma/schema.prisma` y `api/prisma/migrations/` |
| Rutas de API | `api/src/routes/*.ts` |
| Configuración de pagos | `api/src/lib/payments/config.ts` |
| Comisiones / FX | `api/src/lib/fees.ts`, `api/src/lib/payments/fx*.ts` |
| Plantillas de correo | `api/src/lib/email-templates/` |
| Rutas web | `app/**/page.tsx`, `proxy.ts` |
| Cabeceras / CSP web | `next.config.ts` |
| Stack de producción | `docker-compose.prod.yml` |
| nginx | `deploy/nginx/nginx.conf` |
| Variables de entorno (nombres) | `deploy/.env.production.example`, `.env.example`, `api/.env.example`, `mobile/.env.example` |
| Scripts de operación | `deploy/scripts/` |
| CI | `.github/workflows/ci.yml` |
| Versiones | `package.json` (raíz), `api/package.json`, `mobile/package.json` |
| Config de la app Android | `mobile/app.json`, `mobile/plugins/withAndroidReleaseBuild.js` |
| Digital Asset Links | `app/.well-known/assetlinks.json/route.ts` + `ANDROID_SHA256_CERT_FINGERPRINTS` |
| Valores reales de producción | `/opt/elevari/.env.production` en el servidor (nunca en git) |
| Marca (tokens) | `app/globals.css`, `docs/brand/`, `docs/design/` |

## Reglas

1. Se actualiza la fuente antes que la documentación derivada.
2. Ningún secreto en documentos: solo nombres de variable y dónde vive el valor.
3. Todo documento canónico lleva la línea `Última validación: <fecha> · rama <rama>`.
4. `npm run docs:lint` debe pasar (términos obsoletos, marca y correos de contacto antiguos).
