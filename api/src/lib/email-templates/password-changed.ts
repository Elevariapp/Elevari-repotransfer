import { EMAIL_BRAND } from './brand';
import { emailLayout } from './layout';

export function passwordChanged({ guestName }: { guestName: string }): string {
  const content = `
    <h2 style="color:#0F172A; font-size:22px; margin-bottom:20px;">Contraseña Cambiada / Password Changed</h2>
    
    <p style="margin-bottom:16px;">Hola ${guestName},</p>
    <p style="margin-bottom:16px;">Hello ${guestName},</p>

    <p style="margin-bottom:16px;">
      Tu contraseña ha sido cambiada exitosamente.<br/>
      Your password has been successfully changed.
    </p>

    <p style="color:#EF4444; font-size:14px;">
      Si no realizaste este cambio, contáctanos inmediatamente.<br/>
      If you did not make this change, contact us immediately.
    </p>

    <p style="margin-top:24px; color:#64748B; font-size:14px;">
      ¿Necesitas ayuda? Contáctanos por WhatsApp: ${EMAIL_BRAND.whatsappPhone}<br/>
      Need help? Contact us on WhatsApp: ${EMAIL_BRAND.whatsappPhone}
    </p>
  `;

  return emailLayout({ content, previewText: 'Tu contraseña ha sido cambiada' });
}