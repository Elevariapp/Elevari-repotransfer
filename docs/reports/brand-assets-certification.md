# BRAND ASSETS CERTIFICATION — Phase 3.5

**Fecha:** 2026-11-13 · **Actualizado:** 2026-11-23 (paleta terracota v3, assets móviles de marca)
**Generador reproducible:** `scripts/certification/generate-icons.mjs` (sharp). Regenera todos los PNG a partir de `public/brand/app-icon-master.svg` y `app/icon.svg`; no editar los PNG a mano.

---

## 1. Inventario

| Asset | Ruta | Formato | Tamaño | Estado |
|-------|------|---------|--------|--------|
| Icono maestro | `public/brand/app-icon-master.svg` | SVG vectorial | 1024×1024 (viewBox) | PASS |
| Favicon | `app/icon.svg` | SVG | 32×32 | PASS |
| Apple touch icon | `app/apple-icon.png` | PNG | 180×180 · cuadrado completo, sin alfa | PASS |
| Icono 16 | `public/brand/icons/icon-16.png` | PNG | 16×16 · 450 B | PASS |
| Icono 32 | `public/brand/icons/icon-32.png` | PNG | 32×32 · 851 B | PASS |
| Icono 64 | `public/brand/icons/icon-64.png` | PNG | 64×64 · 1.5 KB | PASS |
| Icono 128 | `public/brand/icons/icon-128.png` | PNG | 128×128 · 2.9 KB | PASS |
| Icono 256 | `public/brand/icons/icon-256.png` | PNG | 256×256 · 6.0 KB | PASS |
| Icono 512 | `public/brand/icons/icon-512.png` | PNG | 512×512 · 9.5 KB · cuadrado completo, sin alfa | PASS |
| Icono 1024 | `public/brand/icons/icon-1024.png` | PNG | 1024×1024 · 22.4 KB · cuadrado completo, sin alfa | PASS |
| Icono móvil (iOS / Android legacy) | `mobile/assets/icon.png` | PNG | 1024×1024 · cuadrado completo, sin alfa | PASS (reemplaza el placeholder de Expo) |
| Adaptive icon · fondo | `mobile/assets/android-icon-background.png` | PNG | 512×512 · degradado terracota | PASS (reemplaza el placeholder de Expo) |
| Adaptive icon · primer plano | `mobile/assets/android-icon-foreground.png` | PNG | 512×512 · glifo dentro del círculo seguro | PASS (reemplaza el placeholder de Expo) |
| Adaptive icon · monocromo | `mobile/assets/android-icon-monochrome.png` | PNG | 432×432 · silueta para iconos temáticos | PASS (reemplaza el placeholder de Expo) |
| Splash | `mobile/assets/splash-icon.png` | PNG | 1024×1024 · glifo sobre `#C2410C` | PASS (reemplaza el placeholder de Expo) |
| Favicon web móvil | `mobile/assets/favicon.png` | PNG | 48×48 | PASS (reemplaza el placeholder de Expo) |
| Icono de notificación | `mobile/assets/notification-icon.png` | PNG | 96×96 · silueta blanca sobre transparente | PASS (nuevo) |
| Isotipo (maestro 1024) | `public/brand/app-icon-master.svg` | SVG | 1024×1024 | PASS |
| Concepto Horizon | `public/brand/logo-concept-1-horizon.svg` | SVG | 512×512 | PASS |

Verificación de dimensiones y canal alfa por metadatos de sharp (el generador los imprime al terminar): **15/15 PNG correctos** (8 web + 7 móvil).

---

## 2. Requisitos de tiendas

| Requisito | Estado |
|-----------|--------|
| App Store 1024×1024 sin transparencia | PASS — `icon-1024.png` y `mobile/assets/icon.png`: cuadrado a sangre, sin canal alfa ni esquinas redondeadas |
| Play Store 512×512 | PASS — `icon-512.png`, cuadrado a sangre (Google aplica su máscara) |
| Android adaptive icon (zona segura) | PASS — el punto más lejano del glifo queda a 0.29 del lienzo; el círculo seguro de Android mide 0.306 |
| Android themed icon (Android 13+) | PASS — `android-icon-monochrome.png` |
| Icono de notificación Android | PASS — `notification-icon.png` blanco sobre transparente (referenciado en el plugin `expo-notifications` de `mobile/app.json`) |
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

**PASS** — el set completo de iconos 16→1024 y los assets móviles (launcher, adaptive, monocromo, splash, notificación) existen en la paleta terracota v3 y son reproducibles; favicon y Apple touch icon configurados.
