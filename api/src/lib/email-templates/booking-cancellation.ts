import { formatCop, firstName, siteUrl } from './brand.js';
import { renderEmailLayout, renderHighlightBox, renderInfoCard } from './layout.js';

export function buildBookingCancellationEmail(params: {
  guestName: string | null;
  propertyTitle: string;
  propertySlug: string;
  city: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  reason: string;
  refundAmount?: number;
  refundEligible?: boolean;
  expiredUnpaid?: boolean;
}): { subject: string; text: string; html: string } {
  const name = firstName(params.guestName);
  const url = siteUrl();
  const accountUrl = `${url}/account`;
  const exploreUrl = `${url}/properties`;

  const subject = params.expiredUnpaid
    ? `Reserva no completada — ${params.propertyTitle}`
    : `Reserva cancelada — ${params.propertyTitle}`;

  const refundLine =
    params.refundEligible && params.refundAmount != null && params.refundAmount > 0
      ? `\nReembolso estimado: ${formatCop(params.refundAmount)} (5–10 días hábiles según tu banco).`
      : params.expiredUnpaid
        ? '\nNo se realizó ningún cobro.'
        : '\nSegún nuestra política de cancelación, no aplica reembolso para este caso.';

  const text = `
Hola ${name},

${params.expiredUnpaid ? 'Tu reserva no se completó a tiempo y las fechas quedaron liberadas.' : 'Confirmamos la cancelación de tu reserva en Elevari.'}

Propiedad: ${params.propertyTitle}
${params.city ? `Ubicación: ${params.city}\n` : ''}Entrada: ${params.checkIn}
Salida: ${params.checkOut}
Huéspedes: ${params.guests}

${params.reason}${refundLine}

Ver reservas: ${accountUrl}
Explorar otros espacios: ${exploreUrl}

— Elevari
`.trim();

  const rows = [
    { label: 'Propiedad', value: params.propertyTitle },
    ...(params.city ? [{ label: 'Ubicación', value: params.city }] : []),
    { label: 'Entrada', value: params.checkIn },
    { label: 'Salida', value: params.checkOut },
    { label: 'Huéspedes', value: String(params.guests) },
    { label: 'Estado', value: params.expiredUnpaid ? 'No completada' : 'Cancelada' },
  ];

  const refundHtml =
    params.refundEligible && params.refundAmount != null && params.refundAmount > 0
      ? renderHighlightBox(`
          <strong>Reembolso en proceso</strong><br>
          Monto estimado: <strong>${formatCop(params.refundAmount)}</strong><br>
          ${params.reason}<br><br>
          El reembolso puede tardar 5–10 días hábiles según tu entidad financiera.
        `)
      : renderHighlightBox(`<strong>Política aplicada</strong><br>${params.reason}`);

  const html = renderEmailLayout({
    preheader: params.expiredUnpaid
      ? `Las fechas del ${params.checkIn} quedaron disponibles de nuevo.`
      : `Tu reserva en ${params.propertyTitle} fue cancelada.`,
    eyebrow: params.expiredUnpaid ? 'Reserva no completada' : 'Cancelación',
    title: params.expiredUnpaid ? 'No completaste tu reserva' : 'Reserva cancelada',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hola <strong>${name}</strong>, ${
        params.expiredUnpaid
          ? 'liberamos las fechas porque el pago no se confirmó a tiempo.'
          : 'procesamos tu solicitud de cancelación.'
      }</p>
      <p style="margin:0;">Las fechas quedaron disponibles para otros huéspedes. Si aún quieres escaparte, tenemos más experiencias esperándote.</p>
      ${renderInfoCard(rows)}
      ${refundHtml}
    `,
    cta: { href: exploreUrl, label: 'Explorar colección' },
    secondaryCta: { href: accountUrl, label: 'Ver mi cuenta' },
    footerNote: '¿Dudas sobre reembolsos? Escríbenos indicando la propiedad y las fechas.',
  });

  return { subject, text, html };
}
