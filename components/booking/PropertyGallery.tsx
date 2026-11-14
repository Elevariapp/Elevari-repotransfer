'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';

type MediaItem = {
  id?: string;
  url: string;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
  type?: string;
};

function MediaSlide({
  item,
  title,
  className,
}: {
  item: MediaItem;
  title: string;
  className?: string;
}) {
  const isVideo = item.type === 'video';
  if (isVideo) {
    return (
      <video
        src={item.url}
        className={className}
        controls
        playsInline
        preload="metadata"
      />
    );
  }
  return (
    <img
      src={item.url}
      alt={title}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}

function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  if (item.type === 'video') {
    return (
      <div className={`relative ${className} bg-elevari-forest-deep flex items-center justify-center`}>
        <span className="text-white text-lg">▶</span>
      </div>
    );
  }
  return (
    <img
      src={item.thumbnailUrl ?? item.thumbnail_url ?? item.url}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function PropertyGallery({
  media,
  title,
}: {
  media: MediaItem[];
  title: string;
}) {
  const items = media.filter((m) => m.url);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [active, setActive] = useState(0);

  /** Keyboard support for the lightbox: Escape closes, arrows navigate. */
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowLeft') {
        setActive((a) => (a === 0 ? items.length - 1 : a - 1));
      }
      if (event.key === 'ArrowRight') {
        setActive((a) => (a === items.length - 1 ? 0 : a + 1));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen, items.length]);

  if (items.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-elevari-sand ring-1 ring-elevari-border/50">
        <span className="text-sm text-elevari-muted">Sin fotos o videos</span>
      </div>
    );
  }

  const display = items.slice(0, 5);
  const hero = display[0];
  const rest = display.slice(1);

  const openAt = (idx: number) => {
    setActive(idx);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="relative hidden md:block">
        <div className="grid h-[min(56vh,480px)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl shadow-elevari-lg ring-1 ring-elevari-ink/5">
          <button
            type="button"
            onClick={() => openAt(0)}
            aria-label={`Abrir galería de ${title}`}
            className="relative col-span-2 row-span-2 overflow-hidden bg-elevari-sand"
          >
            <MediaSlide item={hero} title={title} className="h-full w-full object-cover transition hover:scale-[1.02]" />
          </button>
          {rest.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => openAt(i + 1)}
              aria-label={`Ver foto ${i + 2} de ${items.length}`}
              className="relative overflow-hidden bg-elevari-sand"
            >
              <MediaThumb item={img} className="h-full w-full object-cover transition hover:scale-[1.02]" />
            </button>
          ))}
        </div>
        {items.length > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => openAt(0)}
            className="absolute bottom-4 right-4 shadow-card"
          >
            Ver todo el media
          </Button>
        )}
      </div>

      <div className="relative md:hidden">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-elevari-sand ring-1 ring-elevari-border/40">
          <MediaSlide item={items[active]} title={title} className="h-full w-full object-cover" />
        </div>
        {items.length > 1 && (
          <>
            <IconButton
              variant="glass"
              size="sm"
              label="Anterior"
              onClick={() => setActive((a) => (a === 0 ? items.length - 1 : a - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              ‹
            </IconButton>
            <IconButton
              variant="glass"
              size="sm"
              label="Siguiente"
              onClick={() => setActive((a) => (a === items.length - 1 ? 0 : a + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              ›
            </IconButton>
          </>
        )}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute bottom-3 right-3 rounded-lg bg-elevari-surface/95 px-3 py-1.5 text-xs font-semibold shadow-card"
        >
          Ver galería
        </button>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Galería de ${title}`}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-elevari-ink/90 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-2 text-white"
              onClick={() => setLightboxOpen(false)}
            >
              Cerrar
            </button>
            <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] max-w-full">
              <MediaSlide
                item={items[active]}
                title={`${title} — foto ${active + 1} de ${items.length}`}
                className="max-h-[85vh] max-w-full rounded-lg object-contain"
              />
            </div>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive((a) => (a === 0 ? items.length - 1 : a - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-xl text-white"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Foto siguiente"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive((a) => (a === items.length - 1 ? 0 : a + 1));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-xl text-white"
                >
                  ›
                </button>
              </>
            )}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
              {active + 1} / {items.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
