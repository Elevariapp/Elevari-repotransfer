# GOVERNANCE CERTIFICATION

**Fecha:** 2026-11-13

## Ownership por dominio

| Dominio | Owner propuesto | Estado |
|---------|-----------------|--------|
| Web (Next) | Desarrollo | Definido en `.cursorrules` (roles) |
| API (Fastify) | Desarrollo | Definido |
| Base de datos | Infraestructura | **Sin owner nominal** |
| Pagos / Wompi | Negocio + Desarrollo | Compartido, sin RACI formal |
| Legal / cumplimiento | Legal | Pendiente de designar |
| Marketing / analítica | Marketing | Pendiente de designar |
| Seguridad | Infraestructura | **Sin owner** |
| Backups / DR | Infraestructura | **Sin owner** |

## Gates de aprobación

| Gate | Existe | Evidencia |
|------|--------|-----------|
| Build + typecheck en CI | Sí | `.github/workflows/ci.yml` |
| Verificación de pagos (`verification-log.md`) | Sí | `deploy/scripts/check-verification-log.sh` |
| Gate legal internacional | Sí | `FX_INTL_CHECKOUT_ENABLED` + `LEGAL_SIGNOFF_REF` |
| Aprobación de cambios de precios | No formalizado | — |
| Aprobación de despliegue a producción | No formalizado | — |

## Escalado

| Elemento | Estado |
|----------|--------|
| Procedimiento de escalado de incidentes | No documentado |
| Contactos de guardia | No documentados |
| Ventanas de cambio | No definidas |

## Hallazgos

| # | Severidad | Hallazgo |
|---|-----------|----------|
| G1 | Alta | Sin RACI formal para pagos, seguridad y DR |
| G2 | Alta | Sin aprobación formal de despliegue a producción |
| G3 | Media | Sin procedimiento de escalado ni guardias |
| G4 | Media | Sin owner de cumplimiento legal |

## Veredicto

**NO CERTIFICADO** — la gobernanza técnica existe (CI, gates de pago y legal), pero faltan owners nominales, RACI y aprobaciones formales. Es acción organizativa, no de código.
