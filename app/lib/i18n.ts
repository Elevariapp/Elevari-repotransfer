import { getFixedT } from 'next-intl/server';

export const locales = ['es', 'pt', 'fr'] as const;
export const defaultLocale = 'es' as const;

export type Locale = (typeof locales)[number];

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split('/')[1];
  if (locales.includes(segment as Locale)) {
    return segment as Locale;
  }
  return defaultLocale;
}

export async function getTranslations(locale: Locale) {
  const t = await getFixedT({ locale, namespace: 'Common' });
  return t;
}