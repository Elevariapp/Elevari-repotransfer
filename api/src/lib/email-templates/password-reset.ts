import { EMAIL_BRAND } from './brand';
import { emailLayout } from './layout';

export function passwordReset({ resetUrl, guestName }: { resetUrl: string; guestName: string }): string {
  const content = `
    <h2 style="color:#0F172A; font-size:22px; margin-bottom:20px;">Restablecer Contraseña / Reset Password</h2>
    
    <p style="margin-bottom:16px;">Hola ${guestName},</p>
    <p style="margin-bottom:16px;">Hello ${guestName},</p>

    <p style="margin-bottom:16px;">
      Solicitaste restablecer tu contraseña. Haz clic en el botón de abajo:<br/>
      You requested a password reset. Click the button below:
    </p>

    <a href="${resetUrl}" style="display:inline-block; background-color:${EMAIL_BRAND.buttonBackground}; color:${EMAIL_BRAND.buttonText}; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:600; font-size:16px;">Restablecer Contraseña / Reset Password</a>

    <p style="margin-top:16px; color:#64748B; font-size:14px;">
      Este enlace expira en 1 hora.<br/>
      This link expires in 1 hour.
    </p>

    <p style="margin-top:24px; color:#64748B; font-size:14px;">
      ¿Necesitas ayuda? Contáctanos por WhatsApp: ${EMAIL_BRAND.whatsappPhone}<br/>
      Need help? Contact us on WhatsApp: ${EMAIL_BRAND.whatsappPhone}
    </p>
  `;

  return emailLayout({ content, previewText: 'Restablece tu contraseña' });
}