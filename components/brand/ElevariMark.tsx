import React from 'react';

interface ElevariMarkProps {
  size?: number;
  className?: string;
  fill?: string;
  title?: string;
}

const ElevariMark: React.FC<ElevariMarkProps> = ({
  size = 32,
  className = '',
  fill = 'currentColor',
  title = 'Elevari Mark',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <path
        d="M12 2L2 12H12V2Z"
        fill={fill}
      />
      <path
        d="M12 22L22 12H12V22Z"
        fill={fill}
        opacity={0.5}
      />
    </svg>
  );
};

export default ElevariMark;