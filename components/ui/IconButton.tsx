import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

type Variant = 'solid' | 'ghost' | 'glass';
type Size = 'sm' | 'md';

const base =
  'inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';

const variants: Record<Variant, string> = {
  solid: 'bg-elevari-action text-white hover:bg-elevari-action-hover',
  ghost: 'border border-elevari-border bg-elevari-surface text-elevari-slate hover:border-elevari-forest',
  glass: 'bg-elevari-surface/95 text-elevari-slate shadow-[var(--elevari-shadow-soft)] hover:bg-elevari-ivory',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 w-9 text-base',
  md: 'h-11 w-11 text-lg',
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Accessible name — required because the button has no visible text. */
  label: string;
  variant?: Variant;
  size?: Size;
};

/** Icon-only control. Always renders with an accessible name (44px min at md). */
export default function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
