'use client';

import { usePathname } from 'next/navigation';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';

// Focused or dense screens where a floating card would cover controls.
const NO_FLOATING = ['/auth', '/admin', '/host'];
// Money and account forms, and the install page itself: no install pitch there.
const NO_INSTALL = ['/checkout', '/account', '/app'];

const under = (pathname: string, prefixes: readonly string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/**
 * The only floating UI on the public site: the app-install card (phones only, rarely). WhatsApp no
 * longer floats: it lives in the header, the footer and the booking, checkout and help pages
 * (components/whatsapp/WhatsAppLink.tsx), so nothing can cover a CTA, the sticky booking bar or the
 * search form. The card sits in a fixed stack that rises above the property page's sticky booking bar.
 */
export default function FloatingActions() {
  const pathname = usePathname() ?? '/';
  const { mode, install, dismiss } = useInstallPrompt();
  const showInstall = mode && !under(pathname, NO_FLOATING) && !under(pathname, NO_INSTALL);

  return (
    <>
      <ServiceWorkerRegister />
      {showInstall && (
        <div className="elevari-floating-stack">
          <InstallPrompt mode={mode} onInstall={install} onDismiss={dismiss} />
        </div>
      )}
    </>
  );
}
