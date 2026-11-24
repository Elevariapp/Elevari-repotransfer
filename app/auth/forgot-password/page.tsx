'use client';

import { useState } from 'react';
import Link from 'next/link';
import { wanaApi } from '@/lib/api-client';
import AuthShell from '@/components/auth/AuthShell';
import Button from '@/components/ui/Button';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const address = email.trim();
    if (!address) {
      setFieldError('Escribe tu email.');
      return;
    }
    if (!EMAIL_PATTERN.test(address)) {
      setFieldError('Escribe un email válido.');
      return;
    }
    setFieldError(null);
    setError(null);
    setLoading(true);
    try {
      await wanaApi.forgotPassword(address);
      setSentTo(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar el enlace. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const useAnotherEmail = () => {
    setSentTo(null);
    setError(null);
  };

  return (
    <AuthShell>
      <p className="elevari-eyebrow">Cuenta</p>
      <h1 className="mt-2 font-display text-2xl text-elevari-slate sm:text-3xl">Recuperar contraseña</h1>
      <p className="mt-3 text-sm text-elevari-muted">
        Te enviaremos un enlace para crear una contraseña nueva si el correo está registrado en Elevari.
      </p>

      {sentTo ? (
        <div className="mt-6 space-y-4">
          <div
            role="status"
            className="rounded-xl border border-elevari-amber/30 bg-elevari-sand/50 p-4 text-sm text-elevari-slate"
          >
            <p className="font-medium">Revisa tu correo</p>
            <p className="mt-1">
              Si <span className="break-all font-medium">{sentTo}</span> está registrado, recibirás un enlace en unos
              minutos. El enlace vence en 1 hora. Revisa también la carpeta de spam.
            </p>
            <p className="mt-2 text-elevari-muted">
              Si te registraste con Google, entra con el botón de Google en la pantalla de inicio de sesión.
            </p>
          </div>
          <Button type="button" variant="secondary" fullWidth onClick={useAnotherEmail}>
            Usar otro email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className="elevari-label block">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              className="elevari-input"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-required="true"
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? 'forgot-email-error' : undefined}
            />
            {fieldError && (
              <p id="forgot-email-error" role="alert" className="text-xs font-medium text-elevari-error">
                {fieldError}
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-elevari-error/30 bg-elevari-error-soft px-4 py-3 text-sm text-elevari-error"
            >
              {error}
            </div>
          )}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-elevari-muted">
        <Link href="/auth/login" className="elevari-link inline-flex min-h-[44px] items-center">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
