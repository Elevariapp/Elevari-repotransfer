# RUNBOOK — Operación de producción

Última validación: 2026-11-21 · rama chore/elevari-production

Procedimientos para operar Elevari. Solo producción (sin staging). Repositorio público: se usan placeholders (`<SERVER_IP>`, `<CF_ZONE_ID>`, `<HETZNER_SERVER_ID>`, `<HETZNER_SSH_KEY_ID>`); los valores reales están en `docs/HANDOVER.private.md` (local, no versionado). Todos los comandos de servidor se ejecutan como `deploy` en `/opt/elevari` salvo indicación.

```bash
ssh deploy@<SERVER_IP>
cd /opt/elevari
export DC="docker compose -f docker-compose.prod.yml --env-file .env.production"
```

## 1. Bootstrap del servidor (qué se hizo)

Servidor Hetzner cpx32 (Ubuntu 26.04) en Helsinki. Pasos ejecutados, por si hay que reconstruirlo:

1. **Usuario y SSH:** crear `deploy` (sudo, grupo `docker`), instalar la llave pública del propietario. Drop-in `/etc/ssh/sshd_config.d/00-elevari-hardening.conf` con `PasswordAuthentication no`, `PermitRootLogin prohibit-password` y `KbdInteractiveAuthentication no`; `sshd -t` y recargar.
2. **Firewall:** `ufw default deny incoming`, permitir 22/80/443 (`ufw allow 22/tcp`, `80/tcp`, `443/tcp`), `ufw enable`.
3. **fail2ban** (jail `sshd`): `maxretry = 5`, `findtime = 10m`, `bantime = 1h`.
4. **unattended-upgrades** activado.
5. **Swap de 2 GB:** `fallocate -l 2G /swapfile`, `chmod 600`, `mkswap`, `swapon`, entrada en `/etc/fstab`.
6. **Docker 29 + Compose v2**; `/etc/docker/daemon.json` con `"log-driver": "json-file"` y `"log-opts": {"max-size": "10m", "max-file": "3"}`.
7. **Aplicación:** `/opt/elevari` propiedad de `deploy`; clonar el repo; crear `.env.production` desde `deploy/.env.production.example` (`chmod 600`, nunca en git) y validar con `./deploy/scripts/validate-env.sh`.
8. **Certificado de origen:** crear un Origin Certificate en Cloudflare (SSL/TLS → Origin Server; hosts `elevari.live` y `*.elevari.live`, 15 años); guardar en `/etc/ssl/elevari/origin.pem` y `/etc/ssl/elevari/origin.key` (`chmod 600` la llave; la llave nunca sale del servidor). nginx los monta desde `/etc/nginx/certs`.
9. **Stack:** `$DC build && $DC up -d` (la API ejecuta `prisma migrate deploy` al arrancar).
10. **Datos iniciales** (una sola vez):
    ```bash
    $DC exec -e ADMIN_EMAIL=reserve@elevari.live -e ADMIN_PASSWORD='<≥12 caracteres>' api npm run create-admin
    $DC exec -e HOST_EMAIL=reserve@elevari.live api npm run seed:property
    ```
    `RESET_PASSWORD=true` resetea la contraseña de un admin existente. **Nunca** `npm run db:seed` en producción (se niega salvo `ALLOW_DEMO_SEED=true`).
11. **Backups:** `crontab -e` → `0 3 * * * cd /opt/elevari && ./deploy/scripts/backup-db.sh >> /opt/elevari/backups/backup.log 2>&1` (retención 14 días) y activar Hetzner Backups en el servidor.
12. **Cloudflare:** ver [INFRASTRUCTURE.md](../INFRASTRUCTURE.md). Tras el cutover: restringir 80/443 a Cloudflare (sección 8).

## 2. Deploy / actualización

Antes: quality gate completo en local ([COMMANDS.md](../COMMANDS.md)) y push a la rama que se despliega.

```bash
cd /opt/elevari
git fetch --all --tags && git pull
./deploy/scripts/validate-env.sh          # si cambió el env o las plantillas
$DC build
$DC up -d
$DC ps
curl -s http://localhost/health           # {"status":"ok","database":"connected",...}
```

- Marcar la versión estable antes de desplegar: `git tag -a release-YYYYMMDD -m "..." && git push origin release-YYYYMMDD`.
- Cambios en `NEXT_PUBLIC_*` requieren `$DC build web` (se incrustan en el build).
- Cambios solo de variables de runtime en `.env.production`: `$DC up -d` (recrea los contenedores afectados).
- Verificación posterior: `https://elevari.live/health`, home, una reserva de prueba si tocó pagos.

## 3. Rollback

1. Identificar el último estado bueno: `git log --oneline -10` o `git tag --sort=-creatordate`.
2. Volver a ese estado y reconstruir:
   ```bash
   git checkout <tag-o-commit-anterior>
   $DC build
   $DC up -d
   curl -s http://localhost/health
   ```
3. Las migraciones de Prisma solo avanzan: si la versión nueva aplicó una migración incompatible, restaurar la base de datos (sección 5) con un dump anterior al despliegue. Hacer siempre `./deploy/scripts/backup-db.sh` **antes** de desplegar cambios de esquema.
4. Volver a la rama: `git checkout <rama> && git pull` cuando el problema esté corregido.

## 4. Logs y salud

```bash
$DC ps
$DC logs -f --tail=100 api web nginx
$DC logs --since 1h api | grep -i error
curl -s http://localhost/health
docker stats --no-stream
df -h && free -h
```

Desde fuera: `curl -sI https://elevari.live/health`. Un `status: degraded` indica base de datos desconectada.

## 5. Backups y restauración

- Diario 03:00: `deploy/scripts/backup-db.sh` → `/opt/elevari/backups/elevari_<fecha>.sql.gz` + `.sha256`, retención 14 días. Más Hetzner Backups del servidor.
- Backup manual: `./deploy/scripts/backup-db.sh`.
- Restaurar (destructivo, confirmar con el propietario):
  ```bash
  ls -lh backups/
  ./deploy/scripts/restore-db.sh backups/elevari_<fecha>.sql.gz --yes
  ```
  El script verifica el checksum y valida tablas críticas (`bookings`, `payments`, `payment_events`). Después reiniciar la API: `$DC restart api`.
- MinIO (media): solo cubierto por Hetzner Backups; restaurar el servidor desde un backup de Hetzner si se pierde el volumen.
- Probar una restauración en un entorno desechable al menos una vez antes del lanzamiento.

## 6. Rotación de secretos

Cada rotación: generar el valor nuevo, guardarlo en el gestor «Elevari», aplicarlo, verificar, revocar el anterior.

| Secreto | Cómo rotar |
|---------|-----------|
| `JWT_SECRET` | Nuevo valor ≥ 32 caracteres en `.env.production`; `$DC up -d api web`. Cierra todas las sesiones. |
| `POSTGRES_PASSWORD` | `ALTER USER` dentro de postgres (`$DC exec postgres psql -U $POSTGRES_USER`), porque la variable solo se aplica al inicializar el volumen; actualizar `.env.production`; `$DC up -d api`. |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Actualizar el env y `$DC up -d minio api` (las credenciales root de MinIO se leen del env al arrancar). |
| Wompi (`WOMPI_*`) | Regenerar en el panel de Wompi; actualizar env; si cambia `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `$DC build web`; `$DC up -d`; actualizar el secret de eventos del webhook. |
| Alegra (`ALEGRA_API_TOKEN`) | Nuevo token en Alegra; actualizar env; `$DC up -d api`. |
| Resend (`RESEND_API_KEY`) | Crear llave nueva en Resend, actualizar env, `$DC up -d api web`, revocar la anterior. Probar «olvidé mi contraseña». |
| Turnstile (`TURNSTILE_SECRET_KEY`) | Rotar el secret del widget «Elevari Web» en Cloudflare; actualizar env; `$DC up -d api`. La API no arranca sin él. |
| Token de API de Cloudflare | Crear uno nuevo con permisos mínimos, actualizar `CLOUDFLARE_API_TOKEN` en el entorno de quien lo use, eliminar el anterior. |
| Llaves S3 de R2 | Crear llaves nuevas, actualizar a quien las use, eliminar las anteriores. |
| Token de API de Hetzner | Crear uno nuevo en el proyecto, actualizar `HETZNER_API_TOKEN`, eliminar el anterior. |
| Llave SSH | Añadir la nueva a `authorized_keys` del usuario `deploy`, verificar acceso, quitar la anterior. |
| Keystore de subida Android | Si se pierde o se filtra: solicitar reseteo de la llave de subida en Play Console y actualizar las huellas en Firebase. |

Tras rotar: actualizar la lista «Rotación pendiente» de [HANDOVER.md](HANDOVER.md).

## 7. Acceso de emergencia (break-glass): modo rescue de Hetzner

Solo si se perdió el acceso SSH (se utilizó una vez para inyectar la llave). Requiere `HETZNER_API_TOKEN` en el entorno y la llave pública registrada en el proyecto Hetzner (`<HETZNER_SSH_KEY_ID>`).

```bash
# 1. Activar rescue con la llave SSH y reiniciar
curl -s -X POST -H "Authorization: Bearer $HETZNER_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"linux64","ssh_keys":[<HETZNER_SSH_KEY_ID>]}' \
  "https://api.hetzner.cloud/v1/servers/<HETZNER_SERVER_ID>/actions/enable_rescue"
curl -s -X POST -H "Authorization: Bearer $HETZNER_API_TOKEN" \
  "https://api.hetzner.cloud/v1/servers/<HETZNER_SERVER_ID>/actions/reset"

# 2. Entrar al sistema rescue (la huella del host cambia; aceptar solo en este paso)
ssh root@<SERVER_IP>

# 3. Montar el disco y corregir las llaves
mount /dev/sda1 /mnt
nano /mnt/root/.ssh/authorized_keys     # añadir la llave pública correcta
umount /mnt

# 4. Reiniciar (el rescue se desactiva solo tras el reinicio)
reboot
```

Después: `ssh deploy@<SERVER_IP>`, verificar `$DC ps` y `/health`, limpiar la entrada obsoleta de `known_hosts` y rotar la llave si se sospecha compromiso.

## 8. Cutover y rollback de DNS

**Antes del cutover:** quality gate, `validate-env.sh` OK, `$DC ps` sano, `/health` OK, backup reciente, Wompi y Alegra configurados, `create-admin` y `seed:property` hechos.

```bash
# Probar el origen sin tocar DNS
curl -vI --resolve elevari.live:443:<SERVER_IP> https://elevari.live/health
curl -sI --resolve media.elevari.live:443:<SERVER_IP> https://media.elevari.live/elevari-media/
```

**Cutover:** en Cloudflare crear/editar los registros A `@`, `www` y `media` → `<SERVER_IP>` con proxy activado. Mantener SSL en `full`, verificar y luego cambiar a `full (strict)`. Registrar la hora. Verificar: home, `/health`, login con Turnstile, reserva de prueba, `assetlinks.json`, media.

**Rollback:** eliminar o desactivar los registros A nuevos (o restaurar los anteriores) y devolver el SSL al modo previo. No tocar MX/SPF/DMARC de GoDaddy ni los registros DKIM/return-path de Resend.

**Restringir el origen a Cloudflare (después de verificar):**

```bash
for ip in $(curl -s https://www.cloudflare.com/ips-v4); do sudo ufw allow from $ip to any port 80,443 proto tcp; done
for ip in $(curl -s https://www.cloudflare.com/ips-v6); do sudo ufw allow from $ip to any port 80,443 proto tcp; done
sudo ufw delete allow 80/tcp && sudo ufw delete allow 443/tcp
```

Mantener `deploy/nginx/cloudflare-ips.conf` alineado con los rangos publicados por Cloudflare. Si algo falla: `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`.

## 9. Checklist de incidentes

1. **Detectar y acotar:** ¿`/health` responde? `$DC ps`, `$DC logs --since 30m`. Anotar hora y síntoma.
2. **Sitio caído:** `$DC up -d`; revisar disco (`df -h`) y memoria (`free -h`); reiniciar el servicio afectado (`$DC restart api|web|nginx`).
3. **API degradada (`database: disconnected`):** `$DC logs postgres`, `$DC restart postgres api`; si hay corrupción, restaurar (sección 5).
4. **Pagos:** revisar el panel de Wompi y los logs de `/api/v1/webhooks/wompi`; reconciliar reservas `pending` con pagos aprobados; factura fallida → reintento admin (`/api/v1/admin/invoices/pending`).
5. **Ataque o abuso:** en Cloudflare activar «Under Attack» o endurecer reglas; revisar rate limits y WAF; bloquear IPs desde Cloudflare.
6. **Sospecha de filtración de credenciales:** rotar de inmediato (sección 6), revisar accesos y logs, cambiar contraseñas de las cuentas implicadas.
7. **Datos personales comprometidos:** contener, preservar evidencia, notificar a la SIC y a los titulares dentro de los plazos de la Ley 1581 de 2012; contacto reserve@elevari.live.
8. **Comunicar** al propietario y registrar el post-mortem (causa, impacto, acciones).

## 10. Datos sensibles en el repositorio público

Si se commitea por error un secreto, IP, id de cuenta o `docs/HANDOVER.private.md`: (1) rotar/revocar de inmediato lo que sea un secreto; (2) reescribir el historial (`git filter-repo`) y forzar el push; (3) avisar al propietario. `npm run docs:lint` detecta IPs públicas e ids largos en `docs/` y documentos canónicos.
