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
import { formatStayDate } from './format.js';

export function checkInReminder({
  bookingId,
  propertyName,
  checkIn,
  guestName,
  bookingUrl,
  preferencesUrl,
}: {
  bookingId: string;
  propertyName: string;
  checkIn: Date | string;
  guestName?: string | null;
  bookingUrl: string;
  preferencesUrl?: string;
}): string {
  const content = `
    ${emailHeading('Recordatorio de check-in / Check-in reminder')}
    ${emailGreeting(guestName)}
    ${emailBilingual(
      'Tu check-in es mañana. ¡Te esperamos!',
      "Your check-in is tomorrow. We can't wait to welcome you!",
    )}
    ${emailFacts([
      ['ID de reserva / Booking ID', bookingId],
      ['Propiedad / Property', propertyName],
      ['Check-in', formatStayDate(checkIn)],
    ])}
    ${emailButton({ href: bookingUrl, label: 'Ver mi reserva / View my booking' })}
    ${emailHelpLine()}
    ${emailPreferencesLine({
      url: preferencesUrl,
      reasonEs: 'tienes activados los recordatorios de check-in',
      reasonEn: 'check-in reminders are switched on',
    })}
  `;

  const stay = previewName(propertyName);
  return emailLayout({
    content,
    previewText: `Tu check-in en ${stay} es mañana · Your check-in at ${stay} is tomorrow`,
  });
}
