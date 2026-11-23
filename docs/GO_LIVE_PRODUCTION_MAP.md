# Elevari — Mapa go-live producción

**Última actualización:** Jul 2026  
**Estado actual:** `https://elevari.live` · `PAYMENTS_MODE=mock` · pre-live operativo  
**Objetivo:** lanzar cobro real sin sorpresas (Wompi es el único proveedor de pagos)

Leyenda: `[ ]` pendiente · `[x]` hecho · `⏸` bloqueado por dependencia externa

---

## Resumen rápido

| Fase | Requiere keys pago | Puede hacerse ya |
|------|-------------------|------------------|
| Sprint 1 — Confianza | No | Resend, backups, secrets |
| Sprint 2 — Negocio | No | OTA iCal, legal, contenido |
| Sprint 3 — Cobro live | **Sí** | Wompi, Alegra |

---

## Sprint 1 — Confianza (esta semana, sin pagos)

### Emails transaccionales (Resend)

- [ ] Crear cuenta / proyecto en [Resend](https://resend.com)
- [ ] Añadir dominio **`elevari.live`** → copiar registros DNS (SPF, DKIM) en Cloudflare
- [ ] Esperar verificación verde en Resend
- [ ] En VPS `.env.staging` (o `.env.production`):
  ```bash
  RESEND_API_KEY=re_...
  RESEND_FROM="Elevari <reserve@elevari.live>"
  ```
- [ ] Redeploy: `npm run go-live:remote`
- [ ] Probar correos con email real (no `@elevari.live`):
  - [ ] Registro → bienvenida
  - [ ] Olvidé contraseña → reset
  - [ ] Cambio contraseña → confirmación seguridad
  - [ ] Reserva mock confirmada → confirmación + comprobante
  - [ ] Cancelar reserva → cancelación
  - [ ] Reserva con check-in mañana → recordatorio (job ~6 h)

Referencia: `docs/RESEND_SETUP.md`

### Seguridad y operación

- [ ] Rotar `JWT_SECRET` (mín. 32 chars) — **mismo valor** en API y web
- [ ] Rotar `POSTGRES_PASSWORD` + actualizar `DATABASE_URL` en stack
- [ ] Rotar `MINIO_SECRET_KEY`
- [ ] Confirmar `SMOKE_AUTH_SECRET` no expuesto en repos públicos
- [ ] Activar backups DB en VPS (cron diario):
  ```bash
  # Ejemplo crontab en el Droplet
  0 3 * * * /opt/elevari/deploy/scripts/backup-db.sh
  ```
- [ ] Probar restore de un backup (descargar + verificar dump)

### Cloudflare / auth

- [ ] Turnstile: hostnames `elevari.live`, `www.elevari.live` en el widget
- [ ] SSL Cloudflare: **Flexible** o **Full** según nginx (actualmente OK)
- [ ] Google OAuth (si aplica): URIs autorizadas con `https://elevari.live`

---

## Sprint 2 — Negocio (sin pagos)

### Contenido Glamping Waná

- [ ] Fotos reales en `public/properties/glamping-wana/` o MinIO aprobado
- [ ] Copy actualizado (descripción, amenidades, reglas casa)
- [ ] Precio por noche correcto en admin/DB
- [ ] FAQ alineado con política cancelación *moderate* (código en `api/src/lib/cancellation-policy.ts`)

### Legal

- [ ] Revisión abogado: `/legal/terms`, `/legal/privacy`
- [ ] Política cancelación/reembolsos visible para huésped (FAQ + checkout)
- [ ] Datos responsable tratamiento (Elevari / contacto)

### Channel manager — Fase 1 (anti doble booking OTA)

- [ ] Acceso Airbnb + Booking.com del listing
- [ ] Obtener URLs **export iCal** (no pegar en git)
- [ ] En VPS:
  ```bash
  ICAL_SYNC_ENABLED=1
  ICAL_IMPORT_PROPERTY_SLUG=glamping-wana
  ICAL_IMPORT_AIRBNB_URL=https://...
  ICAL_IMPORT_BOOKING_URL=https://...
  ICAL_SYNC_JOB_INTERVAL_MS=600000
  ```
- [ ] Redeploy + migraciones al día
- [ ] Prueba: bloquear 2 noches en Airbnb → en ≤10 min no reservable en Elevari

### Moderación y calidad

- [ ] `MEDIA_AUTO_APPROVE=false` antes de abrir a más anfitriones
- [ ] Flujo admin moderación probado (`/admin/moderation`)

---

## Sprint 3 — Cobro live ⏸ (requiere Wompi)

### Pagos Colombia (Wompi)

- [ ] Cuenta Wompi aprobada + API keys producción
- [ ] `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`
- [ ] `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` en build web
- [ ] URL webhook: `https://elevari.live/api/v1/webhooks/wompi`
- [ ] Probar 1 pago COP real de bajo monto

### Facturación (Alegra / DIAN)

- [ ] `ALEGRA_EMAIL` + `ALEGRA_API_TOKEN` producción
- [ ] Resolución / numeración facturación configurada en Alegra
- [ ] Probar factura tras reserva confirmada COP
- [ ] Verificar correo comprobante + registro en admin invoices

### Cutover a producción real

- [ ] Crear `.env.production` desde `deploy/.env.production.example`
- [ ] URLs: `NEXT_PUBLIC_SITE_URL=https://elevari.live` (sin `/api/v1`)
- [ ] `PAYMENTS_MODE=live`
- [ ] `npm run go-live:validate` (sin errores)
- [ ] Subir `.env.production` al servidor: `scp .env.production root@2.29.165.225:/opt/elevari/.env.production`
- [ ] Añadir secrets en GitHub (Settings → Secrets and variables → Actions):
  - `HETZNER_IP` = `2.29.165.225`
  - `HETZNER_USER` = `root`
  - `HETZNER_SSH_KEY` = contenido completo de `~/.ssh/id_ed25519_elevari_hetzner`
- [ ] Push a `b-main` (despliegue automático vía GitHub Actions) o clic en **Actions → Deploy to Hetzner Production → Run workflow**
- [ ] Desactivar / no usar cuentas `@elevari.live` (auto-bloqueadas en live)
- [ ] Smoke manual: registro → reserva → pago → email → factura

---

## Post-launch (nice-to-have)

- [ ] `SENTRY_DSN` — errores API/web
- [ ] Google Analytics `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [ ] Meta Pixel + CAPI (`META_PIXEL_ID`, `META_ACCESS_TOKEN`)
- [ ] OG images por propiedad (SEO / WhatsApp preview)
- [ ] Fase 2 iCal: export Elevari → import en Airbnb/Booking
- [ ] Panel host: estado sync calendario (Fase 3 CM)
- [ ] Merge rama feature → `main` + push GitHub
- [ ] Segunda propiedad onboarded

---

## Variables de entorno — referencia rápida

| Variable | Sprint | Obligatorio live |
|----------|--------|------------------|
| `JWT_SECRET`, `POSTGRES_*`, `CORS_ORIGIN` | 1 | Sí |
| `RESEND_*` | 1 | Sí (emails) |
| `NEXT_PUBLIC_TURNSTILE_*`, `TURNSTILE_SECRET_KEY` | 1 | Sí (auth) |
| `ICAL_*` | 2 | Recomendado (1 propiedad multi-OTA) |
| `MEDIA_AUTO_APPROVE=false` | 2 | Sí |
| `WOMPI_*` | 3 | Sí (cobro) |
| `ALEGRA_*` | 3 | Sí (COP + factura) |
| `PAYMENTS_MODE=live` | 3 | Sí |

Plantillas: `deploy/.env.staging.example`, `deploy/.env.production.example`

---

## Comandos útiles

```bash
# Validar env staging (mock OK)
npm run go-live:validate:staging

# Validar env producción (exige keys pago)
npm run go-live:validate

# Deploy actual (staging con dominio)
npm run go-live:remote

# Health
BASE_URL=https://elevari.live ./deploy/scripts/verify-health.sh

# Smoke reserva mock (requiere SMOKE_AUTH_SECRET en API)
npm run go-live:smoke:mock
```

---

## Qué ya está listo (no rehacer)

- [x] Infra VPS + Docker + nginx + HTTPS `elevari.live`
- [x] API Fastify + JWT + Turnstile (fixes recientes)
- [x] Booking engine + anti double-booking DB
- [x] Checkout mock Wompi
- [x] 7 emails HTML transaccionales (código)
- [x] UX errores fechas en español
- [x] Código sync iCal Fase 1 (pendiente URLs OTA)
- [x] Admin: propiedades, reservas, moderación

---

## Orden recomendado si solo tienes 1 hora hoy

1. Verificar dominio Resend → probar registro con tu Gmail  
2. Cron backup DB  
3. Anotar URLs iCal cuando tengas acceso Airbnb/Booking  

Wompi puede esperar; **emails + backups + OTA** no deberían.

---

## Mantenimiento

Actualizar casillas `[ ]` → `[x]` tras cada sprint. Enlazar PR/commit cuando aplique.
