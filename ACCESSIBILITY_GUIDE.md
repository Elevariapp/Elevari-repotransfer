# ACCESSIBILITY_GUIDE.md — Accessibility Guide

**Repository:** `elevari-2026` (Elevari hospitality platform)
Última validación: 2026-11-21 · rama chore/elevari-production

## Overview

This document defines Elevari's accessibility standards, testing procedures, and compliance requirements. Elevari is committed to WCAG 2.1 AA compliance across all digital products.

**Owner:** Accessibility Team
**Phase:** 3E (Complete)

## WCAG 2.1 AA Compliance

### Perceivable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 1.1.1 Non-text Content | A | Complete | Alt text on all images, ARIA labels on icons |
| 1.2.1 Audio-only & Video-only | A | N/A | No audio/video content |
| 1.2.2 Captions (Prerecorded) | A | N/A | No prerecorded video |
| 1.2.3 Audio Description | A | N/A | No video content |
| 1.3.1 Info and Relationships | A | Complete | Semantic HTML, proper heading hierarchy |
| 1.3.2 Meaningful Sequence | A | Complete | Logical DOM order, CSS for visual only |
| 1.3.3 Sensory Characteristics | A | Complete | No color-only instructions |
| 1.4.1 Use of Color | A | Complete | Color never sole means of conveying info |
| 1.4.2 Audio Control | A | N/A | No auto-playing audio |
| 1.4.3 Contrast (Minimum) | AA | Complete | 4.5:1 normal text, 3:1 large text |

### Operable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 2.1.1 Keyboard | A | Complete | All functionality keyboard operable |
| 2.1.2 No Keyboard Trap | A | Complete | No keyboard traps in modals, dropdowns |
| 2.1.4 Character Key Shortcuts | A | Complete | No single-character shortcuts |
| 2.2.1 Timing Adjustable | A | Complete | No time limits on booking flow |
| 2.2.2 Pause, Stop, Hide | A | Complete | No auto-playing content |
| 2.3.1 Three Flashes | A | Complete | No flashing content |
| 2.4.1 Bypass Blocks | A | Complete | Skip to main content link |
| 2.4.2 Page Titled | A | Complete | Descriptive `<title>` on every page |
| 2.4.3 Focus Order | A | Complete | Logical tab order |
| 2.4.4 Link Purpose | A | Complete | Link text describes purpose |
| 2.4.5 Multiple Ways | AA | Complete | Search, sitemap, navigation |
| 2.4.6 Headings and Labels | AA | Complete | Descriptive headings and form labels |
| 2.4.7 Focus Visible | AA | Complete | Visible focus indicator on all interactive elements |
| 2.5.1 Pointer Gestures | A | Complete | No multipoint or path-based gestures |
| 2.5.2 Pointer Cancellation | A | Complete | Click up to cancel, not down |
| 2.5.3 Label in Name | A | Complete | Accessible name contains visible label |
| 2.5.4 Motion Actuation | A | Complete | No motion-based functionality |
| 2.5.7 Dragging Movements | AA | Complete | Single-pointer alternative for drag |
| 2.5.8 Target Size | AA | Complete | Minimum 24x24 CSS pixels for targets |

### Understandable

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 3.1.1 Language of Page | A | Complete | `lang` attribute on `<html>` |
| 3.1.2 Language of Parts | AA | Complete | Spanish/English content marked |
| 3.2.1 On Focus | A | Complete | No context change on focus |
| 3.2.2 On Input | A | Complete | No context change on input |
| 3.2.3 Consistent Navigation | AA | Complete | Consistent navigation across pages |
| 3.2.4 Consistent Identification | AA | Complete | Consistent icons and labels |

## Accessibility Testing

### Automated Testing

| Tool | Purpose | Frequency |
|------|---------|-----------|
| axe-core | Automated a11y scanning | Every PR, CI/CD |
| Lighthouse | Accessibility audit | Weekly, pre-release |
| pa11y | CI/CD accessibility gates | Every PR |

### Manual Testing

| Test | Method | Frequency |
|------|--------|-----------|
| Keyboard navigation | Tab through all interactive elements | Every release |
| Screen reader | NVDA, VoiceOver, JAWS testing | Every release |
| High contrast | Windows high contrast mode | Every release |
| Zoom testing | 200% browser zoom | Every release |
| Color blindness | Simulators (Deutan, Protan, Tritan) | Every release |

### User Testing

| Test | Participants | Frequency |
|------|--------------|-----------|
| Assistive technology users | 3-5 users with disabilities | Quarterly |
| Cognitive accessibility | Users with cognitive disabilities | Quarterly |

## Accessibility Requirements for Components

### Interactive Components

- All buttons, links, inputs have accessible names
- Focus visible indicator (2px solid, color-accent)
- Keyboard operable (Enter, Space, Escape, Arrow keys)
- ARIA attributes where needed (aria-expanded, aria-controls, aria-label)
- No reliance on color alone for information

### Forms

- All inputs have associated `<label>` elements
- Error messages associated with `aria-describedby`
- Required fields marked with `aria-required="true"`
- Invalid fields marked with `aria-invalid="true"`
- Focus management on form submission/errors

### Modals & Dialogs

- Focus trapped within modal
- Focus returns to trigger on close
- Escape key closes modal
- ARIA role="dialog" or role="alertdialog"
- `aria-modal="true"` on modal backdrop

### Navigation

- Skip to main content link (first focusable element)
- Logical heading hierarchy (h1 → h2 → h3)
- Landmark regions (nav, main, footer, aside)
- Breadcrumb navigation on nested pages

### Media

- Alt text on all informative images
- Decorative images use `alt=""` (null alt)
- Captions for any video content
- Transcripts for any audio content |

## Common Accessibility Issues & Fixes

| Issue | Impact | Fix |
|-------|--------|-----|
| Missing alt text | Screen reader users miss image content | Add descriptive alt text |
| Low contrast | Low vision users can't read text | Increase contrast to 4.5:1 |
| No focus indicator | Keyboard users can't see focus | Add visible focus ring |
| Missing form labels | Screen reader users don't know input purpose | Associate `<label>` with input |
| Keyboard trap | Keyboard users stuck in component | Ensure escape exits component |
| Vague link text | Screen reader users don't know link destination | Use descriptive link text |
| Missing skip link | Keyboard users must tab through navigation | Add skip to main content link |

## Related Documents

- `EXS_GUIDE.md` — Experience System (tokens, components, a11y)
- `DESIGN_SYSTEM.md` — Design tokens, color, typography, spacing
- `UI_COMPONENT_LIBRARY.md` — Component inventory, usage, props
- `BRAND_SYSTEM.md` — Brand identity, logo, colors, voice
- `ARCHITECTURE.md` — System architecture & tech stack
| 3.3.1 Error Identification | A | Complete | Errors identified and described |
| 3.3.2 Labels or Instructions | A | Complete | Labels and instructions for all inputs |
| 3.3.3 Error Suggestion | AA | Complete | Suggestions for fixing errors |
| 3.3.4 Error Prevention | AA | Complete | Confirmation for destructive actions |

### Robust

| Criterion | Level | Status | Implementation |
|-----------|-------|--------|----------------|
| 4.1.1 Parsing | A | Complete | Valid HTML, no duplicate IDs |
| 4.1.2 Name, Role, Value | A | Complete | ARIA roles, states, properties |
| 4.1.3 Status Messages | AA | Complete | ARIA live regions for dynamic content |
| 1.4.4 Resize Text | AA | Complete | Up to 200% without loss of functionality |
| 1.4.5 Images of Text | AA | Complete | No images of text except logos |
| 1.4.10 Reflow | AA | Complete | Content reflows at 320px width |
| 1.4.11 Non-text Contrast | AA | Complete | 3:1 for UI components, graphical objects |
| 1.4.12 Text Spacing | AA | Complete | Line spacing, paragraph spacing adjustable |
| 1.4.13 Content on Hover/Focus | AA | Complete | No content appears only on hover/focus |