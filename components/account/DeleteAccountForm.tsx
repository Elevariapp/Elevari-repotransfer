'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAccountUser } from '@/components/account/AccountFrame';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ApiError, wanaApi } from '@/lib/api-client';
import { clearSession } from '@/lib/auth-session';

const CONSEQUENCES = [
  'Borramos tu nombre, correo y teléfono y cerramos tu sesión en todos tus dispositivos.',
  'Si eres anfitrión, tus espacios publicados pasan a borrador y dejan de ser visibles.',
  'Conservamos tus reservas, pagos y facturas electrónicas emitidas, sin tus datos personales, porque la ley colombiana nos obliga a guardarlos para fines contables y tributarios.',
  'Te enviaremos un correo para confirmar que tu cuenta fue eliminada.',
  'Esta acción es permanente y no se puede deshacer.',
];

type Failure = { kind: 'field' | 'active_bookings' | 'admin' | 'other'; message: string };

export default function DeleteAccountForm() {
  const user = useAccountUser();
  const [secret, setSecret] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);

  const usesPassword = user.has_password;
  const canSubmit = understood && secret.trim().length > 0 && !deleting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setFailure(null);
    setDeleting(true);
    try {
      await wanaApi.deleteAccount(usesPassword ? { password: secret } : { confirm_email: secret.trim() });
      clearSession();
      toast.success('Tu cuenta fue eliminada');
      // Full navigation so the proxy and every cached client state start clean.
      window.location.assign('/');
    } catch (err) {
      setDeleting(false);
      if (!(err instanceof ApiError)) {
        setFailure({ kind: 'other', message: 'No pudimos eliminar tu cuenta. Inténtalo de nuevo.' });
        return;
      }
      if (err.code === 'invalid_password' || err.code === 'invalid_confirmation') {
        setFailure({ kind: 'field', message: err.message });
      } else if (err.code === 'active_bookings') {
        setFailure({ kind: 'active_bookings', message: err.message });
      } else if (err.code === 'admin_account') {
        setFailure({ kind: 'admin', message: err.message });
      } else {
        setFailure({ kind: 'other', message: err.message });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <section className="elevari-card p-5 sm:p-6">
        <h2 className="font-display text-lg text-elevari-slate">Qué pasa cuando eliminas tu cuenta</h2>
        <ul className="mt-3 space-y-2.5">
          {CONSEQUENCES.map((text) => (
            <li key={text} className="flex gap-2.5 text-sm leading-relaxed text-elevari-muted">
              <span aria-hidden className="mt-0.5 text-elevari-forest">
                •
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-elevari-muted">
          Más detalles en{' '}
          <Link href="/legal/account-deletion" className="elevari-link">
            nuestra política de eliminación de cuenta
          </Link>
          .
        </p>
      </section>

      <section className="elevari-card-premium space-y-5 p-5 sm:p-6">
        {usesPassword ? (
          <Input
            id="delete-password"
            name="password"
            type="password"
            label="Confirma con tu contraseña"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            autoComplete="current-password"
            maxLength={128}
            error={failure?.kind === 'field' ? failure.message : undefined}
          />
        ) : (
          <Input
            id="delete-email"
            name="confirm_email"
            type="email"
            label="Escribe tu correo para confirmar"
            hint={user.email}
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            autoComplete="off"
            error={failure?.kind === 'field' ? failure.message : undefined}
          />
        )}

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-elevari-slate">
          <input
            type="checkbox"
            checked={understood}
            onChange={(event) => setUnderstood(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--elevari-forest)]"
          />
          <span>Entiendo que eliminar mi cuenta es permanente y no se puede deshacer.</span>
        </label>

        {failure && failure.kind !== 'field' && (
          <div
            role="alert"
            className="rounded-xl border border-elevari-error/30 bg-elevari-error-soft px-4 py-3 text-sm leading-relaxed text-elevari-error"
          >
            <p>{failure.message}</p>
            {failure.kind === 'active_bookings' && (
              <Link href="/account" className="mt-2 inline-block font-semibold underline">
                Ver mis reservas
              </Link>
            )}
            {failure.kind === 'admin' && (
              <Link href="/legal/contact" className="mt-2 inline-block font-semibold underline">
                Contactar a soporte
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={deleting || undefined}
          className="elevari-btn-danger min-h-[48px] w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? 'Eliminando…' : 'Eliminar mi cuenta definitivamente'}
        </button>
        <Link href="/account" className="block text-center text-sm font-semibold text-elevari-forest">
          Mejor no, volver a mi cuenta
        </Link>
      </section>
    </form>
  );
}
