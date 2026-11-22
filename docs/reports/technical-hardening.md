# TECHNICAL HARDENING — Phase 3.5

**Fecha:** 2026-11-13

---

## 1. Correcciones aplicadas

| # | Item | Antes | Después | Commit |
|---|------|-------|---------|--------|
| T1 | Convención `middleware` (Next 16) | Warning de deprecación en cada build | `proxy.ts` con `export default proxy`, matcher intacto, **0 warnings** | `chore(next16): migrate deprecated middleware.ts to proxy.ts` |
| T2 | Script `npm run lint` | Fallaba: `next lint` fue eliminado en Next 16 | Reemplazado por `npm run typecheck` (`tsc --noEmit`) | `chore(tooling): ...` |
| T3 | TS 6 `baseUrl` | `tsc` abortaba con TS5101 | `ignoreDeprecations: "6.0"`; typecheck en verde | idem |
| T4 | `images.quality` | `quality={72}` sin declarar → **HTTP 400** en producción | `qualities: [60, 72, 75]` | `perf(web): ...` |
| T5 | `remotePatterns` http wildcard | `{protocol:'http', hostname:'**'}` permitía al optimizador descargar cualquier URL plana | Eliminado; solo MinIO local/VPS por http y https remoto | este workstream |
| T6 | Logs de email | `console.log(params)` con destinatario y cuerpo | Destinatario enmascarado, sin cuerpo | `fix(observability): ...` |
| T7 | Logs de API | `logger: true` sin redacción ni request id | Redacción de auth/cookies + `x-request-id` | idem |

---

## 2. Configuración revisada

| Archivo | Observación | Estado |
|---------|-------------|--------|
| `next.config.ts` | `output: 'standalone'`, `poweredByHeader: false`, `compress: true` | Correcto |
| `next.config.ts` | `typescript.ignoreBuildErrors` activable por `NEXT_IGNORE_TYPE_ERRORS=1` | **Riesgo**: si se define en CI/producción se despliega código con errores de tipo. Mantener sin definir. |
| `tsconfig.json` | `strict: true`, `skipLibCheck: true` | Correcto |
| `.gitignore` | Ignora `node_modules` y `.next` | Correcto |
| CI (`.github/workflows/ci.yml`) | `npm ci` + `npm run build` (web y api) | Correcto |

---

## 3. Código muerto / deuda

| # | Elemento | Estado | Acción |
|---|----------|--------|--------|
| D1 | `middleware/rate-limit.ts` | Sin importaciones (solo mencionado en su propio docblock) | Eliminar o cablear en `proxy` |
| D2 | `components/ui/{Modal,Input,Badge,Toast}.tsx` | Sin consumidores aún | Mantener (API del sistema) o adoptar en admin/auth |
| D3 | Proveedores Bold/Stripe | Código presente, deshabilitado por flags | Documentado; retirar en Fase 6F |
| D4 | 163 referencias a clases `wana-*` | Alias legacy con valores nuevos | Migración planificada (`UI_MIGRATION_PLAN.md`) |
| D5 | `lib/alegra.ts` legacy + `api` invoicing | Ambos presentes | Consolidar en Fase 6B |

---

## 4. Dependencias y seguridad

| Item | Estado |
|------|--------|
| `npm audit` (ejecutado durante `npm ci`/`npm i`) | Reportado por npm; revisar en CI con `npm audit --omit=dev` |
| Secretos en repositorio | **Ninguno** (escaneo de patrones `sk_live_`, `prv_prod_`, `AKIA`, claves PEM, `AIza`) |
| `.env` versionados | No (solo `.env.example` y `.env.wompi.example` con placeholders) |
| `console.log` en producción | Solo `api/src/index.ts` (arranque) e `invoicing` (IDs, sin PII) |

---

## 5. Advertencias de build restantes

| Warning | Estado |
|---------|--------|
| `middleware` deprecado | **Resuelto** |
| Browserslist desactualizado (`caniuse-lite`) | Informativo; actualizar con `npx update-browserslist-db@latest` |
| `next lint` inexistente | **Resuelto** (script eliminado) |

Build final: `Compiled successfully`, `EXIT=0`, 30 rutas.

---

## Veredicto

**PASS** — 7 correcciones aplicadas, build y typecheck limpios. Quedan 5 items de deuda documentados, ninguno bloqueante por sí mismo.
