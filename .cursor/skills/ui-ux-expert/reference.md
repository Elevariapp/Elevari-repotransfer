# Waná UI — referencia rápida

## Jerarquía tipográfica

| Elemento | Clase sugerida |
|----------|----------------|
| Hero H1 | `font-display text-4xl sm:text-5xl lg:text-6xl` |
| Page title | `font-display text-3xl sm:text-4xl` |
| Section | `wana-section-title` |
| Body | `text-sm text-slate-600` |
| Label | `text-xs font-bold uppercase tracking-wider text-slate-500` |

## Espaciado

- Secciones: `py-10 lg:py-14`
- Container: siempre `wana-container`
- Cards grid: `gap-x-6 gap-y-10`

## Estados de botón

```tsx
// Primario
className="wana-btn-primary"

// Secundario
className="wana-btn-ghost"

// Disabled
disabled:opacity-50 disabled:cursor-not-allowed
```

## Imágenes

- Listados: `next/image` con `sizes` (ver `PropertyCard.tsx`)
- Galería: lazy + `decoding="async"`
- Hero: preferir asset local o CDN optimizado (no 1600px Unsplash en prod)

## Accesibilidad mínima

- `alt` en todas las imágenes de producto
- `type="button"` en botones no-submit
- Focus visible en links (`focus-visible:ring-2 focus-visible:ring-wana-forest`)
