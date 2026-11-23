'use client';

import { useEffect, useState } from 'react';
import { whatsappContext, whatsappUrl } from '@/lib/whatsapp';

const DISMISSED_UNTIL_KEY = 'elevari:wa-dismissed-until';
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function isDismissed(): boolean {
  try {
    return Number(localStorage.getItem(DISMISSED_UNTIL_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

/** Small, dismissible WhatsApp entry point; the page decides what the prefilled message says. */
export default function WhatsAppLauncher({ pathname }: { pathname: string }) {
  // Starts hidden so the server and the first client render match; it is fixed-position, so showing it late shifts nothing.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isDismissed());
  }, []);

  if (!visible) return null;

  const { label, message } = whatsappContext(pathname);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_FOR_MS));
    } catch {
      // Without storage it only stays hidden until the next page load.
    }
    setVisible(false);
  };

  return (
    <div className="group relative">
      <a
        href={whatsappUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} (se abre WhatsApp)`}
        className="flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-3.5 text-white shadow-[0_6px_18px_rgba(22,34,44,0.28)] outline-none transition hover:bg-[#1ebe5a] focus-visible:ring-2 focus-visible:ring-[#128c4a] focus-visible:ring-offset-2"
      >
        <svg width="24" height="24" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
          <path d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.3.6 4.54 1.74 6.52L3 29l6.65-1.74A12.96 12.96 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3zm0 23.8c-1.95 0-3.86-.53-5.53-1.52l-.4-.23-3.95 1.03 1.05-3.85-.26-.4A10.76 10.76 0 0 1 5.2 16c0-5.96 4.88-10.8 10.84-10.8 5.97 0 10.8 4.84 10.8 10.8 0 5.95-4.83 10.8-10.8 10.8zm5.93-8.08c-.32-.16-1.92-.95-2.22-1.06-.3-.1-.52-.16-.73.17-.22.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.33-.16-1.37-.5-2.6-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.15-.14.33-.38.5-.57.16-.19.21-.32.32-.54.1-.21.05-.4-.03-.57-.08-.16-.73-1.76-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.7 0 1.6 1.16 3.14 1.32 3.36.16.21 2.28 3.48 5.53 4.88.77.33 1.38.53 1.85.68.78.25 1.49.21 2.05.13.62-.09 1.92-.78 2.19-1.54.27-.75.27-1.4.19-1.54-.08-.13-.3-.21-.62-.37z" />
        </svg>
        <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-200 motion-reduce:transition-none sm:inline sm:group-focus-within:max-w-[14rem] sm:group-focus-within:opacity-100 sm:group-hover:max-w-[14rem] sm:group-hover:opacity-100">
          {label}
        </span>
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Ocultar el botón de WhatsApp"
        className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-elevari-border bg-elevari-surface text-xs leading-none text-elevari-muted shadow-sm transition hover:text-elevari-error focus-visible:ring-2 focus-visible:ring-elevari-forest"
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  );
}
