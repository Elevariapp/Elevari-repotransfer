'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Logo from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/components/i18n/useI18n';
import LanguageSwitch from '@/components/i18n/LanguageSwitch';
import GlobalSearchBar from '@/components/search/GlobalSearchBar';
import NotificationBell from '@/components/notifications/NotificationBell';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { whatsappContext } from '@/lib/whatsapp';

/** Cada enlace va a un destino distinto — sin duplicar /properties */
const navLinks = [
  { href: '/properties', shortLabel: 'collection', match: (p: string) => p === '/properties' || (p.startsWith('/properties') && !p.includes('glamping-wana')) },
  { href: '/properties/glamping-wana', shortLabel: 'featured', match: (p: string) => p.startsWith('/properties/glamping-wana') },
  { href: '/host/add-property', shortLabel: 'publish', match: (p: string) => p.startsWith('/host/add-property') },
  { href: '/legal/faq', shortLabel: 'faq', match: (p: string) => p.startsWith('/legal/faq') },
] as const;

export default function Header({ sticky = true }: { sticky?: boolean }) {
  const { t } = useI18n();
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
  // Support channel for visitors and hosts; the internal admin screens have no use for it.
  const whatsapp = pathname.startsWith('/admin') ? null : whatsappContext(pathname);
  const navLabel = (key: string) => t('Common', key);
  const isHost = user?.role === 'host';
  const isAdmin = user?.role === 'admin';

  return (
    <header className={`elevari-header z-50 overflow-x-clip ${sticky ? 'sticky top-0' : 'relative'}`}>
      <div className="elevari-container grid h-14 min-h-[3.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:h-16 lg:h-[4.25rem] lg:grid-cols-[auto_minmax(0,340px)_minmax(0,1fr)_auto] lg:gap-3 xl:gap-4">
        <div className="flex min-w-0 items-center justify-self-start">
          <span className="lg:hidden">
            <Logo compact onDark />
          </span>
          <span className="hidden lg:inline-flex">
            <Logo onDark />
          </span>
        </div>

        <div className="hidden min-w-0 lg:flex items-center">
          <GlobalSearchBar variant="compact" className="w-full" />
        </div>
        <nav className="hidden min-w-0 items-center justify-center gap-0.5 overflow-hidden lg:flex xl:gap-1">
          {navLinks.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`elevari-header-nav-link whitespace-nowrap ${active ? 'elevari-header-nav-link-active' : ''}`}
              >
                {navLabel(link.shortLabel)}
              </Link>
            );
          })}
          {isHost && (
            <Link
              href="/host"
              className={`elevari-header-nav-link ${pathname.startsWith('/host') && !pathname.startsWith('/host/add-property') ? 'elevari-header-nav-link-active' : ''}`}
            >
              {navLabel('hostDashboard')}
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className={`elevari-header-nav-link ${pathname.startsWith('/admin') ? 'elevari-header-nav-link-active' : ''}`}
            >
              {navLabel('admin')}
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <LanguageSwitch className="hidden sm:inline-flex" />
          {whatsapp && <WhatsAppLink variant="icon" tone="onDark" label={whatsapp.label} message={whatsapp.message} />}
          {!loading && user ? (
            <>
              <Link href="/account" className="elevari-header-account hidden max-w-[7rem] lg:inline xl:max-w-[9rem]">
                {user.name ?? user.email}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="elevari-btn-ghost hidden !px-3 !py-2 text-sm lg:inline-flex xl:!px-4"
              >
                {navLabel('logout')}
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="elevari-btn-ghost hidden !px-3 !py-2 text-sm lg:inline-flex xl:!px-4"
            >
              {navLabel('signIn')}
            </Link>
          )}

          <NotificationBell />

          <button
            type="button"
            ref={menuButtonRef}
            className="elevari-header-menu-btn lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="elevari-mobile-menu"
            aria-label={menuOpen ? navLabel('closeMenu') : navLabel('openMenu')}
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
        <div ref={mobilePanelRef} id="elevari-mobile-menu" className="elevari-header-mobile-panel lg:hidden">
          <nav className="elevari-container flex max-h-[calc(100dvh-3.5rem)] flex-col gap-1 overflow-y-auto py-4 sm:max-h-[calc(100dvh-4rem)]">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{navLabel('language')}</span>
              <LanguageSwitch className="w-full" />
            </div>
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
                {navLabel(link.shortLabel)}
              </Link>
            ))}
            {isHost && (
              <Link
                href="/host"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-white/85 min-h-[44px] hover:bg-white/10"
              >
                {navLabel('hostDashboard')}
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-white/85 min-h-[44px] hover:bg-white/10"
              >
                {navLabel('admin')}
              </Link>
            )}
            {!loading && user ? (
              <>
                <Link
                  href="/account"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm text-white/85 min-h-[44px] hover:bg-white/10"
                >
                  {navLabel('myAccount')}{user.name ? ` · ${user.name}` : ''}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="elevari-btn-ghost mt-1 justify-center min-h-[44px]"
                >
                  {navLabel('logout')}
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={closeMenu}
                className="elevari-btn-ghost mt-1 justify-center min-h-[44px]"
              >
                {navLabel('signIn')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
