'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Contrast = 'normal' | 'high';

const STORAGE_THEME = 'elevari-theme';
const STORAGE_CONTRAST = 'elevari-contrast';

export function applyTheme(theme: Theme, contrast: Contrast) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  if (contrast === 'high') root.dataset.contrast = 'high';
  else delete root.dataset.contrast;
  root.style.colorScheme = theme;
}

/** Inline script: applies the saved theme before first paint (no flash). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_THEME}');var c=localStorage.getItem('${STORAGE_CONTRAST}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;if(c==='high'){d.dataset.contrast='high';}}catch(e){}})();`;

const options: { id: string; label: string; icon: string }[] = [
  { id: 'light', label: 'Tema claro', icon: '☀' },
  { id: 'dark', label: 'Tema oscuro', icon: '☾' },
  { id: 'high', label: 'Alto contraste', icon: '◐' },
];

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<string>('light');

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = (localStorage.getItem(STORAGE_THEME) as Theme | null) ?? (root.dataset.theme as Theme) ?? 'light';
    const savedContrast = (localStorage.getItem(STORAGE_CONTRAST) as Contrast | null) ?? (root.dataset.contrast === 'high' ? 'high' : 'normal');
    setMode(savedContrast === 'high' ? 'high' : savedTheme);
  }, []);

  const select = (id: string) => {
    const theme: Theme = id === 'dark' ? 'dark' : 'light';
    const contrast: Contrast = id === 'high' ? 'high' : 'normal';
    applyTheme(theme, contrast);
    localStorage.setItem(STORAGE_THEME, theme);
    localStorage.setItem(STORAGE_CONTRAST, contrast);
    setMode(id);
  };

  return (
    <div
      role="group"
      aria-label="Apariencia"
      className={`inline-flex items-center gap-0.5 rounded-full border border-white/25 bg-white/10 p-0.5 backdrop-blur-sm ${className}`}
    >
      {options.map((option) => {
        const active = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => select(option.id)}
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
              active ? 'bg-white text-elevari-forest-deep' : 'text-white/80 hover:bg-white/15 hover:text-white'
            }`}
          >
            <span aria-hidden>{option.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
