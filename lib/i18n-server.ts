import { cookies } from 'next/headers';
import commonEs from '@/app/messages/Common/es.json';
import commonEn from '@/app/messages/Common/en.json';
import legalEs from '@/app/messages/Legal/es.json';
import legalEn from '@/app/messages/Legal/en.json';

const MESSAGES: Record<string, { Common: Record<string, unknown>; Legal: Record<string, unknown> }> = {
  es: { Common: commonEs, Legal: legalEs },
  en: { Common: commonEn, Legal: legalEn },
};

export type MessageSection = 'Common' | 'Legal';

const LANGUAGE_COOKIE = 'elevari-language';

/**
 * Reads the user's preferred language from the `elevari-language` cookie.
 * Falls back to Spanish (es) when no cookie is present or the value is invalid.
 */
export async function getServerLanguage(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get(LANGUAGE_COOKIE)?.value;
    if (lang === 'es' || lang === 'en') return lang;
  } catch {
    // cookies() unavailable outside of server rendering; keep default
  }
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

  const parts = key.split('.');
  let value: unknown = messages;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof value === 'string' ? value : key;
}