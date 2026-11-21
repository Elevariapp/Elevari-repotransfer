# DOMAIN_STATUS — Estado real por dominio

Última validación: 2026-11-21 · rama chore/elevari-production

Leyenda: **Listo** = en código y verificado; **Parcial** = existe pero con pendientes; **Pendiente** = falta acción externa o de despliegue.

## Producto

| Dominio | Estado | Detalle |
|---------|--------|---------|
| Catálogo y búsqueda | Listo | `properties`, filtros, SEO (`sitemap`, `robots`, JSON-LD) |
| Reservas | Listo | estados, expiración de pendientes por job, restricción de no-solape en BD |
| Pagos (Wompi) | Parcial | Código completo (intent, webhook con checksum, reembolsos, FX COP/USD). **Llaves live y webhook pendientes en servidor** |
| Facturación (Alegra) | Parcial | Código y cola `pending_invoices` con reintento admin. **Credenciales pendientes** |
| Auth | Listo | JWT, registro/login, reset de contraseña por correo, Google Sign-In opcional, Turnstile obligatorio en producción. Cuentas `@elevari.local` bloqueadas |
| Datos iniciales | Pendiente | `create-admin` y `seed:property` aún por ejecutar en el servidor |
| Panel anfitrión | Listo | alta de propiedades, media, reservas, analítica, sync iCal |
| Panel admin | Listo | analítica, auditoría, reservas, contenido, facturas, moderación, propiedades, usuarios |
| Media | Listo | MinIO + `sharp`; nginx sirve `media.elevari.live/elevari-media/*` (GET/HEAD). Verificar de punta a punta tras el cutover DNS |
| Correo (Resend) | Listo | dominio verificado para envío; plantillas de confirmación, reset, recordatorio de check-in, recibo |
| Analítica | Listo | GTM-PXVGFFMK + GA4 G-W4QC0NYBVJ, Cloudflare Web Analytics; Meta Pixel opcional |
| Legal y cumplimiento | Listo | páginas `legal/*` (términos, privacidad, reembolso, eliminación de cuenta, moderación, accesibilidad, contacto); Ley 1581 de 2012; contacto reserve@elevari.live |
| Marca / diseño / a11y | Listo | ver `BRAND_SYSTEM.md`, `DESIGN_SYSTEM.md`, `ACCESSIBILITY_GUIDE.md` |

## Móvil (Android)

| Dominio | Estado | Detalle |
|---------|--------|---------|
| App `elevari.androidapp` | Listo | rutas guest/host/auth/legal con Expo Router; build `bundleRelease` documentado en `mobile/RELEASE.md` |
| Firma de release | Listo | llave de subida (keystore fuera del repo) |
| Firebase | Listo | app registrada con SHA-1/SHA-256 de la llave de subida y de Play App Signing |
| Push | Pendiente | deshabilitado hasta tener `projectId` real de EAS (login del propietario) y un endpoint de la API para registrar tokens |
| Auth móvil | Listo | API `https://elevari.live/api/v1`; login/registro obtienen el token de Turnstile con un widget WebView |
| Play Console | Pendiente | Internal testing → Producción (cuenta de organización); SHA-256 de Play App Signing a `ANDROID_SHA256_CERT_FINGERPRINTS` |
| Deep links | Pendiente | `autoVerify` configurado para `https://elevari.live`; requiere `assetlinks.json` con la huella de Play |
| iOS | Fuera de alcance | — |

## Infraestructura y operación

| Dominio | Estado | Detalle |
|---------|--------|---------|
| Servidor Hetzner | Listo | hardening, Docker, swap, ufw, fail2ban, backups |
| Stack Docker prod | Listo | postgres, redis, minio, api, web, nginx (443 con Origin Certificate, `www` → apex, `media` → MinIO) |
| Cloudflare | Parcial | zona y reglas aplicadas; DNSSEC pendiente de propagar |
| DNS A (apex/www/media) | Pendiente | cutover gated |
| SSL `full (strict)` | Pendiente | nginx ya sirve el Origin Certificate; falta cambiar el modo en Cloudflare en el cutover |
| Restricción 80/443 a Cloudflare | Pendiente | tras el cutover |
| HSTS 1 año | Pendiente | tras verificar lanzamiento |
| Backups | Listo | cron 03:00 (14 días) + Hetzner Backups |
| Monitoreo externo (uptime/errores) | Pendiente | opcional: `SENTRY_DSN`, ping a `/health` |

## SEO / descubrimiento

Search Console, Safe Browsing, Bing Webmaster y Google Business Profile: pendientes (ver [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md)).

## Documentos relacionados

[ARCHITECTURE.md](ARCHITECTURE.md) · [INFRASTRUCTURE.md](INFRASTRUCTURE.md) · [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) · [ROADMAP.md](ROADMAP.md)
