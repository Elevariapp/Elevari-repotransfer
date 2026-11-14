/**
 * Client-side marketing events (GA4 + Meta Pixel).
 * Server-side purchase events fire from API on payment confirmation.
 *
 * Phase 3 analytics contract (docs/design/CONVERSION_GUIDELINES.md):
 * view_property · select_dates · view_quote · start_checkout
 * payment_started · payment_completed · booking_confirmed · checkout_abandoned
 */

type EventParams = Record<string, string | number | boolean | undefined>;

/** Elevari canonical event → GA4 ecommerce event name */
const GA4_EVENT_MAP: Record<string, string> = {
  view_property: 'view_item',
  select_dates: 'select_dates',
  view_quote: 'view_quote',
  start_checkout: 'begin_checkout',
  payment_started: 'add_payment_info',
  payment_completed: 'purchase',
  booking_confirmed: 'purchase',
  checkout_abandoned: 'checkout_abandoned',
};

function getGaId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
}

function getMetaPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID;
}

export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === 'undefined') return;

  const gaId = getGaId();
  if (gaId && typeof window.gtag === 'function') {
    window.gtag('event', name, params ?? {});
    const ga4Name = GA4_EVENT_MAP[name];
    if (ga4Name && ga4Name !== name) {
      window.gtag('event', ga4Name, params ?? {});
    }
  }

  const pixelId = getMetaPixelId();
  if (pixelId && typeof window.fbq === 'function') {
    window.fbq('track', mapToMetaEvent(name), params ?? {});
  }
}

function mapToMetaEvent(name: string): string {
  const map: Record<string, string> = {
    view_property: 'ViewContent',
    view_item: 'ViewContent',
    start_checkout: 'InitiateCheckout',
    begin_checkout: 'InitiateCheckout',
    payment_started: 'AddPaymentInfo',
    payment_completed: 'Purchase',
    booking_confirmed: 'Purchase',
    purchase: 'Purchase',
    search: 'Search',
    sign_up: 'CompleteRegistration',
  };
  return map[name] ?? name;
}

export const analytics = {
  /** Phase 3 — property detail viewed */
  viewProperty: (property: { id: string; slug: string; title: string; price: number }) => {
    trackEvent('view_property', {
      item_id: property.id,
      item_slug: property.slug,
      item_name: property.title,
      value: property.price,
      currency: 'COP',
    });
  },

  /** Phase 3 — guest picked a stay range */
  selectDates: (params: { propertyId: string; checkIn?: string; checkOut?: string; nights?: number }) => {
    trackEvent('select_dates', {
      property_id: params.propertyId,
      check_in: params.checkIn,
      check_out: params.checkOut,
      nights: params.nights,
    });
  },

  /** Phase 3 — quote returned by the API */
  viewQuote: (params: { propertyId: string; nights: number; total: number; available: boolean }) => {
    trackEvent('view_quote', {
      property_id: params.propertyId,
      nights: params.nights,
      value: params.total,
      currency: 'COP',
      available: params.available,
    });
  },

  /** Phase 3 — checkout screen entered */
  startCheckout: (bookingId: string, value: number) => {
    trackEvent('start_checkout', {
      transaction_id: bookingId,
      value,
      currency: 'COP',
    });
  },

  /** Phase 3 — payment provider handoff started */
  paymentStarted: (params: { bookingId: string; value: number; provider: string; mode: string }) => {
    trackEvent('payment_started', {
      transaction_id: params.bookingId,
      value: params.value,
      currency: 'COP',
      payment_provider: params.provider,
      payment_mode: params.mode,
    });
  },

  /** Phase 3 — provider reported a completed payment */
  paymentCompleted: (bookingId: string, value: number) => {
    trackEvent('payment_completed', {
      transaction_id: bookingId,
      value,
      currency: 'COP',
    });
  },

  /** Phase 3 — booking confirmed by the server */
  bookingConfirmed: (bookingId: string, value: number) => {
    trackEvent('booking_confirmed', {
      transaction_id: bookingId,
      value,
      currency: 'COP',
    });
  },

  /** Phase 3 — checkout left without paying (fires once per booking) */
  checkoutAbandoned: (params: { bookingId: string; value: number; reason: 'navigate_away' | 'page_hidden' }) => {
    trackEvent('checkout_abandoned', {
      transaction_id: params.bookingId,
      value: params.value,
      currency: 'COP',
      reason: params.reason,
    });
  },

  /** Legacy aliases kept for existing call sites */
  beginCheckout: (bookingId: string, value: number) => analytics.startCheckout(bookingId, value),

  purchase: (bookingId: string, value: number) => {
    analytics.paymentCompleted(bookingId, value);
    analytics.bookingConfirmed(bookingId, value);
  },

  search: (term?: string) => {
    trackEvent('search', { search_term: term ?? 'properties' });
  },
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

