import { useId } from 'react';

interface ElevariMarkProps {
  size?: number;
  className?: string;
  /** Sin placa: solo el símbolo, para fondos de marca (header, footer, insignias). */
  plain?: boolean;
  /** Oculto a lectores de pantalla cuando el texto contiguo ya nombra la marca. */
  decorative?: boolean;
  title?: string;
}

/**
 * Elevari Horizon (concepto oficial 1): arco de elevación + línea de horizonte + punto ámbar.
 * Mismas formas que public/brand/logo-concept-1-horizon.svg.
 */
export default function ElevariMark({
  size = 32,
  className = '',
  plain = false,
  decorative = false,
  title = 'Elevari',
}: ElevariMarkProps) {
  // Ids únicos por instancia: varios símbolos en la misma página no deben compartir <defs>.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const plateId = `elevari-plate-${uid}`;
  const glowId = `elevari-glow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={plain ? '133 113 270 270' : '0 0 512 512'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...(decorative
        ? { 'aria-hidden': true, focusable: 'false' }
        : { role: 'img', 'aria-label': title })}
    >
      {decorative ? null : <title>{title}</title>}
      <defs>
        {plain ? null : (
          <linearGradient id={plateId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C2410C" />
            <stop offset="100%" stopColor="#9A340E" />
          </linearGradient>
        )}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {plain ? null : <rect width="512" height="512" rx="120" fill={`url(#${plateId})`} />}
      <path
        d="M168 344C168 232 212 152 256 152C300 152 344 232 344 344"
        stroke="#EA9A2E"
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path d="M190 272H322" stroke="#EA9A2E" strokeWidth="30" strokeLinecap="round" />
      <path
        d="M200 208H312"
        stroke="#FEF3C7"
        strokeWidth="26"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="364" cy="168" r="20" fill="#F59E0B" filter={`url(#${glowId})`} />
    </svg>
  );
}