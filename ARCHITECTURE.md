# ARCHITECTURE — Arquitectura del sistema

Última validación: 2026-11-21 · rama chore/elevari-production

## Visión general

Monorepo con tres unidades:

1. **Web** (raíz): Next.js 16, app router, `output: standalone`, puerto 3000. Sitio público, checkout, panel de anfitrión y admin.
2. **API** (`api/`): Fastify 5 + Prisma 6 + PostgreSQL 16, puerto 4000. Auth, propiedades, reservas, pagos, media, analítica, facturación.
3. **App Android** (`mobile/`): Expo SDK 58 / React Native 0.88, paquete `elevari.androidapp`. Consume la misma API. Firebase (Analytics y Messaging vía `@react-native-firebase`) y Expo Push.

Producción corre en **un único servidor Hetzner** con Docker Compose (`docker-compose.prod.yml`) detrás de Cloudflare. Detalle en [INFRASTRUCTURE.md](INFRASTRUCTURE.md). Solo producción: no hay staging.

## Topología

```
Usuario / App Android
        │ HTTPS
   Cloudflare (WAF, rate limit, TLS, caché)
        │ 80/443 (solo rangos Cloudflare tras el cutover)
   nginx :80 (redirige a HTTPS salvo /health) · :443 (Cloudflare Origin Certificate)
     ├── elevari.live        /          → web  :3000
     │                       /api/*     → api  :4000
     │                       /health    → api  :4000
     ├── www.elevari.live    → 301 a elevari.live
     └── media.elevari.live  /elevari-media/* → minio :9000 (solo GET/HEAD)
   red interna Docker: postgres :5432 · redis :6379 · minio :9000/:9001
```

Postgres, Redis y MinIO no publican puertos al host: solo son alcanzables desde la red `elevari_internal`. nginx publica 80 y 443; el certificado se monta desde `/etc/ssl/elevari/{origin.pem,origin.key}` (creado en el servidor, nunca en git) y `deploy/nginx/cloudflare-ips.conf` restaura la IP real del cliente detrás de Cloudflare. Cualquier host que no sea de Elevari recibe `444` (escaneos por IP directa).

## Layout de URLs (un solo dominio, sin subdominio `api`)

| URL | Destino |
|-----|---------|
| `https://elevari.live/` | Web |
| `https://elevari.live/api/v1/*` | API REST |
| `https://elevari.live/health` | Health de la API (`status`, `database`, `turnstile_required`) |
| `https://media.elevari.live/elevari-media/*` | Media pública (bucket MinIO `elevari-media`) |
| `https://www.elevari.live` | Redirige al apex |
| `https://elevari.live/.well-known/assetlinks.json` | Digital Asset Links de Android (`app/.well-known/assetlinks.json/route.ts`) |

`NEXT_PUBLIC_API_URL` es el origen sin `/api/v1` (`https://elevari.live`).

## Estructura del repositorio

```
app/            Next.js app router (account, admin, auth, become-host, checkout, guides,
                health, heartbeat, host, legal, properties, [slug], api, .well-known)
components/     UI compartida (ui, booking, checkout, catalog, host, admin, analytics, …)
lib/            Utilidades web (analytics, conversion, seo, verify-jwt)
proxy.ts        Proxy de Next 16 (antes middleware): protege /host, /account, /admin con JWT
api/            Fastify
  src/routes/   auth, bookings, payments (+webhooks), properties, media, host, admin,
                financial, analytics, health
  src/lib/      payments (Wompi), email (Resend), alegra, minio, turnstile, ical, fees, …
  src/jobs/     expiración de reservas pendientes, recordatorios de check-in, sync iCal (OTA)
  prisma/       schema.prisma, migraciones, seed (solo desarrollo)
mobile/         App Expo (app/ rutas Expo Router, lib/, components/, plugins/)
deploy/         nginx, plantillas de env, scripts (backup, restore, deploy, verify)
scripts/        docs-lint, auditorías de certificación
e2e/ tests/     Playwright y pruebas
docs/           Documentación de soporte; docs/archive y docs/reports son históricos
```

## Flujos clave

**Reserva y pago (Wompi, único proveedor activo)**
1. Catálogo y disponibilidad: `GET /api/v1/properties…`.
2. `POST /api/v1/bookings` crea la reserva en `pending` (un job la expira según `BOOKING_PENDING_TTL_MINUTES`).
3. Intent de pago → checkout alojado de Wompi con firma de integridad (`WOMPI_INTEGRITY_SECRET`).
4. Wompi llama `POST https://elevari.live/api/v1/webhooks/wompi`; la API valida el checksum con `WOMPI_EVENTS_SECRET`, deduplica y confirma reserva y pago.
5. Correo de confirmación (Resend) y factura electrónica (Alegra); si Alegra falla queda en `pending_invoices` para reintento admin.

**Autenticación**: JWT (`JWT_SECRET`, obligatorio también en la web). La web lo guarda en la cookie `elevari_token` y `proxy.ts` valida el rol (`admin`, `host`). Las cuentas `@elevari.local` están bloqueadas en producción. Turnstile protege login y registro (`TURNSTILE_SECRET_KEY` solo en el servidor). La app Android usa `https://elevari.live/api/v1`, guarda el token con `expo-secure-store` y obtiene el token de Turnstile con un widget en un WebView dentro de la app.

**Arranque de la API en producción (fail-fast)**: la API no inicia sin un `JWT_SECRET` de ≥ 32 caracteres, sin `TURNSTILE_SECRET_KEY` (ni con Turnstile deshabilitado), ni con `PAYMENTS_MODE=mock` salvo `ALLOW_MOCK_PAYMENTS=true` (solo pruebas internas de humo). Ejecuta `prisma migrate deploy` antes de arrancar.

**Datos iniciales en producción**: `npm run create-admin` y `npm run seed:property` dentro del contenedor `api` (ver [docs/RUNBOOK.md](docs/RUNBOOK.md)). El seed demo (`npm run db:seed`) se niega a correr con `NODE_ENV=production` salvo `ALLOW_DEMO_SEED=true`, y no se usa nunca en producción.

**Media**: subida multipart a la API → procesamiento con `sharp` → MinIO; lectura pública desde `media.elevari.live`.

**Analítica**: `NEXT_PUBLIC_GTM_ID` (GTM-PXVGFFMK) carga GTM; el tag de Google dentro del contenedor mide GA4 (`G-W4QC0NYBVJ`). Con GTM activo la web no carga gtag directo y emite eventos al `dataLayer`. Meta Pixel es opcional. Cloudflare Web Analytics no usa cookies.

**Push móvil**: deshabilitado hasta que exista un `projectId` real de EAS y un endpoint de la API para registrar tokens (pendiente; ver [ROADMAP.md](ROADMAP.md)).

## Seguridad en capas

- Cloudflare: Always HTTPS, TLS ≥ 1.2, WAF gestionado + regla custom de rutas sensibles, Bot Fight Mode, rate limit en `/api/v1/auth/*`.
- nginx: TLS 1.2/1.3 con Origin Certificate, cabeceras base, `limit_req` (`/api/` 20 r/s, `/api/v1/auth/` 5 r/s por IP real), host desconocido → `444`, media solo GET/HEAD.
- Next.js: CSP en modo enforce y cabeceras de seguridad (`next.config.ts`).
- API: `@fastify/rate-limit` (120/min por IP), CORS restringido, logs con redacción de `authorization` y `cookie`.

Ver [SECURITY_BASELINE.md](SECURITY_BASELINE.md).

## Documentos relacionados

[INFRASTRUCTURE.md](INFRASTRUCTURE.md) · [DEPENDENCY_MATRIX.md](DEPENDENCY_MATRIX.md) · [DOMAIN_STATUS.md](DOMAIN_STATUS.md) · [TECHNICAL_DECISIONS.md](TECHNICAL_DECISIONS.md) · [SSOT_REGISTRY.md](SSOT_REGISTRY.md)
