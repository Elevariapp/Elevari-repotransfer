'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAccountUser } from '@/components/account/AccountFrame';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { wanaApi } from '@/lib/api-client';

// Same rule as the API (PATCH /auth/me).
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

interface Errors {
  name?: string;
  phone?: string;
  form?: string;
}

export default function ProfileForm() {
  const user = useAccountUser();
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.name ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const nameChanged = trimmedName !== (user.name ?? '');
  const phoneChanged = trimmedPhone !== (user.phone ?? '');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (nameChanged && !trimmedName) next.name = 'Escribe tu nombre.';
    if (phoneChanged && trimmedPhone && !PHONE_PATTERN.test(trimmedPhone)) {
      next.phone = 'Escribe un teléfono válido, por ejemplo +57 300 123 4567.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const { user: updated } = await wanaApi.updateProfile({
        ...(nameChanged ? { name: trimmedName } : {}),
        ...(phoneChanged ? { phone: trimmedPhone || null } : {}),
      });
      updateUser(updated);
      setName(updated.name ?? '');
      setPhone(updated.phone ?? '');
      toast.success('Perfil actualizado');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'No pudimos guardar los cambios.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="elevari-card-premium space-y-5 p-5 sm:p-6">
      <Input
        id="profile-name"
        name="name"
        label="Nombre"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="name"
        maxLength={120}
        error={errors.name}
      />
      <Input
        id="profile-phone"
        name="phone"
        type="tel"
        inputMode="tel"
        label="Teléfono"
        hint="Opcional. Lo usamos solo para coordinar tu estadía."
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        autoComplete="tel"
        maxLength={20}
        error={errors.phone}
      />
      <div>
        <Input
          id="profile-email"
          name="email"
          type="email"
          label="Correo"
          value={user.email}
          readOnly
          aria-readonly="true"
          className="cursor-not-allowed opacity-70"
        />
        <p className="mt-1.5 text-xs text-elevari-muted">
          Para cambiar tu correo,{' '}
          <Link href="/legal/contact" className="elevari-link">
            escríbenos
          </Link>
          .
        </p>
      </div>

      {errors.form && (
        <div
          role="alert"
          className="rounded-xl border border-elevari-error/30 bg-elevari-error-soft px-4 py-3 text-sm text-elevari-error"
        >
          {errors.form}
        </div>
      )}

      <Button type="submit" loading={saving} disabled={!nameChanged && !phoneChanged} fullWidth>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
