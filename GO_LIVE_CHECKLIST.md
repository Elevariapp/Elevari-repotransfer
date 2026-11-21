# GO_LIVE_CHECKLIST — Lanzamiento a producción

Última validación: 2026-11-21 · rama chore/elevari-production

Fuente única del estado de lanzamiento (web + Android, solo producción). `[x]` = hecho y verificado; `[ ]` = pendiente. Procedimientos: [docs/RUNBOOK.md](docs/RUNBOOK.md). Inventario de cuentas: [docs/HANDOVER.md](docs/HANDOVER.md).

## 1. Código y quality gate

CI (`.github/workflows/ci.yml`) corre builds, typecheck móvil y `npm run docs:lint`; no sustituye el gate local.

- [x] Monorepo web + API + móvil con arquitectura documentada ([ARCHITECTURE.md](ARCHITECTURE.md))
- [ ] Quality gate completo sobre el commit exacto que se despliega ([COMMANDS.md](COMMANDS.md)):
  - [ ] `npx tsc --noEmit` (raíz), `cd api && npx tsc --noEmit`, `cd mobile && npx tsc --noEmit`
  - [ ] `npx next build` compila aunque `NEXT_PUBLIC_API_URL` apunte a una URL inalcanzable
  - [ ] `docker compose -f docker-compose.prod.yml --env-file <env> build`
  - [ ] `cd mobile/android && .\gradlew.bat bundleRelease --no-daemon --max-workers=1`
  - [ ] `npm run docs:lint`

## 2. Servidor Hetzner (`ubuntu-8gb-hel1-2`, `<SERVER_IP>`)

- [x] Ubuntu 26.04, Docker 29 + Compose v2, directorio `/opt/elevari` (usuario `deploy`)
- [x] SSH solo con llave; usuario `deploy` (sudo, docker)
- [x] `ufw` 22/80/443, `fail2ban` sshd, `unattended-upgrades`, swap 2 GB, rotación de logs Docker
- [x] `/opt/elevari/.env.production` (chmod 600) fuera de git
- [x] Backup diario `pg_dump` 03:00 (14 días) + Hetzner Backups
- [x] Stack prod: postgres 16, redis 7, minio, api, web, nginx
- [ ] Probar una restauración de backup de extremo a extremo (`restore-db.sh`)

## 3. Cloudflare y DNS

- [x] Zona `elevari.live` activa; nameservers `fish` y `patryk`
- [x] Always HTTPS, TLS ≥ 1.2, TLS 1.3, HTTP/3, HSTS 6 meses
- [x] Bot Fight Mode, Managed Free Ruleset, regla WAF custom, rate limit `/api/v1/auth/*`, cache bypass `/api/*` y `/health`
- [x] Turnstile «Elevari Web» y Web Analytics
- [x] DNSSEC: DS publicado en GoDaddy
- [ ] DNSSEC en estado *active* en Cloudflare (esperar propagación)
- [ ] **Cutover DNS:** registros A `elevari.live`, `www`, `media` → `<SERVER_IP>` (proxied)
- [x] nginx termina TLS en 443 con el Origin Certificate (`/etc/ssl/elevari/`), 80 redirige a HTTPS salvo `/health`, `www` → apex, `media` → MinIO
- [ ] Verificar el Origin Certificate en el servidor tras el cutover (`curl -vI --resolve elevari.live:443:<SERVER_IP> https://elevari.live/health`)
- [ ] Cambiar SSL a `full (strict)`
- [ ] Restringir 80/443 en `ufw` a rangos IP de Cloudflare (mantener sincronizado `deploy/nginx/cloudflare-ips.conf`)
- [ ] Verificar que `media.elevari.live/elevari-media/*` sirve el bucket público
- [ ] HSTS a 1 año + `includeSubDomains` (sin preload hasta verificar)

## 4. Correo

- [x] Resend: dominio `elevari.live` verificado (DKIM, return-path), región `sa-east-1`
- [x] Buzón `reserve@elevari.live` en GoDaddy (MX/SPF/DMARC intactos)
- [ ] Prueba real: recuperación de contraseña y confirmación de reserva llegan a bandeja (no spam)
- [ ] Ajustar `RESEND_FROM="Elevari <reserve@elevari.live>"` en `/opt/elevari/.env.production` si difiere

## 5. Pagos y facturación

- [x] Wompi es el único proveedor (`PAYMENTS_WOMPI_ENABLED=true`; Bold y Stripe deshabilitados)
- [ ] Llaves live de Wompi en el servidor (`WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`, `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`) y rebuild de `web`
- [ ] Webhook en el panel de Wompi: `https://elevari.live/api/v1/webhooks/wompi`
- [ ] Pago real de bajo monto: reserva `confirmed`, correo recibido, webhook 200
- [ ] Alegra: `ALEGRA_EMAIL` y `ALEGRA_API_TOKEN` en el servidor; factura emitida (o en `pending_invoices` con reintento admin)
- [ ] Confirmar los hechos UNVERIFIED de `verification-log.md` con el primer pago real

## 6. Cuentas y acceso

- [x] Cuentas demo (`@elevari.local`) bloqueadas en producción; el seed demo se niega a correr (`ALLOW_DEMO_SEED` no se usa nunca)
- [ ] `deploy/scripts/validate-env.sh` pasa sobre `/opt/elevari/.env.production` (incluye `DISABLE_DEMO_ACCOUNTS=true`, `JWT_SECRET` ≥ 32, Turnstile, Resend)
- [ ] Primer admin: `npm run create-admin` en el contenedor `api` (`ADMIN_EMAIL`=reserve@elevari.live, `ADMIN_PASSWORD` ≥ 12 caracteres)
- [ ] Publicar «Glamping Waná»: `npm run seed:property` (`HOST_EMAIL`; sin usuarios demo ni reseñas)
- [ ] `MEDIA_AUTO_APPROVE=false` confirmado en el servidor
- [ ] Flujo anfitrión: subir imagen → aprobación admin → visible en galería

## 7. Analítica

- [x] GTM-PXVGFFMK con Google tag GA4 `G-W4QC0NYBVJ` (build-time)
- [ ] Verificar eventos en GA4 DebugView tras el cutover
- [ ] (Opcional) Meta Pixel: `NEXT_PUBLIC_META_PIXEL_ID` y rebuild

## 8. Android

- [x] Paquete `elevari.androidapp`; AAB de release firmado con llave de subida
- [x] Firebase: app con SHA-1/SHA-256 de la llave de subida y de Play App Signing
- [ ] Play Console (organización): Internal testing con el AAB
- [ ] SHA-256 de Play App Signing en `ANDROID_SHA256_CERT_FINGERPRINTS` y rebuild/restart; verificar `https://elevari.live/.well-known/assetlinks.json`
- [ ] Verificar deep links `https://elevari.live` (autoVerify) en un dispositivo
- [ ] `projectId` real de EAS (login del propietario) y endpoint de API para registrar tokens → habilitar push (hoy deshabilitado)
- [ ] Verificar login/registro en la app (widget Turnstile en WebView) contra `https://elevari.live/api/v1`
- [ ] APK de prueba vía Firebase App Distribution
- [ ] Play Console: promover a **Producción**

## 9. SEO y descubrimiento

- [ ] Google Search Console: verificar `elevari.live` y enviar `sitemap.xml`
- [ ] Google Safe Browsing: confirmar sin alertas
- [ ] Bing Webmaster Tools
- [ ] Google Business Profile

## 10. Verificación post-cutover

```bash
curl -s https://elevari.live/health
curl -sI https://elevari.live/properties
curl -sI https://elevari.live/sitemap.xml
curl -sI https://www.elevari.live          # redirige al apex
```

- [ ] `/health` → `status: ok`, `database: connected`
- [ ] `/properties` y `/sitemap.xml` → 200
- [ ] Registro/login con Turnstile funcionando
- [ ] Reserva completa de punta a punta (sección 5)
- [ ] Rutas bloqueadas por WAF (`/.env`, `/wp-login`) devuelven bloqueo de Cloudflare
- [ ] Lighthouse y a11y sin regresiones ([PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md), [ACCESSIBILITY_GUIDE.md](ACCESSIBILITY_GUIDE.md))

## 11. Seguridad final

- [ ] **Rotación de credenciales expuestas** (ver «Rotación pendiente» en [docs/HANDOVER.md](docs/HANDOVER.md)): token de API de Cloudflare, llaves S3 de R2, token de API de Hetzner, llave de Resend
- [ ] `.env.production` no está en git (`git check-ignore .env.production`)
- [ ] `JWT_SECRET`, `POSTGRES_PASSWORD`, `MINIO_SECRET_KEY` únicos y guardados en el gestor de contraseñas
- [ ] Monitoreo externo de `/health` con alerta

## Rollback

Rollback de aplicación, de DNS y restauración de base de datos: [docs/RUNBOOK.md](docs/RUNBOOK.md).
