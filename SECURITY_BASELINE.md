# SECURITY_BASELINE — Línea base de seguridad

Última validación: 2026-11-21 · rama chore/elevari-production

Estado: **Hecho** = implementado y verificado; **Pendiente** = falta acción. Contacto de seguridad y privacidad: reserve@elevari.live.

## Red y borde (Cloudflare + servidor)

| Control | Estado | Detalle |
|---------|--------|---------|
| Always HTTPS, TLS ≥ 1.2, TLS 1.3, HTTP/3 | Hecho | Cloudflare |
| HSTS | Hecho (6 meses) | A 1 año + `includeSubDomains` tras verificar el lanzamiento; sin preload hasta entonces |
| WAF gestionado (Free) + regla custom de rutas sensibles | Hecho | `/.env /.git /wp-admin /wp-login /xmlrpc.php /phpmyadmin /vendor/phpunit /.aws /cgi-bin` |
| Bot Fight Mode | Hecho | — |
| Rate limit auth | Hecho | `/api/v1/auth/*`: 20 req / 10 s por IP+colo |
| DNSSEC | Pendiente | DS publicado en GoDaddy; Cloudflare *pending* hasta propagar |
| SSL `full (strict)` en Cloudflare | Pendiente | nginx ya sirve el Origin Certificate; falta cambiar el modo en el cutover |
| 80/443 restringidos a rangos Cloudflare | Pendiente | Tras el cutover |
| Firewall `ufw` (22/80/443) | Hecho | — |

## Servidor

| Control | Estado | Detalle |
|---------|--------|---------|
| SSH solo con llave | Hecho | contraseña y root con contraseña deshabilitados (`00-elevari-hardening.conf`) |
| Usuario `deploy` | Hecho | sudo + grupo docker |
| `fail2ban` sshd | Hecho | 5 intentos/10 min, ban 1 h |
| Parches automáticos | Hecho | `unattended-upgrades` |
| Rotación de logs Docker | Hecho | 10 MB × 3 |
| Copia de backups fuera del servidor | Parcial | Hetzner Backups cubre el servidor; los dumps locales viven en `/opt/elevari/backups` |
| Puertos internos (Postgres, Redis, MinIO) no publicados | Hecho | solo red `elevari_internal`; nginx publica 80/443 |
| TLS en origen (nginx 443 con Origin Certificate) | Hecho | host desconocido → `444`; IP real vía `cloudflare-ips.conf` |

## Aplicación

| Control | Estado | Detalle |
|---------|--------|---------|
| Cabeceras de seguridad y CSP enforce | Hecho | `next.config.ts` y nginx |
| Rate limit de API | Hecho | 120/min por IP (`@fastify/rate-limit`) + `limit_req` en nginx (`/api/` 20 r/s, `/api/v1/auth/` 5 r/s) |
| CORS restringido | Hecho | `CORS_ORIGIN` + apex/www |
| Validación de entrada | Hecho | Zod en rutas |
| Arranque fail-fast en producción | Hecho | la API no inicia sin `JWT_SECRET` ≥ 32 caracteres, sin `TURNSTILE_SECRET_KEY` (ni con Turnstile deshabilitado) y con `PAYMENTS_MODE=mock` salvo `ALLOW_MOCK_PAYMENTS=true` (solo pruebas internas). La web también requiere `JWT_SECRET` |
| Contraseñas con hash | Hecho | `bcryptjs` |
| Turnstile en login/registro | Hecho | web y app Android (widget en WebView); secret solo en `TURNSTILE_SECRET_KEY` del servidor |
| Cuentas demo bloqueadas en producción | Hecho | `@elevari.local` y `DISABLE_DEMO_ACCOUNTS=true`; `validate-env.sh` lo exige |
| Seed demo | Hecho | `npm run db:seed` se niega con `NODE_ENV=production` salvo `ALLOW_DEMO_SEED=true`; no usar nunca en producción |
| Datos iniciales | Hecho | `npm run create-admin` (`ADMIN_EMAIL`, `ADMIN_PASSWORD` ≥ 12 caracteres; `RESET_PASSWORD=true` para resetear) y `npm run seed:property` (`HOST_EMAIL`; sin usuarios demo ni reseñas) |
| Validación de entorno | Hecho | `deploy/scripts/validate-env.sh` (solo producción, estricto: llaves `pub_prod_`/`prv_prod_` de Wompi, Alegra, Resend, Turnstile) |
| Logs sin secretos | Hecho | redacción de `authorization`, `cookie` y firma de Wompi |
| Moderación de media | Hecho | `MEDIA_AUTO_APPROVE=false` en producción |
| MFA para admin | Pendiente | no implementado |

## Pagos

| Control | Estado | Detalle |
|---------|--------|---------|
| Wompi único proveedor live | Hecho | Bold y Stripe deshabilitados |
| Sin datos de tarjeta en Elevari | Hecho | checkout alojado (alcance PCI SAQ A) |
| Firma de integridad en el intent | Hecho | `WOMPI_INTEGRITY_SECRET` |
| Verificación de checksum del webhook | Hecho | `WOMPI_EVENTS_SECRET`; firma inválida → 401 |
| `PAYMENTS_MODE=mock` prohibido en producción | Hecho | la API aborta al arrancar |
| Llaves live en servidor | Pendiente | ver [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md) |

## Secretos

- Valores solo en `/opt/elevari/.env.production` (chmod 600), gestor de contraseñas «Elevari» del propietario y `~/.gradle/gradle.properties` (Android). Nunca en git, issues, chats ni logs.
- El keystore de subida nunca entra al repo (`*.jks` ignorado); su ruta local y claves están en el gestor de contraseñas «Elevari».
- `google-services.json` no se versiona.
- **Rotación pendiente** de credenciales expuestas durante el montaje: ver [docs/HANDOVER.md](docs/HANDOVER.md). Procedimiento: [docs/RUNBOOK.md](docs/RUNBOOK.md).

## Privacidad y cumplimiento

- Ley 1581 de 2012 (Habeas Data): política en `/legal/privacy`; eliminación de cuenta en `/legal/account-deletion`.
- Incidente con datos personales: notificar a la SIC y a los titulares afectados dentro de los plazos legales; canal reserve@elevari.live.
- Facturación electrónica con Alegra.

## Monitoreo y respuesta

| Control | Estado |
|---------|--------|
| Health `/health` | Hecho |
| Uptime externo y alertas | Pendiente |
| Captura de errores (`SENTRY_DSN`) | Pendiente (opcional) |
| Checklist de incidentes | Hecho — [docs/RUNBOOK.md](docs/RUNBOOK.md) |

## Documentos relacionados

[INFRASTRUCTURE.md](INFRASTRUCTURE.md) · [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) · [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md)
