import { EMAIL_BRAND } from './brand.js';
import {
  emailBilingual,
  emailButton,
  emailFacts,
  emailGreeting,
  emailHeading,
  emailHelpLine,
  emailLayout,
  esc,
} from './layout.js';
import { formatMoney } from './format.js';

export function invoiceReceipt({
  invoiceId,
  bookingId,
  propertyName,
  total,
  currency = 'COP',
  guestName,
  billingUrl,
}: {
  invoiceId?: string | null;
  bookingId: string;
  propertyName: string;
  total?: number | null;
  currency?: string;
  guestName?: string | null;
  billingUrl: string;
}): string {
  const issued = Boolean(invoiceId);
  const facts: Array<[string, string]> = [
    [
      'Factura / Invoice',
      issued ? String(invoiceId) : 'En proceso / In progress',
    ],
    ['ID de reserva / Booking ID', bookingId],
    ['Propiedad / Property', propertyName],
  ];
  if (total != null) facts.push(['Total pagado / Total paid', formatMoney(total, currency)]);

  const note = issued
    ? emailBilingual('Gracias por tu pago. Tu factura electrónica ya fue emitida.', 'Thank you for your payment. Your electronic invoice has been issued.')
    : emailBilingual(
        'Gracias por tu pago. Estamos generando tu factura electrónica y te avisaremos cuando esté lista.',
        "Thank you for your payment. We're generating your electronic invoice and will let you know when it's ready.",
      );

  const content = `
    ${emailHeading(issued ? 'Factura / Invoice' : 'Recibo de pago / Payment receipt')}
    ${emailGreeting(guestName)}
    ${emailFacts(facts)}
    ${note}
    ${emailButton({ href: billingUrl, label: 'Ver mis facturas / View my invoices' })}
    <p style="margin:24px 0 0 0; color:#64748B; font-size:14px;">
      ${esc(EMAIL_BRAND.companyName)}<br/>
      NIT: ${esc(EMAIL_BRAND.companyNIT)}<br/>
      ${esc(EMAIL_BRAND.companyAddress)}
    </p>
    ${emailHelpLine()}
  `;

  return emailLayout({
    content,
    previewText: issued
      ? `Tu factura ${invoiceId} está lista · Your invoice ${invoiceId} is ready`
      : 'Recibimos tu pago · We received your payment',
  });
}
