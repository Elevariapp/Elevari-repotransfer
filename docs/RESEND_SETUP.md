# Resend — correo transaccional de Elevari

Última validación: 2026-11-21 · rama chore/elevari-production

## Estado

| Ítem | Valor |
|------|-------|
| Dominio | `elevari.live` verificado en Resend **solo para envío** (región `sa-east-1`) |
| Registros DNS | DKIM `resend._domainkey` y return-path `send` / `rsend` (en Cloudflare) |
| Remitente | `Elevari <reserve@elevari.live>` |
| Buzón de recepción | `reserve@elevari.live` en GoDaddy |

## Variables (solo nombres)

| Variable | Dónde | Notas |
|----------|-------|-------|
| `RESEND_API_KEY` | entorno de producción del servidor | llave con permiso de envío; valor en el gestor «Elevari» |
| `RESEND_FROM` | entorno de producción del servidor | `"Elevari <reserve@elevari.live>"` |
| `PUBLIC_SITE_URL` | entorno de producción del servidor | `https://elevari.live`; se usa en los enlaces de los correos |

## Reglas de DNS

- **No** añadir registros MX de recepción de Resend: la recepción es de GoDaddy.
- No modificar MX, SPF ni DMARC del correo de GoDaddy. Los registros de Resend (DKIM y return-path) conviven con ellos.

## Correos que envía la plataforma

| Evento | Plantilla (`api/src/lib/email-templates/`) |
|--------|------------------------------------------|
| Bienvenida | `welcome` |
| Restablecer contraseña (enlace válido 1 h) | `password-reset` |
| Contraseña cambiada | `password-changed` |
| Confirmación de reserva | `booking-confirmation` |
| Cancelación | `booking-cancellation` |
| Recordatorio de check-in | `check-in-reminder` |
| Recibo de factura | `invoice-receipt` |

## Verificación

```bash
curl -s https://elevari.live/health
curl -X POST https://elevari.live/api/v1/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"<correo-registrado>"}'
```

Respuesta esperada: `success: true` y correo en la bandeja (revisar spam). Si no llega: logs de `api` (`docker compose ... logs api`) y el panel de Resend (Emails / Logs).

## Rotación

Crear una llave nueva en Resend, actualizar `RESEND_API_KEY` en el servidor, `docker compose ... up -d api web`, y revocar la anterior (ver [RUNBOOK.md](RUNBOOK.md) §6). La llave usada durante el montaje debe rotarse tras el go-live ([HANDOVER.md](HANDOVER.md)).
