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

export function bookingCancellation({
  bookingId,
  propertyName,
  guestName,
  reason,
  refundAmount,
  refundEligible,
  expiredUnpaid = false,
  currency = 'COP',
  exploreUrl,
}: {
  bookingId: string;
  propertyName: string;
  guestName?: string | null;
  reason?: string;
  refundAmount?: number;
  refundEligible?: boolean;
  expiredUnpaid?: boolean;
  currency?: string;
  exploreUrl: string;
}): string {
  const headline = expiredUnpaid
    ? emailBilingual(
        'Tu reserva expiró porque el pago no se completó a tiempo. Las fechas quedaron liberadas y no se te cobró nada.',
        "Your booking expired because payment wasn't completed in time. The dates were released and you were not charged.",
      )
    : emailBilingual('Tu reserva fue cancelada.', 'Your booking was cancelled.');

  let refundBlock = '';
  if (!expiredUnpaid) {
    if (refundAmount && refundAmount > 0) {
      refundBlock = emailBilingual(
        `Reembolso: ${formatMoney(refundAmount, currency)}. Se devuelve a tu método de pago original; el tiempo de acreditación depende de tu banco.`,
        `Refund: ${formatMoney(refundAmount, currency)}. It goes back to your original payment method; timing depends on your bank.`,
      );
    } else if (refundEligible === false) {
      refundBlock = emailBilingual(
        'Según la política de cancelación, esta reserva no tiene reembolso.',
        'Under the cancellation policy, this booking is not refundable.',
      );
    }
  }

  const reasonBlock =
    reason && !expiredUnpaid
      ? `<p style="margin:0 0 16px 0; color:#64748B; font-size:14px;">Detalle / Details: ${esc(reason)}</p>`
      : '';

  const content = `
    ${emailHeading(expiredUnpaid ? 'Reserva expirada / Booking expired' : 'Reserva cancelada / Booking cancelled')}
    ${emailGreeting(guestName)}
    ${emailFacts([
      ['ID de reserva / Booking ID', bookingId],
      ['Propiedad / Property', propertyName],
    ])}
    ${headline}
    ${refundBlock}
    ${reasonBlock}
    ${emailButton({ href: exploreUrl, label: 'Nueva reserva / New booking' })}
    ${emailHelpLine()}
  `;

  return emailLayout({
    content,
    previewText: expiredUnpaid
      ? 'Tu reserva expiró sin pago · Your booking expired unpaid'
      : 'Tu reserva fue cancelada · Your booking was cancelled',
  });
}
