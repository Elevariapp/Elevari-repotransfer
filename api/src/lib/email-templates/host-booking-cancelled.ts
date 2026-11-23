import {
  emailBilingual,
  emailButton,
  emailFacts,
  emailGreeting,
  emailHeading,
  emailHelpLine,
  emailLayout,
} from './layout.js';
import { formatStayDate } from './format.js';

export function hostBookingCancelled({
  hostName,
  bookingId,
  propertyName,
  guestName,
  checkIn,
  checkOut,
  dashboardUrl,
}: {
  hostName?: string | null;
  bookingId: string;
  propertyName: string;
  guestName?: string | null;
  checkIn: Date | string;
  checkOut: Date | string;
  dashboardUrl: string;
}): string {
  const content = `
    ${emailHeading('Reserva cancelada / Booking cancelled')}
    ${emailGreeting(hostName)}
    ${emailBilingual(
      'Un huésped canceló su reserva. Las fechas volvieron a estar disponibles en tu calendario.',
      'A guest cancelled their booking. The dates are available again on your calendar.',
    )}
    ${emailFacts([
      ['Propiedad / Property', propertyName],
      ['Huésped / Guest', guestName?.trim() || 'Huésped / Guest'],
      ['Check-in', formatStayDate(checkIn)],
      ['Check-out', formatStayDate(checkOut)],
      ['ID de reserva / Booking ID', bookingId],
    ])}
    ${emailButton({ href: dashboardUrl, label: 'Ir a mi panel / Go to my dashboard' })}
    ${emailHelpLine()}
  `;

  return emailLayout({
    content,
    previewText: `Reserva cancelada en ${propertyName} · Booking cancelled at ${propertyName}`,
  });
}
