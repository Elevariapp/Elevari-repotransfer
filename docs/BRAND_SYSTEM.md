# Brand System — Elevari

Última validación: 2026-11-21 · rama chore/elevari-production

## Compañía y atribución

**Marca:** Elevari (`elevari.live`) — web + Android, solo producción, COP, Colombia (Ley 1581 de 2012).
**Propiedad listada:** Glamping Waná (slug `glamping-wana`), Sutatausa / Cucunubá, Cundinamarca, Colombia.
**Contacto oficial:** `reserve@elevari.live` · WhatsApp `+57 323 268 8534`.

> «Glamping Waná» es una propiedad listada, no la marca. La marca es Elevari.

## Colores de marca

| Token | Valor | Uso |
|-------|-------|-----|
| `--elevari-forest-deep` | `#1E4835` | Placa de fondo, fondos oscuros, header/footer |
| `--elevari-forest` | `#2F6B4F` | Acciones primarias, enlaces |
| `--elevari-fresh` | `#5FA76A` | Trazos del símbolo de marca |
| `--elevari-amber` | `#E9A820` | Punto de acento, botones secundarios, detalles |
| `--elevari-amber-soft` | `#F6E3B8` | Líneas suaves, fondos de acento |
| `--elevari-ivory` | `#F7F4EC` | Fondo claro, superficies |
| `--elevari-sand` | `#E8E3D5` | Bordes, fondos sutiles |
| `--elevari-slate` | `#22313F` | Texto principal |
| `--elevari-ink` | `#16222C` | Texto denso |

## Símbolo de marca (ElevariMark)

Símbolo abstracto: bucle continuo + punto de elevación. Colores: placa forest-deep, bucle fresh, horizonte amber-soft, punto amber.

Ver `components/brand/ElevariMark.tsx` y `public/brand/elevari-mark.svg`.

## Concepto 4 — Elevari Blend

Versión estilo App Store del símbolo: placa redondeada, bucle continuo, punto elevado en amber. Usado en correos transaccionales y como ícono de marca en entornos reducidos.

Ver `components/brand/ElevariBlend.tsx` y `public/brand/logo-concept-4-blend.svg`.

## Uso en correos (Resend)

- Logo: `/brand/logo-concept-4-blend.svg` (referenciado en `api/src/lib/email-templates/brand.ts`)
- Colores de correo mapeados a tokens de marca (ver `brand.ts`)
- Pie de correo: atribución a Elevari + Glamping Waná, Sutatausa/Cucunubá, Cundinamarca, Colombia

## Accesibilidad

- Contraste WCAG 2.2 AA en todos los pares de color
- `prefers-reduced-motion` respeta la desactivación de animaciones
- Enfoque visible en todos los elementos interactivos

## Documentos relacionados

[ELEVARI_LOGO_CONCEPTS.md](ELEVARI_LOGO_CONCEPTS.md) · [HANDOVER.md](HANDOVER.md) · [RESEND_SETUP.md](RESEND_SETUP.md)