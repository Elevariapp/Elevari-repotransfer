# Elevari

Última validación: 2026-11-21 · rama chore/elevari-production

Plataforma de reservas de alojamientos (glamping y estancias) para Colombia. Dominio: **https://elevari.live**. Moneda COP. Datos personales bajo la Ley 1581 de 2012. Contacto único (soporte, legal, privacidad, moderación, accesibilidad, anfitriones): **reserve@elevari.live**.

Alcance de producción: **web + Android**. iOS está fuera de alcance. No existe entorno staging: solo producción.

## Componentes

| Componente | Ruta | Tecnología | Puerto |
|------------|------|------------|--------|
| Web | `/` (raíz) | Next.js 16 (app router, `output: standalone`), React 19, Tailwind 4 | 3000 |
| API | `api/` | Fastify 5, Prisma 6, PostgreSQL 16 | 4000 |
| App Android | `mobile/` | Expo SDK 58 (React Native 0.88), Expo Router, Firebase (Analytics/Messaging), Expo Push | — |
| Infra | `deploy/`, `docker-compose.prod.yml` | Docker Compose en un servidor Hetzner; Cloudflare como edge | 80/443 |

## Inicio rápido (desarrollo local)

```bash
npm install && (cd api && npm install)
npm run docker:infra          # postgres, redis, minio (docker-compose.yml)
cd api && npx prisma migrate deploy && cd ..
npm run api:dev               # API en :4000
npm run dev                   # web en :3000
```

Variables: copia `.env.example` (raíz y `api/`). Nunca subas secretos al repo.

## Documentación canónica

| Tema | Documento |
|------|-----------|
| Arquitectura | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Infraestructura | [INFRASTRUCTURE.md](INFRASTRUCTURE.md) |
| Despliegue y operación | [deploy/DEPLOYMENT_PRODUCTION.md](deploy/DEPLOYMENT_PRODUCTION.md), [docs/RUNBOOK.md](docs/RUNBOOK.md) |
| Traspaso (cuentas, secretos, agentes) | [docs/HANDOVER.md](docs/HANDOVER.md) |
| Go-live | [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md), [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) |
| Seguridad | [SECURITY_BASELINE.md](SECURITY_BASELINE.md) |
| Comandos y quality gate | [COMMANDS.md](COMMANDS.md) |
| Decisiones | [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) |
| Estado por dominio | [DOMAIN_STATUS.md](DOMAIN_STATUS.md) |
| Dependencias | [DEPENDENCY_MATRIX.md](DEPENDENCY_MATRIX.md) |
| Fuentes de verdad | [SSOT_REGISTRY.md](SSOT_REGISTRY.md) |
| Reglas de ejecución | [ELEVARI_MASTER_EXECUTION_GUIDE.md](ELEVARI_MASTER_EXECUTION_GUIDE.md) |
| Roadmap | [ROADMAP.md](ROADMAP.md) |
| Integraciones y llaves | [docs/INTEGRATIONS_KEYS.md](docs/INTEGRATIONS_KEYS.md), [docs/RESEND_SETUP.md](docs/RESEND_SETUP.md), [docs/PAYMENTS.md](docs/PAYMENTS.md) |
| Release Android | [mobile/RELEASE.md](mobile/RELEASE.md) |
| Marca y diseño | [BRAND_SYSTEM.md](BRAND_SYSTEM.md), [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), [UX_PATTERNS.md](UX_PATTERNS.md), [UI_COMPONENT_LIBRARY.md](UI_COMPONENT_LIBRARY.md), [ACCESSIBILITY_GUIDE.md](ACCESSIBILITY_GUIDE.md), [EXS_GUIDE.md](EXS_GUIDE.md) |

Documentos históricos (no canónicos): `docs/archive/`, `docs/reports/`.

## Reglas de oro

1. Ningún secreto en el repo (solo nombres de variables).
2. Solo producción; sin staging.
3. No tocar otros servidores del proyecto Hetzner; solo el de Elevari.
4. Quality gate completo antes de cada push (ver [COMMANDS.md](COMMANDS.md)): incluye `npm run docs:lint`.
