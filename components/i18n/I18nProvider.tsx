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

export type I18nContextType = {
  language: string;
  setLanguage: (code: string) => void;
  t: (section: 'Common' | 'Legal', key: string) => string;
  availableLanguages: Language[];
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);

  // Restore preferred language from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && MESSAGES[stored]) {
        setLanguageState(stored);
      }
    } catch {
      // localStorage unavailable; keep default
    }
  }, []);

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