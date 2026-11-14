# PHASE 0 · WS6 — DISASTER RECOVERY CERTIFICATION

**Fecha:** 2026-11-13 · **Modo:** revisión de procedimientos (sin base de datos para ejecutar restore)

## Procedimientos existentes

| Procedimiento | Script | Estado |
|---------------|--------|--------|
| Backup PostgreSQL | `deploy/scripts/backup-db.sh` | **PASS (mejorado)** |
| Restore PostgreSQL | `deploy/scripts/restore-db.sh` | **PASS (nuevo)** |
| Rollback de despliegue | `deploy/scripts/deploy-prod.sh` (imagen previa) | PASS (documentado) |
| Recuperación de MinIO | No existe | **GAP** |
| Recuperación de Redis | Redis es caché/colas; sin persistencia crítica | N/A |

## Mejoras aplicadas

| Mejora | Detalle |
|--------|---------|
| Checksum SHA-256 | `backup-db.sh` genera `.sha256`; `restore-db.sh` lo verifica |
| Validación de tamaño | Aborta si el dump pesa menos de `BACKUP_MIN_BYTES` (default 1 KB) |
| Retención | Borra dumps y checksums con más de `BACKUP_RETENTION_DAYS` (default 14) |
| Restore seguro | Requiere `--yes`, usa `ON_ERROR_STOP=1` |
| Verificación post-restore | Cuenta `bookings`, `payments`, `payment_events` |
| Scripts npm | `npm run db:backup` / `npm run db:restore` |

## Métricas RTO / RPO

| Métrica | Objetivo propuesto | Evidencia actual |
|---------|--------------------|------------------|
| RPO (pérdida máxima de datos) | ≤ 24 h (backup diario) | **No medido** — depende de cron en el host |
| RTO (tiempo de recuperación) | ≤ 60 min | **No medido** — requiere prueba de restore |
| Restore verificado | Obligatorio antes de go-live | **BLOCKED** — sin PostgreSQL |

## Escenarios

| Escenario | Procedimiento | Probado |
|-----------|---------------|---------|
| Corrupción de BD | `restore-db.sh` desde último dump | No |
| Borrado accidental de tabla | Restore completo (no hay PITR) | No |
| Caída de host | Re-despliegue + restore | No |
| Fuga/rotación de secreto | Rotar + redesplegar | No |
| Fallo de MinIO | Recrear bucket + `mc mirror` (pendiente) | No |

## Hallazgos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| R1 | **Alta** | Sin backup de objetos MinIO | `mc mirror` a almacenamiento externo |
| R2 | Alta | Sin PITR (solo dumps diarios) | Evaluar WAL archiving / proveedor gestionado |
| R3 | Media | Sin cron ni almacenamiento externo definido | Configurar cron + copia off-site cifrada |
| R4 | Media | Sin prueba de restore registrada | Ejecutar y guardar evidencia (RTO medido) |
| R5 | Baja | Backups no cifrados en reposo | `gpg`/`age` con clave de operaciones |

## Veredicto

**NO CERTIFICADO** — los procedimientos existen y fueron endurecidos, pero **no se ha ejecutado ni medido una restauración**. RTO/RPO son objetivos, no hechos.
