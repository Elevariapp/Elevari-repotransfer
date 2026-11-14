# PHASE 0 · WS5 — INFRASTRUCTURE SECURITY CERTIFICATION

**Fecha:** 2026-11-13

## Controles por capa

| Capa | Control | Estado |
|------|---------|--------|
| Edge | TLS/SSL (Cloudflare) | **BLOCKED** — no verificable desde el repo |
| Edge | Security headers (nginx) | **PASS (nuevo)** |
| Edge | Rate limit `/api` 20 r/s por IP, burst 40 | **PASS (nuevo)** |
| App | Security headers (Next, `/:path*`) | **PASS (nuevo)** |
| App | `poweredByHeader: false` | PASS |
| App | CSP | **GAP** — omitida a propósito hasta allowlist de terceros |
| App | HSTS | **PASS** (`max-age=15552000; includeSubDomains`) |
| App | COOP `same-origin` | PASS |
| App | `X-Frame-Options: SAMEORIGIN` | PASS |
| App | `Referrer-Policy: strict-origin-when-cross-origin` | PASS |
| App | `Permissions-Policy` (camera/mic/geo bloqueados) | PASS |
| API | Rate limit global 120/min | PASS |
| API | CORS allowlist (localhost, eleveri.app, www) | PASS |
| API | Redacción de headers sensibles en logs | **PASS (nuevo)** |
| API | Autorización en servidor por rol | PASS (código) |
| API | Firma de webhook obligatoria | **PASS (endurecido)** |
| Datos | SQL parametrizado vía Prisma | PASS |
| Datos | `XSS` — React escapa por defecto; sin `dangerouslySetInnerHTML` | PASS |
| Imágenes | `remotePatterns` sin wildcard http | **PASS (corregido)** |

## OWASP Top 10 (estado)

| Riesgo | Estado | Evidencia |
|--------|--------|-----------|
| A01 Broken Access Control | PASS | middleware/proxy por rol + checks en rutas |
| A02 Cryptographic Failures | PASS | JWT verificado, SHA-256 en firmas, sin secretos en repo |
| A03 Injection | PASS | Prisma ORM, sin SQL concatenado |
| A04 Insecure Design | PASS | gates de disclosure y legal signoff |
| A05 Security Misconfiguration | **PARCIAL** | headers OK; falta CSP |
| A06 Vulnerable Components | **PARCIAL** | requiere `npm audit` en CI |
| A07 Auth Failures | PASS | hash de contraseña, Turnstile opcional, rate limit |
| A08 Integrity Failures | PASS | firma de webhooks + dedupe |
| A09 Logging Failures | PASS | logs estructurados + redacción |
| A10 SSRF | **PASS (corregido)** | wildcard http eliminado del optimizador |

## Hallazgos abiertos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| X1 | Alta | Sin CSP | Definir allowlist (Google, Turnstile, GA4, Meta) y desplegar en report-only → enforce |
| X2 | Media | `npm audit` no corre en CI | Añadir paso `npm audit --omit=dev` con umbral |
| X3 | Media | Sin WAF explícito más allá de Cloudflare | Confirmar reglas gestionadas |
| X4 | Media | Webhooks exentos de rate limit | Añadir límite específico por IP |
| X5 | Baja | Sin `Permissions-Policy` para `usb`, `serial` | Ampliar directiva |

## Veredicto

**PASS con reservas** — 6 controles añadidos/corregidos en este programa. X1 (CSP) es el único hallazgo alto y requiere prueba de integraciones.
