import {
  emailBilingual,
  emailButton,
  emailFacts,
  emailGreeting,
  emailHeading,
  emailHelpLine,
  emailLayout,
  emailPreferencesLine,
  previewName,
} from './layout.js';
import { formatMoney, formatStayDate } from './format.js';

export function hostNewBooking({
  hostName,
  bookingId,
  propertyName,
  guestName,
  checkIn,
  checkOut,
  guests,
  hostReceives,
  currency = 'COP',
  dashboardUrl,
  preferencesUrl,
}: {
  hostName?: string | null;
  bookingId: string;
  propertyName: string;
  guestName?: string | null;
  checkIn: Date | string;
  checkOut: Date | string;
  guests?: number | null;
  hostReceives?: number | null;
  currency?: string;
  dashboardUrl: string;
  preferencesUrl?: string;
}): string {
  const facts: Array<[string, string]> = [
    ['Propiedad / Property', propertyName],
    ['Huésped / Guest', guestName?.trim() || 'Huésped / Guest'],
    ['Check-in', formatStayDate(checkIn)],
    ['Check-out', formatStayDate(checkOut)],
  ];
  if (guests) facts.push(['Huéspedes / Guests', String(guests)]);
  if (hostReceives != null) facts.push(['Ingreso estimado / Estimated payout', formatMoney(hostReceives, currency)]);
  facts.push(['ID de reserva / Booking ID', bookingId]);

  const content = `
    ${emailHeading('Nueva reserva confirmada / New booking confirmed')}
    ${emailGreeting(hostName)}
    ${emailBilingual(
      'Recibiste una nueva reserva pagada. Las fechas ya están bloqueadas en tu calendario.',
      'You received a new paid booking. The dates are already blocked on your calendar.',
    )}
    ${emailFacts(facts)}
    ${emailButton({ href: dashboardUrl, label: 'Ir a mi panel / Go to my dashboard' })}
    ${emailHelpLine()}
    ${emailPreferencesLine({
      url: preferencesUrl,
      reasonEs: 'tienes activadas las alertas de reservas de tus alojamientos',
      reasonEn: 'booking alerts for your stays are switched on',
    })}
  `;

  const stay = previewName(propertyName);
  return emailLayout({
    content,
    previewText: `Nueva reserva en ${stay} · New booking at ${stay}`,
  });
}
