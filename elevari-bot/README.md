# Elevari WhatsApp Business AI Bot

Última validación: 2026-11-21 · rama chore/elevari-production

## Compañía y atribución

**Marca:** Elevari (`elevari.live`) — web + Android, solo producción, COP, Colombia (Ley 1581 de 2012).
**Propiedad listada:** Glamping Waná (slug `glamping-wana`), Sutatausa / Cucunubá, Cundinamarca, Colombia.
**Contacto oficial:** `reserve@elevari.live` · WhatsApp `+57 323 268 8534`.

> «Glamping Waná» es una propiedad listada, no la marca. La marca es Elevari.

## Descripción

Bot de WhatsApp Business no invasivo para Elevari. Atiende consultas frecuentes sobre reservas, disponibilidad, check-in, cancelación y pagos en español e inglés. No reemplaza el contacto humano; deriva a `reserve@elevari.live` cuando es necesario.

## Número de WhatsApp

`+57 323 268 8534` (formato internacional: `573232688534`)

URL de contacto: `https://wa.me/573232688534`

## Integración web

El CTA flotante de WhatsApp (`components/whatsapp/WhatsAppCTA.tsx`) se muestra solo en:

- **Reserva:** página de detalle de propiedad (`/properties/[slug]`)
- **Cancelación:** página de cuenta (`/account`) — desde donde se cancelan reservas
- **Soporte:** preguntas frecuentes (`/legal/faq`)
- **Checkout:** página de pago (`/checkout/[bookingId]`)

El CTA es dismissible (se guarda en `localStorage` como `elevari:wa-dismissed`) y no interfiere con el flujo de reserva.

## Principios

1. **No invasivo:** solo aparece en las páginas indicadas, se puede descartar.
2. **Bilingüe:** respuestas en español e inglés.
3. **Sin datos sensibles:** nunca solicita ni almacena tarjetas, contraseñas ni documentos.
4. **Escalado humano:** deriva a `reserve@elevari.live` para casos complejos.
5. **Cumplimiento:** respeta la Ley 1581 de 2012 (protección de datos personales, Colombia).

## Documentos relacionados

[BRAND_SYSTEM.md](../docs/BRAND_SYSTEM.md) · [HANDOVER.md](../docs/HANDOVER.md) · [RESEND_SETUP.md](../docs/RESEND_SETUP.md)