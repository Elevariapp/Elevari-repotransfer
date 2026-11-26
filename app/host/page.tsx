import type { Metadata } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import HostDashboard from '@/components/host/HostDashboard';
import { wanaApi } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Tus propiedades',
  robots: { index: false, follow: false },
};

type VerificationStatus = {
  id_verified: boolean;
  id_verified_at: string | null;
  verification_id: string | null;
  verification_status: string | null;
};

export default function HostPage() {
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  useEffect(() => {
    let active = true;
    wanaApi
      .verificationStatus()
      .then((s) => {
        if (active) {
          setVerification(s);
          setVerificationLoading(false);
        }
      })
      .catch(() => {
        if (active) setVerificationLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="elevari-eyebrow">Anfitrión</p>
            <h1 className="mt-2 font-display text-3xl text-elevari-slate">Tus propiedades</h1>
            <p className="mt-2 text-elevari-muted">
              Revisa el estado de cada espacio, gestiona sus fotos y videos y consulta tus reservas e ingresos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!verificationLoading && verification && !verification.id_verified && (
              <Link
                href="/host/verify"
                className="elevari-btn-ghost inline-flex min-h-[44px] shrink-0"
              >
                Verificar identidad
              </Link>
            )}
            <Link href="/host/bookings" className="elevari-btn-ghost inline-flex min-h-[44px] shrink-0">
              Reservas
            </Link>
            <Link href="/host/analytics" className="elevari-btn-ghost inline-flex min-h-[44px] shrink-0">
              Analíticas
            </Link>
            <Link href="/host/add-property" className="elevari-btn-primary inline-flex min-h-[44px] shrink-0">
              + Publicar espacio
            </Link>
          </div>
        </header>
        <HostDashboard />
      </main>
    </>
  );
}
