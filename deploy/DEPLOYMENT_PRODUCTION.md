# Elevari — Production Deployment (Fase 6E)

Guía para desplegar el stack Docker en un VPS (Hetzner, DigitalOcean, etc.) con Nginx, PostgreSQL, Redis, MinIO, API Fastify y Next.js standalone.

**Checklist completo:** `deploy/GO_LIVE_CHECKLIST.md`

> **Despliegue automático (GitHub Actions):** Cada push a la rama `b-main` activa el pipeline de CI/CD que despliega automáticamente en Hetzner. También puedes desplegar manualmente desde la pestaña **Actions** → **Deploy to Hetzner Production** → **Run workflow**.
>
> **Secrets requeridos en GitHub** (Settings → Secrets and variables → Actions):
> - `HETZNER_IP` — IP del servidor (ej. `2.29.165.225`)
> - `HETZNER_USER` — usuario SSH (ej. `root`)
> - `HETZNER_SSH_KEY` — contenido completo de tu clave privada SSH (`~/.ssh/id_ed25519_elevari_hetzner`)
> - `EXPO_TOKEN` — token de EAS CLI para builds de Android (obtener en expo.dev/settings/access-tokens)
> - `GOOGLE_PLAY_SERVICE_ACCOUNT` — JSON de cuenta de servicio de Google Play Console (rol "Lanzamiento")
>
> **`.env.production` NO se sube a GitHub.** Debes copiarlo manualmente al servidor:
> ```bash
> scp .env.production root@2.29.165.225:/opt/elevari/.env.production
> ```

## Arquitectura

```
Internet → Cloudflare (SSL) → Nginx (:80) → web (:3000) | api (:4000)
                                    ↓
              postgres · redis · minio (red interna)
```

## Requisitos

- VPS: 2 vCPU, 4 GB RAM mínimo (8 GB recomendado con MinIO)
- Docker 24+ y Docker Compose v2
- Dominio apuntando al VPS (A record)
- Cloudflare o Certbot para TLS (recomendado: Cloudflare proxy + SSL Full)

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
| `WHATSAPP_TOKEN` | Token de Meta Cloud API para el bot de WhatsApp |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de teléfono de WhatsApp Business |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ID de la cuenta WABA |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificación del webhook de WhatsApp |

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
curl http://localhost/bot/health      # WhatsApp Bot health
curl -I http://localhost/properties   # Next.js
docker compose -f docker-compose.prod.yml ps
```

## 5. SSL con Cloudflare

1. Añade el dominio en Cloudflare
2. Proxy naranja activado en DNS
3. SSL/TLS → Full (strict) si usas origin cert, o Full
4. Webhook Wompi → `https://tu-dominio/api/v1/webhooks/wompi`

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
| WhatsApp bot no responde | Verificar `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`; revisar logs `docker compose -f docker-compose.prod.yml logs whatsapp-bot` |
| WhatsApp bot health falla | Verificar que el contenedor `whatsapp-bot` esté corriendo y expuesto en el puerto 3001 |

Ver también: `INFRASTRUCTURE.md`, `ROADMAP.md`
