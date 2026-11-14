# UX CERTIFICATION — Phase 3.5

**Fecha:** 2026-11-13
**Alcance:** marca, tokens, componentes, consistencia, mobile UX y fricción de conversión.

---

## 1. Revisión de sistema

| Área | Estado | Evidencia |
|------|--------|-----------|
| Paleta nueva aplicada | PASS | 0 clases `wana-gold/champagne/charcoal/cream/sand` en `app/` y `components/` |
| Tipografía | PASS | Plus Jakarta Sans (display) + Inter (UI); 0 referencias a Cormorant |
| Design tokens | PASS | `@theme` + `:root` + `lib/design-tokens.ts`; utilidades verificadas en CSS compilado |
| Componentes | PASS | 8 primitivas en `components/ui/` |
| Consistencia de CTA | PASS | `Button`/`ButtonLink` con 4 variantes; alturas 44/48/52 px |
| Uso del logo | PASS | Isotipo + wordmark consistentes; 3 conceptos documentados |
| Mobile UX | PASS (medido) | 0 overflow en 7 viewports; búsqueda visible en 390×844 |
| Accesibilidad de marca | PASS | Contrastes AA verificados |

---

## 2. Fricción y bloqueos de conversión

| # | Hallazgo | Impacto | Estado |
|---|----------|---------|--------|
| UX1 | Barra de búsqueda del hero fuera del viewport en móvil (y=835 en 844 px) | **Crítico** — el usuario no ve la acción principal | **Corregido**: hero 753 px, CTA visible en 390×844 y 360×800 |
| UX2 | El subtítulo del chip activo era ilegible (contraste 1.12) | Medio | **Corregido** |
| UX3 | Los formularios de login/registro dependían de validación nativa en inglés | Medio | **Corregido**: validación inline en español con `aria-invalid` |
| UX4 | El menú móvil no se cerraba con Escape | Medio | **Corregido** + gestión de foco |
| UX5 | `purchase` se emite dos veces a GA4 | Medio (medición) | **Abierto** — decisión de negocio |
| UX6 | El hero móvil oculta las señales de confianza (badges) | Bajo | **Trade-off aceptado** — se muestran desde `sm` |
| UX7 | Copy del hero en dos frases compite con la búsqueda en móvil | Bajo | **Corregido**: segunda frase solo desde `sm` |

---

## 3. Claridad de copy

| Pantalla | Verificación | Estado |
|----------|--------------|--------|
| Home | Propuesta de valor + 3 señales de confianza + precio transparente | PASS |
| Detalle | "Anfitrión Eleveri verificado", amenidades, reseñas, desglose | PASS (código) |
| Checkout | Desglose base × noches + Tarifa de Servicio Elevari = Total | PASS |
| Confirmación | Estado real (`confirmado` / `en proceso`) y próximos pasos | PASS |
| FAQ | Corregido: Wompi (antes Bold/Stripe) y "precio final" | PASS |
| Errores | Español, acción siguiente explícita | PASS |

---

## 4. Acciones repetidas / confusión

| # | Observación | Acción |
|---|-------------|--------|
| UX8 | El detalle exige login solo al reservar (correcto), pero el mensaje del botón cambia según sesión | Aceptado (claridad) |
| UX9 | "Ver colección" aparece dos veces en home (desktop y móvil) con estilos distintos | **Corregido parcialmente**: ambos usan el sistema de botones |
| UX10 | La galería móvil y el lightbox no comparten gesto de swipe | Mejora futura (Low) |

---

## 5. Recomendaciones

| Prioridad | Recomendación |
|-----------|---------------|
| Alta | Prueba de usabilidad con 5–8 usuarios en el flujo reservar (móvil) |
| Alta | Definir un único evento `purchase` para GA4 |
| Media | Añadir swipe en la galería móvil |
| Media | Mostrar señales de confianza en móvil como franja compacta bajo la búsqueda |
| Baja | Revisar microcopy del checkout con negocio |

---

## Veredicto

**PASS** en consistencia de marca y UX móvil medible, con 1 bloqueo crítico de conversión corregido.
