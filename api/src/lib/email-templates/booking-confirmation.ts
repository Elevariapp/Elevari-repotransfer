import {
  emailBilingual,
  emailButton,
  emailFacts,
  emailGreeting,
  emailHeading,
  emailHelpLine,
  emailLayout,
  previewName,
} from './layout.js';
import { formatMoney, formatStayDate } from './format.js';

export function bookingConfirmation({
  bookingId,
  propertyName,
  checkIn,
  checkOut,
  guests,
  total,
  currency = 'COP',
  guestName,
  bookingUrl,
}: {
  bookingId: string;
  propertyName: string;
  checkIn: Date | string;
  checkOut: Date | string;
  guests?: number | null;
  total?: number | null;
  currency?: string;
  guestName?: string | null;
  bookingUrl: string;
}): string {
  const facts: Array<[string, string]> = [
    ['ID de reserva / Booking ID', bookingId],
    ['Propiedad / Property', propertyName],
    ['Check-in', formatStayDate(checkIn)],
    ['Check-out', formatStayDate(checkOut)],
  ];
  if (guests) facts.push(['Huéspedes / Guests', String(guests)]);
  if (total != null) facts.push(['Total pagado / Total paid', formatMoney(total, currency)]);

  const content = `
    ${emailHeading('¡Reserva confirmada! / Booking confirmed!')}
    ${emailGreeting(guestName)}
    ${emailBilingual(
      'Tu pago fue recibido y tu reserva está confirmada. ¡Prepárate para disfrutar!',
      'Your payment was received and your booking is confirmed. Get ready to enjoy!',
    )}
    ${emailFacts(facts)}
    ${emailButton({ href: bookingUrl, label: 'Ver mis reservas / View my bookings' })}
    ${emailHelpLine()}
  `;

  const stay = previewName(propertyName);
  return emailLayout({
    content,
    previewText: `Reserva confirmada en ${stay} · Booking confirmed at ${stay}`,
  });
}
