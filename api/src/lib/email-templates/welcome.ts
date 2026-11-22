import { EMAIL_BRAND } from './brand';
import { emailLayout } from './layout';

export function welcome({ guestName }: { guestName: string }): string {
  const content = `
    <h2 style="color:#0F172A; font-size:22px; margin-bottom:20px;">¡Bienvenido a Elevari! / Welcome to Elevari!</h2>
    
    <p style="margin-bottom:16px;">Hola ${guestName},</p>
    <p style="margin-bottom:16px;">Hello ${guestName},</p>

    <p style="margin-bottom:16px;">
      Gracias por unirte a Elevari, tu plataforma de hospitalidad para gestionar reservas de propiedades (glamping, hoteles, casas vacacionales).<br/>
      Thank you for joining Elevari, your hospitality platform for managing property reservations (glamping, hotels, vacation rentals).
    </p>

    <a href="#" style="display:inline-block; background-color:${EMAIL_BRAND.buttonBackground}; color:${EMAIL_BRAND.buttonText}; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:600; font-size:16px;">Explorar Propiedades / Explore Properties</a>

    <p style="margin-top:24px; color:#64748B; font-size:14px;">
      ¿Necesitas ayuda? Contáctanos por WhatsApp: ${EMAIL_BRAND.whatsappPhone}<br/>
      Need help? Contact us on WhatsApp: ${EMAIL_BRAND.whatsappPhone}
    </p>
  `;

  return emailLayout({ content, previewText: 'Bienvenido a Elevari' });
}