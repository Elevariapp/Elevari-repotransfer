# SECURITY CERTIFICATION (CROSS-PHASE)

**Fecha:** 2026-11-13

## Resumen ejecutivo

| Área | Estado |
|------|--------|
| OWASP Top 10 | 8 PASS · 2 PARCIAL (CSP, dependencias) |
| Protección de secretos | PASS |
| Control de autorización | PASS |
| Seguridad de sesión | PASS (JWT verificado en proxy) |
| Auditabilidad | PASS (eventos + logs) |
| Cabeceras de seguridad | **PASS (añadidas)** |
| SSRF en optimizador | **PASS (corregido)** |
| Webhooks sin firma | **PASS (corregido)** |

## Controles añadidos en este programa

1. `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `HSTS` en Next y nginx.
2. `limit_req` por IP para `/api` y propagación de `X-Request-Id`.
3. Redacción de cabeceras sensibles en logs.
4. `ALLOW_UNSIGNED_WEBHOOKS` explícito (antes se infería de `PAYMENTS_MODE=mock`).
5. Eliminación del wildcard `http://**` en `remotePatterns`.
6. Validación de moneda en webhooks.
7. Guard contra sobre-reembolso.

## Pruebas de seguridad ejecutadas

| Prueba | Resultado |
|--------|-----------|
| Webhook con firma válida | PASS |
| Webhook manipulado (monto/estado) | PASS (rechazado) |
| Webhook con secreto incorrecto | PASS (rechazado) |
| Webhook sin config | PASS (rechazado por defecto) |
| Config Wompi parcial/mezclada | PASS (aborta arranque) |
| Escaneo de secretos | PASS (0 hallazgos) |
| Refund sin rol admin | PASS (403) |
| Transiciones de estado ilegales | PASS (bloqueadas) |

## Hallazgos abiertos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| SEC1 | Alta | Sin Content-Security-Policy | Allowlist de terceros + report-only → enforce |
| SEC2 | Media | `npm audit` no bloquea CI | Añadir auditoría con umbral |
| SEC3 | Media | Sin WAF explícito verificado | Confirmar reglas Cloudflare |
| SEC4 | Media | Webhooks sin rate limit | Límite específico |
| SEC5 | Media | Sin ventana temporal en webhooks | Rechazar timestamps antiguos |
| SEC6 | Baja | Bucket MinIO público completo | Buckets separados |

## Veredicto

**PASS con reservas** — SEC1 es el único hallazgo alto y requiere trabajo de integraciones. El resto son mejoras acotadas.
