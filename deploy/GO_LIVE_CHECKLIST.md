# Waná — Checklist Go-Live

Usa este documento como lista de verificación antes y después del despliegue a producción.

**Dominio objetivo:** `https://wana.co` (cambia en `.env.production` si usas otro)

---

## Fase 0 — Pre-live sin keys (AHORA)

Sin Bold/Stripe/Alegra. Valida el stack completo con pagos mock.

### Archivos

| Archivo | Uso |
|---------|-----|
| `.env.staging` | Env mock, sin keys |
| `docker-compose.staging.yml` | Stack staging |
| `deploy/scripts/deploy-staging.sh` | Build + deploy pre-live |

### Pasos

```bash
# 1. Validar env staging (debe pasar sin errores)
npm run go-live:validate:staging

# 2. Con Docker instalado — deploy pre-live local
npm run go-live:staging

# 3. Verificar endpoints
npm run go-live:verify

# 4. Smoke test manual
# → http://localhost/properties
# → login guest@wana.local / wana12345
# → reserva → checkout → pago mock → confirmado
```

### En VPS (sin dominio, solo IP)

```bash
# En el servidor (tras vps-bootstrap.sh)
sudo ./deploy/scripts/vps-bootstrap.sh
scp .env.staging user@IP:/opt/wana/.env.staging
cd /opt/wana
STAGING_HOST=TU_IP ./deploy/scripts/deploy-staging.sh
BASE_URL=http://TU_IP ./deploy/scripts/verify-health.sh
```

### Cuando tengas keys → go-live real

1. Rellena `.env.production` (PAYMENTS_MODE=live + keys)
2. `npm run go-live:validate`
3. `npm run go-live:deploy`
4. Configura webhooks Bold/Stripe
5. Fase D del checklist

---

## Fase A — Preparación local (paso 1)

### A1. Infraestructura local

- [ ] Docker instalado y en ejecución
- [ ] Ejecutar: `npm run docker:infra`
- [ ] Verificar: `docker compose ps` → postgres, redis, minio healthy

### A2. Migraciones

- [ ] Ejecutar: `cd api && npx prisma migrate deploy`
- [ ] Verificar: sin errores; migración `20260625140000_add_invoicing` aplicada
- [ ] (Opcional primer deploy) Seed demo: `npm run api:seed`

### A3. Smoke test local

- [ ] `npm run api:dev` → `curl http://localhost:4000/health` → `ok`
- [ ] `npm run dev` → abrir `http://localhost:3000/properties`
- [ ] Flujo mock: login `guest@wana.local` / `wana12345` → reserva → checkout mock

---

## Fase B — Variables de producción (paso 2)

Archivo: **`.env.production`** (raíz del proyecto, no commitear)

### B1. Obligatorias (bloquean deploy)

| Variable | Estado | Notas |
|----------|--------|-------|
| `POSTGRES_PASSWORD` | ✅ generado | Guardar en gestor de contraseñas |
| `JWT_SECRET` | ✅ generado | Min 32 chars |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ revisar | Debe ser `https://tu-dominio` |
| `NEXT_PUBLIC_API_URL` | ⚠️ revisar | Mismo dominio, **sin** `/api/v1` |
| `PUBLIC_SITE_URL` | ⚠️ revisar | Igual que SITE_URL |
| `CORS_ORIGIN` | ⚠️ revisar | Igual que SITE_URL |
| `MINIO_SECRET_KEY` | ✅ generado | |
| `MINIO_PUBLIC_URL` | ⚠️ revisar | URL pública de media |

### B2. Pagos live (obligatorio para cobrar)

| Variable | Estado | Dónde obtener |
|----------|--------|---------------|
| `PAYMENTS_MODE` | `live` | Ya configurado |
| `BOLD_API_KEY` | ⬜ pendiente | [dashboard.bold.co](https://dashboard.bold.co) |
| `BOLD_WEBHOOK_SECRET` | ⬜ pendiente | Bold → Webhooks |
| `STRIPE_SECRET_KEY` | ⬜ pendiente | [dashboard.stripe.com](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | ⬜ pendiente | Stripe API keys |
| `STRIPE_WEBHOOK_SECRET` | ⬜ pendiente | Stripe → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⬜ pendiente | Mismo pk que Stripe publishable |

### B3. Facturación Colombia (obligatorio legal)

| Variable | Estado | Dónde obtener |
|----------|--------|---------------|
| `ALEGRA_EMAIL` | ⬜ pendiente | Cuenta Alegra |
| `ALEGRA_API_TOKEN` | ⬜ pendiente | [alegra.com/api](https://alegra.com/api/docs) |

### B4. Marketing (recomendado)

| Variable | Estado |
|----------|--------|
| `RESEND_API_KEY` | ⬜ emails confirmación |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⬜ GA4 |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⬜ Meta Pixel |
| `META_PIXEL_ID` + `META_ACCESS_TOKEN` | ⬜ CAPI server |

### B5. Validar env antes de deploy

```bash
./deploy/scripts/validate-env.sh
```

---

## Fase C — VPS y despliegue (paso 3)

### C1. Servidor

- [ ] VPS provisionado (2 vCPU, 4 GB RAM mínimo)
- [ ] Ubuntu 22.04+ con Docker y Compose v2
- [ ] Usuario con acceso SSH
- [ ] Firewall: puertos 22, 80, 443 abiertos

### C2. Dominio y DNS

- [ ] Registro A: `wana.co` → IP del VPS
- [ ] (Opcional) `www` CNAME → `wana.co`
- [ ] (Opcional) `media.wana.co` → IP o CDN para MinIO
- [ ] Cloudflare proxy activado (recomendado)

### C3. Desplegar en VPS

```bash
# En el servidor
git clone <repo-url> /opt/wana && cd /opt/wana
# Copiar .env.production (scp o paste) — NUNCA por git
scp .env.production user@vps:/opt/wana/.env.production

./deploy/scripts/deploy-prod.sh
```

- [ ] Build completado sin errores
- [ ] Todos los contenedores `running`: `docker compose -f docker-compose.prod.yml ps`

### C4. SSL / HTTPS

- [ ] Cloudflare SSL: Full o Full (strict)
- [ ] O Certbot en nginx (si no usas Cloudflare)

### C5. Webhooks externos

Configurar en dashboards de proveedores:

| Proveedor | URL |
|-----------|-----|
| Bold | `https://wana.co/api/v1/webhooks/bold` |
| Stripe | `https://wana.co/api/v1/webhooks/stripe` |

- [ ] Bold webhook creado y secret copiado a `BOLD_WEBHOOK_SECRET`
- [ ] Stripe webhook creado (eventos: `payment_intent.succeeded`, etc.)
- [ ] Re-deploy si añadiste secrets nuevos: `npm run docker:prod:build && npm run docker:prod:up`

---

## Fase D — Verificación post-deploy

### D1. Health checks

```bash
curl -s https://wana.co/health
curl -sI https://wana.co/properties
curl -sI https://wana.co/sitemap.xml
```

- [ ] `/health` responde OK
- [ ] `/properties` HTTP 200
- [ ] `/sitemap.xml` HTTP 200

### D2. Flujo de reserva (staging con pago real pequeño)

- [ ] Registro / login usuario nuevo
- [ ] Ver propiedad → seleccionar fechas → crear reserva
- [ ] Checkout Bold (COP) — pago de prueba mínimo
- [ ] Redirect success → estado `confirmed`
- [ ] Email confirmación recibido (si Resend configurado)
- [ ] Factura en Alegra o en `pending_invoices` (admin retry)

### D3. Stripe internacional (opcional)

- [ ] Checkout Stripe USD con tarjeta de prueba → confirmed
- [ ] Sin factura Alegra (esperado para USD)

### D4. Host / media

- [ ] Login `host@wana.local` (o host real) → `/host`
- [ ] Subir imagen → visible en galería pública
- [ ] `MEDIA_AUTO_APPROVE=false` → flujo aprobación admin (si implementado)

### D5. Backups y ops

- [ ] `./deploy/scripts/backup-db.sh` ejecutado manualmente
- [ ] Cron diario configurado para backups
- [ ] Logs accesibles: `docker compose -f docker-compose.prod.yml logs -f api`

---

## Fase E — Seguridad final

- [ ] `.env.production` **no** está en git
- [ ] Contraseñas demo (`wana12345`) deshabilitadas o cuentas demo eliminadas en prod
- [ ] `MEDIA_AUTO_APPROVE=false` en producción
- [ ] `PAYMENTS_MODE=live` (no mock)
- [ ] JWT_SECRET y POSTGRES_PASSWORD únicos y almacenados de forma segura
- [ ] Admin solo con cuentas reales (`admin@...`)

---

## Comandos rápidos

```bash
# Local: infra + migrate
npm run docker:infra
cd api && npx prisma migrate deploy

# Validar env
./deploy/scripts/validate-env.sh

# Producción (local o VPS)
npm run docker:prod:build
npm run docker:prod:up

# Backup
./deploy/scripts/backup-db.sh

# Reintentar factura fallida (admin JWT)
curl -X POST https://wana.co/api/v1/admin/invoices/{id}/retry \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Contactos / rollback

| Acción | Comando |
|--------|---------|
| Ver logs | `docker compose -f docker-compose.prod.yml logs -f api web nginx` |
| Parar stack | `npm run docker:prod:down` |
| Restaurar DB | `gunzip -c backups/wana_*.sql.gz \| docker compose -f docker-compose.prod.yml exec -T postgres psql -U wana wana` |
| Rollback release | `git checkout <tag-anterior>` + rebuild |

**Última actualización:** Fase 6E + 6B — Waná 2026
