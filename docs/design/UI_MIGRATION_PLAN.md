# ELEVARI UI MIGRATION PLAN

**Fase:** 3 · **Estado:** ejecutado (v1) — quedan tareas opcionales marcadas
**Objetivo:** pasar del tema legacy negro/champagne al sistema Elevari (forest/fresh/amber/ivory) sin romper flujos.

---

## 1. Estrategia aplicada

En lugar de reescribir pantallas, se re-mapearon los tokens en `app/globals.css`:

1. Los tokens nuevos (`--color-elevari-*`) son la fuente de verdad.
2. Los tokens legacy (`--color-elevari-*`, `--elevari-*`) se conservan como alias con los valores nuevos.
3. Los componentes migraron de clases `elevari-*` de color a clases `elevari-*` de forma mecánica.
4. Las clases estructurales (`.elevari-container`, `.elevari-card`, `.elevari-btn-*`, `.elevari-header*`, `.elevari-footer*`, `.elevari-search-*`) se mantienen: ya consumen tokens.

Resultado: cambio de marca global con un diff acotado y sin tocar lógica de negocio.

---

## 2. Mapa de equivalencias

| Legacy | Nuevo | Hex nuevo |
|--------|-------|-----------|
| `elevari-black` (fondos) | `elevari-forest-deep` | `#1E4835` |
| `elevari-forest` | `elevari-forest` | `#2F6B4F` |
| `elevari-charcoal` (texto) | `elevari-slate` | `#22313F` |
| `elevari-black` (texto) | `elevari-ink` | `#16222C` |
| `elevari-champagne` / `elevari-gold` | `elevari-amber` | `#E9A820` |
| `elevari-champagne-light` / `elevari-gold-light` | `elevari-amber-soft` | `#F6E3B8` |
| `elevari-champagne-dark` (texto) | `elevari-forest` / `elevari-amber-ink` | `#2F6B4F` / `#7A4A00` |
| `elevari-cream` | `elevari-ivory` | `#F7F4EC` |
| `elevari-sand` | `elevari-sand` | `#E8E3D5` |
| `elevari-muted` | `elevari-muted` | `#5C6B65` |
| `elevari-border` | `elevari-border` | `#E2DCCC` |
| Cormorant Garamond (display) | Plus Jakarta Sans | — |

---

## 3. Cambios por área

| Área | Cambio |
|------|--------|
| `app/globals.css` | Nuevos tokens, alias legacy, foco visible global, skip link, header/footer/botones/calendario re-tematizados, sombras y motion en `@theme` |
| `app/layout.tsx` | Plus Jakarta Sans + Inter, skip link, toasts tokenizados, `text-elevari-slate` |
| `app/icon.svg`, `public/brand/*` | Isotipo recoloreado + 3 conceptos + icono maestro |
| `components/Logo.tsx` | Wordmark en `font-display`, descriptor "Escapes naturales" |
| `components/brand/ElevariMark.tsx` | Forest plate, fresh loop, amber point |
| `components/ui/*` | Nuevas primitivas: Button, Card, Input, Badge, Modal, PriceBreakdown |
| `components/home/*` | Hero con propuesta de valor y señales de confianza; TrustStrip actualizado |
| `components/booking/*` | Precio con `PriceBreakdown`, alertas tokenizadas, sheet con `role="dialog"` |
| `components/checkout/*` | Desglose unificado, analytics de pago/abandono, estados de éxito con color semántico |
| `components/search/SearchHero.tsx` | Copy de valor, badges de confianza, `aria-expanded`/`aria-controls` |
| `components/Footer.tsx` | Enlace a Accesibilidad, opacidades corregidas |
| `app/legal/*` | FAQ actualizada a Wompi y precio final; nueva página de Accesibilidad |
| `tailwind.config.ts` | Solo `content` (tokens viven en CSS) |

---

## 4. Pendientes opcionales (no bloqueantes)

- [ ] Sustituir el resto de usos de `.elevari-btn-primary` / `.elevari-btn-ghost` por `<Button>` cuando el componente sea cliente.
- [ ] Renombrar clases estructurales `elevari-*` a `elevari-*` (requiere codemod + revisión visual).
- [ ] Eliminar alias legacy de `globals.css` una vez que no queden clases `elevari-*` en componentes.
- [ ] Migrar `app/admin/*` a las primitivas nuevas (hoy funciona por tokens).
- [ ] Exportar PNGs del icono de app desde `public/brand/app-icon-master.svg`.
- [ ] Auditoría axe DevTools + lector de pantalla en staging.
- [ ] Revisión visual página por página en 360 px, 768 px y 1440 px.

---

## 5. Verificación ejecutada

| Check | Resultado |
|-------|-----------|
| `npm run build` | ✅ Compila (Next 16.2.6, 29 rutas) |
| TypeScript (Next build) | ✅ Sin errores |
| Utilidades Tailwind nuevas en CSS generado | ✅ `bg-elevari-forest`, `text-elevari-slate`, `shadow-card`, `shadow-elevari-lg`, `font-display`, `text-hero`, `elevari-radius-lg`, `elevari-success`, `elevari-amber-soft` |
| Codificación UTF-8 preservada | ✅ Verificado por bytes |
| Skip link en todas las vistas | ✅ 17/17 `<main id="contenido">` |

Aviso preexistente del build: `middleware` deprecado en Next 16 (usar `proxy`). No forma parte de esta fase.
