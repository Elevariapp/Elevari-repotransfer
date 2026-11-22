import React from 'react';
import ElevariBlend from './ElevariBlend';

interface LogoProps {
  size?: number;
  className?: string;
  fill?: string;
  title?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = 48,
  className = '',
  fill = 'currentColor',
  title = 'Elevari',
}) => {
  return (
    <ElevariBlend
      size={size}
      className={className}
      fill={fill}
      title={title}
    />
  );
};

export default Logo;