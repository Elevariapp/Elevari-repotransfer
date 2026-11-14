import { formatCop, firstName, siteUrl } from './brand.js';
import { renderEmailLayout, renderInfoCard, renderHighlightBox } from './layout.js';

export function buildInvoiceReceiptEmail(params: {
  guestName: string | null;
  guestEmail: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  subtotal?: number;
  taxesAndFees?: number;
  totalCharge: number;
  invoiceId?: string;
  bookingId: string;
}): { subject: string; text: string; html: string } {
  const name = firstName(params.guestName);
  const url = siteUrl();
  const accountUrl = `${url}/account`;
  const ref = params.invoiceId ?? params.bookingId.slice(0, 8).toUpperCase();

  const subject = `Comprobante de pago — ${params.propertyTitle}`;
  const text = `
Hola ${name},

Adjuntamos el resumen de facturación de tu reserva en Eleveri.

Referencia: ${ref}
Propiedad: ${params.propertyTitle}
Entrada: ${params.checkIn}
Salida: ${params.checkOut}
Noches: ${params.nights}
Total: ${formatCop(params.totalCharge)}

Ver reservas: ${accountUrl}

Este comprobante respalda tu pago. Consérvalo para tus registros.

— Eleveri
`.trim();

  const rows = [
    { label: 'Referencia', value: ref },
    { label: 'Propiedad', value: params.propertyTitle },
    { label: 'Entrada', value: params.checkIn },
    { label: 'Salida', value: params.checkOut },
    { label: 'Noches', value: String(params.nights) },
    ...(params.subtotal != null ? [{ label: 'Subtotal', value: formatCop(params.subtotal) }] : []),
    ...(params.taxesAndFees != null
      ? [{ label: 'Tarifa de Servicio Elevari', value: formatCop(params.taxesAndFees) }]
      : []),
    { label: 'Total pagado', value: formatCop(params.totalCharge) },
  ];

  const html = renderEmailLayout({
    preheader: `Comprobante Eleveri por ${formatCop(params.totalCharge)} — ${params.propertyTitle}`,
    eyebrow: 'Facturación',
    title: 'Comprobante de pago',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hola <strong>${name}</strong>, aquí tienes el resumen de tu transacción en Eleveri.</p>
      <p style="margin:0;">Correo de la reserva: <strong>${params.guestEmail}</strong></p>
      ${renderInfoCard(rows)}
      ${renderHighlightBox(`
        Este correo funciona como comprobante de pago. Si necesitas soporte con facturación electrónica (DIAN), escríbenos indicando la referencia <strong>${ref}</strong>.
      `)}
    `,
    cta: { href: accountUrl, label: 'Ver mis reservas' },
    footerNote: 'Eleveri — experiencias de glamping en Colombia.',
  });

  return { subject, text, html };
}
