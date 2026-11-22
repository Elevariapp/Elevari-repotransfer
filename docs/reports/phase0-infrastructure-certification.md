# PHASE 0 · WS1 — INFRASTRUCTURE CERTIFICATION

**Fecha:** 2026-11-13 · **Modo:** estático + validación de configuración (sin Docker en el entorno)

## Arquitectura efectiva

```
Internet → Cloudflare → nginx:80 → web:3000 (Next standalone)
                                  → api:4000 (Fastify)
       postgres:5432 · redis:6379 · minio:9000/9001   (red interna compose)
```

## Matriz de servicios

| Servicio | Imagen | Puerto (dev) | Puerto (prod) | Healthcheck | Persistencia |
|----------|--------|--------------|---------------|-------------|--------------|
| postgres | postgres:16-alpine | 5432 | interno | `pg_isready` | volumen `wana_pg_data` |
| redis | redis:7-alpine | 6379 | interno | `redis-cli ping` | volumen `wana_redis_data` |
| minio | minio/minio | 9000/9001 | interno | `mc ready local` | volumen `wana_minio_data` |
| api | build ./api | 4000 | interno | `/health` (nginx) | — |
| web | build raíz | 3000 | interno | — | — |
| nginx | nginx:1.27-alpine | — | 80/443 | — | config ro |

## Validaciones

| # | Validación | Resultado |
|---|-----------|-----------|
| 1 | Dependencias declaradas (`depends_on`) con `condition: service_healthy` | **PASS** |
| 2 | `restart: unless-stopped` en servicios de larga duración | **PASS** |
| 3 | Volúmenes nombrados para estado persistente | **PASS** |
| 4 | Producción no publica Postgres/Redis/MinIO al host | **PASS** |
| 5 | Separación dev / staging / prod en compose distintos | **PASS** |
| 6 | API espera Postgres/Redis antes de arrancar | **PASS** |
| 7 | Arranque real de la pila (`docker compose up`) | **BLOCKED** — Docker no instalado en el entorno |
| 8 | Recuperación de servicio tras caída | **BLOCKED** — requiere runtime |

## Hallazgos

| # | Severidad | Hallazgo | Estado |
|---|-----------|----------|--------|
| I1 | Media | `docker-compose.yml` (dev) publica 5432/6379/9000/9001 en `0.0.0.0`; correcto en local, peligroso si se ejecuta en un VPS | Documentado |
| I2 | Baja | `minio-init` no tiene `restart` ni healthcheck propio | Documentado |
| I3 | Media | `api` en dev monta el código y corre `npm run dev`; no valida el artefacto de producción | Documentado |

## Fixes aplicados en este programa

- Cabeceras de seguridad y `limit_req` en `deploy/nginx/nginx.conf`.
- `X-Request-Id` propagado a API y web.
- Scripts de backup/restore endurecidos (ver WS6).

## Veredicto

**NO CERTIFICADO (runtime)** — configuración **PASS** en 6/6 validaciones estáticas; la ejecución de la pila, el arranque y la recuperación requieren un host con Docker.
