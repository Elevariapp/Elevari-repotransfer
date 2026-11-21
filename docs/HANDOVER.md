# HANDOVER — Traspaso: cuentas, acceso y reglas

Última validación: 2026-11-21 · rama chore/elevari-production

> Este repositorio es **público**. Aquí solo hay descripciones, nombres de variables y placeholders (`<SERVER_IP>`, `<CF_ACCOUNT_ID>`, `<CF_ZONE_ID>`, `<HETZNER_SERVER_ID>`). Los valores reales están en `docs/HANDOVER.private.md` (archivo local, NO versionado; guardado en el gestor de contraseñas «Elevari»). Ningún secreto se escribe en ningún archivo versionado.

## Producto

Elevari (`elevari.live`), web + Android, solo producción, COP, Colombia (Ley 1581 de 2012). Contacto oficial único: `reserve@elevari.live`. «Glamping Waná» es una propiedad listada (slug `glamping-wana`), no la marca.

## Cuentas y propiedad

Todas las cuentas son del propietario de Elevari; el acceso de agentes y terceros se da por tokens acotados y revocables.

| Servicio | Qué contiene | Identificador público |
|----------|--------------|-----------------------|
| GitHub | Código y CI | org `Elevariapp`, repo `Elevariapp/Elevari-repotransfer` (rama por defecto `b-main`; trabajo en `chore/elevari-production`) |
| Hetzner Cloud | Servidor de producción (Helsinki) | id `<HETZNER_SERVER_ID>`, IP `<SERVER_IP>` |
| Cloudflare (Free) | DNS, WAF, TLS, Turnstile, Web Analytics | cuenta `<CF_ACCOUNT_ID>`, zona `<CF_ZONE_ID>` |
| GoDaddy | Registro del dominio y buzón `reserve@elevari.live` | — |
| Google | Play Console (organización), Firebase y Google Cloud (proyecto `elevari`), GA4, GTM, Search Console | GTM `GTM-PXVGFFMK`, GA4 `G-W4QC0NYBVJ` |
| Resend | Correo transaccional (dominio `elevari.live`, `sa-east-1`) | — |
| Wompi | Pagos (único proveedor live) | — |
| Alegra | Facturación electrónica | — |
| Expo / EAS | Push y builds opcionales | `projectId` real pendiente |

Un servidor adicional en el mismo proyecto Hetzner **no pertenece a Elevari y no se toca**.

## Dónde viven los secretos

- Gestor de contraseñas del propietario, bóveda **«Elevari»**: token de API de Cloudflare, token de API de Hetzner, llave de Resend, llaves de Wompi, token de Alegra, keystore de subida Android y sus claves, secret de Turnstile.
- Servidor: archivo de entorno de producción (ver [RUNBOOK.md](RUNBOOK.md)), fuera de git.
- PC del propietario: propiedades de firma de Gradle (ver [mobile/RELEASE.md](../mobile/RELEASE.md)).

Nunca en git, issues, PRs, chats, logs ni capturas.

## Cómo se conecta un agente

Los agentes leen credenciales **solo del entorno** (nunca de archivos del repo) y las reciben del propietario con alcance mínimo:

| Variable | Uso |
|----------|-----|
| `CLOUDFLARE_API_TOKEN` | API de Cloudflare (DNS, reglas, SSL) |
| `HETZNER_API_TOKEN` | API de Hetzner Cloud (estado del servidor, rescue, backups) |
| `RESEND_API_KEY` | API de Resend (dominios, envío) |

```bash
# Cloudflare: estado de la zona
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/<CF_ZONE_ID>"

# Hetzner: estado del servidor
curl -s -H "Authorization: Bearer $HETZNER_API_TOKEN" \
  "https://api.hetzner.cloud/v1/servers/<HETZNER_SERVER_ID>"

# Servidor (usuario deploy, llave SSH del propietario)
ssh deploy@<SERVER_IP>
# Administración como root: alias local `elevari-hetzner` (solo cuando sea imprescindible)

# GitHub: CLI autenticada (gh auth status)
gh repo view Elevariapp/Elevari-repotransfer
gh pr list
```

Pasos de un agente al empezar:
1. `gh auth status` y leer este documento, [ARCHITECTURE.md](../ARCHITECTURE.md) y [RUNBOOK.md](RUNBOOK.md).
2. Pedir los valores de placeholders al propietario (o leer `docs/HANDOVER.private.md` si está disponible localmente).
3. Trabajar en la rama `chore/elevari-production`; correr el quality gate de [COMMANDS.md](../COMMANDS.md) antes de cada push.
4. Para cambios en producción, seguir el RUNBOOK (deploy, rollback, DNS) y verificar `/health` después.

## Reglas de oro

1. **Sin secretos ni datos sensibles en el repo** (es público): ni IPs, ni ids de cuentas, ni tokens, ni correos personales. Usar placeholders. `npm run docs:lint` lo comprueba en `docs/` y documentos canónicos.
2. **No tocar otros servidores** del proyecto Hetzner; operar solo el de Elevari.
3. **Quality gate antes de cada push** ([COMMANDS.md](../COMMANDS.md)).
4. **Solo producción**: sin staging; cambios de infraestructura/DNS con plan de rollback.
5. Wompi es el único proveedor de pagos live; nunca habilitar `PAYMENTS_MODE=mock` ni el seed demo en producción.
6. Ningún comando destructivo (borrar volúmenes, `restore-db.sh --yes`, cambios de DNS) sin confirmación del propietario.

## Rotación pendiente

Credenciales que se expusieron durante el montaje y **deben rotarse tras el go-live** (procedimientos en [RUNBOOK.md](RUNBOOK.md)):

- [ ] Token de API de Cloudflare
- [ ] Llaves S3 de R2 (Cloudflare)
- [ ] Token de API de Hetzner
- [ ] Llave de Resend

Tras rotar: actualizar el gestor de contraseñas, el entorno del servidor si aplica, y marcar aquí.

## Documentos relacionados

[INFRASTRUCTURE.md](../INFRASTRUCTURE.md) · [GO_LIVE_CHECKLIST.md](../GO_LIVE_CHECKLIST.md) · [INTEGRATIONS_KEYS.md](INTEGRATIONS_KEYS.md)
