'use client';

import { createContext, useContext, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@/lib/api-client';

const UserContext = createContext<AuthUser | null>(null);

/** The signed-in user. Only available below AccountFrame, which renders its children once there is one. */
export function useAccountUser(): AuthUser {
  const user = useContext(UserContext);
  if (!user) throw new Error('useAccountUser must be used inside AccountFrame');
  return user;
}

function StateCard({ title, text, action }: { title: string; text: string; action: ReactNode }) {
  return (
    <div role="status" className="elevari-card-premium p-8 text-center">
      <h1 className="font-display text-xl text-elevari-slate">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-elevari-muted">{text}</p>
      <div className="mt-6 flex justify-center">{action}</div>
    </div>
  );
}

/** Page chrome and sign-in guard shared by every /account page. */
export default function AccountFrame({ children }: { children: ReactNode }) {
  const { user, loading, unavailable, refresh } = useAuth();
  const pathname = usePathname();

  let body: ReactNode;
  if (user) {
    body = <UserContext.Provider value={user}>{children}</UserContext.Provider>;
  } else if (loading) {
    body = (
      <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Cargando tu cuenta">
        <div className="h-24 rounded-3xl bg-elevari-sand" />
        <div className="h-48 rounded-3xl bg-elevari-sand" />
      </div>
    );
  } else if (unavailable) {
    body = (
      <StateCard
        title="No pudimos cargar tu cuenta"
        text="Revisa tu conexión e inténtalo de nuevo. Tu sesión sigue activa."
        action={<Button onClick={() => void refresh()}>Reintentar</Button>}
      />
    );
  } else {
    body = (
      <StateCard
        title="Inicia sesión para continuar"
        text="Tu sesión terminó o aún no has iniciado sesión."
        action={
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(pathname || '/account')}`}
            className="elevari-btn-primary min-h-[48px]"
          >
            Iniciar sesión
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <div className="mx-auto w-full max-w-2xl">{body}</div>
      </main>
    </>
  );
}
