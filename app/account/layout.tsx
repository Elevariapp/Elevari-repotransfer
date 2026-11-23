import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AccountFrame from '@/components/account/AccountFrame';

export const metadata: Metadata = {
  title: { default: 'Mi cuenta | Elevari', template: '%s | Mi cuenta | Elevari' },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountFrame>{children}</AccountFrame>;
}
