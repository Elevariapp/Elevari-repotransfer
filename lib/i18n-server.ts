import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import commonEs from '@/app/messages/Common/es.json';
import commonEn from '@/app/messages/Common/en.json';
import legalEs from '@/app/messages/Legal/es.json';
import legalEn from '@/app/messages/Legal/en.json';
import { resolveMessage } from '@/lib/i18n-resolve';

const MESSAGES: Record<string, { Common: Record<string, unknown>; Legal: Record<string, unknown> }> = {
  es: { Common: commonEs, Legal: legalEs },
  en: { Common: commonEn, Legal: legalEn },
};

export type MessageSection = 'Common' | 'Legal';

const LANGUAGE_COOKIE = 'elevari-language';
const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

/**
 * Reads the user's preferred language from the `elevari-language` cookie,
 * then falls back to the `Accept-Language` header, and finally to Spanish (es).
 */
export async function getServerLanguage(): Promise<string> {
  // 1) Cookie takes precedence
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get(LANGUAGE_COOKIE)?.value;
    if (lang === 'es' || lang === 'en') return lang;
  } catch {
    // cookies() unavailable outside of server rendering; continue to header fallback
  }

  // 2) Accept-Language header
  try {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language');
    if (acceptLanguage) {
      const preferred = acceptLanguage
        .split(',')
        .map((part) => part.split(';')[0].trim().toLowerCase())
        .find((tag) => SUPPORTED_LANGUAGES.includes(tag as 'es' | 'en') || tag.startsWith('es') || tag.startsWith('en'));
      if (preferred) {
        return preferred.startsWith('en') ? 'en' : 'es';
      }
    }
  } catch {
    // headers() unavailable outside of server rendering; keep default
  }

  // 3) Default to Spanish
  return 'es';
}

/**
 * Server-side translation helper. Accepts an explicit language code (typically
 * from getServerLanguage()) and defaults to Spanish (es) when omitted.
 * Client components should use useI18n() instead so language switching works live.
 */
export function tServer(section: MessageSection, key: string, language = 'es'): string {
  const messages = MESSAGES[language]?.[section];
  if (!messages) return key;
  return resolveMessage(messages, section, key) ?? key;
}