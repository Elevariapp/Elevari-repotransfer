'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { wanaApi } from '@/lib/api-client';
import AuthShell from '@/components/auth/AuthShell';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!token) {
      setError('Enlace inválido. Solicita uno nuevo.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await wanaApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-elevari-muted">Enlace inválido o incompleto.</p>
        <Link href="/auth/forgot-password" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="font-medium text-elevari-slate">Contraseña actualizada. Redirigiendo al login…</p>
      </div>
    );
  }

  return (
    <>
      <p className="elevari-eyebrow">Cuenta</p>
      <h1 className="mt-2 font-display text-2xl text-elevari-slate sm:text-3xl">Nueva contraseña</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-1.5">
          <span className="elevari-label">Contraseña (mín. 8)</span>
          <input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="elevari-input"
            autoComplete="new-password"
            required
            disabled={loading}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="elevari-label">Confirmar</span>
          <input
            type="password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="elevari-input"
            autoComplete="new-password"
            required
            disabled={loading}
          />
        </label>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <button type="submit" disabled={loading} className="elevari-btn-primary w-full min-h-[48px]">
          {loading ? 'Guardando…' : 'Restablecer contraseña'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell image="/properties/glamping-wana/07.jpg">
      <Suspense fallback={<p className="text-elevari-muted">Cargando…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
