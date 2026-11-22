# BUSINESS CONTINUITY CERTIFICATION

**Fecha:** 2026-11-13

## Matriz de fallos

| Componente | Fallo | Impacto | Comportamiento actual | ¿Continuidad? |
|------------|-------|---------|------------------------|---------------|
| Wompi | Caída / 5xx | No se puede cobrar | `syncWompiPayment` devuelve `paid:false`; reserva queda `pending_payment` | **Parcial** — sin reintento automático |
| Wompi | Webhook perdido | Reserva no confirma | Sync manual por referencia (`POST /payments/:id/sync`) | **Sí, manual** |
| Email (Resend) | Caída | Sin correo de confirmación | `sendEmail` devuelve `sent:false`, el flujo continúa | **Sí** |
| PostgreSQL | Caída | Todo el negocio se detiene | Sin réplica ni failover | **No** |
| Redis | Caída | Rate limit/colas afectadas | Rate limit en memoria del proceso | **Parcial** |
| MinIO | Caída | Media no disponible | Imágenes públicas ya servidas pueden fallar | **No** |
| Cloudflare/CDN | Caída | Sin acceso web | Sin origen alternativo documentado | **No** |
| Host | Caída | Todo caído | Requiere re-despliegue + restore | **No probado** |

## Objetivos de continuidad

| Métrica | Objetivo | Realidad |
|---------|----------|----------|
| RPO | ≤ 24 h | Backups diarios (no automatizados) |
| RTO | ≤ 60 min | No medido |
| MTTR pagos | ≤ 30 min | Depende de operación manual |

## Modos degradados

| Escenario | Modo degradado posible | Implementado |
|-----------|------------------------|--------------|
| Wompi caído | Reserva en `pending_payment` + reintento posterior | Sí (implícito) |
| Email caído | Confirmación visible en web | Sí |
| Redis caído | Rate limit en proceso | Sí |
| DB caída | — | **No** |
| Media caída | Placeholder (`EmptyMedia`) | Sí (parcial) |

## Hallazgos

| # | Severidad | Hallazgo | Remediación |
|---|-----------|----------|-------------|
| BC1 | **Alta** | Sin failover de base de datos | Réplica + promoción documentada o DB gestionada |
| BC2 | Alta | Sin reintento automático de sync de pagos | Job con backoff |
| BC3 | Alta | Sin backup de MinIO | `mc mirror` externo |
| BC4 | Media | Sin plan de continuidad documentado | Documento + simulacro |
| BC5 | Media | Dependencia única de Cloudflare | Documentar DNS de respaldo |

## Veredicto

**NO CERTIFICADO** — la aplicación tolera fallos de email y Redis, y permite reconciliación manual de pagos, pero no existe continuidad para base de datos, storage ni host.
