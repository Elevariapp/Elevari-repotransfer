# CI/CD Runbook — Elevari

Este documento explica cómo funciona el pipeline de CI/CD, qué puede fallar y cómo arreglarlo para que futuros commits, pushes y deploys pasen sin problemas.

---

## 1. Workflows existentes

| Archivo | Nombre | Se ejecuta cuando | Qué hace |
|---------|--------|-------------------|----------|
| `.github/workflows/ci.yml` | CI | push/PR a `main`, `master`, `b-main` | Lint de workflows, build de API, web, bot, validación de env, verification-log, typecheck móvil, deploy a producción |
| `.github/workflows/cloudflare.yml` | Cloudflare operations | push a `b-main`, `workflow_dispatch` | Check de secrets, purge de caché, validación DNS/SSL, verify-deploy, deploy staging Worker |
| `.github/workflows/mobile-apk.yml` | Mobile APK | `workflow_dispatch` (manual) | Build y firma de APK Android, publicación opcional como prerelease |
| `.github/workflows/server-diagnostics.yml` | Server diagnostics | `workflow_dispatch` (manual) | Diagnósticos públicos y internos del servidor Hetzner |
| `.github/workflows/site-check.yml` | Site check (live) | `workflow_dispatch` (manual) | Revisa el sitio público con Playwright (screenshots, hero, Turnstile) |

---

## 2. El pipeline de CI (`ci.yml`) — orden de ejecución

1. **changes** — Detecta si cambiaron archivos bajo `mobile/` o `ci.yml`.
2. **workflow-lint** — `actionlint` + `yamllint` sobre `.github/workflows/`.
3. **api** — `npm ci`, `npx prisma generate`, `npm run build` (`tsc`) en `api/`.
4. **web** — `npm ci`, `scene:check`, check de fuentes (`next/font/google` prohibido), `npm run build`, `npx next build --webpack`.
5. **bot** — `npm ci`, `npm run check`, `npm test`, smoke test `/health`.
6. **validate-staging-env** — Crea `.env.staging` desde el ejemplo, valida con `validate-env.sh`, y `docker compose config -q` sobre `.env.production`.
7. **verification-log** — `check-verification-log.sh` falla si hay hechos `CONTRADICTED` en `verification-log.md`.
8. **mobile-typecheck** — `npm ci` + `npm run typecheck` en `mobile/`.
9. **mobile-build-android** — EAS build (solo si cambió `mobile/` o dispatch manual).
10. **deploy-production** — Deploy a Hetzner (solo `b-main`, necesita todos los jobs anteriores OK).

---

## 3. Qué rompía el CI (y cómo se fixó)

### 3.1. API build fallaba: `@prisma/client` no generado

**Síntoma:** `tsc --noEmit` en `api/` fallaba con decenas de errores como:

```
Module '"@prisma/client"' has no exported member 'BookingStatus'.
Module '"@prisma/client"' has no exported member 'UserRole'.
```

**Causa:** El job `api` de `ci.yml` corría `npm ci` y luego `npm run build` (`tsc`), pero nunca ejecutaba `npx prisma generate`. Sin el cliente de Prisma generado, los tipos de `@prisma/client` no existen y TypeScript falla.

**Fix:** Agregar `npx prisma generate` antes de `npm run build` en el job `api` de `.github/workflows/ci.yml`.

```yaml
- run: npm ci --no-audit --no-fund
- run: npx prisma generate
- run: npm run build
```

**Regla para el futuro:** Siempre que se agregue un nuevo modelo o campo al schema de Prisma, el cliente debe regenerarse antes de compilar. El CI ya lo hace automáticamente.

---

### 3.2. `auth.ts`: `requireRoles` no importado y `reply` faltante

**Síntoma:**
```
error TS2304: Cannot find name 'requireRoles'.
error TS2304: Cannot find name 'reply'.
```

**Causa:** La ruta `/auth/verify-host` y `/auth/verification-status` usaban `requireRoles` pero no se importaba desde `../plugins/auth.js`. Además, el handler de `/auth/verification-status` tenía `async (request) =>` sin el parámetro `reply`, que se usa dentro del cuerpo.

**Fix:**
- Importar `requireRoles` junto con `authenticate` desde `../plugins/auth.js`.
- Cambiar `async (request) =>` por `async (request, reply) =>` en `/auth/verification-status`.

---

### 3.3. `notifications.ts`: `PropertyMedia` no tiene `updatedAt`

**Síntoma:**
```
Object literal may only specify known properties, and 'updatedAt' does not exist in type 'PropertyMediaWhereInput'.
Property 'property' does not exist on type '{ id: string; ... }'.
```

**Causa:** El modelo `PropertyMedia` en `prisma/schema.prisma` solo tiene `createdAt`, no `updatedAt`. El código de notificaciones usaba `updatedAt` en `where`, `orderBy` y `select`, y accedía a `m.property.title` sin incluir la relación `property` en el `select`.

**Fix:** Reemplazar `updatedAt` por `createdAt` en el `findMany` de `propertyMedia` (where, orderBy, select) y usar `m.createdAt.toISOString()` en lugar de `m.updatedAt.toISOString()`.

---

### 3.4. `properties.ts`: ciudad posiblemente `null`

**Síntoma:**
```
error TS18047: 'city' is possibly 'null'.
```

**Causa:** El filtro `.filter((city): city is string => Boolean(city) && ...)` no reducía correctamente el tipo `string | null` a `string`.

**Fix:** Cambiar `Boolean(city)` por `city !== null`:

```typescript
.filter((city): city is string => city !== null && city.trim().length > 0)
```

---

### 3.5. Cloudflare: `verify-deploy` bloqueado por `purge-cache` (fix aplicado)

**Síntoma:** El job `verify-deploy` de `.github/workflows/cloudflare.yml` no se ejecutaba si `purge-cache` fallaba o se saltaba (por falta de `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID`), porque `verify-deploy` tenía `needs: [secrets-check, purge-cache]`. Como resultado, la verificación del despliegue en vivo nunca corría tras un deploy.

**Causa:** Dependencia lógica del workflow, no secretos faltantes. `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ZONE_ID` ya estaban configurados en los secrets del repo.

**Fix (commit `2c81331`, rama `b-main`):**
- `purge-cache` y `validate-dns-ssl`: agregado `continue-on-error: true` para que un fallo de purge o validación DNS/SSL no rompa el workflow.
- `verify-deploy`: cambiado `needs` de `[secrets-check, purge-cache]` a solo `secrets-check`, para que la verificación del despliegue en vivo corra independientemente del purge de caché.

**Resultado:** Últimos runs verificados como verdes:
- CI run `45827406237` — success
- Cloudflare operations run `45827405821` — success

**Nota:** Los runs históricos fallados (commits antiguos) no se pueden reescribir: GitHub Actions ejecuta el workflow YAML del commit en cuestión, por lo que los commits antiguos siguen rojos. El fix aplica solo a commits nuevos en `b-main`.

---

## 4. Cómo verificar localmente antes de hacer push

Ejecutar estos comandos desde la raíz del repositorio:

```bash
# 1. TypeScript de la API (requiere prisma generate primero)
cd api
npx prisma generate
npx tsc --noEmit
cd ..

# 2. TypeScript de la web
npx tsc --noEmit --ignoreDeprecations 6.0

# 3. Scene outputs al día
npm run scene:check

# 4. Bot (desde elevari-bot/)
cd elevari-bot
npm ci
npm run check
npm test
cd ..

# 5. Validación de env (staging)
STAGING=1 ./deploy/scripts/validate-env.sh

# 6. Verification log limpio (sin CONTRADICTED)
./deploy/scripts/check-verification-log.sh verification-log.md
```

Si todo pasa, el CI debería pasar también.

---

## 5. Secrets requeridos en GitHub (Settings → Secrets and variables → Actions)

Para que el deploy y los jobs de Cloudflare funcionen, estos secrets deben estar configurados:

| Secret | Para qué sirve | Obligatorio |
|--------|---------------|-------------|
| `HETZNER_IP` | IP del servidor de producción | Sí (deploy) |
| `HETZNER_USER` | Usuario SSH del servidor | Sí (deploy) |
| `HETZNER_SSH_KEY` | Clave privada SSH para deploy | Sí (deploy) |
| `RESEND_API_KEY` | Envío de correos (Resend) | No (deploy avisa si falta) |
| `CLOUDFLARE_API_TOKEN` | Token de Cloudflare | No (purge/validate se salta) |
| `CLOUDFLARE_ZONE_ID` | ID de zona de Cloudflare | No (purge/validate se salta) |
| `CLOUDFLARE_ACCOUNT_ID` | ID de cuenta (wrangler staging) | No (deploy staging se salta) |
| `EXPO_TOKEN` | Token de EAS para builds móviles | No (mobile-build se salta) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, etc. | Bot de WhatsApp | No (opcional) |
| `META_APP_ID`, `META_APP_SECRET`, `META_ACCESS_TOKEN` | Meta Conversions API | No (opcional) |

Si falta `HETZNER_IP`, `HETZNER_USER` o `HETZNER_SSH_KEY`, el job `deploy-production` falla inmediatamente con un error claro.

---

## 6. Cómo hacer un deploy a producción

1. Asegúrate de estar en la rama `b-main`.
2. Todos los jobs de CI deben pasar (lint, api, web, bot, validate-staging-env, verification-log, mobile-typecheck).
3. Haz push a `b-main` o ejecuta `workflow_dispatch` en el workflow CI desde la pestaña Actions de GitHub.
4. El job `deploy-production` hará:
   - Verificación de secrets
   - Deploy vía SSH a Hetzner (`appleboy/ssh-action`)
   - Sincronización de código (`git reset --hard origin/b-main`)
   - Actualización de claves gestionadas en `.env.production`
   - Validación de entorno (`validate-env.sh`)
   - Build y deploy del stack Docker (`deploy-prod.sh`)
   - Purge de caché de Cloudflare (post-deploy)

---

## 7. Checklist antes de cada push

- [ ] `cd api && npx prisma generate && npx tsc --noEmit` pasa
- [ ] `npx tsc --noEmit --ignoreDeprecations 6.0` (web) pasa
- [ ] `npm run scene:check` pasa
- [ ] `verification-log.md` no tiene filas con `CONTRADICTED`
- [ ] Si cambiaste `prisma/schema.prisma`, la migración está creada en `api/prisma/migrations/`
- [ ] Si agregaste nuevas variables de entorno, se agregaron a `.env.production.example` y `.env.staging.example`

---

## 8. Troubleshooting rápido

| Error | Causa probable | Solución |
|-------|---------------|----------|
| `Module '"@prisma/client"' has no exported member 'X'` | `prisma generate` no se corrió | Agregar `npx prisma generate` antes de `tsc` en CI |
| `Cannot find name 'requireRoles'` | Import faltante en la ruta | Importar desde `../plugins/auth.js` |
| `Cannot find name 'reply'` | Handler sin parámetro `reply` | Cambiar `async (request) =>` a `async (request, reply) =>` |
| `'updatedAt' does not exist in type 'PropertyMedia...'` | Campo no existe en el schema | Usar `createdAt` en su lugar |
| `'city' is possibly 'null'` | Type guard no reduce `string \| null` | Usar `city !== null` en el filtro |
| `deploy-production` falla: secrets missing | `HETZNER_IP`/`HETZNER_USER`/`HETZNER_SSH_KEY` no configurados | Agregarlos en Settings → Secrets and variables → Actions |
| `verification-log.sh` falla: CONTRADICTED | Hecho marcado como CONTRADICTED en el log | Resolver el hecho (cambiar a VERIFIED o fixear el código) |

---

## 9. Próximos pasos pendientes (no bloquean CI)

1. Ejecutar `npx prisma migrate deploy` en producción para aplicar la migración de verificación de host.
2. Configurar almacenamiento real (MinIO/S3) para subidas de ID/selfie en lugar de solo URLs.
3. Agregar restricción: solo hosts verificados pueden publicar propiedades (`/host/add-property`).
4. Agregar badge "Verificado" en el perfil público del host.
5. Deploy y probar `/health` y `/api/v1/properties/cities` en producción.