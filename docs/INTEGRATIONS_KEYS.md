# Mapa de credenciales — Waná

Referencia de qué servicio usa cada variable (sin valores secretos).

| Servicio | Variables en `.env.staging` | Estado en código |
|----------|----------------------------|------------------|
| **Cloudflare Turnstile** | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | ✅ Widget login/registro + validación API |
| **Resend** | `RESEND_API_KEY`, `RESEND_FROM` | ✅ Emails reset + confirmación reserva |
| **Google OAuth** | `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ✅ Google Identity Services + `POST /auth/google` |
| **Meta / Facebook** | `META_APP_ID`, `META_APP_SECRET`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_PIXEL_ID` | ✅ Pixel en web; CAPI necesita `META_ACCESS_TOKEN` |
| **Sentry** | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | 📋 Variables listas; instalar `@sentry/nextjs` en próximo deploy |
| **Alegra** | `ALEGRA_EMAIL`, `ALEGRA_API_TOKEN`, `ALEGRA_TEST_SET_ID` | ⚠️ Falta `ALEGRA_EMAIL` (login Alegra) |

## Cloudflare Turnstile

- **Site key** (pública): `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — widget en login/registro.
- **Secret key** (privada): `TURNSTILE_SECRET_KEY` — validación en API.
- Dashboard: [Cloudflare → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)

**Hostnames obligatorios en el widget:**

| Hostname |
|----------|
| `eleveri.app` |
| `www.eleveri.app` |
| `localhost` (desarrollo) |

Tras crear keys nuevas, actualiza `.env.staging` y redeploy (`npm run go-live:remote`).

Bypass temporal (solo debug): `TURNSTILE_DISABLED=1` y `NEXT_PUBLIC_TURNSTILE_DISABLED=1` en `.env.staging`.

## Resend

- **API key** `re_…`: envío de correos.
- **`RESEND_FROM`**: debe ser dominio verificado en Resend; en staging usamos `onboarding@resend.dev` (solo pruebas).

## Google Cloud Console

- **Client ID** + **Client secret**: login con Google (Identity Services, credential JWT).
- En Google Console → Credentials → OAuth client, autorizar **JavaScript origins**:
  - `https://eleveri.app`
  - `https://www.eleveri.app`
  - `http://localhost:3000` (local)
- No hace falta redirect URI para el flujo actual (One Tap / botón GIS).

## Facebook

- **App ID** + **App secret**: app Meta Developers.
- **Pixel** (web): `NEXT_PUBLIC_META_PIXEL_ID` ya configurado con el App ID si coincide con tu pixel.
- **CAPI** (server): necesitas un **Access Token** de larga duración → `META_ACCESS_TOKEN` (distinto del app secret).

## Sentry

- **DSN**: URL de ingest del proyecto Sentry.

## Alegra

- **API token** (`clave`): autenticación API.
- **Email** (`ALEGRA_EMAIL`): email de tu cuenta Alegra (obligatorio para API).
- **TestSetId**: set de pruebas facturación electrónica Colombia.

## Seguridad

Si compartiste claves en chat, **rota** las que puedas en cada panel (Resend, Cloudflare, Google, Meta, Alegra) después del deploy.
