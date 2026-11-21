# TECHNICAL_DECISIONS — Decisiones técnicas (ADR)

Última validación: 2026-11-21 · rama chore/elevari-production

Formato: contexto → decisión → consecuencias. Las decisiones de 2026-11 reflejan el estado de producción.

## ADR-001 — Hetzner en lugar de AWS (2026-11)

- **Contexto:** un solo servicio con tráfico inicial moderado; se necesita costo predecible y operación simple.
- **Decisión:** un servidor Hetzner Cloud cpx32 (4 vCPU / 8 GB) en Helsinki con Docker Compose. AWS EC2 descartado: más costo y complejidad (IAM, VPC, RDS) sin beneficio a esta escala.
- **Consecuencias:** punto único de fallo; se mitiga con Backups de Hetzner + `pg_dump` diario. Escalar = subir de tipo de servidor o separar la base de datos.

## ADR-002 — Cloudflare como edge (2026-11)

- **Decisión:** Cloudflare Free delante del origen: TLS, WAF gestionado + regla custom, Bot Fight Mode, rate limit en auth, DNSSEC, Turnstile, Web Analytics. Origen restringido a rangos Cloudflare tras el cutover y `full (strict)` con Origin Certificate.
- **Consecuencias:** el origen no es accesible directo; la IP real llega vía cabeceras de Cloudflare. Los cambios de DNS pasan por la zona de Cloudflare (registrador GoDaddy solo delega nameservers).

## ADR-003 — Wompi como único proveedor de pagos (2026-11)

- **Contexto:** mercado colombiano, cobro en COP.
- **Decisión:** Wompi es el único proveedor live (`PAYMENTS_WOMPI_ENABLED=true`). El código de Bold y Stripe se conserva como legacy deshabilitado (`PAYMENTS_BOLD_ENABLED=false`, `PAYMENTS_STRIPE_ENABLED=false`); descartado como camino de producción.
- **Consecuencias:** una sola integración que mantener y certificar; checkout alojado (alcance PCI SAQ A); webhook `https://elevari.live/api/v1/webhooks/wompi` con verificación de checksum obligatoria.

## ADR-004 — GTM + GA4 (2026-11)

- **Decisión:** `NEXT_PUBLIC_GTM_ID` (GTM-PXVGFFMK) contiene el tag de Google para GA4 (G-W4QC0NYBVJ). Con GTM activo la web no carga gtag directo y publica eventos en `dataLayer`. Meta Pixel opcional.
- **Consecuencias:** cambios de etiquetas sin redeploy; las variables `NEXT_PUBLIC_*` son build-time y requieren reconstruir la imagen `web`.

## ADR-005 — Resend para correo transaccional (2026-11)

- **Decisión:** Resend con dominio `elevari.live` verificado solo para envío (región `sa-east-1`). Remitente `Elevari <reserve@elevari.live>`. La recepción sigue en GoDaddy (buzón `reserve@elevari.live`); no se añade MX de Resend.
- **Consecuencias:** SPF/DKIM de Resend conviven con el correo de GoDaddy; no tocar MX/SPF/DMARC de GoDaddy.

## ADR-006 — Un solo dominio, sin subdominio `api` (2026-11)

- **Decisión:** web en `/`, API en `/api/v1/*`, health en `/health` bajo `https://elevari.live`; media en `https://media.elevari.live/elevari-media/*`. `www` redirige al apex.
- **Consecuencias:** sin CORS entre web y API en el navegador; reglas de Cloudflare por ruta (`/api/*` sin caché); `NEXT_PUBLIC_API_URL=https://elevari.live`.

## ADR-007 — Alcance Android-only (2026-11)

- **Decisión:** producción = web + Android (`elevari.androidapp`). iOS fuera de alcance: se eliminó la ruta `apple-app-site-association` y las variables `APPLE_TEAM_ID` / `IOS_BUNDLE_ID` ya no existen.
- **Consecuencias:** solo se sirve Digital Asset Links (`assetlinks.json`); no se publica ni prueba nada para iOS.

## ADR-008 — Expo Push + Firebase en móvil (2026-11)

- **Decisión:** analítica con `@react-native-firebase` (proyecto `elevari`; `google-services.json` no se versiona) y push con `expo-notifications` (Expo Push). Push **deshabilitado** hasta que exista un `projectId` real de EAS y un endpoint de la API para registrar tokens.
- **Consecuencias:** `projectId` de EAS = UUID real (pendiente de login del propietario); endpoint de registro de tokens pendiente en el roadmap. La app autentica con Turnstile mediante un widget en WebView.

## ADR-009 — Play App Signing con llave de subida (2026-11)

- **Decisión:** el AAB se firma con una **llave de subida** (keystore fuera del repo). Google conserva la llave de firma de la app; su SHA-256 va en `ANDROID_SHA256_CERT_FINGERPRINTS` y se sirve en `/.well-known/assetlinks.json`.
- **Consecuencias:** si se pierde la llave de subida, se solicita reseteo a Google Play; el keystore y sus claves viven en el gestor de contraseñas del propietario.

## ADR-010 — Solo producción (sin staging) (2026-11)

- **Decisión:** no se mantiene entorno staging (se eliminaron `docker-compose.staging.yml`, plantilla de env y nginx de staging y sus scripts de despliegue). Las pruebas previas se hacen en local con el quality gate; el despliegue es directo a producción con rollback por git (ver [docs/RUNBOOK.md](docs/RUNBOOK.md)). `validate-env.sh` es solo de producción y estricto.
- **Consecuencias:** disciplina de gate antes de cada push; cuentas demo (`@elevari.local`) bloqueadas en producción; el seed demo se niega a correr con `NODE_ENV=production` (salvo `ALLOW_DEMO_SEED=true`, nunca usar). Datos iniciales de producción: `npm run create-admin` y `npm run seed:property` en el contenedor `api` (sin usuarios demo ni reseñas).

## ADR-011 — nginx termina TLS en el origen (2026-11)

- **Decisión:** nginx sirve 443 con el Cloudflare Origin Certificate montado desde `/etc/ssl/elevari/`; 80 redirige a HTTPS salvo `/health`; `cloudflare-ips.conf` restaura la IP real; hosts: apex (web + API), `www` → 301, `media` → MinIO (GET/HEAD).
- **Consecuencias:** habilita `full (strict)` y restringir 80/443 a Cloudflare en el cutover; el certificado y su llave solo existen en el servidor.

## ADR-012 — Postgres 16 + Prisma + MinIO autoalojados (2026-11)

- **Decisión:** base de datos y almacenamiento S3-compatible en el mismo servidor (contenedores), con `pg_dump` diario y Backups de Hetzner.
- **Consecuencias:** sin réplica ni failover; RPO ≈ 24 h (dump) / snapshot de Hetzner.

## Decisiones previas vigentes

- API Fastify separada de Next.js (equipos y despliegues independientes del renderizado).
- Montos en COP con unidades menores (centavos) y fee de plataforma configurable (`PLATFORM_FEE_PERCENT`, 15 % por defecto).
- Disponibilidad con restricción de no-solape en base de datos (migración `availability_no_overlap`).
- Sincronización iCal con OTAs mediante job periódico.
