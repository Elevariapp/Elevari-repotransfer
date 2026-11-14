'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Logo from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

/** Cada enlace va a un destino distinto — sin duplicar /properties */
const navLinks = [
  { href: '/properties', label: 'Colección', shortLabel: 'Colección', match: (p: string) => p === '/properties' || (p.startsWith('/properties') && !p.includes('glamping-wana')) },
  { href: '/properties/glamping-wana', label: 'Glamping destacado', shortLabel: 'Destacado', match: (p: string) => p.startsWith('/properties/glamping-wana') },
  { href: '/host/add-property', label: 'Publicar', shortLabel: 'Publicar', match: (p: string) => p.startsWith('/host/add-property') },
  { href: '/legal/faq', label: 'FAQ', shortLabel: 'FAQ', match: (p: string) => p.startsWith('/legal/faq') },
] as const;

export default function Header({ sticky = true }: { sticky?: boolean }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  /** Disclosure behaviour: Escape closes and returns focus to the trigger. */
  useEffect(() => {
    if (!menuOpen) return;
    mobilePanelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`wana-header z-50 overflow-x-clip ${sticky ? 'sticky top-0' : ''}`}>
      <div className="wana-container grid h-14 min-h-[3.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:h-16 lg:h-[4.25rem] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4">
        <div className="flex min-w-0 items-center justify-self-start">
          <span className="lg:hidden">
            <Logo compact onDark />
          </span>
          <span className="hidden lg:inline-flex">
            <Logo onDark />
          </span>
        </div>

        <nav className="hidden min-w-0 items-center justify-center gap-0.5 lg:flex xl:gap-1">
          {navLinks.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`wana-header-nav-link ${active ? 'wana-header-nav-link-active' : ''}`}
              >
                <span className="xl:hidden">{link.shortLabel}</span>
                <span className="hidden xl:inline">{link.label}</span>
              </Link>
            );
          })}
          {user?.role === 'host' && (
            <Link
              href="/host"
              className={`wana-header-nav-link ${pathname.startsWith('/host') && !pathname.startsWith('/host/add-property') ? 'wana-header-nav-link-active' : ''}`}
            >
              Mi panel
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`wana-header-nav-link ${pathname.startsWith('/admin') ? 'wana-header-nav-link-active' : ''}`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {!loading && user ? (
            <>
              <Link href="/account" className="wana-header-account hidden max-w-[7rem] lg:inline xl:max-w-[9rem]">
                {user.name ?? user.email}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="wana-btn-ghost hidden !px-3 !py-2 text-sm lg:inline-flex xl:!px-4"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="wana-btn-ghost hidden !px-3 !py-2 text-sm lg:inline-flex xl:!px-4"
            >
              Iniciar sesión
            </Link>
          )}

          <button
            type="button"
            ref={menuButtonRef}
            className="wana-header-menu-btn lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="elevari-mobile-menu"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div ref={mobilePanelRef} id="elevari-mobile-menu" className="wana-header-mobile-panel lg:hidden">
          <nav className="wana-container flex max-h-[calc(100dvh-3.5rem)] flex-col gap-1 overflow-y-auto py-4 sm:max-h-[calc(100dvh-4rem)]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] ${
                  link.match(pathname)
                    ? 'bg-white/10 text-white'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'host' && (
              <Link
                href="/host"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-white/85 min-h-[44px] hover:bg-white/10"
              >
                Mi panel
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-white/85 min-h-[44px] hover:bg-white/10"
              >
                Admin
              </Link>
            )}
            {!loading && user ? (
              <>
                <Link
                  href="/account"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm text-white/85 min-h-[44px] hover:bg-white/10"
                >
                  Mi cuenta{user.name ? ` · ${user.name}` : ''}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="wana-btn-ghost mt-1 justify-center min-h-[44px]"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={closeMenu}
                className="wana-btn-ghost mt-1 justify-center min-h-[44px]"
              >
                Iniciar sesión
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
