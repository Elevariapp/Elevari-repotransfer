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
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();

  const needsTurnstile = TURNSTILE_ENABLED && !turnstileToken;
  const loginHref = redirectTo !== '/'
    ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
    : '/auth/login';

  const validateFields = () => {
    const next: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) next.name = 'Escribe tu nombre.';
    const trimmedEmail = email.trim();
    if (!trimmedEmail) next.email = 'Escribe tu email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) next.email = 'Escribe un email válido.';
    if (!password) next.password = 'Crea una contraseña.';
    else if (password.length < 8) next.password = 'La contraseña debe tener al menos 8 caracteres.';
    return next;
  };

  const refreshTurnstile = () => {
    setTurnstileToken('');
    setTurnstileResetKey((k) => k + 1);
  };

  const afterAuth = (user: { role: 'guest' | 'host' | 'admin' }) => {
    navigateAfterAuth(resolvePostAuthPath(user.role, redirectTo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextFieldErrors = validateFields();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setError(null);
      return;
    }
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

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="register-name" className="wana-label block">
            Nombre
          </label>
          <input
            id="register-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className="wana-input"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
          />
          {fieldErrors.name && (
            <p id="register-name-error" role="alert" className="text-xs font-medium text-elevari-error">
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="register-email" className="wana-label block">
            Email
          </label>
          <input
            id="register-email"
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
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="register-email-error" role="alert" className="text-xs font-medium text-elevari-error">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="wana-label block">
            Contraseña (mín. 8)
          </label>
          <input
            id="register-password"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            className="wana-input"
            autoComplete="new-password"
            required
            aria-required="true"
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
          />
          {fieldErrors.password && (
            <p id="register-password-error" role="alert" className="text-xs font-medium text-elevari-error">
              {fieldErrors.password}
            </p>
          )}
        </div>
        <fieldset className="space-y-2">
          <legend className="wana-label">Quiero</legend>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole('guest')}
              aria-pressed={role === 'guest'}
              className={`wana-chip ${role === 'guest' ? 'wana-chip-active' : ''}`}
            >
              Reservar
            </button>
            <button
              type="button"
              onClick={() => setRole('host')}
              aria-pressed={role === 'host'}
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
          <div role="alert" className="rounded-xl border border-elevari-error/30 bg-elevari-error-soft px-4 py-3 text-sm text-elevari-error">
            {error}
          </div>
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
