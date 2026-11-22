# OPERATIONS CERTIFICATION

**Fecha:** 2026-11-13

## Runbooks existentes

| Runbook | Ruta | Estado |
|---------|------|--------|
| Despliegue producción | `deploy/DEPLOYMENT_PRODUCTION.md` | PASS |
| Checklist go-live | `deploy/GO_LIVE_CHECKLIST.md` | PASS |
| Health verification | `deploy/scripts/verify-health.sh` | PASS |
| Deploy/rollback | `deploy/scripts/deploy-prod.sh` | PASS (parcial) |
| Bootstrap VPS | `deploy/scripts/vps-bootstrap.sh` | PASS |
| Backup / restore | `deploy/scripts/backup-db.sh`, `restore-db.sh` | **PASS (mejorado)** |
| Incidentes | No existe | **GAP** |
| Soporte | No existe | **GAP** |
| Cambios (change management) | No existe | **GAP** |

## Monitorización

| Capacidad | Estado |
|-----------|--------|
| Health endpoint (`/health`) | PASS |
| Healthcheck de contenedores | PASS |
| Logs estructurados | PASS |
| Request IDs | **PASS (nuevo)** |
| Métricas (Prometheus/OTel) | **GAP** |
| Alertas (webhook/email) | **GAP** |
| Error tracking (Sentry) | **GAP** |
| Uptime externo | **GAP** |

## Procedimientos

| Procedimiento | Documentado | Probado |
|---------------|-------------|---------|
| Despliegue | Sí | No |
| Rollback | Parcial | No |
| Restauración de BD | **Sí (nuevo)** | No |
| Rotación de secretos | No | No |
| Incidente de pago | No | No |
| Escalado de capacidad | No | No |

## Hallazgos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| OP1 | **Alta** | Sin monitorización activa ni alertas | Sentry + uptime + alertas de webhook |
| OP2 | Alta | Sin runbook de incidentes ni contactos | Documento + guardias |
| OP3 | Media | Rollback no probado | Simulacro en staging |
| OP4 | Media | Sin gestión de cambios | Checklist de aprobación |
| OP5 | Media | Sin procedimiento de soporte | Definir SLA y canal |

## Veredicto

**NO CERTIFICADO** — los runbooks de despliegue y recuperación existen y mejoraron, pero **no hay operación activa**: sin alertas, sin on-call y sin simulacros ejecutados.
