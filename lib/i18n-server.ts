import commonEs from '@/app/messages/Common/es.json';
import commonEn from '@/app/messages/Common/en.json';
import legalEs from '@/app/messages/Legal/es.json';
import legalEn from '@/app/messages/Legal/en.json';

const MESSAGES: Record<string, { Common: Record<string, unknown>; Legal: Record<string, unknown> }> = {
  es: { Common: commonEs, Legal: legalEs },
  en: { Common: commonEn, Legal: legalEn },
};

export type MessageSection = 'Common' | 'Legal';

/**
 * Server-side translation helper. Defaults to Spanish (es) for SSR since the
 * preferred language lives in localStorage (client-only). Client components
 * should use useI18n() instead so language switching works live.
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