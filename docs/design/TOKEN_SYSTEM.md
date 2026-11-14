# ELEVARI TOKEN SYSTEM

**Fase:** 3 · **Versión:** 1.0
**Fuente de verdad:** `app/globals.css` (`@theme` + `:root`) · espejo tipado: `lib/design-tokens.ts`

---

## 1. Reglas

1. Todo valor visual existe **una sola vez** como token.
2. Los componentes consumen utilidades Tailwind generadas desde `@theme` o `var(--elevari-*)`.
3. Prohibido hex/rgba directos en componentes (excepción: SVG de marca documentados).
4. Los tokens `wana-*` son alias legacy con los mismos valores que `elevari-*`; se eliminarán al cerrar la migración.

---

## 2. Color

### Utilidades Tailwind (desde `@theme`)

| Token | Utilidad | Hex |
|-------|----------|-----|
| `--color-elevari-forest` | `bg-elevari-forest` | `#2F6B4F` |
| `--color-elevari-forest-deep` | `bg-elevari-forest-deep` | `#1E4835` |
| `--color-elevari-forest-light` | `bg-elevari-forest-light` | `#3D8163` |
| `--color-elevari-fresh` | `bg-elevari-fresh` | `#5FA76A` |
| `--color-elevari-fresh-soft` | `bg-elevari-fresh-soft` | `#DFF0E3` |
| `--color-elevari-amber` | `bg-elevari-amber` | `#E9A820` |
| `--color-elevari-amber-ink` | `text-elevari-amber-ink` | `#7A4A00` |
| `--color-elevari-amber-soft` | `bg-elevari-amber-soft` | `#F6E3B8` |
| `--color-elevari-ivory` | `bg-elevari-ivory` | `#F7F4EC` |
| `--color-elevari-surface` | `bg-elevari-surface` | `#FFFFFF` |
| `--color-elevari-sand` | `bg-elevari-sand` | `#E8E3D5` |
| `--color-elevari-slate` | `text-elevari-slate` | `#22313F` |
| `--color-elevari-ink` | `text-elevari-ink` | `#16222C` |
| `--color-elevari-muted` | `text-elevari-muted` | `#5C6B65` |
| `--color-elevari-border` | `border-elevari-border` | `#E2DCCC` |
| `--color-elevari-success` / `-soft` | `text-elevari-success` | `#2F6B4F` / `#DFF0E3` |
| `--color-elevari-warning` / `-soft` | `text-elevari-warning` | `#7A4A00` / `#FBF0D6` |
| `--color-elevari-error` / `-soft` | `text-elevari-error` | `#B3261E` / `#FDECEB` |

Las variantes con opacidad (`bg-elevari-forest/10`) funcionan porque Tailwind v4 deriva del token.

### Variables CSS equivalentes

`--elevari-forest`, `--elevari-forest-deep`, … `--elevari-error-soft`, `--elevari-focus`.

Uso: `style={{ background: 'var(--elevari-forest)' }}` o clases arbitrarias `bg-[var(--elevari-forest)]`.

### Alias legacy

`--color-wana-forest`, `--wana-gold`, `--wana-champagne*`, `--wana-charcoal`, `--wana-cream`, `--wana-sand`, `--wana-border`, `--wana-muted`, `--wana-black*`, `--wana-gray*` → mismos valores que su equivalente Elevari.

---

## 3. Tipografía

| Token | Valor | Utilidad |
|-------|-------|----------|
| `--font-display` | Plus Jakarta Sans (variable `--font-display` de next/font) | `font-display` |
| `--font-sans` | Inter (variable `--font-inter`) | `font-sans` |
| `--text-hero` | `clamp(2rem, 4.2vw + 0.65rem, 3.625rem)` | `text-hero` |
| `--text-heading` | `clamp(1.5rem, 2.2vw + 0.85rem, 2.625rem)` | `text-heading` |
| `--text-body` | `1rem` (line-height 1.6) | `text-body` |
| `--text-caption` | `0.8125rem` (line-height 1.5) | `text-caption` |
| `--text-button` | `0.875rem` | `text-button` |

Clases compuestas: `.wana-display-hero`, `.wana-display-section`, `.wana-display-page`, `.wana-section-title` (aplican familia display, tracking y balance).

Pesos: 500 medium · 600 semibold · 700 bold. No usar 300/800.

---

## 4. Espaciado

| Token | Valor | Utilidad |
|-------|-------|----------|
| `--spacing-xs` | 0.25rem | `p-xs`, `gap-xs` |
| `--spacing-sm` | 0.5rem | `p-sm` |
| `--spacing-md` | 1rem | `p-md` |
| `--spacing-lg` | 1.5rem | `p-lg` |
| `--spacing-xl` | 2.5rem | `p-xl` |
| `--spacing-2xl` | 4rem | `p-2xl` |

Variables espejo: `--elevari-space-*`.

---

## 5. Radio

| Token | Valor | Utilidad |
|-------|-------|----------|
| `--radius-sm` | 0.5rem | `rounded-sm` |
| `--radius-md` | 0.875rem | `rounded-md` |
| `--radius-lg` | 1.25rem | `rounded-lg` |
| `--radius-xl` | 1.75rem | `rounded-xl` |
| `--radius-full` | 9999px | `rounded-full` |

Variables espejo: `--elevari-radius-*` (usadas como `rounded-[var(--elevari-radius-lg)]` cuando se necesita el valor explícito).

---

## 6. Sombras

| Token | Uso | Utilidad |
|-------|-----|----------|
| `--shadow-soft` | Elementos en reposo | `shadow-soft` |
| `--shadow-card` | Tarjetas | `shadow-card` |
| `--shadow-floating` | Dropdowns, barras fijas | `shadow-floating` |
| `--shadow-modal` | Modales y lightbox | `shadow-modal` |
| `--shadow-wana` / `--shadow-wana-lg` | Alias legacy | `shadow-wana`, `shadow-wana-lg` |

Variables espejo: `--elevari-shadow-*`.

---

## 7. Movimiento

| Token | Valor | Utilidad |
|-------|-------|----------|
| `--animate-fade-in` | `fadeIn 0.5s ease-out both` | `animate-fade-in` |
| `--animate-slide-up` | `slideUp 0.45s ease-out both` | `animate-slide-up` |

Keyframes: `fadeIn`, `slideUp` (definidos al final de `globals.css`), más `heroKenburns` y `scrollHint` para el hero.

Regla: toda animación se anula con `prefers-reduced-motion: reduce`.

---

## 8. Uso en TypeScript

```ts
import { colors, spacing, radius, shadows, typography } from '@/lib/design-tokens';

colors.forest;        // '#2F6B4F'
spacing.lg;           // '1.5rem'
radius.full;          // '9999px'
shadows.card;         // '0 2px 8px …'
typography.sizes.hero;
```

---

## 9. Verificación

- Contrastes: tabla en `docs/brand/ELEVARI_BRAND_GUIDE.md` §4 y en §10 de este documento.
- Búsqueda de valores prohibidos: `Select-String -Pattern '#[0-9a-fA-F]{3,8}'` en `components/` (solo deben aparecer SVG de marca).
- Al añadir un token: actualizar `@theme`, `:root`, `lib/design-tokens.ts` y este documento en el mismo commit.

---

## 10. Temas (Light · Dark · High contrast)

Los tokens semánticos se redefinen por atributo en `<html>`:

```html
<html data-theme="dark" data-contrast="high">
```

| Tema | Activación | Notas |
|------|-----------|-------|
| Light | por defecto | `color-scheme: light` |
| Dark | `data-theme="dark"` | `color-scheme: dark`; superficies `#0E1916`/`#16241F`, texto `#E7EFEA`, enlaces `#7ED0A6` |
| High contrast | `data-contrast="high"` | Refuerza `muted`, `border` y el anillo de foco (3 px) |

Reglas:

1. **Action tokens** (`--color-elevari-action`, `--color-elevari-action-hover`) permanecen oscuros en ambos temas para que el texto blanco del CTA mantenga AA.
2. `text-elevari-forest` es el token de **texto/enlace**: se aclara en dark.
3. `amber-ink` permanece oscuro porque se usa sobre chips `amber-soft` claros.
4. Las superficies deben usar `bg-elevari-surface` / `var(--elevari-surface)`, nunca `white` fijo.
5. El tema se aplica antes del primer paint con `themeInitScript` (sin flash) y se persiste en `localStorage` (`elevari-theme`, `elevari-contrast`).
6. Componente: `components/theme/ThemeToggle.tsx` (Claro · Oscuro · Alto contraste), con `aria-pressed`.

### Contraste medido por tema (home, 1440×900)

| Tema | Contraste cuerpo | axe (WCAG 2.2 AA) |
|------|------------------|-------------------|
| Light | 12.10 | 0 violaciones |
| Dark | 15.34 | 0 violaciones |
| High contrast | 12.10 | 0 violaciones |


- Contrastes: tabla en `docs/brand/ELEVARI_BRAND_GUIDE.md` §4.
- Búsqueda de valores prohibidos: `Select-String -Pattern '#[0-9a-fA-F]{3,8}'` en `components/` (solo deben aparecer SVG de marca).
- Al añadir un token: actualizar `@theme`, `:root`, `lib/design-tokens.ts` y este documento en el mismo commit.
