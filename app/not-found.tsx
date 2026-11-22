import Header from '@/components/Header';
import EleveriMark from '@/components/brand/EleveriMark';
import { ButtonLink } from '@/components/ui';

export default function NotFound() {
  return (
    <>
      <Header sticky={false} />
      <main
        id="contenido"
        className="elevari-container flex min-h-[70vh] flex-col items-center justify-center py-16 text-center"
      >
        <div className="flex items-center gap-3">
          <EleveriMark className="h-12 w-12" />
          <span className="h-8 w-px bg-elevari-border" aria-hidden />
          <p className="font-display text-2xl font-semibold tracking-tight text-elevari-forest">404</p>
        </div>
        <h1 className="mt-6 max-w-xl font-display text-3xl font-semibold tracking-tight text-elevari-ink sm:text-4xl">
          Este refugio no existe (o se mudó de montaña)
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-elevari-muted">
          La página que buscas no está disponible. Explora la colección curada en Sutatausa,
          Cucunubá y la sabana de Bogotá.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/properties" size="lg">
            Ver la colección
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" size="lg">
            Ir al inicio
          </ButtonLink>
        </div>
        <p className="mt-8 text-xs text-elevari-muted">
          ¿Necesitas ayuda?{' '}
          <a href="/legal/faq" className="font-semibold text-elevari-forest underline underline-offset-2">
            Preguntas frecuentes
          </a>
        </p>
      </main>
    </>
  );
}
