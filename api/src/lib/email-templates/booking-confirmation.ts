import { formatCop, firstName, siteUrl } from './brand.js';
import { renderEmailLayout, renderInfoCard } from './layout.js';

export function buildBookingConfirmationEmail(params: {
  guestName: string | null;
  propertyTitle: string;
  propertySlug: string;
  city: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalCharge?: number;
  bookingId: string;
}): { subject: string; text: string; html: string } {
  const name = firstName(params.guestName);
  const url = siteUrl();
  const successUrl = `${url}/checkout/${params.bookingId}/success?property=${params.propertySlug}`;
  const accountUrl = `${url}/account`;
  const totalLine =
    params.totalCharge != null ? `\nTotal pagado: ${formatCop(params.totalCharge)}` : '';

  const subject = `Reserva confirmada — ${params.propertyTitle}`;
  const text = `
Hola ${name},

¡Tu reserva en Elevari está confirmada!

Propiedad: ${params.propertyTitle}
${params.city ? `Ubicación: ${params.city}\n` : ''}Entrada: ${params.checkIn}
Salida: ${params.checkOut}
Huéspedes: ${params.guests}
Noches: ${params.nights}${totalLine}

Ver reserva: ${successUrl}
Mi cuenta: ${accountUrl}

Te esperamos en la naturaleza.

— Elevari
`.trim();

  const rows = [
    { label: 'Propiedad', value: params.propertyTitle },
    ...(params.city ? [{ label: 'Ubicación', value: params.city }] : []),
    { label: 'Entrada', value: params.checkIn },
    { label: 'Salida', value: params.checkOut },
    { label: 'Huéspedes', value: String(params.guests) },
    { label: 'Noches', value: String(params.nights) },
    ...(params.totalCharge != null
      ? [{ label: 'Total', value: formatCop(params.totalCharge) }]
      : []),
  ];

  const html = renderEmailLayout({
    preheader: `Confirmación de reserva en ${params.propertyTitle}. Entrada ${params.checkIn}.`,
    eyebrow: 'Reserva confirmada',
    title: 'Tu escapada está confirmada',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hola <strong>${name}</strong>, gracias por confiar en Elevari. Hemos recibido tu pago y tu estadía quedó reservada.</p>
      <p style="margin:0;">Prepara la mochila — te espera una experiencia de glamping con confort, naturaleza y detalle en cada paso.</p>
      ${renderInfoCard(rows)}
    `,
    cta: { href: successUrl, label: 'Ver detalle de reserva' },
    secondaryCta: { href: accountUrl, label: 'Gestionar desde mi cuenta' },
    footerNote: 'Recibirás el comprobante de facturación en un correo aparte cuando esté disponible.',
  });

  return { subject, text, html };
}
