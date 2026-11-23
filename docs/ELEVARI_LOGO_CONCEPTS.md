# Logo Concepts — Elevari

Última validación: 2026-11-23 · rama chore/rebrand-elevari

## Compañía y atribución

**Marca:** Elevari (`elevari.live`) — web + Android, solo producción, COP, Colombia.
**Propiedad listada:** Glamping Waná (slug `glamping-wana`), Sutatausa / Cucunubá, Cundinamarca, Colombia.
**Contacto oficial:** `reserve@elevari.live` · WhatsApp `+57 323 268 8534`.

## Concepto 1 — Elevari Horizon (oficial)

Elevación arco + línea de horizonte + punto amber. Placa terracota con degradado, arco y horizonte ámbar, línea suave crema, punto amber con resplandor.

Archivo: `public/brand/logo-concept-1-horizon.svg`

## Colores de marca (SVG)

| Rol | Valor | Concepto 1 |
|-----|-------|------------|
| Placa | `#C2410C` → `#9A340E` (degradado) | Fondo de la marca |
| Arco y horizonte | `#EA9A2E` | Ámbar |
| Línea suave | `#FEF3C7` | Crema (opacidad 0.9) |
| Punto / acento | `#F59E0B` | Amber con filtro de resplandor |

## Componente de marca

`components/brand/ElevariMark.tsx` — símbolo reutilizable con props `size`, `className`, `plain` (solo el glifo, sin placa; para fondos oscuros), `decorative` (`aria-hidden`, sin `<title>`; úsalo junto a texto) y `title`. Los ids del degradado y del resplandor son únicos por instancia. Es el único componente React del símbolo: no crear copias.

## Documentos relacionados

[BRAND_SYSTEM.md](BRAND_SYSTEM.md) · [HANDOVER.md](HANDOVER.md)