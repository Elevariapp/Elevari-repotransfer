import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';

type Elevation = 'flat' | 'card' | 'floating';

const elevations: Record<Elevation, string> = {
  flat: 'border-elevari-border bg-elevari-surface',
  card: 'border-elevari-border bg-elevari-surface shadow-[var(--elevari-shadow-card)]',
  floating: 'border-elevari-border bg-elevari-surface shadow-[var(--elevari-shadow-floating)]',
};

export default function Card({
  children,
  elevation = 'card',
  padded = true,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  elevation?: Elevation;
  padded?: boolean;
}) {
  return (
    <div
      className={cx(
        'rounded-[var(--elevari-radius-lg)]',
        elevations[elevation],
        padded && 'p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
