// Single source of truth for support / legal contact points used across the app.
import { Alert, Linking } from 'react-native';

export const SUPPORT_WHATSAPP_NUMBER = '573232688534';
export const WEBSITE_URL = 'https://elevari.live';

export const LEGAL_URLS = {
  terms: `${WEBSITE_URL}/legal/terms`,
  privacy: `${WEBSITE_URL}/legal/privacy`,
  refund: `${WEBSITE_URL}/legal/refund`,
  accountDeletion: `${WEBSITE_URL}/legal/account-deletion`,
  contact: `${WEBSITE_URL}/legal/contact`,
} as const;

export const HOST_DASHBOARD_URL = `${WEBSITE_URL}/host`;

export const DEFAULT_SUPPORT_MESSAGE = 'Hola, necesito ayuda con la app de Elevari.';

/** Same words as the web booking card, so the concierge gets the listing address either way. */
export function propertySupportMessage(slug: string): string {
  return `Hola, tengo una pregunta sobre este espacio de Elevari: ${WEBSITE_URL}/properties/${slug}`;
}

export function buildWhatsAppUrl(text: string = DEFAULT_SUPPORT_MESSAGE): string {
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export async function openExternalUrl(url: string, failureMessage?: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No pudimos abrir el enlace', failureMessage ?? 'Inténtalo de nuevo desde tu navegador.');
  }
}

export function openWhatsAppSupport(text: string = DEFAULT_SUPPORT_MESSAGE): Promise<void> {
  return openExternalUrl(
    buildWhatsAppUrl(text),
    `Escríbenos por WhatsApp al +${SUPPORT_WHATSAPP_NUMBER} o desde elevari.live.`,
  );
}
