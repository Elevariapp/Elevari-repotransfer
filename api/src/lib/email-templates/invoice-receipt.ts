import { EMAIL_BRAND } from './brand.js';
import { emailLayout } from './layout.js';

export function invoiceReceipt({ invoiceId, bookingId, propertyName, total, guestName }: { invoiceId: string; bookingId: string; propertyName: string; total: string; guestName: string }): string {
  const content = `
    <h2 style="color:#0F172A; font-size:22px; margin-bottom:20px;">Factura / Invoice Receipt</h2>
    
    <p style="margin-bottom:16px;">Hola ${guestName},</p>
    <p style="margin-bottom:16px;">Hello ${guestName},</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0; color:#64748B; width:30%;">Número de Factura / Invoice #:</td>
        <td style="padding:8px 0; color:#0F172A; font-weight:600;">${invoiceId}</td>
      </tr>
      <tr>
        <td style="padding:8px 0; color:#64748B;">ID de Reserva / Booking ID:</td>
        <td style="padding:8px 0; color:#0F172A; font-weight:600;">${bookingId}</td>
      </tr>
      <tr>
        <td style="padding:8px 0; color:#64748B;">Propiedad / Property:</td>
        <td style="padding:8px 0; color:#0F172A; font-weight:600;">${propertyName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0; color:#64748B;">Total:</td>
        <td style="padding:8px 0; color:#0F172A; font-weight:600;">${total}</td>
      </tr>
    </table>

    <p style="margin-bottom:16px;">
      Gracias por tu pago. / Thank you for your payment.
    </p>

    <a href="#" style="display:inline-block; background-color:${EMAIL_BRAND.buttonBackground}; color:${EMAIL_BRAND.buttonText}; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:600; font-size:16px;">Descargar Factura / Download Invoice</a>

    <p style="margin-top:24px; color:#64748B; font-size:14px;">
      ${EMAIL_BRAND.companyName}<br/>
      NIT: ${EMAIL_BRAND.companyNIT}<br/>
      ${EMAIL_BRAND.companyAddress}
    </p>

    <p style="margin-top:16px; color:#64748B; font-size:14px;">
      ¿Necesitas ayuda? Contáctanos por WhatsApp: ${EMAIL_BRAND.whatsappPhone}<br/>
      Need help? Contact us on WhatsApp: ${EMAIL_BRAND.whatsappPhone}
    </p>
  `;

  return emailLayout({ content, previewText: `Tu factura ${invoiceId} está lista` });
}
