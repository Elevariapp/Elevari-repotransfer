# ROADMAP — Hoja de ruta

Última validación: 2026-11-21 · rama chore/elevari-production

El detalle de lo pendiente para el lanzamiento está en [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md). Este documento lista lo que sigue después.

## Ahora — lanzamiento (web + Android)

1. Llaves live de Wompi en el servidor y webhook configurado.
2. Credenciales de Alegra.
3. Cutover DNS, `full (strict)` y restricción de 80/443 a Cloudflare (nginx ya sirve TLS con el Origin Certificate).
4. Bootstrap de datos: `create-admin` y `seed:property`.
5. Android: Internal testing → huella de Play App Signing en `assetlinks.json` → Producción.
6. SEO: Search Console, Safe Browsing, Bing Webmaster, Google Business Profile.
7. Rotación de credenciales expuestas durante el montaje (ver [docs/HANDOVER.md](docs/HANDOVER.md)).

## Siguiente — estabilización (0–3 meses)

| Ítem | Motivo |
|------|--------|
| Habilitar push móvil: `projectId` real de EAS en `mobile/app.json` (requiere login del propietario) + endpoint de la API para registrar tokens + envío con Expo Push | Hoy el push está deshabilitado en la app |
| Monitoreo externo de `/health` y captura de errores (`SENTRY_DSN`) | Sin alertas hoy |
| HSTS a 1 año con `includeSubDomains` | Tras verificar el lanzamiento |
| Prueba periódica de restauración de backups | Validar RPO/RTO reales |
| Copia fuera del servidor de los dumps de Postgres y de MinIO | Hoy solo Hetzner Backups cubre MinIO |
| Mantener el pipeline de CI alineado con el quality gate (incluye `docs:lint`) | CI no construye imágenes Docker de producción ni el AAB |

## Después — evolución

- Réplica o base de datos gestionada si crece el tráfico.
- Retirar el código legacy de Bold y Stripe cuando ya no se necesite rollback.
- Mensajería anfitrión–huésped y búsqueda avanzada.
- WhatsApp Business / Meta Conversions API según resultados de marketing.
- Evaluar iOS solo si cambia el alcance (hoy fuera de alcance).

## Fuera de alcance

iOS, entorno staging, subdominio `api`, proveedores de pago distintos de Wompi.
