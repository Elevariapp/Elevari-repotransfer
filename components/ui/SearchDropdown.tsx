'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
};

export default function SearchDropdown({
  open,
  onClose,
  children,
  className = '',
  align = 'left',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  const alignClass =
    align === 'right'
      ? 'right-0'
      : align === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'left-0';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`elevari-dropdown-panel absolute top-[calc(100%+10px)] z-[120] ${alignClass} ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
