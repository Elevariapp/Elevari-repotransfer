# BRAND_SYSTEM.md — Brand Identity System

**Repository:** `elevari-2026` (Elevari hospitality platform)
Última validación: 2026-11-21 · rama chore/elevari-production

## Overview

The Brand System defines Elevari's brand identity: logo usage, color palette, typography, voice & tone, imagery, and brand applications. It ensures consistent brand expression across all touchpoints.

**Owner:** Brand Team
**Phase:** 3E (Complete)

## Logo

### Logo Variants

| Variant | Usage | File |
|---------|-------|------|
| Wordmark | Primary logo, headers, marketing | `components/brand/brand-logo.tsx` (variant="wordmark") |
| Icon mark | Favicon, app icon, social profiles | `components/brand/brand-logo.tsx` (variant="icon") |
| Combined | Wordmark + icon, full lockup | `components/brand/brand-logo.tsx` (variant="combined") |
| Monochrome | Single-color applications | `components/brand/brand-logo.tsx` (variant="monochrome") |
| Reversed | Light logo on dark backgrounds | `components/brand/brand-logo.tsx` (variant="reversed") |

### Logo Usage Rules

- **Clear space:** Minimum clear space equal to the height of the "E" letterform
- **Minimum size:** 24px height for digital, 12mm for print
- **Do not:** Stretch, skew, rotate, add effects, change colors, or combine with other logos
- **Background:** Use wordmark on light backgrounds, reversed on dark backgrounds
- **Incorrect usage:** Never place on busy backgrounds, never outline, never drop shadow

### Logo Files

## Brand Colors

### Primary Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Elevari Slate | `#0F172A` | Primary brand color, text, headers |
| Elevari Sky | `#0EA5E9` | Accent color, links, primary actions |
| Elevari White | `#FFFFFF` | Background, reversed text |

### Secondary Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Elevari Slate Light | `#F8FAFC` | Light backgrounds, surfaces |
| Elevari Slate Mid | `#64748B` | Secondary text, muted elements |
| Elevari Slate Dark | `#1E293B` | Dark mode surfaces |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | Success states, confirmations |
| Warning | `#F59E0B` | Warning states, cautions |
| Error | `#EF4444` | Error states, destructive actions |
| Info | `#3B82F6` | Informational messages |

### Color Usage Guidelines

- Primary brand color (Slate) for main CTAs and headings
- Accent color (Sky) for secondary actions and highlights
- Never use brand colors for error/success states — use semantic colors
- Maintain WCAG AA contrast ratios (4.5:1 normal text, 3:1 large text)

## Typography

### Brand Font

| Font | Usage | Weights |
|------|-------|---------|
| Inter | All brand communications | 400, 500, 600, 700 |

### Font Usage

| Element | Font Size | Weight | Usage |
|---------|-----------|--------|-------|
| Brand headline | 2.25rem (36px) | 700 | Hero sections, campaign headers |
| Page heading | 1.875rem (30px) | 700 | Page titles |
| Section heading | 1.5rem (24px) | 600 | Section titles |

## Imagery

### Photography Style

- **Warm, natural lighting** — Golden hour preferred
- **Authentic moments** — Real guests, real properties, real experiences
- **Diverse representation** — Different ages, backgrounds, family types
- **Colombian hospitality** — Showcase local culture, architecture, landscapes
- **High resolution** — Minimum 1200px width for web, 2000px for print

### Image Usage

| Context | Style | Aspect Ratio |
|---------|-------|--------------|
| Hero banners | Lifestyle, wide | 16:9 |
| Property listings | Interior/exterior, bright | 4:3 |
| Property detail gallery | Mix of interior, exterior, amenities | 3:2 |
| Host profiles | Portrait, friendly | 1:1 |
| Blog posts | Featured image, relevant | 16:9 |
| Social media | Platform-optimized | 1:1 (feed), 9:16 (stories) |

### Image Guidelines

- Always include alt text for accessibility
- Optimize for web (WebP preferred, JPEG fallback)
- Lazy load below-the-fold images
- Use Next.js Image component for automatic optimization

## Brand Applications

### Digital Applications

| Application | Brand Elements | Notes |
|-------------|---------------|-------|
| Website | Logo, colors, typography, imagery | Primary brand touchpoint |
| Admin dashboard | Logo, colors, typography | Internal tool, simplified |
| Email templates | Logo, colors, typography | Transactional + marketing |
| Social media | Logo, colors, imagery, voice | Platform-native adaptations |
| Mobile app (future) | Logo, colors, typography | iOS + Android |

### Print Applications

| Application | Brand Elements | Notes |
|-------------|---------------|-------|
| Business cards | Logo, colors, typography | Standard size |
| Letterhead | Logo, colors | Official correspondence |
| Invoices/receipts | Logo, colors | Transactional documents |
| Signage | Logo, colors | Property signage, events |

## Related Documents

- `DESIGN_SYSTEM.md` — Design tokens, color, typography, spacing
- `EXS_GUIDE.md` — Experience System (tokens, components, a11y)
- `UI_COMPONENT_LIBRARY.md` — Component inventory, usage, props
- `ACCESSIBILITY_GUIDE.md` — WCAG AA compliance & a11y testing
- `ARCHITECTURE.md` — System architecture & tech stack
| Subheading | 1.25rem (20px) | 600 | Subsection titles |
| Body text | 1rem (16px) | 400 | Paragraphs, descriptions |
| Small text | 0.875rem (14px) | 400 | Captions, helper text |
| Label | 0.75rem (12px) | 500 | Form labels, metadata |

## Voice & Tone

### Brand Voice Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| Welcoming | Warm, inclusive, hospitable | "Welcome to your next stay" |
| Professional | Competent, reliable, trustworthy | "Secure booking with Wompi" |
| Clear | Simple, direct, jargon-free | "Check-in: 3 PM, Check-out: 11 AM" |
| Helpful | Supportive, guiding, anticipatory | "Need help? Contact support" |

### Tone Variations

| Context | Tone | Example |
|---------|------|---------|
| Booking confirmation | Celebratory, reassuring | "Your stay is confirmed! 🎉" |
| Error message | Helpful, non-blaming | "Please check your payment details" |
| Legal/terms | Formal, precise | "By booking, you agree to our terms" |
| Marketing | Inspiring, aspirational | "Discover your perfect getaway" |

### Writing Guidelines

- Use active voice ("Book your stay" not "Your stay can be booked")
- Use present tense
- Avoid jargon and technical terms
- Write for an international audience (COP currency, Spanish/English)
- Be concise — every word should earn its place |

| Format | Location | Usage |
|--------|----------|-------|
| SVG | `components/brand/brand-logo.tsx` | React component, scalable |
| PNG | `public/images/brand/logo.png` | Fallback, social media |
| Favicon | `public/favicon.ico` | Browser tab icon |
| App icon | `public/images/brand/app-icon.png` | Mobile app, PWA |