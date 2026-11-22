# Waná — Deploy en Droplet 164.92.241.30

**URL staging:** http://164.92.241.30/properties

El servidor ya responde con nginx (Ubuntu). Falta desplegar el stack Waná.

---

## Paso 1 — Desde tu Mac (copiar proyecto al servidor)

```bash
cd /Users/macbook/Downloads/wana-2026-main

# Copiar proyecto (excluye node_modules)
rsync -avz --progress \
  --exclude node_modules --exclude .next --exclude api/node_modules \
  --exclude .git \
  ./ root@164.92.241.30:/opt/wana/

# Copiar env staging
scp .env.staging root@164.92.241.30:/opt/wana/.env.staging
```

Si usas usuario distinto a `root`, cambia `root@` por `tu_usuario@`.

---

## Paso 2 — En el servidor (SSH)

```bash
ssh root@164.92.241.30
```

```bash
cd /opt/wana

# Bootstrap Docker (si no está)
apt-get update && apt-get install -y docker.io docker-compose-plugin git
systemctl enable docker && systemctl start docker

# Detener nginx del sistema (libera puerto 80)
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

chmod +x deploy/scripts/*.sh

# Deploy staging (build ~10-15 min primera vez)
./deploy/scripts/deploy-staging.sh

# Verificar
BASE_URL=http://164.92.241.30 ./deploy/scripts/verify-health.sh
```

---

## Paso 3 — Probar en el navegador

| URL | Qué ver |
|-----|---------|
| http://164.92.241.30/properties | Listado |
| http://164.92.241.30/health | API OK |
| http://164.92.241.30/auth/login | Login |

**Credenciales demo** (tras seed):

| Email | Password |
|-------|----------|
| guest@wana.local | wana12345 |
| host@wana.local | wana12345 |
| admin@wana.local | wana12345 |

Flujo: propiedad → fechas → checkout → **pago mock** → confirmado.

---

## Si algo falla

```bash
# Logs
cd /opt/wana
docker compose -f docker-compose.staging.yml --env-file .env.staging logs -f api web nginx

# Estado
docker compose -f docker-compose.staging.yml --env-file .env.staging ps

# Rebuild
docker compose -f docker-compose.staging.yml --env-file .env.staging build --no-cache
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
```

---

## Firewall DigitalOcean

Asegúrate de tener abiertos: **22**, **80**, **443**.
