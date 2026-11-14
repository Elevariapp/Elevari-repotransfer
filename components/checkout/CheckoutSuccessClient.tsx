'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { wanaApi } from '@/lib/api-client';
import { analytics } from '@/lib/analytics';

export default function CheckoutSuccessClient({
  bookingId,
  propertySlug,
  paymentId,
  isMock,
}: {
  bookingId: string;
  propertySlug?: string;
  paymentId?: string;
  isMock?: boolean;
}) {
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'pending'>('loading');
  const purchaseTracked = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    async function sync() {
      try {
        if (isMock && paymentId) {
          await wanaApi.mockCompletePayment(paymentId);
        }

        const { booking } = await wanaApi.getBooking(bookingId);

        if (booking.status !== 'confirmed') {
          const pending = booking.payments?.find(
            (p) => p.status !== 'succeeded' && p.externalId,
          );
          const toSync = paymentId ?? pending?.id;
          if (toSync) {
            await wanaApi.syncPayment(toSync);
          }
        }

        const refreshed = await wanaApi.getBooking(bookingId);
        if (!cancelled) {
          const confirmed = refreshed.booking.status === 'confirmed';
          setStatus(confirmed ? 'confirmed' : 'pending');
          if (confirmed && !purchaseTracked.current) {
            purchaseTracked.current = true;
            const fees = refreshed.booking.feesBreakdown;
            const value = fees?.total_charge_to_guest ?? 0;
            analytics.paymentCompleted(bookingId, value);
            analytics.bookingConfirmed(bookingId, value);
          }
        }
      } catch {
        if (!cancelled) setStatus('pending');
      }
    }

    sync();
    const interval = setInterval(() => {
      attempts += 1;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        return;
      }
      sync();
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bookingId, paymentId, isMock]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
          status === 'confirmed'
            ? 'bg-elevari-success-soft text-elevari-success'
            : 'bg-elevari-sand text-elevari-muted'
        }`}
      >
        {status === 'loading' ? '…' : status === 'confirmed' ? '✓' : '⏳'}
      </div>

      <h1 className="mt-6 font-display text-3xl text-elevari-ink">
        {status === 'confirmed'
          ? '¡Reserva confirmada!'
          : status === 'loading'
            ? 'Verificando pago…'
            : 'Pago en proceso'}
      </h1>

      <p className="mt-3 text-elevari-muted">
        {status === 'confirmed'
          ? 'Te enviaremos los detalles a tu correo. ¡Nos vemos pronto!'
          : status === 'loading'
            ? 'Estamos confirmando tu pago. Esta página se actualizará automáticamente.'
            : 'El pago sigue en proceso. Revisa tu correo o tu cuenta en unos minutos; si persiste, contáctanos.'}
      </p>

      <div className="mt-10 flex flex-col gap-3 text-sm">
        {status === 'pending' && (
          <Link href="/account" className="font-medium text-elevari-forest hover:underline">
            Ir a mi cuenta
          </Link>
        )}
        {propertySlug && (
          <Link href={`/properties/${propertySlug}`} className="font-medium text-elevari-forest hover:underline">
            Volver a la propiedad
          </Link>
        )}
        <Link href="/properties" className="text-elevari-muted hover:text-elevari-forest">
          Explorar más espacios
        </Link>
      </div>
    </div>
  );
}
