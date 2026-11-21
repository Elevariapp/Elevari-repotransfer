import { firstName, siteUrl } from './brand.js';
import { renderEmailLayout, renderHighlightBox } from './layout.js';

export function buildWelcomeEmail(params: {
  name: string | null;
  role: 'guest' | 'host' | 'admin';
}): { subject: string; text: string; html: string } {
  const name = firstName(params.name);
  const url = siteUrl();
  const exploreUrl = params.role === 'host' ? `${url}/host` : `${url}/properties`;
  const accountUrl = `${url}/account`;
  const roleLine =
    params.role === 'host'
      ? 'Tu panel de anfitrión está listo para publicar espacios, gestionar reservas y recibir huéspedes con la elegancia que merece tu proyecto.'
      : 'Descubre domos, cabañas y refugios en la naturaleza colombiana — reserva con calma, paga con seguridad y vive la experiencia desde el primer clic.';

  const subject = 'Bienvenido a Elevari — tu próxima escapada empieza aquí';
  const text = `
Hola ${name},

¡Gracias por unirte a Elevari!

${roleLine}

Explorar: ${exploreUrl}
Tu cuenta: ${accountUrl}
Preguntas frecuentes: ${url}/legal/faq

Naturaleza. Confort. Momentos que elevan.

— Elevari
`.trim();

  const html = renderEmailLayout({
    preheader: 'Tu cuenta está lista. Explora glampings únicos en Colombia.',
    eyebrow: 'Bienvenida',
    title: `Hola, ${name}.`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Gracias por crear tu cuenta en <strong>Elevari</strong>. Ya formas parte de una comunidad que elige escapadas con alma, diseño y servicio impecable.</p>
      <p style="margin:0;">${roleLine}</p>
      ${renderHighlightBox(`
        <strong style="color:#1A1A1A;">Lo que puedes hacer ahora</strong><br><br>
        ✓ Explorar la colección de glampings<br>
        ✓ Guardar fechas y reservar en minutos<br>
        ✓ Gestionar reservas desde tu cuenta<br>
        ✓ Recibir confirmaciones y comprobantes por correo
      `)}
    `,
    cta: { href: exploreUrl, label: params.role === 'host' ? 'Ir a mi panel' : 'Explorar colección' },
    secondaryCta: { href: accountUrl, label: 'Ver mi cuenta' },
    footerNote: 'Este es un correo transaccional de tu cuenta Elevari.',
  });

  return { subject, text, html };
}
