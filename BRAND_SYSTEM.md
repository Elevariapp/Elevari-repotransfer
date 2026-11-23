# Elevari Brand System

## Brand Identity

**Company:** Elevari S.A.S  
**NIT:** 902088849  
**Address:** CR 5 NO. 16 14 OF 711 ED EL GLOBO, BOGOTÁ, D.C, código postal 111711  
**Developed by:** Armada AI S.A.S, NIT: 902056540  
**Powered by:** IMPOSSIBLY CORP, D-U-N-S #: 06-969-4845  

## Brand Colors

### Primary Colors (Terracotta + Cream)
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Terracotta | `#C2410C` | 194, 65, 12 | Main brand color: buttons, links, mark plate |
| Terracotta Deep | `#9A340E` | 154, 52, 14 | Header/footer, hover states, dark end of the plate |
| Amber | `#EA9A2E` | 234, 154, 46 | Mark arch and horizon, highlights on terracotta |
| Amber Accent | `#F59E0B` | 245, 158, 11 | Mark point, focus ring, small accents |
| Cream | `#FEF3C7` | 254, 243, 199 | Page background, soft lines |

Source of truth: `app/globals.css` (`--elevari-*`), mirrored in `lib/design-tokens.ts` and `mobile/lib/design-tokens.ts`.

### Secondary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Slate 900 | `#0F172A` | 15, 23, 42 | Primary text, dark backgrounds |
| Slate 700 | `#334155` | 51, 65, 85 | Secondary text, borders |
| Slate 500 | `#64748B` | 100, 116, 139 | Muted text, placeholders |
| Slate 100 | `#F1F5F9` | 241, 245, 249 | Light backgrounds |
| Slate 50 | `#F8FAFC` | 248, 250, 252 | Very light backgrounds |

### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | Success states, confirmations |
| Warning | `#F59E0B` | Warnings, alerts |
| Error | `#EF4444` | Errors, destructive actions |
| Info | `#3B82F6` | Information, links |

## Logo

The official mark is **Concept 1 — Horizon**: an elevation arc, a horizon line and an amber point on a terracotta plate (`public/brand/logo-concept-1-horizon.svg`). The earlier Path, Nest and Blend explorations were retired.

Lockup: the mark next to the wordmark "Elevari", with no tagline.

## Component References

- `components/brand/ElevariMark.tsx` — the only React implementation of the mark
- `components/Logo.tsx` — mark + "Elevari" wordmark lockup

## Email Brand Colors

- Primary: `#C2410C` (Terracotta)
- Secondary: `#0F172A` (Slate)
- Accent: `#C2410C` (Terracotta)
- Button background: `#C2410C`
- Button text: `#FFFFFF`
- Link color: `#C2410C`
- Footer background: `#0F172A`
- Footer text: `#FEF3C7` (Cream); footer links `#EA9A2E` (Amber)
- Logo: `https://elevari.live/brand/icons/icon-128.png` (PNG, because mail clients do not render SVG)

## WhatsApp Business Brand

- Phone: +57 3232688534
- CTA: "Talk to AI Concierge on WhatsApp"
- Placement: Reservation, cancellation, support, checkout pages only
- Style: Subtle floating button, opt-in greeting

## Cinematic Background Design

- Theme: Mountains, nature landscapes, rivers, glamping guests
- Animations: Parallax, slow zoom, subtle particle overlays
- Overlay: Amber gradient blended with dark overlay for text readability
- Responsive: Mobile-optimized, prefers-reduced-motion support
- Performance: Lazy load, compressed assets, fallback static image