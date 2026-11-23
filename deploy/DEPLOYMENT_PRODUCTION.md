# Elevari — Production Deployment (Fase 6E)

Guía para desplegar el stack Docker en un VPS (Hetzner, DigitalOcean, etc.) con Nginx, PostgreSQL, Redis, MinIO, API Fastify, Next.js standalone y WhatsApp bot.

**Checklist completo:** `deploy/GO_LIVE_CHECKLIST.md`

## Despliegue automático (GitHub Actions + SSH)

Cada push a `b-main` ejecuta `.github/workflows/ci.yml`: build API/Web, check del bot, validación de env/compose, typecheck móvil y, si todo pasa, el job **Deploy to Hetzner Production** (`appleboy/ssh-action`) entra por SSH al VPS, hace `git reset --hard origin/b-main`, valida `.env.production` y ejecuta `deploy/scripts/deploy-prod.sh` (build + `up -d` de **web, api, bot, nginx**, con health checks que fallan el job si algo no responde). También manual: **Actions → CI → Run workflow** (rama `b-main`).

> **Costo de minutos:** los repos públicos tienen minutos ilimitados en runners de GitHub. En repos privados el pipeline ya está optimizado (cancelación de runs obsoletos, caché npm y `.next/cache`, EAS con `--no-wait`, build móvil solo si cambia `mobile/`). El build Docker pesado corre en tu VPS, no en GitHub.

### Secrets (Settings → Secrets and variables → Actions → *New repository secret*)

| Secret | Valor |
|--------|-------|
| `HETZNER_IP` | IP del VPS (ej. `2.29.165.225`) |
| `HETZNER_USER` | Usuario SSH (ej. `root`) |
| `HETZNER_SSH_KEY` | Clave **privada** completa (incluye `-----BEGIN/END-----`) |
| `EXPO_TOKEN` | Token de expo.dev → Account Settings → Access Tokens (opcional: sin él se omite el build Android) |

Crear una clave dedicada al deploy:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/elevari_deploy -C "github-actions-deploy" -N ""
ssh-copy-id -i ~/.ssh/elevari_deploy.pub root@<HETZNER_IP>   # o añade la .pub a ~/.ssh/authorized_keys
cat ~/.ssh/elevari_deploy                                   # → pegar en HETZNER_SSH_KEY
```

Con GitHub CLI: `gh secret set HETZNER_IP`, `gh secret set HETZNER_USER`, `gh secret set HETZNER_SSH_KEY < ~/.ssh/elevari_deploy`, `gh secret set EXPO_TOKEN`.

### Preparar el VPS una vez

```bash
git clone https://github.com/Elevariapp/Elevari-repotransfer.git /opt/elevari
cd /opt/elevari && git checkout b-main
cp deploy/.env.production.example .env.production   # editar: JWT_SECRET único, claves Wompi, WHATSAPP_*
chmod +x deploy/scripts/*.sh
```

`.env.production` **no** se sube a GitHub. Si vive solo en el servidor, `git reset --hard` no lo toca (está en `.gitignore`).

### Android (EAS)

El job `mobile-build-android` encola con EAS un AAB (`production`, Play Store) y un APK (`preview`, instalación directa). Descárgalos en https://expo.dev → proyecto → Builds. Se ejecuta solo si cambia `mobile/` o por *Run workflow*.

### WhatsApp bot

`elevari-bot/` se construye y arranca junto al resto del stack (servicio `bot` en `docker-compose.prod.yml`, puerto interno 3001). Nginx expone solo `/webhook/whatsapp` y `/bot/health`; `/chat` queda interno. Configura en Meta → WhatsApp → Webhook: `https://<dominio>/webhook/whatsapp` con el mismo `WHATSAPP_VERIFY_TOKEN` de `.env.production`.

### Validar localmente antes de hacer push

```bash
npm run hooks:install      # una vez: activa pre-push (corre ci:local)
npm run ci:local           # typechecks web/mobile/api, env staging, log, bot, compose
npm run ci:local:full      # + lockfiles con npm 10 y builds reales de api y web
```

> Los lockfiles deben generarse con npm 10 (el de Node 22 en CI): `npx npm@10 install --package-lock-only` dentro de la carpeta correspondiente. Un lockfile de npm 11 puede romper `npm ci` en CI.

## Arquitectura

```
Internet → Cloudflare (SSL) → Nginx (:80) → web (:3000) | api (:4000) | bot (:3001)
                                    ↓
              postgres · redis · minio (red interna)
```

## Requisitos

- VPS: 2 vCPU, 4 GB RAM mínimo (8 GB recomendado con MinIO)
- Docker 24+ y Docker Compose v2
- Dominio apuntando al VPS (A record)
- Cloudflare o Certbot para TLS (con el nginx actual, solo HTTP en :80: Cloudflare proxy + SSL *Flexible*; ver sección 5)

## 1. Preparar servidor

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
```

## 2. Clonar y configurar

```bash
git clone <repo-url> elevari && cd elevari
cp deploy/.env.production.example .env.production
# Editar .env.production — contraseñas, JWT, keys Wompi, Alegra
```

Variables críticas:
| Variable | Uso |
|----------|-----|
| `POSTGRES_PASSWORD` | Base de datos |
| `JWT_SECRET` | Auth (min 32 caracteres) |
| `NEXT_PUBLIC_API_URL` | `https://tu-dominio` (sin `/api/v1`) |
| `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET` | Pagos Wompi (COP) |
| `ALEGRA_EMAIL` + `ALEGRA_API_TOKEN` | Facturación Colombia |

## 3. Build y arranque

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

La API ejecuta `prisma migrate deploy` al iniciar. Seed inicial (opcional):

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
```

## 4. Verificar

```bash
curl http://localhost/health          # API health vía nginx
curl -I http://localhost/properties   # Next.js
docker compose -f docker-compose.prod.yml ps
```

## 5. SSL con Cloudflare

1. Añade el dominio en Cloudflare y cambia los nameservers en el registrador.
2. **DNS → Records** (todos con proxy naranja): `A @` → IP del VPS, `CNAME www` → `elevari.live`, `A api` y `A app` → IP del VPS (la app móvil usa `api.elevari.live` y `app.elevari.live`). **Borra cualquier otro registro de `@`/`www`** (A, AAAA o CNAME): Cloudflare importa los registros de parking del registrador al añadir el dominio y, si quedan, sirven la página "/lander" en vez de tu sitio.
3. **SSL/TLS → Overview → Flexible.** El nginx del stack solo escucha HTTP en el puerto 80 y el firewall del VPS no abre el 443. Con *Full* o *Full (strict)* Cloudflare intenta HTTPS contra el origen y devuelve error 522/525. Usa Full (strict) solo después de instalar un certificado de origen en nginx y abrir el 443.
4. Webhook Wompi → `https://tu-dominio/api/v1/webhooks/wompi`

### Si el sitio no carga

Actions → **Server diagnostics** → Run workflow (solo lectura; el repo es público, así que no imprime secretos). Comprueba DNS, registro del dominio, respuesta de Cloudflare, puertos del origen, contenedores y si Cloudflare llega de verdad a tu nginx. El último job (*Does Cloudflare reach OUR server?*) dice "RESULT: Cloudflare reaches this server" cuando el registro DNS apunta bien.

## 6. Backups PostgreSQL

```bash
chmod +x deploy/scripts/backup-db.sh
./deploy/scripts/backup-db.sh
```

Programar con cron (diario 3am):

```cron
0 3 * * * cd /opt/elevari && ./deploy/scripts/backup-db.sh
```

## 7. Actualizar release

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## 8. Monitoreo básico

- Uptime: ping `https://tu-dominio/health`
- Logs: `docker compose -f docker-compose.prod.yml logs -f api web nginx`
- Sentry: opcional vía `SENTRY_DSN`

## 9. Facturación Alegra (Fase 6B)

Al confirmar un pago COP/Wompi, la API:
1. Emite factura en Alegra si hay credenciales
2. Si falla → `pending_invoices` para reintento manual

Reintentar factura fallida (admin):

```bash
# Login admin → obtener JWT
curl -X POST https://tu-dominio/api/v1/admin/invoices/{id}/retry \
  -H "Authorization: Bearer <admin_token>"
```

Listar pendientes:

```bash
curl https://tu-dominio/api/v1/admin/invoices/pending \
  -H "Authorization: Bearer <admin_token>"
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| API no conecta a DB | Verificar `DATABASE_URL` y health de postgres |
| Webhooks 404 | Nginx debe proxy `/api/` a api:4000 |
| Imágenes no cargan | `MINIO_PUBLIC_URL` + bucket público |
| Facturas no emiten | Verificar Alegra keys; revisar `pending_invoices` |

Ver también: `INFRASTRUCTURE.md`, `ROADMAP.md`
