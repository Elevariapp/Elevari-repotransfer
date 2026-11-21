# Mapa de credenciales — Elevari

Última validación: 2026-11-21 · rama chore/elevari-production

Qué servicio usa cada variable. **Sin valores secretos**: los valores viven en el gestor de contraseñas «Elevari» y en el entorno de producción del servidor ([RUNBOOK.md](RUNBOOK.md)). Cualquier credencial expuesta durante el montaje se rota tras el go-live ([HANDOVER.md](HANDOVER.md)).

| Servicio | Variables | Estado |
|----------|-----------|--------|
| Wompi (único proveedor live) | `PAYMENTS_MODE`, `PAYMENTS_WOMPI_ENABLED`, `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`, `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Llaves live pendientes en servidor |
| Alegra | `ALEGRA_EMAIL`, `ALEGRA_API_TOKEN` | Pendiente |
| Resend | `RESEND_API_KEY`, `RESEND_FROM` | Dominio verificado; ver [RESEND_SETUP.md](RESEND_SETUP.md) |
| Cloudflare Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (pública), `TURNSTILE_SECRET_KEY` | Activo; obligatorio en producción |
| Google Tag Manager / GA4 | `NEXT_PUBLIC_GTM_ID` (`GTM-PXVGFFMK`), `NEXT_PUBLIC_GA_MEASUREMENT_ID` (`G-W4QC0NYBVJ`) | Activo; build-time |
| Meta Pixel (opcional) | `NEXT_PUBLIC_META_PIXEL_ID`, `META_PIXEL_ID`, `META_ACCESS_TOKEN` (CAPI) | Opcional |
| Google Sign-In (opcional) | `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID` | Opcional |
| Sentry (opcional) | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | No instalado |
| Android / Digital Asset Links | `ANDROID_SHA256_CERT_FINGERPRINTS`, `ANDROID_PACKAGE_NAME` | Falta la huella de Play App Signing |
| Firma Android | `ELEVARI_UPLOAD_STORE_FILE`, `ELEVARI_UPLOAD_STORE_PASSWORD`, `ELEVARI_UPLOAD_KEY_ALIAS`, `ELEVARI_UPLOAD_KEY_PASSWORD` (propiedades de Gradle en el PC del propietario) | Configuradas |
| Núcleo | `JWT_SECRET`, `POSTGRES_*`, `MINIO_*`, `CORS_ORIGIN`, `DISABLE_DEMO_ACCOUNTS` | Ver [deploy/DEPLOYMENT_PRODUCTION.md](../deploy/DEPLOYMENT_PRODUCTION.md) |
| Bootstrap | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RESET_PASSWORD`, `HOST_EMAIL` | Solo al ejecutar `create-admin` / `seed:property` |
| Agentes / operación | `CLOUDFLARE_API_TOKEN`, `HETZNER_API_TOKEN`, `RESEND_API_KEY` | Se leen del entorno de quien opera; nunca de archivos del repo |
| Legacy (deshabilitado) | `PAYMENTS_BOLD_ENABLED`, `PAYMENTS_STRIPE_ENABLED`, `BOLD_*`, `STRIPE_*` | Código legacy; no usar |

Plantillas de nombres: `deploy/.env.production.example`, `.env.example`, `api/.env.example`, `mobile/.env.example`.

## Cloudflare Turnstile

Widget «Elevari Web». La sitekey es pública (viaja en el HTML) y está en `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: `0x4AAAAAAGL6Nkc1KmMspy5d`. El secret solo existe en `TURNSTILE_SECRET_KEY` del servidor. Hostnames del widget: `elevari.live` (y `localhost` para desarrollo). La app Android obtiene el token con un widget dentro de un WebView. Rotación: [RUNBOOK.md](RUNBOOK.md) §6.

## Google

- **GTM** `GTM-PXVGFFMK` contiene el tag de Google para GA4 `G-W4QC0NYBVJ`. Con GTM activo la web no carga gtag directo.
- **Google Sign-In** (opcional): autorizar `https://elevari.live` en los JavaScript origins del cliente OAuth.
- **Firebase** (proyecto `elevari`): app `elevari.androidapp` con las huellas SHA-1/SHA-256 de la llave de subida y de Play App Signing; `google-services.json` no se versiona.

## Alegra

`ALEGRA_EMAIL` (correo de la cuenta Alegra) y `ALEGRA_API_TOKEN`. Si falla la emisión, la factura queda en `pending_invoices` (reintento por un admin).

## Seguridad

Si una credencial se comparte en un chat o se commitea, se considera comprometida: rotarla ([RUNBOOK.md](RUNBOOK.md) §6 y §10).
