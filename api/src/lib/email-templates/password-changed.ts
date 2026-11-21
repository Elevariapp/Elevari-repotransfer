import { firstName, siteUrl } from './brand.js';
import { renderEmailLayout, renderHighlightBox } from './layout.js';

export function buildPasswordChangedEmail(params: {
  name: string | null;
  email: string;
}): { subject: string; text: string; html: string } {
  const name = firstName(params.name);
  const url = siteUrl();
  const forgotUrl = `${url}/auth/forgot-password`;

  const subject = 'Tu contraseña fue actualizada — Elevari';
  const text = `
Hola ${name},

Confirmamos que la contraseña de tu cuenta Elevari (${params.email}) se actualizó correctamente.

Si fuiste tú, no necesitas hacer nada más.

Si no reconoces este cambio, restablece tu acceso de inmediato:
${forgotUrl}

— Elevari
`.trim();

  const html = renderEmailLayout({
    preheader: 'Confirmación de cambio de contraseña en tu cuenta Elevari.',
    eyebrow: 'Seguridad',
    title: 'Contraseña actualizada',
    bodyHtml: `
      <p style="margin:0 0 14px;">Hola <strong>${name}</strong>, tu contraseña se cambió correctamente.</p>
      <p style="margin:0;">Cuenta: <strong>${params.email}</strong></p>
      ${renderHighlightBox(`
        <strong>¿No fuiste tú?</strong><br>
        Restablece tu acceso de inmediato y revisa la actividad reciente de tu cuenta.
      `)}
    `,
    cta: { href: forgotUrl, label: 'Restablecer acceso' },
    secondaryCta: { href: `${url}/account`, label: 'Ir a mi cuenta' },
    footerNote: 'Te enviamos este aviso automáticamente por seguridad.',
  });

  return { subject, text, html };
}
