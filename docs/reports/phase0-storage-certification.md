# PHASE 0 · WS3 — STORAGE CERTIFICATION

**Fecha:** 2026-11-13 · **Modo:** revisión de configuración (sin MinIO en ejecución)

## Configuración

| Elemento | Valor | Resultado |
|----------|-------|-----------|
| Bucket | `wana-media` | PASS |
| Inicialización | `mc mb --ignore-existing` idempotente | PASS |
| Política de acceso | `mc anonymous set download wana/wana-media` | **RIESGO** |
| Credenciales | `MINIO_ROOT_USER/PASSWORD` (dev) / env (prod) | PASS |
| URL pública | `MINIO_PUBLIC_URL` | PASS |
| Tipos permitidos | imagen (→WebP + thumbnails con sharp) y video MP4/WebM | PASS |
| Límite de subida | 80 MB (`@fastify/multipart`) | PASS |
| Validación de archivo | `media-process.ts` (sharp) | PASS (código) |
| Cuarentena / moderación | `MEDIA_AUTO_APPROVE` + panel admin | PASS |
| Retención | No definida | **GAP** |
| Backup de objetos | No incluido en `backup-db.sh` | **GAP** |

## Hallazgos

| # | Severidad | Hallazgo | Riesgo |
|---|-----------|----------|--------|
| S1 | **Alta** | El bucket completo es de lectura anónima. Hoy solo contiene media pública, pero cualquier objeto futuro (facturas, documentos) quedaría público. | Exposición de datos |
| S2 | Media | Sin política de retención ni ciclo de vida para media huérfana | Coste y privacidad |
| S3 | Media | El backup solo cubre PostgreSQL; los objetos de MinIO no se respaldan | Pérdida de activos |
| S4 | Baja | Sin antivirus/escaneo de archivos subidos | Contenido malicioso |

## Recomendaciones (acción de infraestructura)

1. Separar en `wana-media-public` (anónimo) y `wana-private` (solo API con credenciales).
2. Añadir `mc ilm` (lifecycle) para media no referenciada.
3. Incluir `mc mirror` del bucket en el plan de backup.
4. Escaneo opcional con ClamAV antes de aprobar media.

## Veredicto

**NO CERTIFICADO** — la configuración es funcional, pero la política de acceso anónimo total y la ausencia de backup de objetos son bloqueantes de seguridad/continuidad para producción.
