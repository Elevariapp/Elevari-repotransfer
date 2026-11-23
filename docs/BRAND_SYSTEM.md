# Brand System — Elevari

Última validación: 2026-11-23 · rama chore/rebrand-elevari

## Compañía y atribución

**Marca:** Elevari (`elevari.live`) — web + Android, solo producción, COP, Colombia (Ley 1581 de 2012).
**Propiedad listada:** Glamping Waná (slug `glamping-wana`), Sutatausa / Cucunubá, Cundinamarca, Colombia.
**Contacto oficial:** `reserve@elevari.live` · WhatsApp `+57 323 268 8534`.

> «Glamping Waná» es una propiedad listada, no la marca. La marca es Elevari.

## Colores de marca

Paleta **Terracota + Crema**. Fuente: `app/globals.css`; espejos en `lib/design-tokens.ts` (web) y `mobile/lib/design-tokens.ts` (móvil). Los nombres `forest` y `fresh` son heredados: sus valores ya no son verdes.

| Token | Valor | Uso |
|-------|-------|-----|
| `--elevari-forest-deep` | `#9A340E` | Terracota profundo: extremo oscuro de la placa, header/footer, texto sobre ámbar |
| `--elevari-forest` | `#C2410C` | Terracota: acciones primarias, enlaces, extremo claro de la placa |
| `--elevari-fresh` | `#EA9A2E` | Ámbar del símbolo: arco y horizonte |
| `--elevari-amber` | `#F59E0B` | Punto de acento, foco, detalles |
| `--elevari-amber-soft` | `#FEF3C7` | Línea suave del símbolo, fondos de acento |
| `--elevari-ivory` | `#FEF3C7` | Fondo claro, superficies |
| `--elevari-sand` | `#E8E3D5` | Bordes, fondos sutiles |
| `--elevari-slate` | `#0F172A` | Texto principal |
| `--elevari-ink` | `#0F172A` | Texto denso |

## Símbolo de marca (ElevariMark)

Símbolo **Horizon** (concepto 1, oficial): arco de elevación + línea de horizonte + punto de luz. Placa terracota (`#C2410C` → `#9A340E`), arco y horizonte `#EA9A2E`, línea suave `#FEF3C7`, punto `#F59E0B` con resplandor.

Ver `components/brand/ElevariMark.tsx` (props `size`, `className`, `plain`, `decorative`, `title`) y `public/brand/app-icon-master.svg`. `components/Logo.tsx` combina el símbolo con el wordmark «Elevari», sin descriptor.

## Iconos y assets móviles

Los PNG (iconos web, Apple touch, launcher/adaptive/splash/notificación de Expo) se generan con `node scripts/certification/generate-icons.mjs` a partir de `public/brand/app-icon-master.svg` y `app/icon.svg`. No editar los PNG a mano. Detalle en `docs/reports/brand-assets-certification.md`.

## Uso en correos (Resend)

- Logo: `https://elevari.live/brand/icons/icon-128.png` (PNG; los clientes de correo no renderizan SVG). Definido en `api/src/lib/email-templates/brand.ts`
- Botones y enlaces en terracota `#C2410C` (contraste 5.2:1 con texto blanco); enlaces del pie en ámbar `#EA9A2E`
- Pie de correo: atribución a Elevari + Glamping Waná, Sutatausa/Cucunubá, Cundinamarca, Colombia

## Accesibilidad

- Contraste WCAG 2.2 AA en todos los pares de color
- `prefers-reduced-motion` respeta la desactivación de animaciones
- Enfoque visible en todos los elementos interactivos

## Documentos relacionados

[ELEVARI_LOGO_CONCEPTS.md](ELEVARI_LOGO_CONCEPTS.md) · [HANDOVER.md](HANDOVER.md) · [RESEND_SETUP.md](RESEND_SETUP.md)