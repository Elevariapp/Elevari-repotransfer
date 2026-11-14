# ENTERPRISE SCALABILITY CERTIFICATION

**Fecha:** 2026-11-13 · **Modo:** modelo de capacidad (sin load testing ejecutado)

## Estado

**NO CERTIFICADO por falta de evidencia.** No se ejecutaron pruebas a 1K / 10K / 100K usuarios. Este documento entrega el modelo y las recomendaciones para ejecutarlas.

## Modelo a 1K / 10K / 100K

| Concurrentes | RPS medio | RPS pico (×3) | Web (2 vCPU) | API | PostgreSQL |
|--------------|-----------|---------------|--------------|-----|------------|
| 1.000 | 69 | 208 | 1 instancia | 1 instancia | 1 instancia (ok) |
| 10.000 | 694 | 2.083 | 6–8 instancias | 4–6 instancias | Réplica lectura + PgBouncer |
| 100.000 | 6.944 | 20.833 | 40–60 instancias + CDN | 20–30 instancias | Cluster / particionado |

## Cuellos de botella identificados (por diseño)

| # | Componente | Límite | Mitigación |
|---|------------|--------|-----------|
| ES1 | Next SSR en 1 contenedor | CPU | Escalado horizontal + ISR/CDN |
| ES2 | Pool de Prisma | Conexiones | PgBouncer |
| ES3 | `EXCLUDE` gist en reservas | Escrituras concurrentes | Particionar por propiedad |
| ES4 | `/_next/image` | Ancho de banda/CPU | Cache CDN |
| ES5 | Listados sin caché | Carga DB | Redis + `revalidate` |
| ES6 | Rate limit por IP | NAT corporativo | Límite por sesión/API key |
| ES7 | MinIO local | I/O | Object storage gestionado |
| ES8 | Webhooks sin límite | Picos | Cola (BullMQ) + workers |

## Recomendaciones de arquitectura

1. **CDN** para estáticos e imágenes (Cloudflare ya disponible).
2. **PgBouncer** delante de PostgreSQL.
3. **Redis** para caché de listados y rate limit distribuido.
4. **Workers** (BullMQ) para emails, thumbnails y reintentos de CAPI.
5. **Cola de reservas** si la contención del `EXCLUDE` aparece en las pruebas.
6. **Observabilidad** (OTel) para medir p95 por ruta.

## Plan de validación

| Etapa | Herramienta | Criterio de aceptación |
|-------|-------------|------------------------|
| 100 usuarios | k6 | p95 < 500 ms, 0 errores |
| 1.000 | k6 | p95 < 800 ms, error < 0.1 % |
| 10.000 | k6 distribuido | p95 < 1.2 s, error < 0.5 % |
| 100.000 | simulación + modelado | Plan de escalado validado por infraestructura |

## Veredicto

**NO CERTIFICADO** — el modelo y las mitigaciones están definidos; la evidencia de carga no existe.
