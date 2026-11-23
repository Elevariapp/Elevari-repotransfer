'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import AccountIcon, { type AccountIconName } from '@/components/account/AccountIcon';
import { useAccountUser } from '@/components/account/AccountFrame';
import GuestBookingsList from '@/components/account/GuestBookingsList';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { cx } from '@/lib/cx';

const ROLE_LABELS = { guest: 'Huésped', host: 'Anfitrión', admin: 'Administrador' } as const;

const ROW =
  'flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-elevari-ivory/60 focus-visible:bg-elevari-ivory/60';

function RowBody({
  icon,
  label,
  hint,
  danger,
  chevron = true,
}: {
  icon: AccountIconName;
  label: string;
  hint?: string;
  danger?: boolean;
  chevron?: boolean;
}) {
  return (
    <>
      <span
        className={cx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          danger ? 'bg-elevari-error-soft text-elevari-error' : 'bg-elevari-fresh-soft text-elevari-forest',
        )}
      >
        <AccountIcon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx('block text-sm font-semibold', danger ? 'text-elevari-error' : 'text-elevari-slate')}>
          {label}
        </span>
        {hint && <span className="block text-xs text-elevari-muted">{hint}</span>}
      </span>
      {chevron && (
        <span aria-hidden className="text-lg text-elevari-muted">
          ›
        </span>
      )}
    </>
  );
}

function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="elevari-eyebrow px-1">
        {title}
      </h2>
      <ul className="elevari-card mt-3 divide-y divide-elevari-border overflow-hidden">{children}</ul>
    </section>
  );
}

function LinkRow({
  href,
  ...body
}: { href: string } & Parameters<typeof RowBody>[0]) {
  return (
    <li>
      <Link href={href} className={ROW}>
        <RowBody {...body} />
      </Link>
    </li>
  );
}

export default function AccountHub() {
  const user = useAccountUser();
  const { logout } = useAuth();
  const router = useRouter();
  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="space-y-8">
      <section className="elevari-card-premium flex items-center gap-4 p-5 sm:p-6">
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-elevari-forest font-display text-xl font-semibold text-white"
        >
          {(user.name ?? user.email).trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="elevari-eyebrow">Mi cuenta</p>
          <h1 className="truncate font-display text-xl text-elevari-slate sm:text-2xl">{user.name ?? user.email}</h1>
          <p className="truncate text-sm text-elevari-muted">{user.email}</p>
        </div>
        <Badge tone="brand" className="hidden shrink-0 sm:inline-flex">
          {ROLE_LABELS[user.role]}
        </Badge>
      </section>

      {user.role !== 'guest' && (
        <ul className="elevari-card overflow-hidden">
          <LinkRow
            href={isAdmin ? '/admin' : '/host'}
            icon={isAdmin ? 'shield' : 'home'}
            label={isAdmin ? 'Panel de administración' : 'Panel de anfitrión'}
            hint={isAdmin ? 'Reservas, propiedades y moderación' : 'Tus espacios, reservas y fotos'}
          />
        </ul>
      )}

      {!isAdmin && <GuestBookingsList />}

      <Group id="account-settings" title="Configuración">
        <LinkRow href="/account/profile" icon="user" label="Editar perfil" hint="Nombre y teléfono" />
        <LinkRow
          href="/account/security"
          icon="lock"
          label={user.has_password ? 'Contraseña y seguridad' : 'Crear una contraseña'}
          hint={user.has_password ? 'Cambia tu contraseña' : 'Para entrar también con tu correo'}
        />
        {!isAdmin && (
          <>
            <LinkRow href="/account/payments" icon="card" label="Pagos" hint="Historial y reembolsos" />
            <LinkRow href="/account/billing" icon="receipt" label="Facturación" hint="Facturas electrónicas" />
          </>
        )}
      </Group>

      <Group id="account-legal" title="Legal y ayuda">
        <LinkRow href="/legal/terms" icon="document" label="Términos y condiciones" />
        <LinkRow href="/legal/privacy" icon="shield" label="Política de privacidad" />
        <LinkRow href="/legal/contact" icon="chat" label="Contacto y soporte" />
      </Group>

      <Group id="account-session" title="Sesión">
        <li>
          <button type="button" onClick={handleLogout} className={ROW}>
            <RowBody icon="logout" label="Cerrar sesión" chevron={false} />
          </button>
        </li>
        {!isAdmin && (
          <LinkRow href="/account/delete" icon="trash" label="Eliminar mi cuenta" hint="Esta acción es permanente" danger />
        )}
      </Group>
    </div>
  );
}
