# BRAND ASSETS CERTIFICATION — Phase 3.5

**Fecha:** 2026-11-13
**Generador reproducible:** `scripts/certification/generate-icons.mjs` (sharp)

---

## 1. Inventario

| Asset | Ruta | Formato | Tamaño | Estado |
|-------|------|---------|--------|--------|
| Icono maestro | `public/brand/app-icon-master.svg` | SVG vectorial | 1024×1024 (viewBox) | PASS |
| Favicon | `app/icon.svg` | SVG | 32×32 | PASS |
| Apple touch icon | `app/apple-icon.png` | PNG | 180×180 | PASS (nuevo) |
| Icono 16 | `public/brand/icons/icon-16.png` | PNG | 16×16 · 335 B | PASS (nuevo) |
| Icono 32 | `public/brand/icons/icon-32.png` | PNG | 32×32 · 603 B | PASS (nuevo) |
| Icono 64 | `public/brand/icons/icon-64.png` | PNG | 64×64 · 1.2 KB | PASS (nuevo) |
| Icono 128 | `public/brand/icons/icon-128.png` | PNG | 128×128 · 2.5 KB | PASS (nuevo) |
| Icono 256 | `public/brand/icons/icon-256.png` | PNG | 256×256 · 5.1 KB | PASS (nuevo) |
| Icono 512 | `public/brand/icons/icon-512.png` | PNG | 512×512 · 11.4 KB | PASS (nuevo) |
| Icono 1024 | `public/brand/icons/icon-1024.png` | PNG | 1024×1024 · 26.5 KB | PASS (nuevo) |
| Isotipo | `public/brand/eleveri-mark.svg` | SVG | 40×40 | PASS |
| Concepto Horizon | `public/brand/logo-concept-1-horizon.svg` | SVG | 512×512 | PASS |
| Concepto Path | `public/brand/logo-concept-2-path.svg` | SVG | 512×512 | PASS |
| Concepto Nest | `public/brand/logo-concept-3-nest.svg` | SVG | 512×512 | PASS |

Verificación de dimensiones por metadatos de sharp: **7/7 PNG correctos**.

---

## 2. Requisitos de tiendas

| Requisito | Estado |
|-----------|--------|
| App Store 1024×1024 sin transparencia | PASS — `icon-1024.png` con fondo forest plano |
| Play Store 512×512 | PASS — `icon-512.png` |
| Favicon | PASS — `app/icon.svg` |
| Apple touch | PASS — `app/apple-icon.png` 180×180 |
| Reconocible a 16 px | PASS (revisión de silueta: arco + punto ámbar, sin texto) |
| Sin clichés turísticos | PASS — sin montañas, cabañas, árboles ni hojas |

---

## 3. Pendientes

| # | Pendiente | Prioridad |
|---|-----------|-----------|
| B1 | Exportar `.ico` multirresolución (16/32/48) para favicon legacy | Baja |
| B2 | Set de screenshots de tienda (requiere app móvil, Fase 5) | N/A hoy |
| B3 | Validar concepto de logo con usuarios | Media |
| B4 | Congelar versión 1.0 del logo tras validación | Media |

---

## Veredicto

**PASS** — el set completo de iconos 16→1024 existe y es reproducible; favicon y Apple touch icon configurados.
