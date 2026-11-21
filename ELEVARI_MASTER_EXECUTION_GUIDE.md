# ELEVARI_MASTER_EXECUTION_GUIDE — Reglas de ejecución

Última validación: 2026-11-21 · rama chore/elevari-production

Guía para cualquier persona o agente que modifique Elevari. Complementa [docs/HANDOVER.md](docs/HANDOVER.md) (cuentas y acceso) y [docs/RUNBOOK.md](docs/RUNBOOK.md) (operación).

## Contexto fijo

- Marca **Elevari**, dominio `elevari.live`, Colombia, COP, Ley 1581 de 2012.
- «Glamping Waná» es el nombre de **una propiedad** (slug `glamping-wana`) listada en la plataforma; no es la marca.
- Contacto oficial para todo (soporte, legal, privacidad, moderación, accesibilidad, anfitriones): `reserve@elevari.live`.
- Alcance: web + Android, solo producción (sin staging, sin iOS).
- Rama de trabajo: `chore/elevari-production`; rama por defecto del repo: `b-main`.

## Reglas de oro

1. **Sin secretos en el repo.** Solo nombres de variables y dónde vive el valor. Los valores viven en `/opt/elevari/.env.production`, el gestor de contraseñas del propietario y `~/.gradle/gradle.properties`.
2. **No tocar ningún otro servidor** del proyecto Hetzner: operar solo el servidor de Elevari (`<HETZNER_SERVER_ID>`).
3. **Quality gate antes de cada push** (ver [COMMANDS.md](COMMANDS.md)).
4. **Solo producción.** Cambios de infraestructura o DNS con paso de verificación y plan de rollback documentado en el RUNBOOK.
5. **Pagos:** Wompi es el único proveedor live. Bold y Stripe son código legacy deshabilitado.
6. **No modificar** archivos generados de Android (`mobile/android` está ignorado por git; se configura con `app.json` y plugins de Expo).
7. **Documentación viva:** si cambia el comportamiento, se actualiza el documento fuente (ver [SSOT_REGISTRY.md](SSOT_REGISTRY.md)) en el mismo cambio y se corre `npm run docs:lint`.

## Flujo de trabajo

1. Leer el documento fuente del dominio ([SSOT_REGISTRY.md](SSOT_REGISTRY.md)).
2. Cambio pequeño y enfocado en la rama de trabajo.
3. Quality gate completo.
4. Push y PR contra `b-main`.
5. Despliegue con el procedimiento del RUNBOOK; verificar `/health` y el flujo afectado.
6. Actualizar [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md) o [DOMAIN_STATUS.md](DOMAIN_STATUS.md) si cambia el estado.

## Verificación de hechos externos

`verification-log.md` registra hechos de Wompi con estado VERIFIED / UNVERIFIED / CONTRADICTED; CI (`check-verification-log.sh`) falla si el código live depende de un hecho CONTRADICTED. Confirmar los UNVERIFIED con el primer pago y webhook reales.

## Particularidades de las herramientas

- Next.js 16: el antiguo `middleware.ts` es ahora `proxy.ts`. Consultar la documentación de la versión instalada, no la memoria.
- Expo SDK 58: consultar `https://docs.expo.dev/versions/v58.0.0/` antes de tocar APIs de Expo/EAS (ver `mobile/AGENTS.md`).
- `NEXT_PUBLIC_*` se fija en build: cambiarlas exige reconstruir la imagen `web`.
- La imagen `web` falla el build si faltan `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` y ya no ignora errores de TypeScript: un typecheck roto rompe `docker compose build`.

## Fases (estado)

| Fase | Resultado | Estado |
|------|-----------|--------|
| Fundación (código web + API) | catálogo, reservas, auth, media, admin, host | Hecho |
| Pagos Wompi | integración y certificación en código | Hecho (llaves live pendientes) |
| App Android | build firmado, Firebase, push (cliente) | Hecho; publicación en Play pendiente |
| Infraestructura Hetzner + Cloudflare | servidor, hardening, edge | Hecho; cutover pendiente |
| Lanzamiento | ver [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md) | En curso |

Detalle posterior al lanzamiento: [ROADMAP.md](ROADMAP.md).
