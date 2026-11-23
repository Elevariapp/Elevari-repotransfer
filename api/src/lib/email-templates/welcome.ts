import { emailBilingual, emailButton, emailGreeting, emailHeading, emailHelpLine, emailLayout } from './layout.js';

export function welcome({
  guestName,
  ctaUrl,
  isHost = false,
}: {
  guestName?: string | null;
  ctaUrl: string;
  isHost?: boolean;
}): string {
  const intro = isHost
    ? emailBilingual(
        'Tu cuenta de anfitrión está lista. Publica tu propiedad y empieza a recibir reservas.',
        'Your host account is ready. List your property and start receiving bookings.',
      )
    : emailBilingual(
        'Gracias por unirte a Elevari, tu plataforma de hospitalidad para reservar glamping, hoteles y casas vacacionales.',
        'Thank you for joining Elevari, your hospitality platform to book glamping, hotels and vacation rentals.',
      );

  const content = `
    ${emailHeading('¡Bienvenido a Elevari! / Welcome to Elevari!')}
    ${emailGreeting(guestName)}
    ${intro}
    ${emailButton({
      href: ctaUrl,
      label: isHost ? 'Ir a mi panel / Go to my dashboard' : 'Explorar propiedades / Explore properties',
    })}
    ${emailHelpLine()}
  `;

  return emailLayout({ content, previewText: 'Bienvenido a Elevari · Welcome to Elevari' });
}
