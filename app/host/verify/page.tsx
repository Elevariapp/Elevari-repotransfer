import type { Metadata } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { wanaApi } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Verificar identidad',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  const [status, setStatus] = useState<{
    id_verified: boolean;
    verification_status: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    wanaApi
      .verificationStatus()
      .then((s) => {
        if (active) {
          setStatus({ id_verified: s.id_verified, verification_status: s.verification_status });
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="elevari-container py-12">
          <p className="text-elevari-muted">Cargando estado de verificación…</p>
        </main>
      </>
    );
  }

  if (status?.id_verified) {
    return (
      <>
        <Header />
        <main className="elevari-container py-12">
          <div className="elevari-card p-8 text-center">
            <p className="font-semibold text-elevari-forest">✓ Identidad ya verificada</p>
            <p className="mt-2 text-elevari-muted">
              Tu identidad ha sido verificada. Ya puedes publicar propiedades.
            </p>
            <Link href="/host" className="elevari-btn-primary mt-6 inline-flex min-h-[44px]">
              Volver al panel
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="elevari-container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="elevari-card p-8">
            <p className="elevari-eyebrow">Verificación de identidad</p>
            <h1 className="mt-2 font-display text-2xl text-elevari-slate">
              Verifica tu identidad como anfitrión
            </h1>
            <p className="mt-2 text-elevari-muted">
              Sube tu documento de identidad y una selfie para que podamos verificar quién eres. Este
              proceso ayuda a mantener segura la comunidad de Elevari.
            </p>

            {status?.verification_status === 'pending' && (
              <div className="mt-6 p-4 rounded bg-elevari-sand border border-elevari-muted/20">
                <p className="text-sm text-elevari-muted">
                  Tu verificación está pendiente de revisión. Te notificaremos por correo cuando se
                  complete.
                </p>
              </div>
            )}

            {status?.verification_status === 'rejected' && (
              <div className="mt-6 p-4 rounded bg-elevari-error/10 border border-elevari-error/20">
                <p className="text-sm text-elevari-error">
                  Tu verificación anterior fue rechazada. Puedes volver a enviar tus documentos.
                </p>
              </div>
            )}

            {message && (
              <div className="mt-4 p-4 rounded text-sm">
                {message.kind === 'success' ? (
                  <div className="bg-elevari-forest/10 border border-elevari-forest/20 text-elevari-forest">
                    {message.text}
                  </div>
                ) : (
                  <div className="bg-elevari-error/10 border border-elevari-error/20 text-elevari-error">
                    {message.text}
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                setMessage(null);
                const formData = new FormData(e.currentTarget);
                const body = {
                  id_document_url: formData.get('id_document_url') as string,
                  selfie_url: formData.get('selfie_url') as string,
                  id_number: formData.get('id_number') as string,
                  full_name: formData.get('full_name') as string,
                };
                try {
                  await wanaApi.verifyHost(body);
                  setMessage({ kind: 'success', text: 'Verificación enviada. Te notificaremos por correo.' });
                  setStatus((s) => (s ? { ...s, verification_status: 'pending' } : s));
                } catch (err: any) {
                  setMessage({
                    kind: 'error',
                    text: err?.message || 'No pudimos enviar la verificación. Inténtalo de nuevo.',
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
              className="mt-6 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-elevari-slate">
                    Documento de identidad (URL)
                  </label>
                  <input
                    name="id_document_url"
                    type="url"
                    placeholder="https://ejemplo.com/documento.jpg"
                    required
                    className="w-full rounded border border-elevari-muted bg-elevari-slate/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-elevari-forest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-elevari-slate">
                    Selfie (URL)
                  </label>
                  <input
                    name="selfie_url"
                    type="url"
                    placeholder="https://ejemplo.com/selfie.jpg"
                    required
                    className="w-full rounded border border-elevari-muted bg-elevari-slate/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-elevari-forest"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-elevari-slate">
                  Número de identificación
                </label>
                <input
                  name="id_number"
                  type="text"
                  placeholder="12345678"
                  required
                  className="w-full rounded border border-elevari-muted bg-elevari-slate/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-elevari-forest"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-elevari-slate">
                  Nombre completo
                </label>
                <input
                  name="full_name"
                  type="text"
                  placeholder="Juan Pérez"
                  required
                  className="w-full rounded border border-elevari-muted bg-elevari-slate/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-elevari-forest"
                />
              </div>
              <p className="text-xs text-elevari-muted">
                Sube una foto clara de tu documento de identidad y una selfie. Un administrador revisará
                tu identidad y te notificará por correo electrónico.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="elevari-btn-primary w-full min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando…' : 'Enviar verificación'}
              </button>
            </form>

            <p className="mt-6 text-xs text-elevari-muted text-center">
              ¿Preguntas? Escríbenos a reserve@elevari.live o por WhatsApp.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}