'use client';

import { usePathname } from 'next/navigation';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import WhatsAppLauncher from '@/components/whatsapp/WhatsAppLauncher';

// Focused or dense screens where a floating widget would cover controls.
const NO_FLOATING = ['/auth', '/admin', '/host'];
// Money and account forms: no install pitch while the person is in the middle of them.
const NO_INSTALL = ['/checkout', '/account'];

const under = (pathname: string, prefixes: readonly string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/**
 * The only floating UI on the public site: an app-install card (phones only, rarely) above the
 * WhatsApp launcher. They share one fixed stack so they can never overlap each other, and the stack
 * rises above the property page's sticky booking bar.
 */
export default function FloatingActions() {
  const pathname = usePathname() ?? '/';
  const { mode, install, dismiss } = useInstallPrompt();

  return (
    <>
      <ServiceWorkerRegister />
      {!under(pathname, NO_FLOATING) && (
        <div className="elevari-floating-stack">
          {mode && !under(pathname, NO_INSTALL) && (
            <InstallPrompt mode={mode} onInstall={install} onDismiss={dismiss} />
          )}
          <WhatsAppLauncher pathname={pathname} />
        </div>
      )}
    </>
  );
}
