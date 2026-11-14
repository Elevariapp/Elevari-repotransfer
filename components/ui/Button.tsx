import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cx } from '@/lib/cx';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-elevari-forest text-white shadow-[0_6px_18px_rgba(47,107,79,0.26)] hover:bg-elevari-forest-deep',
  accent: 'bg-elevari-amber text-elevari-slate shadow-[0_6px_18px_rgba(233,168,32,0.28)] hover:bg-[#d9971a]',
  secondary:
    'border border-elevari-border bg-elevari-surface text-elevari-slate hover:border-elevari-forest hover:bg-elevari-ivory',
  ghost: 'bg-transparent text-elevari-forest hover:bg-elevari-fresh-soft',
};

/** All sizes keep a 44px minimum touch target (WCAG 2.2 AA / mobile first). */
const sizes: Record<Size, string> = {
  sm: 'min-h-[44px] px-4 py-2 text-sm',
  md: 'min-h-[48px] px-6 py-3 text-sm',
  lg: 'min-h-[52px] px-8 py-3.5 text-base',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ariaLabel,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
    >
      {children}
    </Link>
  );
}
