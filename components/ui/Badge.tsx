import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'accent' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'border-elevari-border bg-elevari-surface text-elevari-slate',
  success: 'border-elevari-success/25 bg-elevari-success-soft text-elevari-success',
  warning: 'border-elevari-warning/25 bg-elevari-warning-soft text-elevari-warning',
  error: 'border-elevari-error/25 bg-elevari-error-soft text-elevari-error',
  accent: 'border-elevari-amber/40 bg-elevari-amber-soft text-elevari-amber-ink',
  brand: 'border-elevari-forest/25 bg-elevari-fresh-soft text-elevari-forest-deep',
};

export default function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
