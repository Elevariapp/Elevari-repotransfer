import Image from 'next/image';

type Props = {
  image: string;
  alt?: string;
  overlay?: 'forest' | 'dark' | 'light';
  children: React.ReactNode;
  className?: string;
};

export default function CinematicBand({
  image,
  alt = '',
  overlay = 'forest',
  children,
  className = '',
}: Props) {
  const overlayClass =
    overlay === 'dark'
      ? 'bg-elevari-ink/55'
      : overlay === 'light'
        ? 'bg-elevari-ivory/88'
        : 'bg-gradient-to-r from-elevari-ink/88 via-elevari-ink/65 to-elevari-ink/75';

  return (
    <section className={`relative overflow-hidden min-h-[240px] ${className}`}>
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="100vw"
          quality={70}
          className="object-cover scale-105 transition-transform duration-[8s] ease-out hover:scale-110"
          priority={false}
        />
        <div className={`absolute inset-0 ${overlayClass}`} />
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 20%, rgba(212,175,122,0.35) 0%, transparent 45%)',
          }}
          aria-hidden
        />
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
