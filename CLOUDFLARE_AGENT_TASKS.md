# Cloudflare Agent — Task Prompts

This document lists concrete tasks for a **Cloudflare Agent** (an AI agent or runbook operator with access to the Cloudflare dashboard/API for `elevari.live`). It is split into:

1. **Things to do FOR Cloudflare** — one-time or recurring configuration you perform on the Cloudflare side.
2. **Things the Cloudflare Agent should do autonomously** — ongoing monitoring, enforcement, and remediation the agent can run on a schedule or on deploy events.

---

## 1. Things to do FOR Cloudflare (configuration & setup)

### 1.1 DNS records (orange-cloud = proxied through Cloudflare)

| Record | Type | Name | Content | Proxied | Purpose |
|--------|------|------|---------|---------|---------|
| A | @ | `<Hetzner IP>` | ✅ | Root domain `elevari.live` |
| CNAME | www | `elevari.live` | ✅ | `www.elevari.live` |
| A | api | `<Hetzner IP>` | ✅ | Mobile app API (`api.elevari.live`) |
| A | app | `<Hetzner IP>` | ✅ | PWA install page (`app.elevari.live`) |

**Rule:** Delete any leftover parking A/AAAA/CNAME records for `@` or `www` that the registrar imported — they serve Cloudflare's "lander" page instead of your site.

### 1.2 SSL/TLS

- **SSL/TLS → Overview → Flexible** (current, unchanged since 23rd): nginx only listens on HTTP `:80`; Cloudflare terminates HTTPS at the edge. The Cloudflare→origin leg is plaintext.
- Do **not** switch to Full/Full (strict) until you install an origin certificate on nginx and open `:443` on the VPS firewall — otherwise you'll get 522/525 errors.
- Edge certificate: managed by Cloudflare (Universal SSL). Verify expiry quarterly via `openssl s_client -connect elevari.live:443 -servername elevari.live \| openssl x509 -noout -dates`.

### 1.3 Cache behavior

- **Caching → Configuration → Browser Cache TTL:** currently **14400 (4 hours)** — agent recommends lowering to **300 (5 min)** for HTML so deploys propagate quickly without a manual purge.
- **Caching → Configuration → Cache Level:** "Standard" (cache static assets; HTML is cacheable only if you add an Edge Cache TTL rule).
- **Caching → Configuration → Development Mode:** keep **off** in production (it bypasses cache for 3 hours — useful only during debugging).
- **Page Rules / Cache Rules:** add a rule to cache HTML for `elevari.live/*` with Edge Cache TTL = 0 (bypass cache) **or** a short TTL (e.g. 5 min) so deploys propagate quickly without a manual purge.

### 1.4 WAF / Bot management

- **WAF → Custom rules:** create a **Skip** rule so GitHub Actions runners and the mobile app are not challenged:
  - Field: `URI Path` → contains `/health` → Action: **Skip** (WAF rules, Bot Fight Mode, Managed Challenge)
  - Field: `URI Path` → starts with `/api/` AND Header `x-api-key` equals `<mobile app key>` → Action: **Skip** (so the Android app isn't blocked by Bot Fight Mode)
- **Security → Bots → Bot Fight Mode:** set to **On** (blocks scrapers) but add the Skip rules above so legitimate traffic isn't affected.
- **Security → WAF → Managed rules:** Cloudflare Managed Ruleset (CMS, WordPress, etc.) — set to **Sensitive** or **Low** sensitivity; monitor for false positives on `/auth/login` and `/auth/register`.

### 1.5 Turnstile (already in use)

- **Turnstile → Site keys:** verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` matches the widget on `/auth/login` and `/auth/register`.
- **Turnstile → Site keys → Secret key:** must match `TURNSTILE_SECRET_KEY` on the API server.
- **⚠️ Dominios permitidos:** actualmente solo `elevari.live`. Faltan `www.elevari.live` y `app.elevari.live` — si un usuario entra por `www.elevari.live/login` o `app.elevari.live/login`, el widget de Turnstile falla. **El agente no puede editar Turnstile (403).** Hazlo tú en el dashboard: Turnstile → Site keys → edit → añadir dominios.
- If you rotate the site key, update `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `.env.production` and redeploy.

### 1.6 Workers (optional — NOT production)

- The `elevari-repotransfer` Worker on `*.workers.dev` is a **copy only**. `elevari.live` is served by the Hetzner stack behind Cloudflare proxy.
- **Rutas y dominios vacíos:** el Worker no recibe tráfico (rutas `[]`, dominios `[]`). Todo el pipeline despliega código que ningún usuario alcanza a través del Worker.
- **Do not** add custom domains or routes to the Worker — it would capture traffic meant for the VPS.
- If you don't need it: Workers & Pages → Builds → Disconnect.

### 1.7 Secrets in GitHub (Settings → Secrets and variables → Actions) — ✅ DONE

| Secret | Value | Where to get it | Status |
|--------|-------|-----------------|--------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with `Zone:Cache` purge + `Zone:DNS:Read` + `Zone:SSL:Read` permissions | Cloudflare → My Profile → API Tokens → Create Token → "Edit zone cache" template | ✅ Added |
| `CLOUDFLARE_ZONE_ID` | Zone ID for `elevari.live` | Cloudflare → elevari.live → Overview → Zone ID (right sidebar) | ✅ Added |

Both secrets are now configured in the `elevari-repotransfer` repo. The CI/CD pipeline is unblocked — `cloudflare.yml` and the post-deploy purge step in `ci.yml` will run on the next push to `b-main`.

---

## 2. Things the Cloudflare Agent should do autonomously

### 2.1 Purge cache on every production deploy

- **Trigger:** GitHub Actions `deploy-production` job succeeds on `b-main`.
- **Action:** Call `POST /zones/{zone_id}/purge_cache` with `{"purge_everything": true}` (or purge specific URLs if purge_everything isn't permitted).
- **Success:** API returns `success: true`; subsequent `curl -I https://elevari.live/` shows `cf-cache-status: MISS` then `HIT`.
- **Already wired:** `.github/workflows/ci.yml` step "Purge Cloudflare cache (post-deploy)" + `deploy/scripts/cloudflare-purge.sh`.

### 2.2 Validate DNS + SSL + origin reachability (daily or on demand)

- **Trigger:** Daily schedule (cron) or manual `workflow_dispatch`.
- **Action:**
  1. Query Cloudflare API for DNS records; confirm `@`, `www`, `api`, `app` all point to the Hetzner IP and are proxied (orange cloud).
  2. `curl -I https://elevari.live/` → confirm `cf-cache-status` and `cf-ray` headers present (Cloudflare is in the path).
  3. `openssl s_client` → confirm edge certificate is valid and not expiring within 30 days.
  4. `curl https://elevari.live/health` → confirm HTTP 200 through Cloudflare.
- **Success:** All checks pass; otherwise open a GitHub issue or post a warning in the CI run summary.
- **Already wired:** `.github/workflows/cloudflare.yml` job `validate-dns-ssl`.

### 2.3 Verify the live deploy matches the committed build

- **Trigger:** After every production deploy.
- **Action:**
  1. Fetch `https://elevari.live/` through Cloudflare.
  2. Check `<html lang="es">` or `<html lang="en">` is present (i18n build is live).
  3. Check `cf-cache-status` header to confirm edge caching behavior.
  4. Check for the hero scene markers (`data-elevari-scene`, `sc-sw`) if the new hero should be live.
- **Success:** `<html lang>` is a supported locale; no warning emitted.
- **Already wired:** `.github/workflows/cloudflare.yml` job `verify-deploy`.

### 2.4 Monitor WAF / Bot Fight Mode false positives

- **Trigger:** Daily or on demand.
- **Action:** Query Cloudflare Security Events (API: `GET /zones/{zone_id}/firewall/events.limit=100`) for `elevari.live`; filter for `action: challenge` or `action: block` on paths `/auth/login`, `/auth/register`, `/api/*`, `/health`.
- **Success:** No blocks on legitimate paths; if found, create a WAF Skip rule and notify the team.
- **Not yet wired:** add a scheduled job to `.github/workflows/cloudflare.yml`.

### 2.5 Check origin health from outside Cloudflare

- **Trigger:** Daily or on deploy.
- **Action:** `curl` directly to the Hetzner IP (bypassing Cloudflare) on `:80` with `Host: elevari.live` header; confirm HTTP 200 on `/health`, `/`, `/bot/health`.
- **Success:** Origin responds 200; if not, the issue is on the VPS, not Cloudflare.
- **Already wired:** `.github/workflows/server-diagnostics.yml` job `origin-trace`.

### 2.6 Cache status reporting

- **Trigger:** On demand or weekly.
- **Action:** `curl -I https://elevari.live/` and key asset URLs (`/_next/static/...`); record `cf-cache-status` (HIT/MISS/BYPASS/EXPIRED).
- **Success:** Static assets show `HIT`; HTML shows `BYPASS` or short TTL; no `EXPIRED` surprises.
- **Not yet wired:** add to `verify-deploy` job or a separate scheduled job.

### 2.7 SSL certificate expiry watch

- **Trigger:** Weekly.
- **Action:** `openssl s_client -connect elevari.live:443 -servername elevari.live \| openssl x509 -noout -enddate`; alert if expiry < 30 days.
- **Success:** Certificate valid > 30 days.
- **Not yet wired:** add a scheduled step to `validate-dns-ssl`.

### 2.8 Stale-content remediation (when visitors report old content)

- **Trigger:** Manual (visitor reports stale i18n/hero after deploy).
- **Action:**
  1. Purge Cloudflare cache: `POST /zones/{zone_id}/purge_cache` → `purge_everything: true`.
  2. Ask visitor to hard-refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`) and clear site data.
  3. If service worker is stale: unregister it (Chrome DevTools → Application → Service Workers → Unregister).
  4. Verify: `curl -I https://elevari.live/` → `cf-cache-status: MISS` then `HIT`; `curl -s https://elevari.live/ \| grep -i "html lang"` → correct locale.
- **Already wired:** `deploy/scripts/cloudflare-purge.sh` + manual steps in `deploy/DEPLOYMENT_PRODUCTION.md`.

---

## 3. Quick reference commands

```bash
# Purge everything (requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID)
curl -X POST "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'

# Check edge cache status
curl -I https://elevari.live/ | grep -iE '^(cf-cache-status|cf-ray|age):'

# Check <html lang> through Cloudflare
curl -s https://elevari.live/ | grep -oiE '<html[^>]*\blang=["\'][a-z]{2}["\']'

# Check edge certificate dates
echo | openssl s_client -connect elevari.live:443 -servername elevari.live 2>/dev/null \
  | openssl x509 -noout -issuer -dates

# DNS records via Cloudflare API
curl -sS -H "Authorization: Bearer {TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records?per_page=50"
```

---

## 4. Files changed in this improvement

| File | What changed |
|------|-------------|
| `.github/workflows/cloudflare.yml` | **New** — Cloudflare cache purge, DNS/SSL validation, and live-deploy verification jobs |
| `.github/workflows/ci.yml` | Added "Purge Cloudflare cache (post-deploy)" step to `deploy-production` |
| `deploy/scripts/cloudflare-purge.sh` | **New** — Reusable script to purge Cloudflare cache via API (purge_everything + per-URL fallback) |
| `CLOUDFLARE_AGENT_TASKS.md` | **New** — This document |
| `deploy/DEPLOYMENT_PRODUCTION.md` | Document the two new secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`) |

---

## 5. Estado actual del agente Cloudflare (informe del agente)

### 5.1 Lo que el agente confirmó (estado verificado)

| Área | Estado | Detalle |
|------|--------|---------|
| Turnstile | ⚠️ Incompleto | Sitekey `0x4AAAAAAGL6Nkc1KmMspy5d`, modo managed. Dominios: solo `elevari.live`. Faltan `www.elevari.live` y `app.elevari.live`. Modificado hoy 19:38 vía dashboard. |
| SSL/TLS | ⚠️ Flexible | Sin cambios desde el 23. Tramo Cloudflare→origen en texto plano. |
| Cache | ⚠️ Agresivo | `browser_cache_ttl: 14400` (4 h), dev mode off. |
| Worker | ⚠️ Sin tráfico | Rutas `[]`, dominios `[]`. 0 invocaciones. No recibe tráfico de usuarios. |
| WAF / Rate limiting | ⚠️ Vacío | Ruleset custom versión 1 sin reglas. `/login` y `/register` sin límite de intentos. |
| Alertas | ❌ Cero | Ninguna notificación para 5xx o deploys rotos. |

### 5.2 Lo que el agente PUEDE hacer (ejecución bajo petición)

- **Purge de caché** — todo el zone o URLs concretas (`POST /zones/{zone_id}/purge_cache`).
- **Zone settings** — cambiar `browser_cache_ttl`, `cache_level`, development mode, Always Use HTTPS, min TLS.
- **Activar traces en el Worker** — para depurar el próximo deploy.
- **Leer y verificar** — analytics de requests/5xx/cache hit ratio, eventos de firewall, historial de deployments y versiones.
- **Purgas puntuales** (tareas #1 y #8 de la sección 2).

### 5.3 Lo que el agente NO puede hacer (403 o sin acceso)

| Acción | Motivo | Quién debe hacerlo |
|--------|--------|-------------------|
| Editar Turnstile (añadir `www.elevari.live`, `app.elevari.live`) | 403 confirmado | Tú en el dashboard: Turnstile → Site keys → edit → añadir dominios |
| Crear o editar API tokens | Solo My Profile → API Tokens | Tú en Cloudflare dashboard |
| Conectar repo a Workers Builds | Workers CI es solo lectura para el agente | N/A (no necesario) |
| Crear políticas de alerta | 403 confirmado | Tú en Dashboard → Notifications |
| Escribir en Turnstile | 403 confirmado | Tú en el dashboard |
| Leer Bot Fight Mode | 403 | Tú en el dashboard |
| Health checks / Load Balancing | No están en tu plan | N/A |
| Escribir commits / secrets de GitHub | Sin acceso | Tú en GitHub |
| Peticiones salientes a `2.29.165.225` | Sin red saliente | GitHub Actions runner |
| Programar tareas recurrentes | No es un scheduler | GitHub Actions (cron) o Worker con cron |

### 5.4 Consecuencia directa para las 8 tareas autónomas (sección 2)

| Tarea | ¿Puede el agente? | Notas |
|-------|-------------------|-------|
| #1 Purge cache en deploy | ✅ Sí | Ejecuta purgas puntuales bajo petición |
| #2 Validar DNS + SSL + origen | ✅ Consultar | Puede leer, no programar |
| #3 Verificar deploy coincide con commit | ❌ No | No tiene acceso a commits de GitHub |
| #4 Monitorear WAF false positives | ✅ Consultar | Puede leer eventos de firewall bajo petición |
| #5 Salud del origen desde fuera | ❌ No | Sin red saliente a la IP del VPS |
| #6 Reporte de estado de caché | ✅ Consultar | Puede leer analytics bajo petición |
| #7 Watch de expiración SSL | ⚠️ Parcial | Puede leer edge cert (sí), no origin cert (no) |
| #8 Remediación de contenido obsoleto | ✅ Sí | Ejecuta purgas puntuales bajo petición |

### 5.5 Cuatro acciones seguras, reversibles y de efecto inmediato (agente ofrece ejecutar)

1. **Bajar `browser_cache_ttl` de 14400 a 300** — zone setting, reversible.
2. **Purgar la caché del zone** — `purge_everything`, efecto inmediato.
3. **Activar traces en el Worker** — para depurar el próximo deploy.
4. *(No puede)* Reponer `www.elevari.live` en Turnstile — **tú debes hacerlo en el dashboard**.

> ⚠️ El agente advierte: su conexión con la API de Cloudflare es intermitente. Algunas escrituras pueden fallar. Te lo dirá sin adornos si no se completa.

### 5.6 Las cinco brechas reales de tu CI/CD hoy

1. **El Worker no recibe tráfico** — rutas y dominios vacíos. Es el hueco más grande; es de arquitectura, no de CI.
2. **SSL flexible** — Cloudflare→origen en texto plano. Debe pasar a Full (strict) solo después de instalar certificado en el origen.
3. **`browser_cache_ttl: 14400`** — 4 horas de caché de navegador. Un deploy puede tardar 4 h en verse. Bájalo a 300 para HTML.
4. **WAF y rate limiting vacíos** — `/login` y `/register` sin límite de intentos. Con Turnstile activo, falta un rate limit en esas rutas.
5. **Cero alertas** — un deploy roto o un 5xx no avisa a nadie.
