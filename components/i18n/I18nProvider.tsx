'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';

import commonEs from '@/app/messages/Common/es.json';
import commonEn from '@/app/messages/Common/en.json';
import legalEs from '@/app/messages/Legal/es.json';
import legalEn from '@/app/messages/Legal/en.json';

type Language = { code: string; label: string; native: string };

export const LANGUAGES: Language[] = [
  { code: 'es', label: 'Español', native: 'Español' },
  { code: 'en', label: 'English', native: 'English' },
];

type Messages = {
  Common: Record<string, unknown>;
  Legal: Record<string, unknown>;
};

const MESSAGES: Record<string, Messages> = {
  es: { Common: commonEs, Legal: legalEs },
  en: { Common: commonEn, Legal: legalEn },
};

const DEFAULT_LANGUAGE = 'es';
const STORAGE_KEY = 'elevari-language';
const COOKIE_KEY = 'elevari-language';

export type I18nContextType = {
  language: string;
  setLanguage: (code: string) => void;
  t: (section: 'Common' | 'Legal', key: string) => string;
  availableLanguages: Language[];
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, initialLanguage }: { children: ReactNode; initialLanguage?: string }) {
  const [language, setLanguageState] = useState<string>(initialLanguage ?? DEFAULT_LANGUAGE);

  // Restore preferred language from cookie (SSR) then localStorage (client) on mount,
  // only when no initialLanguage was provided by the server.
  useEffect(() => {
    if (initialLanguage) return;
    try {
      const cookieMatch = document.cookie.match(
        new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`)
      );
      if (cookieMatch && MESSAGES[cookieMatch[1]]) {
        setLanguageState(cookieMatch[1]);
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && MESSAGES[stored]) {
          setLanguageState(stored);
        }
      }
    } catch {
      // localStorage/cookie unavailable; keep default
    }
  }, [initialLanguage]);

  // Persist language and update <html lang> whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // localStorage unavailable
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((code: string) => {
    if (!MESSAGES[code]) return;
    setLanguageState(code);
    // Persist to cookie for SSR so the server knows the user's language
    try {
      document.cookie = `${COOKIE_KEY}=${code}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // cookie unavailable
    }
  }, []);

  const t = useCallback((section: 'Common' | 'Legal', key: string): string => {
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
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    availableLanguages: LANGUAGES,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}