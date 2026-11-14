'use client';

import { useState } from 'react';
import Link from 'next/link';
import { wanaApi } from '@/lib/api-client';
import AuthShell from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await wanaApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell image="/properties/glamping-wana/06.webp">
      <p className="elevari-eyebrow">Cuenta</p>
      <h1 className="mt-2 font-display text-2xl text-elevari-slate sm:text-3xl">Recuperar contraseña</h1>
      <p className="mt-3 text-sm text-elevari-muted">
        Te enviaremos un enlace si el correo está registrado en Eleveri.
      </p>

      {sent ? (
        <div className="mt-6 rounded-xl border border-elevari-amber/30 bg-elevari-sand/50 p-4 text-sm text-elevari-slate">
          Si el correo existe, recibirás un enlace en unos minutos. Revisa también spam.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="elevari-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="elevari-input"
              autoComplete="email"
              required
            />
          </label>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <button type="submit" disabled={loading} className="elevari-btn-primary w-full min-h-[48px]">
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-elevari-muted">
        <Link href="/auth/login" className="elevari-link">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
