# Auditoría de botones y secciones — Waná

Última revisión: junio 2026. Clasificación: **API** (Fastify/JWT) vs **Legacy** (Supabase / Next API obsoleto).

## Resumen ejecutivo

| Estado | Cantidad |
|--------|----------|
| ✅ Funcional (API) | Flujo principal huésped + host + admin |
| ⚠️ Parcial | Búsqueda fechas (filtro en listado, fechas al reservar en detalle) |
| 🔜 Próximo | Reset password por email (Resend) |
| ❌ Legacy deshabilitado | Supabase auth en forgot/reset, heartbeat debug |

## Por sección

### Navegación global (`Header`, `Footer`, `Logo`)

| Elemento | Destino / acción | Estado |
|----------|------------------|--------|
| Logo | `/` | ✅ |
| Explorar | `/properties` | ✅ |
| Anfitrión | `/host` | ✅ |
| FAQ | `/legal/faq` | ✅ |
| Admin (solo admin) | `/admin` | ✅ |
| Menú móvil ☰ | Mismos links + login/logout | ✅ |
| Iniciar sesión | `/auth/login` | ✅ |
| Mi cuenta / Salir | `/account`, logout JWT | ✅ |
| Footer: Propiedades, FAQ, Publicar, Legal | Rutas correctas | ✅ |

### Home (`/`, `SearchHero`)

| Elemento | Estado | Notas |
|----------|--------|-------|
| Buscar | ✅ | → `/properties?city=&guests=&check_in=&check_out=` |
| Fechas hero | ✅ | Date picker opcional |
| Ver todos / Explorar espacios | ✅ | → `/properties` |
| Property cards | ✅ | → detalle |

### Listado (`/properties`)

| Elemento | Estado |
|----------|--------|
| Cards | ✅ API `GET /properties` |
| Filtros URL `city`, `guests` | ✅ |
| Filtros fechas | ⚠️ Mostrados en UI; aplicar al reservar en detalle |

### Detalle (`/properties/[slug]`)

| Elemento | Estado |
|----------|--------|
| Galería | ✅ |
| Calendario + huéspedes | ✅ |
| Reservar | ✅ → checkout |
| Login redirect `?book=1` | ✅ Abre widget móvil |
| Reviews | ✅ API |

### Checkout (`/checkout/[id]`)

| Elemento | Estado |
|----------|--------|
| Pago Bold mock/live | ✅ |
| Pago Stripe mock/live | ✅ |
| Confirmación success | ✅ |

### Auth

| Ruta | Estado |
|------|--------|
| `/auth/login` | ✅ JWT API |
| `/auth/register` | ✅ JWT API |
| `/auth/forgot-password` | ⚠️ Mensaje + link a cuenta (sin email aún) |
| `/auth/reset-password` | ✅ Redirect a forgot |

### Cuenta (`/account`)

| Elemento | Estado |
|----------|--------|
| Perfil | ✅ |
| Mis reservas | ✅ `GET /bookings/me` |
| Pagar / Cancelar | ✅ checkout / `POST cancel` |
| Cambiar contraseña | ✅ `POST /auth/change-password` |
| Links host/admin | ✅ |

### Host

| Ruta / acción | Estado |
|---------------|--------|
| Dashboard lista | ✅ |
| Publicar espacio | ✅ `POST /host/properties` |
| Media upload/delete | ✅ MinIO API |
| CTA empty state | ✅ |

### Admin

| Ruta | Estado |
|------|--------|
| Resumen | ✅ |
| Propiedades (publicar) | ✅ |
| Media (aprobar/rechazar) | ✅ |
| Reservas | ✅ |
| Legacy content/audit/user/debug | ✅ → `/admin` |

### Legal

| Ruta | Estado |
|------|--------|
| `/legal/privacy` | ✅ Estático |
| `/legal/terms` | ✅ Estático |
| `/legal/faq` | ✅ Contenido API |
| `/legal/[type]` | ✅ Redirect estáticos |

### Sistema

| Ruta | Estado |
|------|--------|
| `/health` | ✅ Muestra API health |
| `/heartbeat` | ✅ → `/health` |

## Legacy a no usar en producción

- `app/api/upload`, `app/api/bookings` (Next)
- `app/api/admin/*`
- `utils/supabase/*` en UI (excepto stubs build)
- `DateRangePicker` + `use-booking-flow` (Supabase)

## Pruebas manuales recomendadas

1. **Huésped:** login → buscar con ciudad → detalle → reservar → checkout mock → success → cuenta muestra reserva.
2. **Host:** login → publicar → subir media → admin publica.
3. **Admin:** aprobar media → publicar propiedad → ver reserva en tab.
4. **Móvil 375px:** menú, reservar bottom sheet, formularios.
5. **Logout:** header y cuenta.

## Automatización futura

- E2E Playwright: login, listado, quote, booking mock payment.
- Smoke `verify-health.sh` en cada deploy.
