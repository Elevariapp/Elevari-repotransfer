import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import HostDashboard from '@/components/host/HostDashboard';
import HostPageClient from './HostPage.client';

export const metadata: Metadata = {
  title: 'Tus propiedades',
  robots: { index: false, follow: false },
};

export default function HostPage() {
  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <HostPageClient />
      </main>
    </>
  );
}
