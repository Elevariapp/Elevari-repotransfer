'use client';

import { useState } from 'react';

interface AccordionProps {
  title: string;
  content: string;
}

export default function Accordion({ title, content }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="elevari-card overflow-hidden transition hover:shadow-wana">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-elevari-slate min-h-[52px]"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-elevari-border bg-elevari-ivory text-elevari-forest transition ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-elevari-border px-5 pb-5 pt-3 text-sm leading-relaxed text-elevari-muted">
          {content}
        </div>
      )}
    </div>
  );
}
