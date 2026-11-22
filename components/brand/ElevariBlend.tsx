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
  title = 'Elevari Horizon (official)',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="plateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#B45309"/>
          <stop offset="100%" stop-color="#92400E"/>
        </linearGradient>
        <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      {/* Concept 1 — ELEVARI HORIZON (official): elevation arc + horizon line + amber point */}
      <rect width="512" height="512" rx="120" fill="url(#plateGradient)"/>
      <path d="M168 344C168 232 212 152 256 152C300 152 344 232 344 344" stroke="#064E3B" strokeWidth="30" strokeLinecap="round"/>
      <path d="M190 272H322" stroke="#064E3B" strokeWidth="30" strokeLinecap="round"/>
      <path d="M200 208H312" stroke="#FEF3C7" strokeWidth="26" strokeLinecap="round" opacity="0.9"/>
      <circle cx="364" cy="168" r="20" fill={fill === 'currentColor' ? '#D97706' : fill} filter="url(#amberGlow)"/>
    </svg>
  );
};

export default ElevariBlend;