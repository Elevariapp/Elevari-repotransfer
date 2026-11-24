import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import CopyChecksum from '@/components/pwa/CopyChecksum';
import InstallAppPanel, { PlatformNote } from '@/components/pwa/InstallAppPanel';
import { APK_URL, INSTALL_PAGE_PATH, PLAY_STORE_LIVE, PLAY_STORE_URL } from '@/lib/app-links';
import { androidReleaseForSdk, getApkInfo, type ApkInfo } from '@/lib/apk-info';
import { formatInstantDate } from '@/lib/format';
import { siteUrl } from '@/lib/site-url';

// The published build can change at any time; five minutes keeps GitHub calls rare and the page fresh.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Instalar la app de Elevari',
  description:
    'Descarga la app de Elevari para Android o añádela a la pantalla de inicio de tu celular. Instalación paso a paso.',
  alternates: { canonical: siteUrl(INSTALL_PAGE_PATH) },
  openGraph: {
    title: 'Instalar la app de Elevari',
    description: 'Elevari en tu celular: app para Android o acceso directo desde la pantalla de inicio.',
    url: siteUrl(INSTALL_PAGE_PATH),
  },
};

const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;

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

const chip = 'rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm';
const apkLabel = PLAY_STORE_LIVE ? 'Descargar el APK' : 'Descargar para Android';
const buttonBase =
  'inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full px-8 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-elevari-forest-deep sm:w-auto';
const buttonPrimary = `${buttonBase} bg-white text-elevari-forest-deep shadow-lg hover:bg-elevari-amber-soft`;
const buttonSecondary = `${buttonBase} border border-white/40 text-white hover:bg-white/10`;

function DownloadBlock({ info }: { info: ApkInfo | null }) {
  const release = info ? androidReleaseForSdk(info.minSdk) : null;

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {PLAY_STORE_LIVE && (
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonPrimary}>
            Descarga la app para Android
          </a>
        )}
        {info && (
          <a href={APK_URL} className={PLAY_STORE_LIVE ? buttonSecondary : buttonPrimary}>
            <DownloadIcon />
            {apkLabel}
          </a>
        )}
      </div>

      {info && (
        <>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-white/90">
            <li className={chip}>Versión {info.versionName}</li>
            <li className={chip}>{formatSize(info.sizeBytes)}</li>
            <li className={chip}>Publicada el {formatInstantDate(info.builtAt)}</li>
            {release && <li className={chip}>Android {release} o superior</li>}
          </ul>
          <PlatformNote className="text-white/85" />
        </>
      )}

      {!info && !PLAY_STORE_LIVE && (
        <div className="max-w-md rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm">
          <p className="font-display text-lg text-white">Disponible muy pronto</p>
          <p className="mt-1 text-sm leading-relaxed text-white/85">
            Estamos publicando la primera versión para Android. Mientras tanto puedes añadir Elevari a la pantalla de
            inicio de tu celular.
          </p>
          <a
            href="#app-web"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-elevari-amber-soft underline underline-offset-4 hover:text-white"
          >
            Ver cómo hacerlo
          </a>
        </div>
      )}
    </div>
  );
}

const installSteps = [
  {
    title: 'Descarga el archivo',
    body: `Toca «${apkLabel}». Si Chrome pregunta si quieres conservarlo, acepta: es el aviso habitual con cualquier app que no viene de Google Play.`,
  },
  {
    title: 'Permite instalar desde esta fuente',
    body: 'Al abrir el archivo, Android pide permiso una sola vez. Toca «Configuración» y activa «Permitir desde esta fuente» (el texto puede variar según la marca de tu celular).',
  },
  {
    title: 'Instala y abre Elevari',
    body: 'Vuelve atrás y toca «Instalar». Si Play Protect muestra un aviso, elige «Más detalles» y luego «Instalar de todos modos».',
  },
] as const;

function TestSignatureNotice() {
  return (
    <div
      role="note"
      className="mt-8 rounded-2xl border border-elevari-amber/50 bg-elevari-amber-soft p-5 text-elevari-amber-ink"
    >
      <p className="font-display text-base font-semibold">Versión de prueba</p>
      <p className="mt-1 text-sm leading-relaxed">
        Esta compilación está firmada con una clave de prueba que cambia en cada versión. Para instalar una versión más
        nueva, desinstala primero la anterior; tus reservas siguen en tu cuenta y solo tendrás que iniciar sesión de
        nuevo.
      </p>
    </div>
  );
}

function InstallSteps({ info }: { info: ApkInfo }) {
  return (
    <section aria-labelledby="pasos" className="elevari-container pt-12 lg:pt-16">
      <p className="elevari-eyebrow">Instalación</p>
      <h2 id="pasos" className="elevari-section-title mt-2">
        Instálala en tres pasos
      </h2>
      <div className="elevari-divider-gold mt-4" />
      <ol className="mt-8 grid gap-5 md:grid-cols-3">
        {installSteps.map((step, index) => (
          <li key={step.title} className="elevari-card-premium p-6">
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full bg-elevari-amber-soft font-display text-lg font-semibold text-elevari-amber-ink"
            >
              {index + 1}
            </span>
            <h3 className="mt-4 font-display text-lg text-elevari-slate">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-elevari-muted">{step.body}</p>
          </li>
        ))}
      </ol>
      {info.signing === 'test' && <TestSignatureNotice />}
    </section>
  );
}

function Verification({ info }: { info: ApkInfo }) {
  return (
    <section aria-labelledby="verificar" className="elevari-container pt-12 lg:pt-16">
      <div className="elevari-card-premium p-6 sm:p-8">
        <p className="elevari-eyebrow">Seguridad</p>
        <h2 id="verificar" className="elevari-section-title mt-2">
          Comprueba tu descarga
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-elevari-muted">
          Cada versión publica su huella SHA-256. Si la de tu archivo coincide con esta, es exactamente el que compilamos.
          En un computador la calculas con <code className="font-mono text-elevari-slate">sha256sum elevari.apk</code>.
        </p>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-elevari-border bg-elevari-sand/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <code id="apk-sha256" className="block break-all font-mono text-[0.8125rem] leading-relaxed text-elevari-slate">
            {info.sha256}
          </code>
          <div className="shrink-0">
            <CopyChecksum value={info.sha256} targetId="apk-sha256" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Questions({ info }: { info: ApkInfo | null }) {
  const items = [
    ...(PLAY_STORE_LIVE
      ? []
      : [
          {
            question: '¿Por qué Android pide permiso para instalarla?',
            answer:
              'Porque esta app todavía no se instala desde Google Play. El permiso se da una sola vez y puedes quitarlo cuando quieras desde los ajustes de tu celular.',
          },
        ]),
    {
      question: '¿Cómo la actualizo?',
      answer:
        info?.signing === 'test'
          ? 'Descarga la versión nueva desde esta página. Como es una versión de prueba, desinstala antes la anterior.'
          : 'Descarga la versión nueva desde esta página e instálala encima de la actual: conserva tus datos.',
    },
    {
      question: '¿Qué pasa con mis datos?',
      answer:
        'La app usa tu cuenta de Elevari. Puedes eliminarla cuando quieras, desde la app o en la página de eliminación de cuenta.',
    },
  ];

  return (
    <section aria-labelledby="preguntas" className="elevari-container py-12 lg:py-16">
      <h2 id="preguntas" className="elevari-section-title">
        Preguntas frecuentes
      </h2>
      <div className="elevari-divider-gold mt-4" />
      <dl className={`mt-6 grid gap-5 ${items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {items.map((item) => (
          <div key={item.question} className="elevari-card p-6">
            <dt className="font-display text-base font-semibold text-elevari-slate">{item.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-elevari-muted">{item.answer}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm text-elevari-muted">
        Consulta la{' '}
        <Link href="/legal/privacy" className="elevari-link underline underline-offset-4">
          política de privacidad
        </Link>{' '}
        o{' '}
        <Link href="/legal/account-deletion" className="elevari-link underline underline-offset-4">
          cómo eliminar tu cuenta
        </Link>
        .
      </p>
    </section>
  );
}

export default async function InstallAppPage() {
  const info = await getApkInfo();

  return (
    <>
      <Header sticky={false} />
      <main id="contenido">
        <section className="elevari-container pt-8 sm:pt-12 lg:pt-16">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-elevari-forest-deep to-elevari-action px-6 py-10 text-white shadow-[var(--elevari-shadow-lg)] sm:px-10 lg:px-14 lg:py-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-elevari-amber/25 blur-3xl"
            />
            <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-elevari-amber-soft">
                  App para Android
                </p>
                <h1 className="elevari-display-page mt-3 text-white">Elevari en tu celular</h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
                  Reserva glamping en Colombia, sigue tus estadías y habla con nosotros desde una app hecha para tu
                  mano.
                </p>
                <DownloadBlock info={info} />
              </div>

              {/* The code is for a desktop visitor handing the page over to a phone, so phones don't get it. */}
              <div className="hidden sm:block lg:col-span-5">
                <div className="mx-auto w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-[var(--elevari-shadow-lg)]">
                  {/* 222 px is 6 x the code's 37 modules, so the squares stay crisp on 1x screens. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/qr-app.svg"
                    alt="Código QR que abre la página elevari.live/app"
                    width={222}
                    height={222}
                    className="mx-auto h-[222px] w-[222px]"
                  />
                  <p className="mt-3 font-display text-base font-semibold text-slate-900">Escanéalo con tu celular</p>
                  <p className="mt-0.5 text-sm text-slate-600">y sigue los pasos desde tu teléfono</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {info && <InstallSteps info={info} />}
        {info && <Verification info={info} />}

        <section
          id="app-web"
          aria-labelledby="app-web-titulo"
          className="elevari-container scroll-mt-24 pt-12 lg:pt-16"
        >
          <p className="elevari-eyebrow">Sin instalar archivos</p>
          <h2 id="app-web-titulo" className="elevari-section-title mt-2">
            Añade Elevari a tu pantalla de inicio
          </h2>
          <div className="elevari-divider-gold mt-4" />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-elevari-muted">
            Funciona en Android y en iPhone: Elevari se abre como una app, sin descargar archivos y siempre en su última
            versión.
          </p>
          <div className="mt-8">
            <InstallAppPanel />
          </div>
        </section>

        <Questions info={info} />
      </main>
    </>
  );
}
