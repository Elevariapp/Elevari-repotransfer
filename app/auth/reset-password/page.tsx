import type { Metadata } from 'next';
import ResetPasswordClient from './ResetPasswordClient';

// The page may be opened with the reset token in the URL: never leak it through Referer or search engines.
export const metadata: Metadata = {
  title: 'Nueva contraseña',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordClient />;
}
