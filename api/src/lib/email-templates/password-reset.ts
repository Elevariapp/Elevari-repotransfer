import { firstName, siteUrl } from './brand.js';
import { renderEmailLayout, renderHighlightBox } from './layout.js';

export function buildPasswordResetEmail(params: {
  name: string | null;
  resetUrl: string;
}): { subject: string; text: string; html: string } {
  const name = firstName(params.name);
  const url = siteUrl();

  const subject = 'Restablece tu contraseña — Elevari';
  const text = `
Hola ${name},

Recibimos una solicitud para restablecer la contraseña de tu cuenta Elevari.

Abre este enlace (válido 1 hora):
${params.resetUrl}

Si no solicitaste este cambio, ignora este correo. Tu contraseña seguirá igual.

Ayuda: ${url}/legal/faq

— Elevari
`.trim();

  const html = renderEmailLayout({
    preheader: 'Enlace seguro para restablecer tu contraseña. Válido 1 hora.',
    eyebrow: 'Seguridad',
    title: 'Restablece tu contraseña',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hola <strong>${name}</strong>, recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
      <p style="margin:0;">Pulsa el botón para crear una nueva contraseña. Por tu seguridad, el enlace expira en <strong>1 hora</strong>.</p>
      ${renderHighlightBox(`
        Si <strong>no</strong> fuiste tú, puedes ignorar este mensaje. Nadie podrá acceder sin el enlace.
      `)}
    `,
    cta: { href: params.resetUrl, label: 'Restablecer contraseña' },
    secondaryCta: { href: `${url}/auth/login`, label: 'Volver a iniciar sesión' },
    footerNote: 'Por seguridad, nunca compartas este enlace con otras personas.',
  });

  return { subject, text, html };
}
