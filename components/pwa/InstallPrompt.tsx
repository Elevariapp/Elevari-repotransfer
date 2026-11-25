'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ANDROID_APP_URL, type InstallMode } from '@/hooks/useInstallPrompt';
import { APK_INFO_URL } from '@/lib/app-links';
import { parseApkInfo } from '@/lib/apk-info';

export function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mx-0.5 inline-block align-[-3px] text-elevari-forest"
    >
      <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1v-8a1 1 0 00-1-1h-1" />
    </svg>
  );
}

/** The published Android version is optional: the popup must still work if GitHub is unavailable. */
function useAndroidVersion(mode: InstallMode) {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'ios') return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    fetch(APK_INFO_URL, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((raw) => setVersion(parseApkInfo(raw)?.versionName ?? null))
      .catch(() => {
        // The install action remains useful without the optional version label.
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [mode]);

  return version;
}

/** Install card. Which copy and action it shows depends on what the device can actually do. */
export default function InstallPrompt({
  mode,
  onInstall,
  onDismiss,
}: {
  mode: InstallMode;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  const version = useAndroidVersion(mode);

  return (
    <section
      aria-labelledby="install-title"
      className="w-full rounded-2xl border border-elevari-border bg-elevari-surface p-4 shadow-[var(--elevari-shadow-floating)] sm:max-w-sm"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/icons/icon-128.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 id="install-title" className="font-display text-base font-semibold text-elevari-slate">
            {mode === 'play'
              ? 'Descarga la app para Android'
              : mode === 'ios'
                ? 'Instala Elevari en tu iPhone'
                : 'Instala la app de Elevari'}
          </h2>
          <p className="mt-1 text-sm leading-snug text-elevari-muted">
            {mode === 'ios' ? (
              <>
                iOS no usa archivos APK. Abre Safari, toca <ShareIcon />
                <strong className="font-semibold text-elevari-slate">Compartir</strong> y luego{' '}
                <strong className="font-semibold text-elevari-slate">Añadir a pantalla de inicio</strong>.
              </>
            ) : (
              'Reserva y gestiona tus estadías con un toque, sin abrir el navegador.'
            )}
          </p>
          {version && mode !== 'ios' && (
            <p className="mt-2 text-xs font-semibold text-elevari-forest">Versión Android {version}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar"
          className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-elevari-muted transition hover:text-elevari-slate focus-visible:ring-2 focus-visible:ring-elevari-forest"
        >
          <span aria-hidden>✕</span>
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {mode === 'ios' ? (
          <Link
            href="/app#ios"
            onClick={onDismiss}
            className="elevari-btn-primary min-h-[44px] flex-1 !py-2"
          >
            Ver pasos para iPhone
          </Link>
        ) : mode === 'play' ? (
          <a
            href={ANDROID_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDismiss}
            className="elevari-btn-primary min-h-[44px] flex-1 !py-2"
          >
            Descargar en Google Play
          </a>
        ) : (
          <button type="button" onClick={onInstall} className="elevari-btn-primary min-h-[44px] flex-1 !py-2">
            Instalar app
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[44px] rounded-full px-4 text-sm font-semibold text-elevari-muted transition hover:text-elevari-slate"
        >
          Ahora no
        </button>
      </div>
    </section>
  );
}
