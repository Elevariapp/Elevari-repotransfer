import { firstName, siteUrl } from './brand.js';
import { renderEmailLayout, renderHighlightBox, renderInfoCard } from './layout.js';

export function buildCheckInReminderEmail(params: {
  guestName: string | null;
  propertyTitle: string;
  propertySlug: string;
  city: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  bookingId: string;
}): { subject: string; text: string; html: string } {
  const name = firstName(params.guestName);
  const url = siteUrl();
  const propertyUrl = `${url}/properties/${params.propertySlug}`;
  const accountUrl = `${url}/account`;
  const faqUrl = `${url}/legal/faq`;

  const subject = `Mañana es tu check-in en ${params.propertyTitle}`;
  const text = `
Hola ${name},

¡Mañana comienza tu estadía en Elevari!

Propiedad: ${params.propertyTitle}
${params.city ? `Ubicación: ${params.city}\n` : ''}Entrada: ${params.checkIn}
Salida: ${params.checkOut}
Huéspedes: ${params.guests} · ${params.nights} noche(s)

Recomendaciones:
• Llega en el horario acordado con el anfitrión
• Lleva identificación y ropa cómoda para clima de montaña
• Revisa las normas del espacio antes de llegar

Ver propiedad: ${propertyUrl}
Mi reserva: ${accountUrl}
FAQ: ${faqUrl}

Te deseamos una estadía inolvidable.

— Elevari
`.trim();

  const rows = [
    { label: 'Propiedad', value: params.propertyTitle },
    ...(params.city ? [{ label: 'Ubicación', value: params.city }] : []),
    { label: 'Entrada', value: params.checkIn },
    { label: 'Salida', value: params.checkOut },
    { label: 'Huéspedes', value: String(params.guests) },
    { label: 'Noches', value: String(params.nights) },
  ];

  const html = renderEmailLayout({
    preheader: `Check-in mañana ${params.checkIn} — ${params.propertyTitle}.`,
    eyebrow: 'Recordatorio',
    title: 'Tu escapada empieza mañana',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hola <strong>${name}</strong>, mañana es tu check-in. Ya casi estás en la naturaleza, con el confort que mereces.</p>
      ${renderInfoCard(rows)}
      ${renderHighlightBox(`
        <strong>Antes de llegar</strong><br><br>
        ✓ Confirma horario de llegada con el anfitrión<br>
        ✓ Lleva identificación<br>
        ✓ Ropa en capas — noches frescas en montaña<br>
        ✓ Revisa normas del espacio en la ficha de la propiedad
      `)}
    `,
    cta: { href: propertyUrl, label: 'Ver detalles del glamping' },
    secondaryCta: { href: accountUrl, label: 'Abrir mi reserva' },
    footerNote: '¿Imprevisto? Contáctanos con antelación para ayudarte.',
  });

  return { subject, text, html };
}
