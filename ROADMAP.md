# Waná — Roadmap de producto

Estado a junio 2026. Fases 0–4 completadas en código; fases 5–6 definidas aquí.

## Resumen por fase

| Fase | Nombre | Estado | Entregable principal |
|------|--------|--------|----------------------|
| **0** | Infraestructura | ✅ Hecho | Docker, PostgreSQL, Fastify API, Prisma |
| **1** | Reservas UI | ✅ Hecho | Listado, detalle, checkout, estado de booking |
| **2** | Pagos | ✅ Hecho | Wompi-first + FX quotes + disclosure + refunds + webhooks (mock validado; live pendiente keys) |
| **3** | Media | ✅ Hecho | MinIO, upload host, galería imagen/video |
| **Auth** | JWT | ✅ Hecho | Register/login, protección host/account |
| **4** | Marketing | ✅ Hecho | GA4, Meta Pixel, SEO, emails, CAPI |
| **6B** | Facturación Alegra | ✅ Hecho | Emisión post-pago + pending_invoices + admin retry |
| **6E** | Producción | ✅ Hecho | docker-compose.prod, nginx, Dockerfile web, CI |
| **5** | Apps móviles | 📋 Planificada | Expo/React Native, misma API REST |
| **6** | Ops restantes | 📋 Parcial | Admin UI, mensajería, búsqueda, legacy cleanup |

---

## Fase 4 — Marketing (completada)

### Web (cliente)
- `lib/analytics.ts` — eventos: `view_item`, `begin_checkout`, `purchase`, `search`
- `components/analytics/MarketingScripts.tsx` — GA4, Meta Pixel, GTM opcional
- `app/sitemap.ts` + `app/robots.ts` — SEO dinámico
- `PropertyJsonLd` — schema.org `LodgingBusiness`
- Metadata Open Graph en layout y páginas de propiedad

### API (servidor)
- `api/src/lib/marketing.ts` — email confirmación (Resend o log en dev)
- Meta Conversions API en confirmación de pago (server-side, deduplicado con `event_id`)

### Variables de entorno

**Web (`.env.local`):**
```bash
NEXT_PUBLIC_SITE_URL=https://wana.co
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXX
NEXT_PUBLIC_META_PIXEL_ID=XXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXX   # opcional; si está, GA4 directo se omite
```

**API (`api/.env`):**
```bash
PUBLIC_SITE_URL=https://wana.co
RESEND_API_KEY=
RESEND_FROM=Waná <reservas@wana.co>
META_PIXEL_ID=
META_ACCESS_TOKEN=
```

---

## Fase 5 — Apps móviles (recomendada siguiente)

**Objetivo:** Huéspedes y anfitriones en iOS/Android con la misma API REST (sin Supabase BaaS).

### Alcance MVP
1. **Expo (React Native)** — monorepo `apps/mobile` o carpeta `mobile/`
2. **Auth** — JWT igual que web (`/auth/login`, token en SecureStore)
3. **Flujos huésped:** explorar propiedades, detalle, reserva, checkout (Stripe SDK / Bold deep link)
4. **Flujos host (v2):** subir fotos, ver reservas
5. **Push notifications** — Expo Notifications + API endpoint para tokens
6. **Deep links** — `wana://checkout/{id}`, universal links

### Dependencias previas (ya cubiertas)
- API REST estable ✅
- Auth JWT ✅
- Pagos con redirect / Stripe client secret ✅

### Esfuerzo estimado
- MVP huésped (browse + book): **3–4 semanas**
- Host + push: **+2 semanas**

### No incluir en Fase 5
- Reescribir API
- Offline-first complejo
- Video processing en app

---

## Fase 6 — Operaciones, facturación y producción

**Objetivo:** Operar Waná en producción con equipos internos y cumplimiento Colombia.

### Bloques propuestos

#### 6A — Admin & moderación
- Dashboard `/admin` sobre API (no Supabase legacy)
- Aprobar media, moderar reseñas, ver métricas de reservas
- Roles: `admin` en JWT

#### 6B — Facturación Alegra
- Conectar `confirm-payment` → Alegra (código legacy en `lib/alegra.ts`)
- Factura electrónica post-pago Colombia
- Tabla `pending_invoices` ya modelada en legacy

#### 6C — Mensajería host–huésped
- Chat in-app o integración WhatsApp Business API
- Notificaciones de nueva reserva al host

#### 6D — Búsqueda & descubrimiento
- Filtros mapa (Mapbox/Google Maps)
- Full-text search (PostgreSQL `tsvector` o Meilisearch)
- Calendario de disponibilidad global

#### 6E — Producción & observabilidad
- Deploy VPS Docker (Nginx, SSL, Cloudflare)
- Workers BullMQ (Redis): emails, thumbnails FFmpeg, CAPI retry
- Sentry, uptime, backups PostgreSQL
- Rate limiting (Upstash o Redis local)
- CI/CD GitHub Actions

#### 6F — Deprecar legacy
- Migrar `domos` → `properties` (ETL)
- Eliminar Netlify Functions y rutas Supabase admin
- Un solo stack: Next + API + Postgres

### Priorización sugerida para Fase 6
1. **6E** Producción (bloqueante para go-live real)
2. **6B** Alegra (requerimiento legal Colombia)
3. **6A** Admin (operación diaria)
4. **6D** Búsqueda (crecimiento)
5. **6C** Mensajería (retención)
6. **6F** Legacy cleanup (deuda técnica)

---

## Decisión: ¿Fase 5 o 6 primero?

| Criterio | Fase 5 (móvil) | Fase 6 (ops/prod) |
|----------|----------------|-------------------|
| Go-live web Colombia | No crítico | **Crítico** (6E, 6B) |
| Marketing / adquisición | Complementa web | SEO/analytics ya en Fase 4 |
| Inversión en apps | Alto | — |
| Keys Bold/Stripe live | Necesario en ambos | Necesario en ambos |

**Recomendación:** Paralelizar **6E + 6B** (producción + facturación) mientras se valida tráfico web. Iniciar **Fase 5** cuando haya reservas recurrentes en web o requisito explícito de app store.

---

## Pendientes transversales (cualquier fase)

- [ ] Wompi API keys en producción (sandbox test primero — ver verification-log.md)
- [ ] Dominio + SSL + webhook Wompi público (`/api/v1/webhooks/wompi`)
- [ ] Legal signoff para checkout internacional (legal-review-pack.md)
- [ ] Tests E2E (Playwright) flujo reserva completo
- [ ] i18n EN (turismo internacional)
