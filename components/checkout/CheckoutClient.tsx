'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { analytics } from '@/lib/analytics';
import toast from 'react-hot-toast';
import { ApiError, wanaApi, type BookingDetail, type DisclosurePayload, type FxQuoteInfo } from '@/lib/api-client';
import { formatCop, formatDateRange } from '@/lib/format';
import { formatPropertyLocation } from '@/lib/property-location';
import PropertyThumb from '@/components/ui/PropertyThumb';
import PriceBreakdown from '@/components/ui/PriceBreakdown';
import CheckoutStepper from './CheckoutStepper';

interface CheckoutClientProps {
  booking: BookingDetail;
  propertySlug?: string;
  coverImage?: string | null;
}

function formatMinor(minor: number, currency: string): string {
  const major = minor / 100;
  return currency === 'USD'
    ? `US$${major.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : formatCop(major);
}

export default function CheckoutClient({ booking, propertySlug, coverImage }: CheckoutClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [disclosure, setDisclosure] = useState<DisclosurePayload | null>(null);
  const [quote, setQuote] = useState<FxQuoteInfo | null>(null);
  const paymentStartedRef = useRef(false);

  const fees = booking.feesBreakdown;
  const total = fees?.total_charge_to_guest ?? 0;
  const isInternational = (booking.property.country ?? 'CO') !== 'CO';

  useEffect(() => {
    analytics.startCheckout(booking.id, total);
  }, [booking.id, total]);

  /**
   * checkout_abandoned: fires when the guest leaves checkout without starting a
   * payment. Starting a payment (provider handoff) marks the flow as engaged.
   */
  useEffect(() => {
    let reported = false;
    const report = (reason: 'navigate_away' | 'page_hidden') => {
      if (reported || paymentStartedRef.current) return;
      reported = true;
      analytics.checkoutAbandoned({ bookingId: booking.id, value: total, reason });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') report('page_hidden');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      report('navigate_away');
    };
  }, [booking.id, total]);
  const checkIn = typeof booking.checkIn === 'string' ? booking.checkIn : String(booking.checkIn);
  const checkOut = typeof booking.checkOut === 'string' ? booking.checkOut : String(booking.checkOut);

  const goSuccess = () => {
    router.push(`/checkout/${booking.id}/success${propertySlug ? `?property=${propertySlug}` : ''}`);
  };

  if (booking.status === 'confirmed') {
    return (
      <div className="elevari-card-premium p-8 text-center">
        <p className="text-3xl text-elevari-forest">✓</p>
        <h2 className="mt-2 font-display text-2xl text-elevari-ink">Reserva confirmada</h2>
        <button type="button" onClick={goSuccess} className="elevari-btn-primary mt-6">
          Ver confirmación
        </button>
      </div>
    );
  }

  const startPayment = async (acceptedDisclosure?: DisclosurePayload) => {
    setLoading(true);
    paymentStartedRef.current = true;
    try {
      const returnUrl = `${window.location.origin}/checkout/${booking.id}/success`;
      const result = await wanaApi.createPaymentIntent({
        booking_id: booking.id,
        idempotency_key: `pay_${booking.id}_wompi`,
        return_url: returnUrl,
        display_currency: isInternational ? 'USD' : 'COP',
        quote_id: quote?.id,
        locale: 'es',
        disclosure: acceptedDisclosure
          ? { version: acceptedDisclosure.version, hash: acceptedDisclosure.hash, accepted: true }
          : undefined,
      });

      analytics.paymentStarted({
        bookingId: booking.id,
        value: total,
        provider: 'wompi',
        mode: result.mode ?? 'live',
      });

      if (result.already_paid) {
        toast.success('Esta reserva ya está pagada');
        goSuccess();
        return;
      }

      if (result.mode === 'mock') {
        await wanaApi.mockCompletePayment(result.payment_id);
        toast.success('Pago simulado (Wompi)');
        goSuccess();
        return;
      }

      if (result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }

      toast.error('No se pudo iniciar el pago');
    } catch (err) {
      // 428 — disclosure required for international checkout
      if (err instanceof ApiError && err.status === 428 && err.details) {
        const d = err.details as { disclosure?: DisclosurePayload; quote?: FxQuoteInfo };
        if (d.disclosure) setDisclosure(d.disclosure);
        if (d.quote) setQuote(d.quote);
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Error al iniciar pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CheckoutStepper current="review" />
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <section className="elevari-card p-6">
          <h2 className="elevari-section-title">Tu viaje</h2>
          <div className="mt-4 flex gap-4">
            <PropertyThumb src={coverImage} alt={booking.property.title} size="md" />
            <div>
              <p className="font-semibold text-elevari-slate">{booking.property.title}</p>
              <p className="text-sm text-elevari-muted">
                {formatPropertyLocation(booking.property.city)}
              </p>
              <p className="mt-2 text-sm text-elevari-muted">
                {formatDateRange(checkIn.slice(0, 10), checkOut.slice(0, 10))}
              </p>
              <p className="text-sm text-elevari-muted">
                {booking.guests} huésped{booking.guests > 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </section>

        <section className="elevari-card p-6">
          <h2 className="elevari-section-title">Método de pago</h2>
          <p className="mt-2 text-sm text-elevari-muted">
            Paga de forma segura con Wompi — tarjetas, PSE, Nequi y más.
          </p>

          {quote && disclosure ? (
            <div className="mt-6 rounded-xl border border-elevari-border bg-elevari-ivory/60 p-5">
              <h3 className="font-semibold text-elevari-slate">Detalle de tu pago internacional</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between font-semibold text-elevari-slate">
                  <span>Monto cobrado</span>
                  <span>{formatMinor(quote.charge_amount_minor, quote.charge_currency)}</span>
                </div>
                <div className="flex justify-between text-elevari-muted">
                  <span>Valor de referencia</span>
                  <span>{formatMinor(quote.display_amount_minor, quote.display_currency)}</span>
                </div>
                <div className="flex justify-between text-elevari-muted">
                  <span>Tasa de cambio</span>
                  <span>{quote.rate.toLocaleString('es-CO')} COP/USD</span>
                </div>
                <div className="flex justify-between text-elevari-muted">
                  <span>Cotización válida hasta</span>
                  <span>{new Date(quote.expires_at).toLocaleTimeString('es-CO')}</span>
                </div>
              </div>
              <p className="mt-4 rounded-lg bg-elevari-surface/70 p-3 text-xs leading-relaxed text-elevari-muted">
                {disclosure.text}
              </p>
              <button
                type="button"
                onClick={() => startPayment(disclosure)}
                disabled={loading}
                className="elevari-btn-primary mt-4 w-full"
              >
                {loading ? 'Preparando pago…' : 'Acepto y quiero pagar'}
              </button>
            </div>
          ) : (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => startPayment()}
                disabled={loading}
                className="elevari-btn-select elevari-btn-select-active disabled:opacity-50"
              >
                <div>
                  <span className="font-semibold text-elevari-slate">Wompi</span>
                  <p className="text-xs text-elevari-muted">Tarjetas, PSE, Nequi, Bancolombia</p>
                </div>
                <span className="rounded-full bg-elevari-forest-deep px-2.5 py-0.5 text-xs font-semibold text-white">
                  COP
                </span>
              </button>
              {loading && <p className="mt-3 text-center text-sm text-elevari-muted">Preparando pago…</p>}
            </div>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="elevari-card-premium p-6">
          <h3 className="font-semibold text-elevari-slate">Desglose</h3>
          {fees && (
            <PriceBreakdown
              className="mt-4"
              fees={fees}
              format={(amount) => formatCop(amount)}
              totalLabel="Total (COP)"
            />
          )}
          <p className="mt-4 text-xs text-elevari-muted">
            Todos los pagos se procesan en pesos colombianos (COP) a través de Wompi.
          </p>
        </div>
      </aside>
    </div>
    </>
  );
}
