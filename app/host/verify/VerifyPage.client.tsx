'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { wanaApi } from '@/lib/api-client';

export default function VerifyPageClient() {
  const [status, setStatus] = useState<{
    id_verified: boolean;
    verification_status: string | null;
    review_by?: string | null;
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
          setStatus({ id_verified: s.id_verified, verification_status: s.verification_status, review_by: s.review_by ?? null });
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
            <div className="mt-2 flex justify-center">
              <VerifiedBadge verified />
            </div>
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
              Sube tu documento de identidad y una selfie. La revisión es automática y toma segundos;
              si necesita una mirada humana, la tienes en{' '}
              <strong className="text-elevari-slate">máximo 1 hora</strong>.
            </p>

            {status?.verification_status === 'pending' && (
              <div className="mt-6 p-4 rounded bg-elevari-sand border border-elevari-muted/20">
                <p className="text-sm text-elevari-muted">
                  Tu verificación está pendiente de revisión.
                  {status.review_by
                    ? ` Compromiso de respuesta: antes de ${new Date(status.review_by).toLocaleString('es-CO')}.`
                    : ' Te notificaremos por correo cuando se complete.'}
                </p>
              </div>
            )}

            {status?.verification_status === 'rejected' && (
              <div className="mt-6 p-4 rounded bg-elevari-error/10 border border-elevari-error/20">
                <p className="text-sm text-elevari-error">
                  Tu verificación anterior fue rechazada. Revisa que el documento sea legible y que el
                  número coincida, y vuelve a enviarlo.
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
                const document = formData.get('document');
                const selfie = formData.get('selfie');
                if (!(document instanceof File) || !(selfie instanceof File) || !document.size || !selfie.size) {
                  setMessage({ kind: 'error', text: 'Adjunta el documento de identidad y la selfie.' });
                  setSubmitting(false);
                  return;
                }
                try {
                  const result = await wanaApi.verifyHost({
                    document,
                    selfie,
                    id_number: String(formData.get('id_number') ?? ''),
                    full_name: String(formData.get('full_name') ?? ''),
                  });
                  setStatus({
                    id_verified: result.id_verified,
                    verification_status: result.status,
                    review_by: result.review_by,
                  });
                  setMessage({ kind: 'success', text: result.message });
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
                  <label htmlFor="document" className="block text-xs font-medium text-elevari-slate">
                    Documento de identidad
                  </label>
                  <input
                    id="document"
                    name="document"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="w-full rounded border border-elevari-muted bg-elevari-slate/5 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-elevari-forest file:px-3 file:py-1.5 file:text-white focus:outline-none focus:ring-2 focus:ring-elevari-forest"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="selfie" className="block text-xs font-medium text-elevari-slate">
                    Selfie
                  </label>
                  <input
                    id="selfie"
                    name="selfie"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="w-full rounded border border-elevari-muted bg-elevari-slate/5 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-elevari-forest file:px-3 file:py-1.5 file:text-white focus:outline-none focus:ring-2 focus:ring-elevari-forest"
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
                Los archivos se guardan en almacenamiento privado y solo los usa la revisión de
                identidad. Máximo 10 MB por imagen (JPG, PNG o WebP).
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