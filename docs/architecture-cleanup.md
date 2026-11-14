# ARCHITECTURE CLEANUP — Foundation Reboot

**Fecha:** 2026-11-13
**Autoridad aplicada:** Architecture Authority + Cleanup Authority + Payment Authority

---

## 1. Arquitectura oficial

| Capa | Oficial | Estado |
|------|---------|--------|
| Compute | AWS EC2 | Documentado (`deploy/`, `INFRASTRUCTURE.md`) |
| Base de datos | PostgreSQL | Prisma + migraciones |
| Storage | S3-compatible (MinIO local) | `MINIO_*` |
| Edge | Cloudflare | DNS/TLS/WAF |
| Pagos | Wompi | Único proveedor implementado |
| Extensiones | Fly.io · Hugging Face | Permitidas |

**Fuera de alcance:** Vercel · Supabase · Firebase · Netlify.

---

## 2. Eliminaciones aplicadas

| Elemento | Evidencia de falta de uso | Justificación | Impacto | Resultado esperado |
|----------|---------------------------|---------------|---------|--------------------|
| `netlify.toml` | No referenciado por build ni CI | Netlify fuera de arquitectura | Ninguno | Menos configuración ambigua |
| `@netlify/plugin-nextjs` | Solo lo usaba `netlify.toml` | Dependencia muerta | Bundle/instalación más ligera | Sin plugins de plataformas excluidas |
| `components/checkout/StripePaymentForm.tsx` | 0 importaciones (solo auto-referencia) | Stripe no certificable | Ninguno | Sin UI de proveedor no soportado |
| `api/src/lib/payments/stripe-provider.ts` | Solo importado por router/refund | Stripe eliminado | Refunds no-Wompi → `pending_manual` | Dominio Wompi-only |
| `api/src/lib/payments/bold-provider.ts` | Solo importado por router/webhooks | Bold eliminado | Webhooks Bold retirados | Superficie de ataque menor |
| Rutas `/webhooks/bold`, `/webhooks/stripe` | Específicas de proveedores retirados | No certificables | 404 | API mínima |
| `@stripe/react-stripe-js`, `@stripe/stripe-js` | Sin uso tras borrar el formulario | Dependencias muertas | Instalación más ligera | Sin SDKs no usados |
| `DEPLOYMENT_PHASE3.md`, `DEPLOYMENT_PHASE3_QUICKREF.md` | Guías Supabase/Vercel obsoletas | Fuera de arquitectura | Documentación duplicada eliminada | Una sola guía (`deploy/`) |
| `README_ADMIN.md` | Basado en Supabase RLS | Fuera de arquitectura | — | Documentación vigente en `docs/` |
| `middleware/rate-limit.ts` | 0 importaciones | Código muerto | — | Menos deuda |
| `STRIPE_COP_USD_RATE` fallback | Alias legacy | Proveedor retirado | `FX_COP_USD_RATE` única fuente | Configuración limpia |
| `PAYMENTS_BOLD_ENABLED`, `PAYMENTS_STRIPE_ENABLED` | Flags sin proveedor | Configuración muerta | Arranque más estricto | Fail-fast solo Wompi |

---

## 3. Documentos archivados

Movidos a `docs/archive/` con aviso de obsolescencia (referencian Supabase/Netlify/Vercel):

- `BUTTON_AUDIT.md`
- `PLATFORM_STATUS_CHECKLIST.md`
- `QUALITY_FRAMEWORK_GO_NO_GO.md`
- `SERVICES_MIGRATION_PLAN.md`

---

## 4. Abstracción conservada (Payment Authority)

`api/src/lib/payments/router.ts` mantiene:

- `PaymentProvider` (tipo Prisma)
- `SUPPORTED_PROVIDERS = ['wompi']`
- `createProviderIntent(provider, input, idempotency)`

Cualquier proveedor futuro se añade detrás del mismo contrato sin tocar el flujo de reservas.

> Nota: el enum `PaymentProvider` de PostgreSQL conserva los valores `bold`/`stripe` por compatibilidad histórica de datos. Cambiarlo requiere migración; no hay código que los emita.

---

## 5. Verificación

| Check | Resultado |
|-------|-----------|
| `npm run typecheck` | ✅ 0 errores |
| `npm run build` | ✅ 30 rutas |
| Referencias `bold/stripe` en `api/src` | ✅ 0 |
| Referencias a Netlify/Supabase/Vercel en configuración activa | ✅ 0 |
| Tests de lógica de pagos | ✅ 50/50 (incluye webhooks y refunds) |
