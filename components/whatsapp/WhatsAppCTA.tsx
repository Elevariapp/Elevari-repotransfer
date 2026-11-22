'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const WHATSAPP_NUMBER = '573232688534';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function WhatsAppCTA() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      dismissed = Boolean(localStorage.getItem('elevari:wa-dismissed'));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed) return null;

  return (
    <Link
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-elevari-border bg-elevari-surface px-3.5 py-2.5 text-sm font-semibold text-elevari-slate shadow-elevari-lg transition hover:bg-elevari-ivory"
      aria-label="Escribenos por WhatsApp"
    >
      <span className="text-elevari-amber" aria-hidden>
        ✆
      </span>
      <span className="hidden sm:inline">WhatsApp +57 323 268 8534</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            localStorage.setItem('elevari:wa-dismissed', '1');
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
        className="ml-2 flex h-5 w-5 items-center justify-center rounded-full border border-elevari-border bg-elevari-surface text-elevari-muted hover:text-elevari-error transition"
        aria-label="Cerrar"
      >
        <span className="text-[10px]">×</span>
      </button>
    </Link>
  );
}