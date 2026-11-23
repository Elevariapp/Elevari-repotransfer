'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAccountUser } from '@/components/account/AccountFrame';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ApiError, wanaApi } from '@/lib/api-client';
import { setSession } from '@/lib/auth-session';

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

interface Errors {
  current?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

export default function SecurityForm() {
  const user = useAccountUser();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [reveal, setReveal] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<'changed' | 'created' | null>(null);

  const hasPassword = user.has_password;
  const fieldType = reveal ? 'text' : 'password';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (hasPassword && !current) next.current = 'Escribe tu contraseña actual.';
    if (password.length < MIN_LENGTH) next.password = `Usa al menos ${MIN_LENGTH} caracteres.`;
    else if (password.length > MAX_LENGTH) next.password = `Usa como máximo ${MAX_LENGTH} caracteres.`;
    else if (hasPassword && password === current) next.password = 'La nueva contraseña debe ser distinta a la actual.';
    if (confirm !== password) next.confirm = 'Las contraseñas no coinciden.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const result = await wanaApi.changePassword({
        ...(hasPassword ? { current_password: current } : {}),
        password,
      });
      // Changing the password revokes the old session; the response carries the replacement.
      setSession(result.token);
      setDone(hasPassword ? 'changed' : 'created');
      setCurrent('');
      setPassword('');
      setConfirm('');
      toast.success(hasPassword ? 'Contraseña actualizada' : 'Contraseña creada');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invalid_current_password') {
        setErrors({ current: err.message });
      } else {
        setErrors({ form: err instanceof Error ? err.message : 'No pudimos actualizar la contraseña.' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div role="status" className="elevari-card-premium p-6 text-center sm:p-8">
        <span
          aria-hidden
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-elevari-fresh-soft text-xl text-elevari-forest"
        >
          ✓
        </span>
        <h2 className="mt-4 font-display text-xl text-elevari-slate">
          {done === 'changed' ? 'Contraseña actualizada' : 'Contraseña creada'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-elevari-muted">
          Por seguridad cerramos tu sesión en tus otros dispositivos y te enviamos un aviso por correo. Si no
          fuiste tú, escríbenos de inmediato.
        </p>
        <Link href="/account" className="elevari-btn-primary mt-6 min-h-[48px]">
          Volver a mi cuenta
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="elevari-card-premium space-y-5 p-5 sm:p-6">
      {!hasPassword && (
        <p className="rounded-xl border border-elevari-border bg-elevari-ivory/60 px-4 py-3 text-sm leading-relaxed text-elevari-muted">
          Iniciaste sesión con Google, así que aún no tienes contraseña. Crea una para entrar también con tu
          correo ({user.email}).
        </p>
      )}

      {hasPassword && (
        <Input
          id="security-current"
          name="current_password"
          type={fieldType}
          label="Contraseña actual"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          autoComplete="current-password"
          maxLength={MAX_LENGTH}
          error={errors.current}
        />
      )}
      <Input
        id="security-new"
        name="password"
        type={fieldType}
        label="Nueva contraseña"
        hint={`Mínimo ${MIN_LENGTH} caracteres.`}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        maxLength={MAX_LENGTH}
        error={errors.password}
      />
      <Input
        id="security-confirm"
        name="confirm_password"
        type={fieldType}
        label="Confirmar nueva contraseña"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        autoComplete="new-password"
        maxLength={MAX_LENGTH}
        error={errors.confirm}
      />

      <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-elevari-muted">
        <input
          type="checkbox"
          checked={reveal}
          onChange={(event) => setReveal(event.target.checked)}
          className="h-4 w-4 accent-[var(--elevari-forest)]"
        />
        Mostrar contraseñas
      </label>

      {errors.form && (
        <div
          role="alert"
          className="rounded-xl border border-elevari-error/30 bg-elevari-error-soft px-4 py-3 text-sm text-elevari-error"
        >
          {errors.form}
        </div>
      )}

      <Button type="submit" loading={saving} fullWidth>
        {saving ? 'Guardando…' : hasPassword ? 'Actualizar contraseña' : 'Crear contraseña'}
      </Button>

      {hasPassword && (
        <p className="text-center text-sm text-elevari-muted">
          ¿No recuerdas la actual?{' '}
          <Link href="/auth/forgot-password" className="elevari-link">
            Recupérala por correo
          </Link>
        </p>
      )}
    </form>
  );
}
