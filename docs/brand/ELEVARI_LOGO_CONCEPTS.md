# Elevari Logo Concepts

## Overview

This document describes the four logo concepts developed for Elevari S.A.S, a hospitality platform for managing property reservations (glamping, hotels, vacation rentals).

## Concept 1: Arc + Amber Point

A circular arc with a single amber point representing a property marker or booking pin. The arc suggests completeness and the amber point represents a specific location or destination.

**Best for:** App icons, favicons, small-scale branding

## Concept 2: Ascending Path

An upward-trending path line representing growth, reservations, and hospitality elevation. The path moves from bottom-left to top-right, symbolizing progress and upward mobility.

**Best for:** Marketing materials, growth-focused communications

## Concept 3: Containment Curve

A protective curve surrounding a central element, representing security, care, and guest experience. The curve envelops the center like a welcoming embrace.

**Best for:** Trust-focused communications, security messaging, guest experience

## Concept 4: Blend (Current - Active)

A blended combination of Concepts 1-3:

- **Arc** from Concept 1 — outer containment curve in Slate 900
- **Ascending path** from Concept 2 — upward-trending line in Amber gradient
- **Containment curve** from Concept 3 — protective outer arc
- **Amber point** — glowing accent at the path endpoint
- **Amber gradient overlay** — matches brand primary color `#F59E0B`
- **App Store style** — clean, scalable, recognizable at small sizes
- **Scalable SVG format** — `public/brand/logo-concept-4-blend.svg`

### SVG Preview

![Concept 4 Blend Logo](../brand/logo-concept-4-blend.svg)

### Comparison Table

| Feature | Concept 1 | Concept 2 | Concept 3 | Concept 4 (Blend) |
|---------|-----------|-----------|-----------|-------------------|
| Arc | ✅ | ❌ | ✅ | ✅ |
| Ascending Path | ❌ | ✅ | ❌ | ✅ |
| Containment Curve | ❌ | ❌ | ✅ | ✅ |
| Amber Point | ✅ | ❌ | ❌ | ✅ |
| Gradient | ❌ | ❌ | ❌ | ✅ |
| App Store Style | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Scalable SVG | ✅ | ✅ | ✅ | ✅ |

## Usage

```tsx
import ElevariBlend from '@/components/brand/ElevariBlend';

// Default size (48px)
<ElevariBlend />

// Custom size
<ElevariBlend size={96} />

// Custom color
<ElevariBlend fill="#F59E0B" size={64} />

// With custom class
<ElevariBlend className="my-logo" size={48} />
```

## Brand Colors Used

- Amber Primary: `#F59E0B`
- Amber Dark: `#D97706`
- Slate 900: `#0F172A`