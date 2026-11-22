# Plan de migración de servicios — Waná

Documento de referencia para pasar de Supabase legacy a la API propia (Fastify + Prisma + MinIO).

## Estado actual (junio 2026)

| Área | Estado | Backend |
|------|--------|---------|
| Explorar propiedades | ✅ API | `GET /api/v1/properties` |
| Detalle + reserva | ✅ API | bookings, payments |
| Auth JWT | ✅ API | `/api/v1/auth/*` |
| Host dashboard + media | ✅ API | host + media |
| **Host crear propiedad** | ✅ API | `POST /api/v1/host/properties` |
| Checkout / pagos | ✅ API (+ mock staging) | Bold/Stripe |
| Facturación Alegra | ✅ API | admin invoices |
| **Admin panel** | ✅ API | overview, properties, media, bookings |
| **Legal privacy/terms** | ✅ Estático | páginas Next.js |
| Legal FAQ | ⚠️ Estático (copy legacy) | actualizar contenido |
| Legal `[type]` dinámico | ⚠️ Legacy Supabase | reemplazado por privacy/terms |
| Home reviews | ✅ Removido Supabase | ISR listado API |
| SearchHero fechas | ❌ Decorativo | pendiente date picker |
| Channel manager / external_blocks | ❌ Solo Supabase | futuro API |
| Account / perfil | ⚠️ Revisar | mixto |

## Fases recomendadas

### Fase A — Completada en este ciclo

1. `POST /host/properties` + formulario `/host/add-property`
2. Admin migrado: resumen, propiedades (publicar borradores), media, reservas
3. Páginas legales estáticas `/legal/privacy`, `/legal/terms`
4. Header con menú móvil (`< md`)

### Fase B — Corto plazo (1–2 sprints)

1. **SearchHero**: date picker real → query params en `/properties?check_in=&check_out=&guests=`
2. **Account**: reservas del huésped vía `GET /bookings` (endpoint guest si falta)
3. **FAQ**: copy actualizado sin Supabase
4. Eliminar rutas/archivos Supabase no usados (`app/legal/[type]`, `ModerationView`, stubs)
5. **Admin facturas**: UI para `invoices/pending` + retry

### Fase C — Operaciones

1. **Calendario manual**: `AvailabilityBlock` CRUD host + admin (reemplaza `external_blocks`)
2. **Channel manager**: import iCal / API OTAs → bloques en Prisma
3. **Notificaciones**: Resend en confirmación, recordatorios
4. **Reviews**: modelo `Review` en UI pública

### Fase D — Producción

1. Claves Bold/Stripe live + webhooks en nginx
2. `MEDIA_AUTO_APPROVE=false` en prod
3. Backups Postgres + MinIO
4. Monitoreo (health, logs, alertas pagos)

## Cómo mejorar en cada área (post-migración)

### UX / diseño (ui-ux-expert)

- Unificar todas las vistas con `wana-card`, `wana-btn-primary`, sin `rounded-[32px]` legacy
- Skeleton loaders en listados admin y properties
- Stepper checkout (resumen → pago → confirmación)
- Empty states con CTA en admin y host
- Touch targets ≥ 44px en móvil (ya aplicado en nav y formularios nuevos)

### Host

- Wizard multi-paso: datos → fotos → precios → publicar
- Preview del listado antes de solicitar publicación
- Estadísticas: ocupación, ingresos (requiere reporting API)

### Admin

- Filtros y búsqueda en tablas
- Auditoría de acciones (quién aprobó media / publicó)
- Dashboard de facturas Alegra integrado
- Moderación en lote

### Legal / confianza

- Versionado de terms con fecha en metadata
- Cookie banner + GA4 consent mode
- Política de cancelación por propiedad

### Performance

- `next/image` en todo (admin moderation puede migrar a Image)
- CDN delante de MinIO en prod
- Revalidate tags por propiedad al publicar

### Seguridad

- Rate limit en auth y upload
- Validación de rol admin solo en API (ya) + UI
- Rotación JWT, secrets en VPS no en git

## Despliegue tras cambios

```bash
npm run go-live:remote   # o deploy-staging en el Droplet
```

Verificar:

- `host@wana.local` crea propiedad → sube media → admin publica
- `/legal/privacy` y `/legal/terms` sin error
- Admin `/admin/moderation` aprueba media
- Menú móvil en 375px width

## Dependencias entre equipos

| Necesitas | Para |
|-----------|------|
| API keys pagos | checkout live |
| Alegra API | facturas automáticas |
| Dominio + TLS | cookies seguras, Bold return URLs |
| Contenido legal final | reemplazar texto placeholder en privacy/terms |
