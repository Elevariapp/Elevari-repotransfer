# EXS_GUIDE.md — Experience System Guide

**Repository:** `elevari-2026` (Elevari hospitality platform)
Última validación: 2026-11-21 · rama chore/elevari-production

## Overview

The Experience System (EXS) is Elevari's unified design language. It encompasses design tokens, component library, accessibility standards, and theming. EXS ensures consistency across web and (future) mobile surfaces.

**Phase:** 3E (Complete)
**Owner:** Design Team

## Design Tokens

### Color Tokens

| Token | Usage | Value (Light) | Value (Dark) |
|-------|-------|---------------|--------------|
| `--color-primary` | Primary actions, links | `#0F172A` (slate-900) | `#F8FAFC` (slate-50) |
| `--color-secondary` | Secondary actions | `#64748B` (slate-500) | `#94A3B8` (slate-400) |
| `--color-accent` | Accents, highlights | `#0EA5E9` (sky-500) | `#38BDF8` (sky-400) |
| `--color-success` | Success states | `#10B981` (emerald-500) | `#34D399` (emerald-400) |
| `--color-warning` | Warning states | `#F59E0B` (amber-500) | `#FBBF24` (amber-400) |
| `--color-error` | Error states | `#EF4444` (red-500) | `#F87171` (red-400) |
| `--color-background` | Page background | `#FFFFFF` | `#0F172A` |
| `--color-surface` | Card/surface background | `#F8FAFC` | `#1E293B` |
| `--color-text-primary` | Primary text | `#0F172A` | `#F8FAFC` |
| `--color-text-secondary` | Secondary text | `#475569` | `#CBD5E1` |
| `--color-border` | Borders, dividers | `#E2E8F0` | `#334155` |

### Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `0.25rem` (4px) | Tight spacing |
| `--space-sm` | `0.5rem` (8px) | Component padding |
| `--space-md` | `1rem` (16px) | Section spacing |
| `--space-lg` | `1.5rem` (24px) | Component gaps |
| `--space-xl` | `2rem` (32px) | Page sections |
| `--space-2xl` | `3rem` (48px) | Major sections |

### Typography Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `Inter, system-ui, sans-serif` | Body text |
| `--font-heading` | `Inter, system-ui, sans-serif` | Headings |
| `--text-xs` | `0.75rem` / `1rem` line-height | Captions, labels |

## Component Library

### Base UI Components (`components/ui/`)

| Component | Props | Status | Notes |
|-----------|-------|--------|-------|
| Button | variant, size, disabled, onClick | Complete | Primary, secondary, ghost, danger |
| Input | type, label, error, disabled | Complete | Text, email, number, password |
| Card | children, padding, shadow | Complete | Property cards, info cards |
| Badge | variant, children | Complete | Status badges, labels |
| Avatar | src, alt, size | Complete | User/host profile images |
| Checkbox | checked, onChange, label | Complete | Forms, filters |
| Radio | value, onChange, label | Complete | Selection groups |
| Select | options, value, onChange | Complete | Dropdown selects |
| Dialog | open, onOpenChange, children | Complete | Modals, confirmations |
| DropdownMenu | trigger, children | Complete | Context menus, user menus |
| Tabs | value, onValueChange, children | Complete | Tabbed interfaces |
| Separator | orientation, decorative | Complete | Visual dividers |
| ScrollArea | children | Complete | Custom scroll containers |
| Tooltip | content, side | Complete | Hover tooltips |
| Popover | open, onOpenChange, children | Complete | Floating content |

### Feature Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| PropertyCard | `components/catalog/` | Complete | Property listing card |
| PropertyGallery | `components/catalog/` | Complete | Image gallery with lightbox |
| BookingForm | `components/booking/` | Complete | Dates, guests, payment |
| CheckoutForm | `components/checkout/` | Complete | Guest details, payment method |
| SearchForm | `components/search/` | Complete | Location, dates, guests filter |
| AnalyticsDashboard | `components/analytics/` | Complete | Metrics, charts, attribution |
| MarketingScripts | `components/analytics/` | Complete | GA4, Meta Pixel, CAPI |
| ThemeToggle | `components/theme/` | Complete | Light/dark mode switch |

## Theming

### Light/Dark Mode

- Theme stored in `localStorage` key `theme`
- CSS class `dark` applied to `<html>` element
- `ThemeProvider` component wraps the app
- `ThemeToggle` component for user switching
- System preference respected on first visit

### CSS Variables

All design tokens exposed as CSS custom properties on `:root` and `.dark`:
```css
:root {
  --color-primary: #0F172A;
  --color-background: #FFFFFF;
  /* ... all tokens */
}
.dark {
  --color-primary: #F8FAFC;
  --color-background: #0F172A;
  /* ... all tokens */
}
```

## Accessibility (WCAG AA)

EXS meets WCAG 2.1 AA standards:

- **Color contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus visible:** All interactive components show focus ring
- **Keyboard navigation:** All components operable via keyboard
- **ARIA labels:** All interactive elements have accessible names
- **Semantic HTML:** Proper use of `<button>`, `<a>`, `<nav>`, `<main>`, etc.
- **Reduced motion:** Respects `prefers-reduced-motion` media query
- **Screen reader:** Tested with NVDA, VoiceOver, JAWS

## Migration Plan

From legacy components to EXS token-based components:

1. **Phase 1:** Define all design tokens (Complete)
2. **Phase 2:** Build base UI component library (Complete)
3. **Phase 3:** Migrate feature components to use tokens (Complete)
4. **Phase 4:** Remove legacy hardcoded styles (In Progress)
5. **Phase 5:** Mobile app EXS adoption (Planned)

## Related Documents

- `DESIGN_SYSTEM.md` — Design tokens, color, typography, spacing details
- `UI_COMPONENT_LIBRARY.md` — Component inventory, usage, props
- `ACCESSIBILITY_GUIDE.md` — WCAG AA compliance & a11y testing
- `BRAND_SYSTEM.md` — Brand identity, logo, colors, voice
- `ARCHITECTURE.md` — System architecture & tech stack
| BrandLogo | `components/brand/` | Complete | Elevari logo variants |
| Header | `components/layout/` | Complete | Navigation, auth, search |
| Footer | `components/layout/` | Complete | Links, legal, social |
| `--text-sm` | `0.875rem` / `1.25rem` line-height | Small text |
| `--text-base` | `1rem` / `1.5rem` line-height | Body text |
| `--text-lg` | `1.125rem` / `1.75rem` line-height | Lead text |
| `--text-xl` | `1.25rem` / `1.75rem` line-height | Subheadings |
| `--text-2xl` | `1.5rem` / `2rem` line-height | Section headings |
| `--text-3xl` | `1.875rem` / `2.25rem` line-height | Page headings |
| `--text-4xl` | `2.25rem` / `2.5rem` line-height | Hero headings |

### Shadow & Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.25rem` (4px) | Small elements |
| `--radius-md` | `0.375rem` (6px) | Buttons, inputs |
| `--radius-lg` | `0.5rem` (8px) | Cards, modals |
| `--radius-xl` | `0.75rem` (12px) | Large containers |
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Card elevation |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modal elevation |