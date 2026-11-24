'use client';

import { useEffect, useRef, useState } from 'react';

/** Copies a checksum. Falls back to selecting the text when the clipboard API is not available. */
export default function CopyChecksum({ value, targetId }: { value: string; targetId: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      const node = document.getElementById(targetId);
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setState('manual');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 3000);
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-elevari-border px-4 text-sm font-semibold text-elevari-slate transition hover:border-elevari-forest hover:text-elevari-forest focus-visible:ring-2 focus-visible:ring-elevari-forest"
      >
        {state === 'copied' ? 'Copiado' : state === 'manual' ? 'Seleccionado' : 'Copiar'}
      </button>
      <span role="status" className="sr-only">
        {state === 'copied' && 'Código copiado'}
        {state === 'manual' && 'Código seleccionado, cópialo con tu teclado'}
      </span>
    </>
  );
}
