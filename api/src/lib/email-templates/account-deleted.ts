import {
  emailBilingual,
  emailGreeting,
  emailHeading,
  emailLayout,
} from './layout.js';
import { EMAIL_BRAND } from './brand.js';

export function accountDeleted({ guestName }: { guestName?: string | null }): string {
  const content = `
    ${emailHeading('Tu cuenta fue eliminada / Your account was deleted')}
    ${emailGreeting(guestName)}
    ${emailBilingual(
      'Eliminamos tu cuenta de Elevari y tus datos personales (nombre, teléfono y contraseña). Cerramos todas tus sesiones.',
      'We deleted your Elevari account and your personal data (name, phone and password). All your sessions were closed.',
    )}
    ${emailBilingual(
      'Por obligaciones contables y tributarias conservamos de forma anonimizada el registro de reservas, pagos y facturas.',
      'To meet accounting and tax obligations we keep booking, payment and invoice records in anonymized form.',
      { muted: true },
    )}
    <p style="margin:0 0 16px 0; color:#B3261E; font-size:14px;">
      Si no fuiste tú, escríbenos de inmediato a ${EMAIL_BRAND.supportEmail}.<br/>
      If this wasn't you, write to us right away at ${EMAIL_BRAND.supportEmail}.
    </p>
    ${emailBilingual(
      'Gracias por haber sido parte de Elevari. Siempre serás bienvenido de vuelta.',
      'Thank you for being part of Elevari. You will always be welcome back.',
      { muted: true },
    )}
  `;

  return emailLayout({ content, previewText: 'Tu cuenta de Elevari fue eliminada · Your Elevari account was deleted' });
}
