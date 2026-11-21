# DESIGN_SYSTEM.md — Design System

**Repository:** `elevari-2026` (Elevari hospitality platform)
Última validación: 2026-11-21 · rama chore/elevari-production

## Overview

The Design System defines Elevari's visual language: color palette, typography, spacing, iconography, motion, and component specifications. It is the single source of truth for all UI design decisions.

**Owner:** Design Team
**Phase:** 3E (Complete)

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Slate 900 | `#0F172A` | Primary text, headers, primary buttons |
| Slate 800 | `#1E293B` | Dark surfaces, card backgrounds (dark mode) |
| Slate 700 | `#334155` | Borders (dark mode), secondary text |
| Slate 600 | `#475569` | Secondary text (light mode) |
| Slate 500 | `#64748B` | Placeholder text, disabled states |
| Slate 400 | `#94A3B8` | Muted text, borders |
| Slate 300 | `#CBD5E1` | Light borders, dividers |
| Slate 100 | `#F1F5F9` | Light backgrounds, hover states |
| Slate 50 | `#F8FAFC` | Page background (dark mode), near-white |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| Sky 500 | `#0EA5E9` | Primary accent, links, active states |
| Sky 400 | `#38BDF8` | Accent (dark mode) |
| Emerald 500 | `#10B981` | Success, confirm, positive actions |
| Emerald 400 | `#34D399` | Success (dark mode) |
| Amber 500 | `#F59E0B` | Warning, caution |
| Amber 400 | `#FBBF24` | Warning (dark mode) |
| Red 500 | `#EF4444` | Error, delete, destructive actions |
| Red 400 | `#F87171` | Error (dark mode) |

### Semantic Color Mapping


## Typography

### Font Stack

| Font | Usage | Fallback |
|------|-------|----------|
| Inter | Body, headings, UI | system-ui, sans-serif |
| Inter (variable) | Headings, display | system-ui, sans-serif |

### Type Scale

| Size | Font Size | Line Height | Font Weight | Usage |
|------|-----------|-------------|-------------|-------|
| text-4xl | 2.25rem (36px) | 2.5rem (40px) | 700 | Hero headings |
| text-3xl | 1.875rem (30px) | 2.25rem (36px) | 700 | Page headings |
| text-2xl | 1.5rem (24px) | 2rem (32px) | 600 | Section headings |
| text-xl | 1.25rem (20px) | 1.75rem (28px) | 600 | Subheadings |
| text-lg | 1.125rem (18px) | 1.75rem (28px) | 500 | Lead text |
| text-base | 1rem (16px) | 1.5rem (24px) | 400 | Body text |
| text-sm | 0.875rem (14px) | 1.25rem (20px) | 400 | Small text, captions |
| text-xs | 0.75rem (12px) | 1rem (16px) | 400 | Labels, helper text |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text |
| Medium | 500 | Emphasis, lead text |
| Semibold | 600 | Headings, subheadings |
| Bold | 700 | Page headings, hero text |

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| space-0 | 0 | Reset |
| space-px | 1px | Borders |
| space-1 | 0.25rem (4px) | Tight padding |
| space-2 | 0.5rem (8px) | Component padding |
| space-3 | 0.75rem (12px) | Small gaps |
| space-4 | 1rem (16px) | Standard padding |
| space-5 | 1.25rem (20px) | Component gaps |
| space-6 | 1.5rem (24px) | Section spacing |
| space-8 | 2rem (32px) | Page sections |

## Iconography

| Icon Set | Usage | Source |
|----------|-------|--------|
| Lucide React | UI icons (navigation, actions) | `lucide-react` |
| Custom SVG | Brand icons, logo marks | `components/brand/icons/` |

### Icon Sizes

| Size | Value | Usage |
|------|-------|-------|
| icon-sm | 1rem (16px) | Small UI, badges |
| icon-md | 1.25rem (20px) | Buttons, inputs |
| icon-lg | 1.5rem (24px) | Headings, section icons |
| icon-xl | 2rem (32px) | Hero sections, features |

## Motion & Transitions

| Token | Value | Usage |
|-------|-------|-------|
| duration-fast | 150ms | Hover states, toggles |
| duration-normal | 300ms | Page transitions, modals |
| duration-slow | 500ms | Complex animations |
| ease-in-out | cubic-bezier(0.4, 0, 0.2, 1) | Standard easing |
| ease-out | cubic-bezier(0, 0, 0.2, 1) | Entrance animations |
| ease-in | cubic-bezier(0.4, 0, 1, 1) | Exit animations |

## Component Specifications

### Button

| Property | Value |
|----------|-------|
| Height | 2.5rem (40px) |
| Padding | 0 1rem (0 16px) |
| Border radius | radius-md (6px) |
| Font size | text-base (16px) |
| Font weight | 500 |
| Transition | duration-fast, ease-in-out |

### Input

| Property | Value |
|----------|-------|
| Height | 2.5rem (40px) |
| Padding | 0 0.75rem (0 12px) |
| Border radius | radius-md (6px) |
| Border | 1px solid color-border |
| Font size | text-base (16px) |

### Card

| Property | Value |
|----------|-------|
| Padding | 1.5rem (24px) |
| Border radius | radius-lg (8px) |
| Background | color-surface |
| Border | 1px solid color-border |
| Shadow | shadow-md |

## Related Documents

- `EXS_GUIDE.md` — Experience System (tokens, components, a11y)
- `UI_COMPONENT_LIBRARY.md` — Component inventory, usage, props
- `BRAND_SYSTEM.md` — Brand identity, logo, colors, voice
- `ACCESSIBILITY_GUIDE.md` — WCAG AA compliance & a11y testing
- `ARCHITECTURE.md` — System architecture & tech stack
| space-10 | 2.5rem (40px) | Large sections |
| space-12 | 3rem (48px) | Major sections |
| space-16 | 4rem (64px) | Hero sections |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-none | 0 | Sharp corners |
| radius-sm | 0.25rem (4px) | Badges, small elements |
| radius-md | 0.375rem (6px) | Buttons, inputs |
| radius-lg | 0.5rem (8px) | Cards, modals |
| radius-xl | 0.75rem (12px) | Large containers |
| radius-full | 9999px | Avatars, pills |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| shadow-none | none | No elevation |
| shadow-sm | 0 1px 2px 0 rgb(0 0 0 / 0.05) | Subtle elevation |
| shadow-md | 0 4px 6px -1px rgb(0 0 0 / 0.1) | Card elevation |
| shadow-lg | 0 10px 15px -3px rgb(0 0 0 / 0.1) | Modal elevation |
| shadow-xl | 0 20px 25px -5px rgb(0 0 0 / 0.1) | Dropdown elevation |
| Semantic Token | Light Mode | Dark Mode |
|----------------|-----------|-----------|
| `--color-primary` | Slate 900 | Slate 50 |
| `--color-secondary` | Slate 500 | Slate 400 |
| `--color-accent` | Sky 500 | Sky 400 |
| `--color-success` | Emerald 500 | Emerald 400 |
| `--color-warning` | Amber 500 | Amber 400 |
| `--color-error` | Red 500 | Red 400 |
| `--color-background` | White | Slate 900 |
| `--color-surface` | Slate 50 | Slate 800 |
| `--color-text-primary` | Slate 900 | Slate 50 |
| `--color-text-secondary` | Slate 600 | Slate 300 |
| `--color-border` | Slate 200 | Slate 700 |