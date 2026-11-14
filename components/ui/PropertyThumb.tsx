import Image from 'next/image';

type Props = {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: 'h-16 w-16 rounded-xl',
  md: 'h-20 w-20 rounded-xl',
  lg: 'h-32 w-32 rounded-2xl',
};

export default function PropertyThumb({ src, alt, size = 'md', className = '' }: Props) {
  const dim = sizes[size];

  if (src) {
    return (
      <div className={`relative shrink-0 overflow-hidden bg-elevari-sand ${dim} ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={size === 'lg' ? '128px' : '80px'}
        />
      </div>
    );
  }

  return (
    <div
      className={`wana-empty-media shrink-0 ring-1 ring-wana-border/60 ${dim} ${className}`}
      aria-hidden
    >
      <span className="text-lg text-elevari-amber">✦</span>
      <span>Eleveri</span>
    </div>
  );
}
