# ELEVARI DESIGN SYSTEM

**Fase:** 3 · **Versión:** 1.0
**Tokens:** `app/globals.css` (`@theme` + `:root`) · `lib/design-tokens.ts`
**Regla:** ningún componente define valores visuales propios; todo consume tokens.

---

## 1. Arquitectura

```
app/globals.css        → @theme (utilidades Tailwind) + :root (CSS vars) + clases .wana-* heredadas
lib/design-tokens.ts   → espejo tipado de los tokens para JS (emails, gráficos, tests)
lib/cx.ts              → helper de clases condicionales (sin dependencias externas)
components/ui/*        → primitivas del sistema
```

Tailwind v4 lee los tokens desde `@theme`; `tailwind.config.ts` solo declara las rutas de contenido.

---

## 2. Primitivas (`components/ui`)

| Componente | API principal | Notas |
|-----------|---------------|-------|
| `Button` | `variant: primary \| accent \| secondary \| ghost`, `size: sm \| md \| lg`, `loading`, `fullWidth` | Altura mínima 44 px siempre |
| `ButtonLink` | mismo API + `href` | CTA de navegación |
| `Card` | `elevation: flat \| card \| floating`, `padded` | Radio y sombra por token |
| `Input` | `label`, `hint`, `error` | `aria-invalid`, `aria-describedby`, error con `role="alert"` |
| `Badge` | `tone: neutral \| success \| warning \| error \| accent \| brand` | Estados y etiquetas |
| `Modal` | `open`, `onClose`, `title`, `footer` | `role="dialog"`, `aria-modal`, Escape, scroll lock |
| `PriceBreakdown` | `fees`, `format`, `totalLabel` | Único desglose de precio autorizado |
| `Toast` | re-export de `react-hot-toast` | Estilos tokenizados en `app/layout.tsx` |

Import: `import { Button, Card, Badge } from '@/components/ui';`

---

## 3. Clases heredadas (compatibilidad)

Estas clases siguen existiendo y ya apuntan a la nueva paleta. Se mantienen para no romper pantallas existentes y se irán sustituyendo por primitivas.

`.wana-container` · `.wana-page-bg` · `.wana-card` · `.wana-card-elevated` · `.wana-card-premium` · `.wana-btn-primary` · `.wana-btn-ghost` · `.wana-btn-accent` · `.wana-btn-select` · `.wana-chip` · `.wana-input` · `.wana-label` · `.wana-header*` · `.wana-footer*` · `.wana-eyebrow` · `.wana-display-*` · `.wana-section-title` · `.wana-search-*` · `.wana-calendar` · `.wana-glass` · `.wana-skip-link`

---

## 4. Patrones de interfaz

### Botones
- **Una sola acción primaria por pantalla.** En checkout: "Pagar" (forest).
- Acciones secundarias: `secondary` o `ghost`.
- Acento ámbar: solo para destacar (ej. CTA del header sobre fondo forest).
- Estado de carga: `loading` (spinner + `aria-busy`), nunca deshabilitar sin explicación.

### Tarjetas
- Foto primero, texto después. Título 1 línea, ubicación 1 línea, precio destacado.
- Hover: elevación (`shadow-wana-lg`) y escala de imagen 1.04, nunca cambio de layout.

### Formularios
- Label siempre visible (nunca solo placeholder).
- Error debajo del campo, en `elevari-error`, con `role="alert"`.
- Ayuda (`hint`) en `elevari-muted`.
- Campos con `min-height: 44px`.

### Precio
- Siempre: base × noches → Tarifa de Servicio Elevari → Total.
- El total es el número más grande del bloque.
- Internacional: monto cobrado (COP) autoritativo + referencia USD + tasa + vigencia.

### Estados
| Estado | Patrón |
|--------|--------|
| Cargando | Skeleton con `animate-pulse` y `aria-hidden`; texto `sr-only` "Cargando" |
| Vacío | Título + explicación + acción siguiente |
| Error | Qué pasó + cómo resolver + reintento |
| Éxito | Confirmación explícita + próximos pasos |

---

## 5. Layout y responsive

- Mobile first: 1 columna hasta 640 px, 2 hasta 1024 px, 3–4 en desktop.
- Contenedor: `.wana-container` (max 80rem, padding 1/1.5/2rem).
- Espaciado vertical de secciones: `py-14 lg:py-20` (token `--elevari-space-2xl` para hero).
- Breakpoints estándar de Tailwind (`sm 640`, `md 768`, `lg 1024`, `xl 1280`).
- Zonas táctiles ≥ 44 × 44 px; barras fijas móviles respetan `env(safe-area-inset-bottom)` cuando aplique.

---

## 6. Accesibilidad (WCAG 2.2 AA)

Implementado en esta fase:

- Skip link global: "Saltar al contenido principal" → `#contenido` (presente en las 17 vistas con `<main>`).
- Foco visible global: `:focus-visible` con outline forest 2 px y offset 2 px.
- `prefers-reduced-motion` desactiva animaciones y scroll suave.
- Contraste verificado (ver `ELEVARI_BRAND_GUIDE.md` §4).
- Diálogos: `Modal` y lightbox de galería con `role="dialog"`, `aria-modal`, Escape y bloqueo de scroll.
- Galería: navegación con flechas del teclado, etiquetas `aria-label` por imagen y contador visible.
- Búsqueda: campos con `aria-expanded` y `aria-controls` apuntando a sus paneles.
- Toasts con `role="status"` y `aria-live="polite"`.
- Errores de formulario con `role="alert"`.

Pendiente recomendado: auditoría con lector de pantalla (NVDA/VoiceOver) y axe DevTools en staging.

---

## 7. Performance

- `next/image` con `sizes` correctos en tarjetas, galería y hero; `loading="lazy"` fuera del primer viewport.
- Slideshow del hero arranca tras `requestIdleCallback` (no bloquea LCP).
- Fuentes con `display: swap` y variables CSS (sin FOIT).
- Animaciones limitadas a `opacity` y `transform`.
- `revalidate = 60` en home; datos cacheados por Next.
- Presupuesto sugerido: LCP < 2.5 s (4G), CLS < 0.1, INP < 200 ms.

---

## 8. Temas y superficies

El sistema soporta **Light**, **Dark** y **High contrast** mediante `data-theme` / `data-contrast` en `<html>` (ver `TOKEN_SYSTEM.md` §10).

Reglas de componente:

- Toda superficie usa `bg-elevari-surface` (nunca `bg-white` fijo).
- Los CTA primarios usan `bg-elevari-action` (se mantiene oscuro en dark para conservar el texto blanco AA).
- Los enlaces usan `text-elevari-forest` (se aclara en dark).
- El toggle vive en `components/theme/ThemeToggle.tsx` y se muestra en el header (desktop y menú móvil).

## 9. Cómo añadir un componente

1. Verificar si existe una primitiva que cubra el caso.
2. Si necesita un valor visual nuevo → crear token en `@theme` y en `:root`, y documentarlo en `TOKEN_SYSTEM.md`.
3. Implementar en `components/ui/` con props tipadas y `className` opcional.
4. Exportar en `components/ui/index.ts`.
5. Revisar: foco visible, teclado, contraste, 44 px, responsive y `aria-*`.
