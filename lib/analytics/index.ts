/**
 * Client-side analytics for the Elevari web storefront.
 *
 * Emits conversion/funnel events to the browser dataLayer (GTM-compatible)
 * and keeps an in-memory queue for testing/debugging.
 *
 * All methods are safe to call server-side (no-op) and client-side.
 */

import { track, getEvents, clearEvents } from '@/lib/conversion/analytics';

type AnalyticsEventName =
  | 'view_property'
  | 'property_opened'
  | 'catalog_viewed'
  | 'filter_applied'
  | 'sort_applied'
  | 'property_clicked'
  | 'start_checkout'
  | 'checkout_abandoned'
  | 'payment_completed'
  | 'booking_confirmed';

interface Analytics {
  viewProperty: (payload: { id: string; slug: string; title: string; price: number }) => void;
  propertyOpened: (payload: { slug: string; price: number }) => void;
  catalogViewed: (payload: { results: number; total?: number; activeFilters: number; sort: string }) => void;
  filterApplied: (payload: { key: string; value: string | number; activeFilters: number }) => void;
  sortApplied: (payload: { sort: string; activeFilters: number }) => void;
  propertyClicked: (payload: { slug: string; position?: number; sort?: string; activeFilters?: number }) => void;
  startCheckout: (bookingId: string, total: number) => void;
  checkoutAbandoned: (payload: { bookingId: string; value: number; reason: 'navigate_away' | 'page_hidden' }) => void;
  paymentCompleted: (bookingId: string, value: number) => void;
  bookingConfirmed: (bookingId: string, value: number) => void;
  track: (eventName: string, payload?: Record<string, unknown>) => void;
  getEvents: () => Array<{ name: string; payload?: Record<string, unknown>; timestamp: number }>;
  clearEvents: () => void;
}

function event(name: AnalyticsEventName, payload: Record<string, unknown>) {
  track(name, payload);
}

export const analytics: Analytics = {
  viewProperty: (payload) => event('view_property', payload),
  propertyOpened: (payload) => event('property_opened', payload),
  catalogViewed: (payload) => event('catalog_viewed', payload),
  filterApplied: (payload) => event('filter_applied', payload),
  sortApplied: (payload) => event('sort_applied', payload),
  propertyClicked: (payload) => event('property_clicked', payload),
  startCheckout: (bookingId, total) => event('start_checkout', { bookingId, total }),
  checkoutAbandoned: (payload) => event('checkout_abandoned', payload),
  paymentCompleted: (bookingId, value) => event('payment_completed', { bookingId, value }),
  bookingConfirmed: (bookingId, value) => event('booking_confirmed', { bookingId, value }),
  track,
  getEvents,
  clearEvents,
};

export default analytics;
export type { AnalyticsEventName };
