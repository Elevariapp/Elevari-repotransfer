'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import AuthDivider from '@/components/auth/AuthDivider';
import AuthShell from '@/components/auth/AuthShell';
import { navigateAfterAuth, resolvePostAuthPath } from '@/lib/auth-redirect';
import { isTurnstileEnabledClient } from '@/lib/turnstile-config';

const TURNSTILE_ENABLED = isTurnstileEnabledClient();
const GOOGLE_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export default function RegisterClient({
  redirectTo = '/',
  initialRole = 'guest',
}: {
  redirectTo?: string;
  initialRole?: 'guest' | 'host';
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'guest' | 'host'>(initialRole);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();

  const needsTurnstile = TURNSTILE_ENABLED && !turnstileToken;
  const loginHref = redirectTo !== '/'
    ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
    : '/auth/login';

  const refreshTurnstile = () => {
    setTurnstileToken('');
    setTurnstileResetKey((k) => k + 1);
  };

  const afterAuth = (user: { role: 'guest' | 'host' | 'admin' }) => {
    navigateAfterAuth(resolvePostAuthPath(user.role, redirectTo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('Completa la verificación de seguridad antes de continuar');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await register({
        email,
        password,
        name,
        role,
        turnstile_token: turnstileToken || undefined,
      });
      afterAuth(user);
    } catch (err) {
      if (TURNSTILE_ENABLED) refreshTurnstile();
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('Completa la verificación de seguridad antes de usar Google');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential, {
        turnstile_token: turnstileToken || undefined,
        role,
      });
      afterAuth(user);
    } catch (err) {
      if (TURNSTILE_ENABLED) refreshTurnstile();
      setError(err instanceof Error ? err.message : 'Error con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell topLink={{ href: loginHref, label: 'Iniciar sesión' }}>
      <p className="wana-eyebrow">Registro</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Crear cuenta</h1>
      <p className="mt-2 text-sm text-elevari-muted">Huésped o anfitrión — empieza en minutos.</p>

      {GOOGLE_ENABLED && (
        <div className="mt-6">
          <GoogleSignInButton onCredential={handleGoogle} text="signup_with" />
          <AuthDivider label="o con email" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="wana-label">Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="wana-input"
            autoComplete="name"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="wana-label">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="wana-input"
            autoComplete="email"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="wana-label">Contraseña (mín. 8)</span>
          <input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="wana-input"
            autoComplete="new-password"
            required
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="wana-label">Quiero</legend>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole('guest')}
              className={`wana-chip ${role === 'guest' ? 'wana-chip-active' : ''}`}
            >
              Reservar
            </button>
            <button
              type="button"
              onClick={() => setRole('host')}
              className={`wana-chip ${role === 'host' ? 'wana-chip-active' : ''}`}
            >
              Anfitrión
            </button>
          </div>
        </fieldset>

        {TURNSTILE_ENABLED && (
          <TurnstileWidget
            resetKey={turnstileResetKey}
            onToken={setTurnstileToken}
            onExpire={() => {
              setTurnstileToken('');
              setTurnstileResetKey((k) => k + 1);
            }}
          />
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || needsTurnstile}
          className="wana-btn-primary w-full min-h-[48px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creando…' : needsTurnstile ? 'Completa la verificación' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-elevari-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href={loginHref} className="wana-link">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
