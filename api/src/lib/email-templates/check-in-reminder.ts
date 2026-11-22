import { EMAIL_BRAND } from './brand';
import { emailLayout } from './layout';

export function checkInReminder({ bookingId, propertyName, checkIn, guestName }: { bookingId: string; propertyName: string; checkIn: string; guestName: string }): string {
  const content = `
    <h2 style="color:#0F172A; font-size:22px; margin-bottom:20px;">Recordatorio de Check-in / Check-in Reminder</h2>
    
    <p style="margin-bottom:16px;">Hola ${guestName},</p>
    <p style="margin-bottom:16px;">Hello ${guestName},</p>

    <p style="margin-bottom:16px;">
      Tu check-in es mañana. ¡Te esperamos!<br/>
      Your check-in is tomorrow. We can't wait to welcome you!
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0; color:#64748B; width:30%;">ID de Reserva / Booking ID:</td>
        <td style="padding:8px 0; color:#0F172A; font-weight:600;">${bookingId}</td>
      </tr>
      <tr>
        <td style="padding:8px 0; color:#64748B;">Propiedad / Property:</td>
        <td style="padding:8px 0; color:#0F172A; font-weight:600;">${propertyName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0; color:#64748B;">Check-in:</td>
        <td style="padding:8px 0; color:#0F172A; font-weight:600;">${checkIn}</td>
      </tr>
    </table>

    <a href="#" style="display:inline-block; background-color:${EMAIL_BRAND.buttonBackground}; color:${EMAIL_BRAND.buttonText}; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:600; font-size:16px;">Detalles de Check-in / Check-in Details</a>

    <p style="margin-top:24px; color:#64748B; font-size:14px;">
      ¿Necesitas ayuda? Contáctanos por WhatsApp: ${EMAIL_BRAND.whatsappPhone}<br/>
      Need help? Contact us on WhatsApp: ${EMAIL_BRAND.whatsappPhone}
    </p>
  `;

  return emailLayout({ content, previewText: `Recordatorio: tu check-in es mañana` });
}