import Header from '@/components/Header';
import CheckoutClient from '@/components/checkout/CheckoutClient';
import { wanaApi, ApiError } from '@/lib/api-client';
import { getServerBooking } from '@/lib/api-server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ property?: string }>;
}) {
  const { bookingId } = await params;
  const { property: propertySlug } = await searchParams;

  let booking: Awaited<ReturnType<typeof getServerBooking>>['booking'];
  try {
    const res = await getServerBooking(bookingId);
    booking = res.booking;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect(`/auth/login?redirect=${encodeURIComponent(`/checkout/${bookingId}`)}`);
    }
    notFound();
  }

  if (booking.status === 'confirmed') {
    redirect(`/checkout/${bookingId}/success${propertySlug ? `?property=${propertySlug}` : ''}`);
  }

  let coverImage: string | null = null;
  if (propertySlug) {
    try {
      const prop = await wanaApi.getProperty(propertySlug);
      coverImage = prop.cover_image;
    } catch {
      coverImage = null;
    }
  }

  if (booking.status !== 'pending_payment') {
    return (
      <>
        <Header sticky={false} />
        <main id="contenido" className="wana-container py-14">
          <div className="wana-card mx-auto max-w-md p-8 text-center">
            <p className="text-elevari-muted">Esta reserva no está disponible para pago ({booking.status}).</p>
            <Link href="/properties" className="wana-btn-primary mt-6 inline-flex">
              Ver propiedades
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header sticky={false} />
      <main id="contenido" className="wana-container py-8 lg:py-12">
        <header className="mb-8">
          <p className="wana-eyebrow">Checkout</p>
          <h1 className="mt-2 font-display text-3xl text-elevari-slate sm:text-4xl">Confirma y paga</h1>
        </header>
        <CheckoutClient booking={booking as never} propertySlug={propertySlug} coverImage={coverImage} />
      </main>
    </>
  );
}
