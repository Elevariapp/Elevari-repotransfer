'use client';

import { ShareIcon } from '@/components/pwa/InstallPrompt';
import { usePwaInstall, type PwaPlatform } from '@/hooks/useInstallPrompt';

/** A short, device-aware hint for the APK button: the file only makes sense on an Android phone. */
export function PlatformNote({ className = 'text-elevari-muted' }: { className?: string }) {
  const { platform, standalone } = usePwaInstall();
  if (standalone || platform === null || platform === 'android') return null;
  return (
    <p className={`mt-4 max-w-md text-sm leading-relaxed ${className}`}>
      {platform === 'ios' ? (
        <>
          El archivo APK es solo para Android y no se puede instalar en iPhone o iPad.{' '}
          <a href="#ios" className="font-semibold underline underline-offset-4 hover:text-elevari-forest">
            Ver las instrucciones para iPhone
          </a>
          .
        </>
      ) : (
        '¿Estás en un computador? Escanea el código QR con tu celular Android para abrir esta página allí.'
      )}
    </p>
  );
}

function StepList({ steps }: { steps: readonly React.ReactNode[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3 text-sm leading-relaxed text-elevari-muted">
          <span
            aria-hidden
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevari-amber-soft text-xs font-bold text-elevari-amber-ink"
          >
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

const strong = (text: string) => <strong className="font-semibold text-elevari-slate">{text}</strong>;

function DeviceCard({
  id,
  current,
  title,
  steps,
  footnote,
  anchorId,
}: {
  id: PwaPlatform;
  current: PwaPlatform | null;
  title: string;
  steps: readonly React.ReactNode[];
  footnote?: string;
  anchorId?: string;
}) {
  const isCurrent = current === id;
  return (
    <article
      id={anchorId}
      className={`elevari-card scroll-mt-24 p-6 ${isCurrent ? 'ring-2 ring-elevari-forest/50' : ''}`}
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg text-elevari-slate">{title}</h3>
        {isCurrent && (
          <span className="rounded-full bg-elevari-amber-soft px-3 py-1 text-xs font-semibold text-elevari-amber-ink">
            Tu dispositivo
          </span>
        )}
      </div>
      <StepList steps={steps} />
      {footnote && <p className="mt-4 text-xs leading-relaxed text-elevari-muted">{footnote}</p>}
    </article>
  );
}

/** The no-file alternative: add the website to the home screen (a PWA). */
export default function InstallAppPanel() {
  const { platform, standalone, canPrompt, promptInstall } = usePwaInstall();

  if (standalone) {
    return (
      <p role="status" className="elevari-card p-6 text-sm font-medium text-elevari-slate">
        Ya estás usando Elevari como app. ¡Gracias por instalarla!
      </p>
    );
  }

  return (
    <div>
      {canPrompt && (
        <button type="button" onClick={promptInstall} className="elevari-btn-primary mb-6 min-h-12">
          Instalar la app web
        </button>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <DeviceCard
          id="android"
          current={platform}
          title="Android · Chrome"
          anchorId="android-web"
          steps={[
            <>Abre esta página en Chrome y toca el menú {strong('⋮')} (arriba a la derecha).</>,
            <>Elige {strong('Instalar app')} o {strong('Añadir a la pantalla de inicio')}.</>,
            <>Confirma con {strong('Instalar')}. El icono de Elevari aparece junto a tus otras apps.</>,
          ]}
        />
        <DeviceCard
          id="ios"
          current={platform}
          title="iPhone y iPad · Safari"
          anchorId="ios"
          steps={[
            <>Abre esta página en Safari.</>,
            <>
              Toca <ShareIcon />
              {strong('Compartir')} en la barra del navegador.
            </>,
            <>
              Elige {strong('Añadir a pantalla de inicio')} y confirma con {strong('Añadir')}.
            </>,
          ]}
          footnote="iOS no permite instalar archivos APK. Esta es la forma de instalar Elevari en iPhone y iPad; la versión web se actualiza automáticamente. Si usas otro navegador, abre primero esta página en Safari."
        />
      </div>
    </div>
  );
}
