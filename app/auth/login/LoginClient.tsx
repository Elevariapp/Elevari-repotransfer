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

export default function LoginPage({ redirectTo = '/' }: { redirectTo?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const needsTurnstile = TURNSTILE_ENABLED && !turnstileToken;

  const validateFields = () => {
    const next: { email?: string; password?: string } = {};
    const trimmed = email.trim();
    if (!trimmed) next.email = 'Escribe tu email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) next.email = 'Escribe un email válido.';
    if (!password) next.password = 'Escribe tu contraseña.';
    return next;
  };

  const refreshTurnstile = () => {
    setTurnstileToken('');
    setTurnstileResetKey((k) => k + 1);
  };

  const afterAuth = (user: { role: 'guest' | 'host' | 'admin' }) => {
    navigateAfterAuth(resolvePostAuthPath(user.role, redirectTo));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextFieldErrors = validateFields();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setError(null);
      return;
    }
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('Completa la verificación de seguridad');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password, turnstileToken || undefined);
      afterAuth(user);
    } catch (err) {
      if (TURNSTILE_ENABLED) refreshTurnstile();
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('Completa la verificación de seguridad antes de Google');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential, { turnstile_token: turnstileToken || undefined });
      afterAuth(user);
    } catch (err) {
      if (TURNSTILE_ENABLED) refreshTurnstile();
      setError(err instanceof Error ? err.message : 'Error con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell topLink={{ href: '/auth/register', label: 'Crear cuenta' }}>
      <p className="wana-eyebrow">Bienvenido</p>
      <h1 className="mt-2 font-display text-3xl text-elevari-slate">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-elevari-muted">Reserva con la confianza de una plataforma internacional.</p>

      {(GOOGLE_ENABLED || TURNSTILE_ENABLED) && GOOGLE_ENABLED && (
        <div className="mt-6">
          <GoogleSignInButton onCredential={handleGoogle} text="signin_with" />
          <AuthDivider label="o con email" />
        </div>
      )}

      <form onSubmit={handleLogin} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="wana-label block">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            className="wana-input"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="login-email-error" role="alert" className="text-xs font-medium text-elevari-error">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="wana-label block">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            className="wana-input"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
          />
          {fieldErrors.password && (
            <p id="login-password-error" role="alert" className="text-xs font-medium text-elevari-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

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
          <div role="alert" className="rounded-xl border border-elevari-error/30 bg-elevari-error-soft px-4 py-3 text-sm text-elevari-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || needsTurnstile}
          className="wana-btn-primary w-full min-h-[48px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Entrando…' : needsTurnstile ? 'Completa la verificación' : 'Entrar'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/auth/forgot-password" className="wana-link font-medium">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-elevari-muted">
        ¿No tienes cuenta?{' '}
        <Link href={redirectTo !== '/' ? `/auth/register?redirect=${encodeURIComponent(redirectTo)}` : '/auth/register'} className="wana-link">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
