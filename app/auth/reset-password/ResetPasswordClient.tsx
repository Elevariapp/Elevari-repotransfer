'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError, wanaApi } from '@/lib/api-client';
import { clearSession } from '@/lib/auth-session';
import { readResetToken } from '@/lib/reset-link';
import AuthShell from '@/components/auth/AuthShell';
import Button, { ButtonLink } from '@/components/ui/Button';

const REDIRECT_DELAY_MS = 3000;

type FieldErrors = { password?: string; confirm?: string };

export default function ResetPasswordClient() {
  // null until the browser URL has been read, '' when there is no token in it.
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const read = () => {
      const found = readResetToken(window.location);
      if (!found) return false;
      setToken(found);
      setError(null);
      setLinkExpired(false);
      // Keep the secret out of the address bar, the history and screenshots.
      window.history.replaceState(null, '', window.location.pathname);
      return true;
    };
    if (!read()) setToken((current) => current ?? '');
    // Pasting a new link into a tab that already shows this page only changes the fragment.
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => window.location.assign('/auth/login'), REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [done]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !token) return;
    const next: FieldErrors = {};
    if (password.length < 8) next.password = 'La contraseña debe tener al menos 8 caracteres.';
    else if (password.length > 128) next.password = 'La contraseña no puede superar los 128 caracteres.';
    if (!confirm) next.confirm = 'Confirma tu nueva contraseña.';
    else if (confirm !== password) next.confirm = 'Las contraseñas no coinciden.';
    setFieldErrors(next);
    if (next.password || next.confirm) return;

    setError(null);
    setLinkExpired(false);
    setLoading(true);
    try {
      await wanaApi.resetPassword(token, password);
      // Every earlier session was revoked by the reset; drop the dead token kept in this browser.
      clearSession();
      setDone(true);
    } catch (err) {
      setLinkExpired(err instanceof ApiError && err.code === 'invalid_reset_token');
      setError(err instanceof Error ? err.message : 'No pudimos restablecer tu contraseña. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const requestNewLink = (
    <ButtonLink href="/auth/forgot-password" size="lg" fullWidth>
      Solicitar nuevo enlace
    </ButtonLink>
  );

  const heading = done ? 'Contraseña actualizada' : token === '' ? 'Enlace incompleto' : 'Nueva contraseña';

  let body: React.ReactNode;
  if (done) {
    body = (
      <>
        <p role="status" className="mt-3 text-sm text-elevari-muted">
          Ya puedes iniciar sesión con tu nueva contraseña. Por seguridad cerramos tus otras sesiones.
        </p>
        <div className="mt-6">
          <ButtonLink href="/auth/login" size="lg" fullWidth>
            Iniciar sesión
          </ButtonLink>
        </div>
      </>
    );
  } else if (token === '') {
    body = (
      <>
        <p role="alert" className="mt-3 text-sm text-elevari-muted">
          Este enlace no es válido o ya se usó. Solicita uno nuevo para crear tu contraseña.
        </p>
        <div className="mt-6">{requestNewLink}</div>
      </>
    );
  } else {
    body = (
      <>
        <p className="mt-3 text-sm text-elevari-muted">Elige una contraseña de al menos 8 caracteres.</p>
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reset-password" className="elevari-label block">
              Contraseña nueva
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className="elevari-input"
              autoComplete="new-password"
              maxLength={128}
              required
              aria-required="true"
              disabled={loading || token === null}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? 'reset-password-error' : undefined}
            />
            {fieldErrors.password && (
              <p id="reset-password-error" role="alert" className="text-xs font-medium text-elevari-error">
                {fieldErrors.password}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="reset-confirm" className="elevari-label block">
              Confirma tu contraseña
            </label>
            <input
              id="reset-confirm"
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (fieldErrors.confirm) setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              className="elevari-input"
              autoComplete="new-password"
              maxLength={128}
              required
              aria-required="true"
              disabled={loading || token === null}
              aria-invalid={fieldErrors.confirm ? true : undefined}
              aria-describedby={fieldErrors.confirm ? 'reset-confirm-error' : undefined}
            />
            {fieldErrors.confirm && (
              <p id="reset-confirm-error" role="alert" className="text-xs font-medium text-elevari-error">
                {fieldErrors.confirm}
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

          {linkExpired ? (
            requestNewLink
          ) : (
            <Button type="submit" size="lg" fullWidth loading={loading} disabled={token === null}>
              {loading ? 'Guardando…' : 'Restablecer contraseña'}
            </Button>
          )}
        </form>
      </>
    );
  }

  return (
    <AuthShell>
      <p className="elevari-eyebrow">Cuenta</p>
      <h1 className="mt-2 font-display text-2xl text-elevari-slate sm:text-3xl">{heading}</h1>
      {body}
      {!done && (
        <p className="mt-6 text-center text-sm text-elevari-muted">
          <Link href="/auth/login" className="elevari-link inline-flex min-h-[44px] items-center">
            Volver a iniciar sesión
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
