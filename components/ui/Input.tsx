import type { InputHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export default function Input({ label, hint, error, id, className, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-elevari-slate">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cx(
          'wana-input min-h-[44px]',
          error && 'border-elevari-error focus:border-elevari-error',
          className,
        )}
        {...rest}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-elevari-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-elevari-error">
          {error}
        </p>
      )}
    </div>
  );
}
