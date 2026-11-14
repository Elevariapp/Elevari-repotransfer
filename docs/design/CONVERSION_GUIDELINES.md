# ELEVARI CONVERSION GUIDELINES

**Fase:** 3 · **Versión:** 1.0
**Código:** `lib/analytics.ts` · **Eventos en componentes:** BookingWidget, CheckoutClient, CheckoutSuccessClient, PropertyViewTracker

---

## 1. Principios de conversión

1. **Confianza antes que conversión.** Verificación del anfitrión, pago seguro y soporte visibles antes del CTA.
2. **Precio total visible antes de pedir datos.** El usuario nunca descubre el total en el checkout.
3. **Una acción primaria por pantalla.** En detalle: "Reservar". En checkout: "Pagar".
4. **Mobile first.** La barra fija de reserva en móvil mantiene el total y el CTA siempre accesibles.
5. **Menos pasos, menos fricción.** El login solo se exige en el momento de reservar, no antes.
6. **Recuperación clara.** Todo error dice qué pasó y qué hacer, sin culpar al usuario.

---

## 2. Contrato de analítica

Cada evento se emite una vez por acción significativa y viaja a GA4 y Meta Pixel.

| Evento | Cuándo | Parámetros | GA4 equivalente | Meta |
|--------|--------|-----------|-----------------|------|
| `view_property` | Se abre el detalle de propiedad | `item_id`, `item_slug`, `item_name`, `value`, `currency` | `view_item` | ViewContent |
| `select_dates` | El huésped elige un rango válido | `property_id`, `check_in`, `check_out`, `nights` | `select_dates` | — |
| `view_quote` | La API devuelve cotización (una vez por combinación fechas/huéspedes) | `property_id`, `nights`, `value`, `currency`, `available` | `view_quote` | — |
| `start_checkout` | Se entra al checkout | `transaction_id`, `value`, `currency` | `begin_checkout` | InitiateCheckout |
| `payment_started` | Se inicia el pago en el proveedor | `transaction_id`, `value`, `payment_provider`, `payment_mode` | `add_payment_info` | AddPaymentInfo |
| `payment_completed` | El proveedor reporta pago exitoso | `transaction_id`, `value` | `purchase` | Purchase |
| `booking_confirmed` | El servidor confirma la reserva | `transaction_id`, `value` | `purchase` | Purchase |
| `checkout_abandoned` | Se sale del checkout sin iniciar pago | `transaction_id`, `value`, `reason` (`navigate_away` \| `page_hidden`) | `checkout_abandoned` | — |

**Reglas de emisión**
- `view_quote` usa una firma `check_in|check_out|guests` para no duplicar eventos por re-render.
- `checkout_abandoned` no se emite si el usuario ya inició el pago (`paymentStartedRef`).
- `payment_completed` y `booking_confirmed` se emiten juntos una sola vez por reserva (`purchaseTracked`).
- Sin `NEXT_PUBLIC_GA_MEASUREMENT_ID` ni `NEXT_PUBLIC_META_PIXEL_ID`, los eventos son no-op (desarrollo seguro).

---

## 3. Embudo objetivo

```
view_property
   ↓
select_dates
   ↓
view_quote  ──────────────┐
   ↓                      │ (si no hay disponibilidad)
start_checkout            └→ fricción de fechas
   ↓
payment_started
   ↓
payment_completed + booking_confirmed
```

Métricas a vigilar:
- **Detalle → selección de fechas** (intención).
- **Selección → cotización** (disponibilidad real).
- **Cotización → checkout** (decisión).
- **Checkout → pago iniciado** (confianza en el pago).
- **Pago iniciado → confirmado** (éxito técnico del proveedor).
- **Abandono de checkout** por `reason`.

---

## 4. Reglas de copy por pantalla

| Pantalla | Debe contener |
|----------|---------------|
| Home | Propuesta de valor en una frase + 3 señales de confianza + búsqueda visible sin scroll |
| Listado | Filtros activos visibles, estado vacío con acción, disponibilidad en tiempo real |
| Detalle | Galería, anfitrión verificado, amenities, reseñas, precio total por fechas, CTA fijo en móvil |
| Checkout | Stepper, desglose completo, método de pago con medios aceptados, aviso de moneda |
| Confirmación | Estado real (confirmado / en proceso), próximos pasos, acceso a la reserva |

Prohibido en copy: "gratis" si hay Tarifa de Servicio, "desde" sin fecha, urgencia falsa, tecnicismos del proveedor.

---

## 5. Fricción aceptada

- Login obligatorio solo al reservar (no para explorar).
- Disclosure de conversión internacional antes de pagar (requisito legal).
- Confirmación de fechas antes de crear la reserva (evita reservas erróneas).

---

## 6. Medición y validación

1. Verificar eventos en GA4 DebugView y Meta Events Manager (staging).
2. Comparar `payment_completed` del cliente contra pagos confirmados en API (debe converger).
3. Revisar semanalmente el abandono por `reason` y por dispositivo.
4. Cualquier cambio de copy o CTA debe declarar la métrica que espera mover.
