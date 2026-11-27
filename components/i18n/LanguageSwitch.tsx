'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { useI18n } from '@/components/i18n/useI18n';

export default function LanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage, availableLanguages, t } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const current = availableLanguages.find((l) => l.code === language) ?? availableLanguages[0];

  // Close the menu when the user clicks anywhere else, so it never stays stuck open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const choose = (code: string) => {
    setLanguage(code);
    setOpen(false);
    // Server Components (home, catalog, property pages) translate during SSR from the
    // `elevari-language` cookie. Without a refresh the header would switch language while
    // the page content stayed in the previous language until a manual reload.
    startTransition(() => router.refresh());
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} data-testid="language-switch">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('Common', 'common.languageSwitch')}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-language={language}
        className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elevari-amber-soft"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
          <path d="M2 12h20M12 2v20" />
        </svg>
        <span className="text-xs font-medium hidden sm:inline">{current.native}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('Common', 'common.selectLanguage')}
          className="absolute right-0 z-50 mt-2 w-32 rounded-xl border border-white/20 bg-elevari-slate/95 p-1 text-white shadow-lg backdrop-blur"
          onMouseLeave={() => setOpen(false)}
        >
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={lang.code === language}
              onClick={() => choose(lang.code)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition ${
                lang.code === language ? 'bg-white/20' : 'hover:bg-white/20'
              }`}
            >
              <span className="font-medium">{lang.native}</span>
              {lang.code === language && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
