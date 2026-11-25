'use client';

import { usePwaInstall } from '@/hooks/useInstallPrompt';

function DownloadIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v12M7 11l5 5 5-5M5 20h14" />
    </svg>
  );
}

const buttonBase =
  'inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full px-8 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-elevari-forest-deep sm:w-auto';
const buttonPrimary = `${buttonBase} bg-white text-elevari-forest-deep shadow-lg hover:bg-elevari-amber-soft`;
const buttonSecondary = `${buttonBase} border border-white/40 text-white hover:bg-white/10`;

/**
 * The hero action follows the visitor's device. An APK is never offered as an iOS installation:
 * iPhone and iPad visitors are sent to the Safari "Add to Home Screen" instructions instead.
 */
export default function PlatformInstallActions({
  apkAvailable,
  apkLabel,
  apkUrl,
  playStoreLive,
  playStoreUrl,
}: {
  apkAvailable: boolean;
  apkLabel: string;
  apkUrl: string;
  playStoreLive: boolean;
  playStoreUrl: string;
}) {
  const { platform } = usePwaInstall();

  if (platform === 'ios') {
    return (
      <div className="mt-8">
        <a href="#ios" className={buttonPrimary}>
          Instalar en iPhone o iPad
        </a>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85">
          iOS no permite instalar archivos APK. Abre esta página en Safari y elige «Añadir a pantalla de inicio».
        </p>
      </div>
    );
  }

  const androidActions = (
    <>
      {playStoreLive && (
        <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className={buttonPrimary}>
          Descarga la app para Android
        </a>
      )}
      {apkAvailable && (
        <a href={apkUrl} className={playStoreLive ? buttonSecondary : buttonPrimary}>
          <DownloadIcon />
          {apkLabel}
        </a>
      )}
      {!playStoreLive && !apkAvailable && (
        <span className={`${buttonBase} border border-white/40 text-white/60`}>
          Android · Disponible muy pronto
        </span>
      )}
    </>
  );

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{androidActions}</div>
    </div>
  );
}
