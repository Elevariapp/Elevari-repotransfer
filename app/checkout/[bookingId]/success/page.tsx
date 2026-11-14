import Header from '@/components/Header';
import CheckoutSuccessClient from '@/components/checkout/CheckoutSuccessClient';

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ property?: string; mock?: string; payment_id?: string }>;
}) {
  const { bookingId } = await params;
  const { property: propertySlug, mock, payment_id: paymentId } = await searchParams;

  return (
    <>
      <Header sticky={false} />
      <main id="contenido" className="wana-container py-12 lg:py-16">
        <CheckoutSuccessClient
          bookingId={bookingId}
          propertySlug={propertySlug}
          paymentId={paymentId}
          isMock={mock === '1'}
        />
      </main>
    </>
  );
}
