import { siteUrl } from '@/lib/site-url';

const DEFAULT_NUMBER = '573232688534';

/** The WhatsApp Business number the concierge bot answers on. Digits only, as wa.me requires. */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '') || DEFAULT_NUMBER;

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export interface WhatsAppContext {
  /** Accessible name and tooltip for the WhatsApp link. */
  label: string;
  /** Prefilled message. Plain Spanish words so the concierge routes it to the right topic. */
  message: string;
}

/** What to offer, and what to say, depending on where the visitor is. */
export function whatsappContext(pathname: string): WhatsAppContext {
  if (/^\/properties\/[^/]+$/.test(pathname)) {
    return {
      label: 'Preguntar por este espacio',
      message: `Hola, tengo una pregunta sobre este espacio de Elevari: ${siteUrl(pathname)}`,
    };
  }
  const confirmed = /^\/checkout\/([^/]+)\/success\/?$/.exec(pathname);
  if (confirmed) {
    return {
      label: 'Ayuda con mi reserva',
      message: `Hola, necesito ayuda con mi reserva ${confirmed[1]} en Elevari.`,
    };
  }
  const checkout = /^\/checkout\/([^/]+)\/?$/.exec(pathname);
  if (checkout) {
    return {
      label: 'Ayuda con mi pago',
      message: `Hola, necesito ayuda con el pago de mi reserva ${checkout[1]} en Elevari.`,
    };
  }
  if (pathname.startsWith('/checkout')) {
    return { label: 'Ayuda con mi pago', message: 'Hola, necesito ayuda con el pago de mi reserva en Elevari.' };
  }
  if (pathname.startsWith('/legal/refund')) {
    return {
      label: 'Preguntar por reembolsos',
      message: 'Hola, tengo una pregunta sobre reembolsos y cancelaciones en Elevari.',
    };
  }
  if (pathname.startsWith('/account')) {
    return { label: 'Ayuda con mi cuenta', message: 'Hola, necesito ayuda con mi cuenta en Elevari.' };
  }
  if (pathname.startsWith('/become-host')) {
    return {
      label: 'Hablar sobre ser anfitrión',
      message: 'Hola, quiero ser anfitrión y publicar mi espacio en Elevari.',
    };
  }
  if (pathname === '/host' || pathname.startsWith('/host/')) {
    return { label: 'Soporte para anfitriones', message: 'Hola, soy anfitrión en Elevari y necesito ayuda con mi panel.' };
  }
  return { label: 'Escríbenos por WhatsApp', message: 'Hola, quiero información sobre Elevari.' };
}
