import type { Metadata } from 'next';
import Header from '@/components/Header';
import VerifyPageClient from './VerifyPage.client';

export const metadata: Metadata = {
  title: 'Verificar identidad',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <>
      <Header />
      <VerifyPageClient />
    </>
  );
}
