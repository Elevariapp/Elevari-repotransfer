'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

/** Oculta el footer en flujos de auth (pantalla completa dedicada). */
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/auth')) return null;
  return <Footer />;
}
