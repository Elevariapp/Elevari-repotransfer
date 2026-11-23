import { EMAIL_BRAND } from './brand.js';
import {
  emailBilingual,
  emailButton,
  emailGreeting,
  emailHeading,
  emailHelpLine,
  emailLayout,
  esc,
} from './layout.js';

export function passwordReset({
  resetUrl,
  guestName,
}: {
  resetUrl: string;
  guestName?: string | null;
}): string {
  const content = `
    ${emailHeading('Restablecer contraseña / Reset password')}
    ${emailGreeting(guestName)}
    ${emailBilingual(
      'Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón:',
      'We received a request to reset your password. Click the button below:',
    )}
    ${emailButton({ href: resetUrl, label: 'Restablecer contraseña / Reset password' })}
    <div style="height:16px; line-height:16px;">&nbsp;</div>
    ${emailBilingual(
      'Este enlace expira en 1 hora y solo puede usarse una vez.',
      'This link expires in 1 hour and can only be used once.',
      { muted: true },
    )}
    <p style="margin:0 0 16px 0; color:#64748B; font-size:13px; word-break:break-all;">
      Si el botón no funciona, copia y pega este enlace / If the button doesn't work, copy and paste this link:<br/>
      <a href="${esc(resetUrl)}" style="color:${EMAIL_BRAND.linkColor};">${esc(resetUrl)}</a>
    </p>
    ${emailBilingual(
      'Si no solicitaste este cambio, ignora este correo: tu contraseña no cambiará.',
      "If you didn't request this, ignore this email: your password won't change.",
      { muted: true },
    )}
    ${emailHelpLine()}
  `;

  return emailLayout({ content, previewText: 'Restablece tu contraseña · Reset your password' });
}
