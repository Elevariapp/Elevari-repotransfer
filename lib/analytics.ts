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
  property_clicked: 'select_item',
  property_opened: 'view_item',
  checkout_started: 'begin_checkout',
  reservation_completed: 'purchase',
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
    property_clicked: 'ViewContent',
    property_opened: 'ViewContent',
    start_checkout: 'InitiateCheckout',
    begin_checkout: 'InitiateCheckout',
    checkout_started: 'InitiateCheckout',
    payment_started: 'AddPaymentInfo',
    payment_completed: 'Purchase',
    booking_confirmed: 'Purchase',
    reservation_completed: 'Purchase',
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

  /** Phase 4 — catalog filter applied */
  filterApplied: (params: { key: string; value: string; activeFilters: number }) => {
    trackEvent('filter_applied', {
      filter_key: params.key,
      filter_value: params.value,
      active_filters: params.activeFilters,
    });
  },

  /** Phase 4 — catalog sort changed */
  sortApplied: (params: { sort: string; activeFilters: number }) => {
    trackEvent('sort_applied', { sort: params.sort, active_filters: params.activeFilters });
  },

  /** Phase 4 — results list rendered */
  catalogViewed: (params: { results: number; total?: number; activeFilters: number; sort: string }) => {
    trackEvent('catalog_viewed', {
      results: params.results,
      total: params.total,
      active_filters: params.activeFilters,
      sort: params.sort,
    });
  },

  /** Phase 4 — property card clicked from a results list */
  propertyClicked: (params: {
    slug: string;
    position?: number;
    sort?: string;
    activeFilters?: number;
  }) => {
    trackEvent('property_clicked', {
      item_slug: params.slug,
      position: params.position,
      sort: params.sort,
      active_filters: params.activeFilters,
    });
  },

  /** Phase 4 — property detail opened */
  propertyOpened: (params: { slug: string; price?: number }) => {
    trackEvent('property_opened', {
      item_slug: params.slug,
      value: params.price,
      currency: 'COP',
    });
  },

  /** Phase 4 — canonical funnel aliases (same payloads as start_checkout/purchase) */
  checkoutStarted: (bookingId: string, value: number) => {
    analytics.startCheckout(bookingId, value);
    trackEvent('checkout_started', {
      transaction_id: bookingId,
      value,
      currency: 'COP',
    });
  },

  reservationCompleted: (bookingId: string, value: number) => {
    analytics.bookingConfirmed(bookingId, value);
    trackEvent('reservation_completed', {
      transaction_id: bookingId,
      value,
      currency: 'COP',
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

