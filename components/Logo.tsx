import Link from 'next/link';
import EleveriMark from '@/components/brand/EleveriMark';

type LogoProps = {
  compact?: boolean;
  /** Fondo oscuro (header/footer): wordmark blanco */
  onDark?: boolean;
};

export default function Logo({ compact = false, onDark = true }: LogoProps) {
  const wordColor = onDark ? 'text-white' : 'text-elevari-ink';
  const subColor = onDark ? 'text-elevari-amber-soft' : 'text-elevari-muted';

  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
      aria-label="Eleveri — inicio"
    >
      <span className="relative shrink-0 transition-transform duration-200 group-hover:scale-[1.03]">
        <EleveriMark className={compact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-9 w-9 sm:h-10 sm:w-10'} />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span
            className={`block font-display text-[1.25rem] font-semibold tracking-[-0.03em] sm:text-[1.35rem] ${wordColor}`}
          >
            eleveri
          </span>
          <span
            className={`mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.22em] sm:block ${subColor}`}
          >
            Escapes naturales
          </span>
        </span>
      )}
    </Link>
  );
}
