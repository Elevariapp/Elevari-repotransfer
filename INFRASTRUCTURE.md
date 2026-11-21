# INFRASTRUCTURE — Infraestructura de producción

Última validación: 2026-11-21 · rama chore/elevari-production

Solo existe producción. No hay staging.

> Este repositorio es **público**. Los valores reales (IP, ids de Hetzner/Cloudflare/Resend, etc.) están en `docs/HANDOVER.private.md` (archivo local, NO versionado; guardado en el gestor de contraseñas «Elevari»). Aquí se usan placeholders: `<SERVER_IP>`, `<CF_ACCOUNT_ID>`, `<CF_ZONE_ID>`, `<HETZNER_SERVER_ID>`.

## Servidor

| Ítem | Valor |
|------|-------|
| Proveedor | Hetzner Cloud (el proyecto puede contener otros servidores ajenos a Elevari: **no se tocan**; operar solo por id/alias del servidor de Elevari) |
| Servidor | `ubuntu-8gb-hel1-2` (id `<HETZNER_SERVER_ID>`), Helsinki `hel1` |
| Tipo | cpx32 — 4 vCPU / 8 GB RAM / 160 GB disco |
| SO | Ubuntu 26.04 |
| IPv4 | `<SERVER_IP>` |
| Runtime | Docker 29 + Compose v2 |
| Directorio de la app | `/opt/elevari` (propietario: usuario `deploy`) |
| Env de producción | `/opt/elevari/.env.production` (chmod 600, nunca en git; plantilla `deploy/.env.production.example`) |

## Stack (`docker-compose.prod.yml`)

| Servicio | Imagen / build | Notas |
|----------|----------------|-------|
| `postgres` | `postgres:16-alpine` | volumen `elevari_pg_data`, healthcheck `pg_isready` |
| `redis` | `redis:7-alpine` | AOF activado, volumen `elevari_redis_data` |
| `minio` | `minio/minio:latest` | volumen `elevari_minio_data`; consola :9001 solo interna |
| `minio-init` | `minio/mc:latest` | crea el bucket `MINIO_BUCKET` y lo marca lectura anónima |
| `api` | `./api/Dockerfile` | ejecuta `prisma migrate deploy` al arrancar; puerto 4000 interno |
| `web` | `./Dockerfile` | Next standalone, puerto 3000 interno; `NEXT_PUBLIC_*` como build args |
| `nginx` | `nginx:1.27-alpine` | publica 80 y 443; `deploy/nginx/nginx.conf` + `deploy/nginx/cloudflare-ips.conf`; certificado montado desde `/etc/ssl/elevari/` (`origin.pem`, `origin.key`) |

Todos con `restart: unless-stopped` en la red interna `elevari_internal`.

## Hardening del servidor

- SSH solo con llave (login por contraseña y root con contraseña deshabilitados; drop-in `/etc/ssh/sshd_config.d/00-elevari-hardening.conf`).
- Usuario `deploy` (sudo, grupo docker). Acceso: `ssh deploy@<SERVER_IP>` con la llave SSH ed25519 del propietario (el alias local `elevari-hetzner` entra como root y se usa solo para administración).
- `ufw`: 22/80/443 abiertos; 80/443 se restringen luego a rangos IP de Cloudflare.
- `fail2ban` (sshd): 5 intentos/10 min, ban de 1 h.
- `unattended-upgrades` activo.
- Swap de 2 GB.
- Rotación de logs de Docker: 10 MB × 3 archivos.

## Backups

| Qué | Cómo |
|-----|------|
| PostgreSQL | cron diario 03:00 → `deploy/scripts/backup-db.sh` → `/opt/elevari/backups` (`elevari_*.sql.gz` + `.sha256`, retención 14 días) |
| Servidor completo | Hetzner Backups automáticos activados |
| Restauración | `deploy/scripts/restore-db.sh <archivo> --yes` (ver [docs/RUNBOOK.md](docs/RUNBOOK.md)) |

Los volúmenes de MinIO (media) están cubiertos solo por los Backups de Hetzner.

## Edge — Cloudflare (plan Free)

| Ítem | Valor |
|------|-------|
| Account id | `<CF_ACCOUNT_ID>` |
| Zona `elevari.live` | `<CF_ZONE_ID>` |
| Nameservers | `fish.ns.cloudflare.com`, `patryk.ns.cloudflare.com` |
| Registrador | GoDaddy (también aloja el buzón `reserve@elevari.live`; MX/SPF/DMARC de GoDaddy no se tocan; nunca añadir MX de recepción de Resend) |

Configuración aplicada:

- Always HTTPS, TLS mínimo 1.2, TLS 1.3, HTTP/3.
- HSTS 6 meses (pasar a 1 año + `includeSubDomains` tras verificar el lanzamiento; sin preload hasta entonces).
- Bot Fight Mode y Cloudflare Managed Free Ruleset.
- Regla WAF custom que bloquea rutas de escáneres: `/.env`, `/.git`, `/wp-admin`, `/wp-login`, `/xmlrpc.php`, `/phpmyadmin`, `/vendor/phpunit`, `/.aws`, `/cgi-bin`.
- Rate limit en `/api/v1/auth/*`: 20 req / 10 s por IP+colo.
- Cache bypass para `/api/*` y `/health`.
- DNSSEC: DS publicado en GoDaddy; el estado en Cloudflare queda *pending* hasta que propague.
- Turnstile: widget «Elevari Web», sitekey `0x4AAAAAAGL6Nkc1KmMspy5d` (pública); el secret vive solo en `TURNSTILE_SECRET_KEY` del servidor.
- Web Analytics (sin cookies).

SSL/TLS: modo `full` hoy → `full (strict)` en el cutover. nginx ya termina TLS en 443 con un **Origin Certificate** de Cloudflare (15 años; hosts `elevari.live` y `*.elevari.live`) montado desde `/etc/ssl/elevari/` (`origin.pem`, `origin.key`; la llave nunca sale del servidor, `chmod 600`). Hosts de nginx: `elevari.live` (web + API), `www` → 301 al apex, `media` → bucket MinIO `elevari-media` (solo GET/HEAD). El puerto 80 redirige a HTTPS salvo `/health`.

## DNS

| Registro | Destino | Estado |
|----------|---------|--------|
| A `elevari.live` | `<SERVER_IP>` (proxied) | cutover pendiente (paso gated) |
| A `www` | `<SERVER_IP>` (proxied) | cutover pendiente |
| A `media` | `<SERVER_IP>` (proxied) | cutover pendiente |
| MX / SPF / DMARC | GoDaddy (correo `reserve@elevari.live`) | intactos |
| DKIM `resend._domainkey`, return-path `send` / `rsend` | Resend | verificados |

Procedimiento de cutover y rollback: [docs/RUNBOOK.md](docs/RUNBOOK.md).

## Correo

Envío transaccional con Resend (dominio `elevari.live` verificado, región `sa-east-1`). Remitente: `Elevari <reserve@elevari.live>` (`RESEND_FROM`). Guía: [docs/RESEND_SETUP.md](docs/RESEND_SETUP.md).

## Otros servicios

| Servicio | Uso |
|----------|-----|
| Wompi | Único proveedor de pagos activo |
| Alegra | Facturación electrónica Colombia |
| Google (Firebase, GTM, GA4, Search Console, Play Console) | Analítica, push y distribución Android |
| Expo / EAS | Push y, opcionalmente, builds |
| GitHub (`Elevariapp/Elevari-repotransfer`) | Código y CI |

Inventario de cuentas y ubicación de secretos: [docs/HANDOVER.md](docs/HANDOVER.md).
