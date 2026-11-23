import {
  emailBilingual,
  emailButton,
  emailGreeting,
  emailHeading,
  emailHelpLine,
  emailLayout,
} from './layout.js';
import { formatDateTime } from './format.js';

export function passwordChanged({
  guestName,
  changedAt,
  secureUrl,
}: {
  guestName?: string | null;
  changedAt: Date;
  secureUrl: string;
}): string {
  const when = formatDateTime(changedAt);
  const content = `
    ${emailHeading('Contraseña cambiada / Password changed')}
    ${emailGreeting(guestName)}
    ${emailBilingual(
      `Tu contraseña se cambió correctamente el ${when.es}. Por seguridad cerramos tus otras sesiones.`,
      `Your password was successfully changed on ${when.en}. For your security we signed you out of your other sessions.`,
    )}
    <p style="margin:0 0 16px 0; color:#B3261E; font-size:14px;">
      Si no fuiste tú, restablece tu contraseña ahora y escríbenos de inmediato.<br/>
      If this wasn't you, reset your password now and contact us immediately.
    </p>
    ${emailButton({ href: secureUrl, label: 'Asegurar mi cuenta / Secure my account' })}
    ${emailHelpLine()}
  `;

  return emailLayout({ content, previewText: 'Tu contraseña fue cambiada · Your password was changed' });
}
