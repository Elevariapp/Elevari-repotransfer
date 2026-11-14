'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { wanaApi } from '@/lib/api-client';

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      toast.error('Mínimo 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await wanaApi.changePassword(password);
      toast.success('Contraseña actualizada');
      setPassword('');
      setConfirm('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 border-t border-elevari-border pt-8">
      <h2 className="font-display text-lg text-elevari-slate">Cambiar contraseña</h2>
      <label className="block space-y-1.5">
        <span className="wana-label">Nueva contraseña</span>
        <input
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="wana-input"
          required
        />
      </label>
      <label className="block space-y-1.5">
        <span className="wana-label">Confirmar</span>
        <input
          type="password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="wana-input"
          required
        />
      </label>
      <button type="submit" disabled={loading} className="wana-btn-primary min-h-[48px]">
        {loading ? 'Guardando…' : 'Actualizar contraseña'}
      </button>
    </form>
  );
}
