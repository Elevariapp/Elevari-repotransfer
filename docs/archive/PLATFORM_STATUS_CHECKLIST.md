# Waná — Smart Checklist (estado de plataforma)

**Última revisión:** post-deploy `https://eleveri.app`  
**Modo:** pre-live · pagos mock · dominio Eleveri activo  
**Mapa go-live (checklist ejecutable):** [`docs/GO_LIVE_PRODUCTION_MAP.md`](GO_LIVE_PRODUCTION_MAP.md)

Leyenda: ✅ listo · ⚠️ parcial · ❌ no funcional / legacy · 📋 pendiente

---

## 1. Infra y deploy

| Item | Estado | Notas |
|------|--------|-------|
| Droplet DigitalOcean | ✅ | `164.92.241.30` |
| Docker stack (API+Web+DB+MinIO+Nginx) | ✅ | `docker-compose.staging.yml` |
| Health `/health` + API | ✅ | DB connected |
| HTTPS / dominio | ✅ | `https://eleveri.app` (Cloudflare) |
| Redirect www → apex | ✅ | nginx staging |
| Pagos live Bold/Stripe | ❌ | `PAYMENTS_MODE=mock` (pendiente keys) |
| Alegra facturación | ❌ | Sin credenciales live |
| Backups automáticos | 📋 | Script `deploy/scripts/backup-db.sh` |

---

## 2. Flujo huésped (core — API nueva)

| Pantalla / acción | Estado | Verificación |
|-------------------|--------|--------------|
| Home `/` | ✅ | Hero, destacados API |
| Listado `/properties` | ✅ | Grid + filtros ciudad/huéspedes/fechas |
| Detalle `/properties/[slug]` | ✅ | Galería + widget |
| Cotizar fechas | ✅ | API `bookings/quote` |
| Crear reserva | ✅ | Requiere login JWT |
| Checkout | ✅ | Bold/Stripe/mock |
| Success + confirmación | ✅ | Polling estado |
| Login `/auth/login` | ✅ | JWT + cookie + Turnstile |
| Register `/auth/register` | ✅ | guest/host + `?redirect=` |
| Sesión unificada cookie/localStorage | ✅ | `lib/auth-session.ts` |
| Huésped en `/host` | ✅ | → `/become-host` |
| Logout (Header) | ✅ | Limpia token |
| Account `/account` | ✅ | Perfil básico |

**Credenciales demo:** `guest@wana.local` / `wana12345`

---

## 3. Flujo anfitrión (API nueva)

| Pantalla / acción | Estado | Verificación |
|-------------------|--------|--------------|
| `/host` dashboard | ✅ | Lista propiedades API |
| `/host/properties/[id]/media` | ✅ | Upload MinIO |
| `/host/add-property` | ✅ | `POST /api/v1/host/properties` + upload media |
| Publicar desde Footer | ✅ | → add-property API |

---

## 4. Admin (API)

| Pantalla | Estado | Notas |
|----------|--------|-------|
| `/admin` | ✅ | Overview API |
| `/admin/properties` | ✅ | Publicar borradores |
| `/admin/moderation` | ✅ | Aprobar/rechazar media |
| `/admin/bookings` | ✅ | Lista reservas |
| `/admin/content` | ✅ | Redirect → `/admin` |
| `/admin/audit` | ✅ | Redirect → `/admin` |
| `/admin/user` | ✅ | Redirect → `/admin` |
| `/admin/debug` | ✅ | Redirect → `/admin` |

**Pendiente:** UI facturas Alegra en admin; calendario manual (reemplaza external_blocks).

---

## 5. Legal y contenido

| Ruta | Estado | Notas |
|------|--------|-------|
| `/legal/faq` | ✅ | Estático (actualizar copy) |
| `/legal/privacy` | ✅ | Página estática |
| `/legal/terms` | ✅ | Página estática |
| Footer links legal | ✅ | Privacy/Terms OK |

**Pendiente:** texto legal final con abogado; eliminar `app/legal/[type]` legacy.

---

## 6. Botones y CTAs — auditoría

| Elemento | Ubicación | Funciona | Nota |
|----------|-----------|----------|------|
| Buscar | SearchHero | ✅ | → `/properties` con filtros |
| Fechas hero | SearchHero | ✅ | Date picker + query params |
| Explorar espacios | Home CTA | ✅ | → `/properties` |
| Nav Explorar / Host / FAQ | Header | ✅ | Links OK |
| Iniciar sesión | Header | ✅ | |
| Salir | Header | ✅ | |
| Property cards | Listado | ✅ | → detalle |
| Reservar | BookingWidget | ✅ | Con auth |
| Pago Bold/Stripe/mock | Checkout | ✅ | Mock en staging |
| Publicar espacio | Footer | ✅ | → add-property API |
| FAQ accordion | FAQ | ✅ | |
| Mobile nav | Header | ✅ | Menú hamburguesa `< md` |

---

## 7. Responsive

| Área | Estado | Gap |
|------|--------|-----|
| Home hero | ⚠️ | OK visual; fechas ocultas en móvil sin alternativa |
| Property grid | ✅ | 1→2→3→4 cols |
| Booking sidebar | ✅ | Stack en móvil |
| Checkout | ✅ | Botones apilados |
| Header nav | ✅ | Hamburger + links en móvil |
| Footer | ✅ | Grid responsive |
| Galería lightbox | ⚠️ | Probar touch en móvil |

---

## 8. Performance / UX polish

| Item | Estado |
|------|--------|
| `next/image` en cards | ✅ |
| ISR listados (60s) | ✅ |
| Home sin Supabase | ✅ |
| Tailwind v4 globals | ✅ |
| Skeleton loaders | 📋 |
| Search con filtros (ciudad/fechas) | 📋 |
| i18n EN | 📋 |

---

## 9. Skill UI/UX (para Cursor)

| Item | Estado |
|------|--------|
| Skill `ui-ux-expert` | ✅ | `.cursor/skills/ui-ux-expert/SKILL.md` |
| Auditoría botones | ✅ | `docs/BUTTON_AUDIT.md` |
| Uso | Invocar: *"usa ui-ux-expert para mejorar checkout"* o `@Design` |

---

## 10. Prioridades sugeridas (orden)

### P0 — Funcionalidad visible rota
1. ~~Menú móvil en Header~~ ✅
2. ~~`/host/add-property` migrado a API~~ ✅
3. ~~Legal privacy/terms estáticos~~ ✅
4. ~~Migrar `/admin/*` a API~~ ✅

### P1 — UX reserva (Airbnb-level)
5. ~~SearchHero con date picker~~ ✅ (filtro ciudad/huéspedes; fechas en detalle al reservar)
6. Skeleton en listado mientras carga API
7. Empty states ilustrados (sin propiedades, sin reservas)
8. Stepper visual en checkout

### P2 — Diseño consistente
9. Unificar páginas legacy (`rounded-[32px] bg-slate-50`) al design system Waná
10. ~~Eliminar Supabase legacy~~ ✅ (Jul 2026 — API Fastify + JWT únicamente)
11. Favicon + OG images por propiedad en prod

### P3 — Go-live
12. Dominio + HTTPS
13. Keys Bold/Stripe + webhooks
14. Alegra + Resend emails
15. Desactivar cuentas demo en prod

---

## Comandos útiles

```bash
# Verificar staging
BASE_URL=http://164.92.241.30 ./deploy/scripts/verify-health.sh

# Re-deploy tras cambios UI
npm run go-live:remote
```

---

## Cómo mantener este checklist

Tras cada sprint UI o deploy, actualizar secciones 2–6. El agente con skill `ui-ux-expert` debe marcar ítems al cerrar tareas.
