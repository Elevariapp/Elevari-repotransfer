import React from 'react';

interface ElevariBlendProps {
  size?: number | string;
  className?: string;
  fill?: string;
  title?: string;
}

const ElevariBlend: React.FC<ElevariBlendProps> = ({
  size = 48,
  className = '',
  fill = 'currentColor',
  title = 'Elevari Blend Logo',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Concept 3: Containment Curve (outer protective arc) */}
      <path
        d="M 30,100 A 70,70 0 0 1 170,100 A 70,70 0 0 1 30,100"
        fill="none"
        stroke="#0F172A"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Concept 1: Arc + Amber Point (inner arc with amber accent) */}
      <path
        d="M 50,100 A 50,50 0 0 1 150,100"
        fill="none"
        stroke={fill === 'currentColor' ? 'url(#amberGradient)' : fill}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Concept 2: Ascending Path (upward trending line) */}
      <path
        d="M 60,140 L 90,110 L 120,130 L 140,90"
        fill="none"
        stroke={fill === 'currentColor' ? 'url(#amberGradient)' : fill}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Amber Point (Concept 1 accent) */}
      <circle
        cx="140"
        cy="90"
        r="6"
        fill={fill === 'currentColor' ? '#F59E0B' : fill}
        filter="url(#glow)"
      />

      {/* Center convergence point */}
      <circle cx="100" cy="100" r="3" fill="#0F172A" />
    </svg>
  );
};

export default ElevariBlend;