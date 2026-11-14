import { getToken } from './auth-session';
import { humanizeApiError } from './api-errors';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getToken();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit & { auth?: boolean }): Promise<T> {
  const token = options?.auth ? getAuthToken() : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    next: options?.next,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw = typeof data.error === 'string' ? data.error : 'Request failed';
    const code = typeof data.code === 'string' ? data.code : undefined;
    throw new ApiError(humanizeApiError(raw, code), res.status, data.details);
  }

  return data as T;
}

export interface PropertyListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_per_night: number;
  max_guests: number;
  city: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  amenities?: unknown;
  cover_image: string | null;
  rating: number | null;
  review_count: number;
  media?: unknown[];
  reviews?: Array<{ id: string; rating: number; comment?: string | null }>;
}

export interface BookingQuote {
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  available: boolean;
  fees: {
    base_amount: number;
    platform_fee_percent: number;
    platform_fee_amount: number;
    total_amount: number;
    total_charge_to_guest: number;
    host_receives: number;
    subtotal: number;
    nights: number;
    price_per_night: number;
  };
  currency: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'guest' | 'host' | 'admin';
}

export const wanaApi = {
  health: () => request<{ status: string; database: string }>('/health'),

  login: (email: string, password: string, turnstile_token?: string) =>
    request<{ token: string; user: AuthUser }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, turnstile_token }),
    }),

  register: (data: {
    email: string;
    password: string;
    name: string;
    role?: 'guest' | 'host';
    turnstile_token?: string;
  }) =>
    request<{ token: string; user: AuthUser }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  googleAuth: (credential: string, options?: { turnstile_token?: string; role?: 'guest' | 'host' }) =>
    request<{ token: string; user: AuthUser; is_new_user?: boolean }>('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        credential,
        turnstile_token: options?.turnstile_token,
        role: options?.role,
      }),
    }),

  me: () => request<{ user: AuthUser | null }>('/api/v1/auth/me', { auth: true }),

  changePassword: (password: string) =>
    request<{ success: boolean }>('/api/v1/auth/change-password', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ password }),
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ success: boolean }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  myBookings: () =>
    request<{ data: GuestBookingRow[] }>('/api/v1/bookings/me', { auth: true }),

  cancelBooking: (id: string) =>
    request<{ booking: { id: string; status: string } }>(`/api/v1/bookings/${id}/cancel`, {
      method: 'POST',
      auth: true,
    }),

  listHostProperties: () =>
    request<{ data: HostPropertySummary[] }>('/api/v1/host/properties', { auth: true }),

  createHostProperty: (body: {
    title: string;
    description: string;
    city: string;
    price_per_night: number;
    max_guests?: number;
    amenities?: string[];
  }) =>
    request<{ property: HostPropertySummary }>('/api/v1/host/properties', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),

  adminOverview: () =>
    request<AdminOverview>('/api/v1/admin/overview', { auth: true }),

  adminBookings: () =>
    request<{ data: AdminBookingRow[] }>('/api/v1/admin/bookings', { auth: true }),

  adminProperties: () =>
    request<{ data: AdminPropertyRow[] }>('/api/v1/admin/properties', { auth: true }),

  adminUpdatePropertyStatus: (id: string, status: PropertyStatus) =>
    request<{ property: { id: string; status: string; slug: string } }>(
      `/api/v1/admin/properties/${id}/status`,
      { method: 'PATCH', auth: true, body: JSON.stringify({ status }) },
    ),

  adminPendingMedia: () =>
    request<{ data: AdminPendingMedia[] }>('/api/v1/admin/media/pending', { auth: true }),

  adminApproveMedia: (id: string) =>
    request<{ media: { id: string; status: string } }>(`/api/v1/admin/media/${id}/approve`, {
      method: 'POST',
      auth: true,
    }),

  adminRejectMedia: (id: string) =>
    request<{ media: { id: string; status: string } }>(`/api/v1/admin/media/${id}/reject`, {
      method: 'POST',
      auth: true,
    }),

  adminPendingInvoices: () =>
    request<{ data: AdminPendingInvoiceRow[] }>('/api/v1/admin/invoices/pending', { auth: true }),

  adminRetryInvoice: (id: string) =>
    request<{ success: boolean }>(`/api/v1/admin/invoices/${id}/retry`, {
      method: 'POST',
      auth: true,
    }),

  listProperties: (params?: {
    city?: string;
    guests?: number;
    check_in?: string;
    check_out?: string;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set('city', params.city);
    if (params?.guests) q.set('guests', String(params.guests));
    if (params?.check_in) q.set('check_in', params.check_in);
    if (params?.check_out) q.set('check_out', params.check_out);
    if (params?.limit) q.set('limit', String(params.limit));
    const query = q.toString();
    return request<{ data: PropertyListItem[]; meta: { count: number } }>(
      `/api/v1/properties${query ? `?${query}` : ''}`,
      { next: { revalidate: 60 } },
    );
  },

  getProperty: (slug: string) =>
    request<PropertyListItem & { media: unknown[] }>(`/api/v1/properties/${slug}`, {
      next: { revalidate: 60 },
    }),

  getAvailability: (propertyId: string) =>
    request<{
      property_id: string;
      blocked_ranges: Array<{ start: string; end: string; source: string }>;
    }>(`/api/v1/properties/${propertyId}/availability`),

  quoteBooking: (body: {
    property_id: string;
    check_in: string;
    check_out: string;
    guests: number;
  }) => request<BookingQuote>('/api/v1/bookings/quote', { method: 'POST', body: JSON.stringify(body) }),

  createBooking: (body: {
    property_id: string;
    check_in: string;
    check_out: string;
    guests: number;
    idempotency_key: string;
    guest_email?: string;
    guest_name?: string;
  }) =>
    request<{ booking: unknown; reused: boolean }>('/api/v1/bookings', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),

  getBooking: (id: string) =>
    request<{ booking: BookingDetail }>(`/api/v1/bookings/${id}`, { auth: true }),

  createPaymentIntent: (body: {
    booking_id: string;
    idempotency_key: string;
    return_url: string;
    display_currency?: 'COP' | 'USD';
    quote_id?: string;
    locale?: 'es' | 'en';
    disclosure?: { version: string; hash: string; accepted: true };
  }) =>
    request<PaymentIntentResponse>('/api/v1/payments/intent', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),

  syncPayment: (paymentId: string) =>
    request<{ status: string; booking_id?: string }>(`/api/v1/payments/${paymentId}/sync`, {
      method: 'POST',
      auth: true,
    }),

  mockCompletePayment: (paymentId: string) =>
    request<{ status: string; booking_id: string }>(`/api/v1/payments/${paymentId}/mock-complete`, {
      method: 'POST',
      auth: true,
    }),
};

export interface GuestBookingRow {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
  guests: number;
  property_title: string;
  property_slug: string;
  property_city: string | null;
  created_at: string;
  total?: number;
}

export interface HostPropertySummary {
  id: string;
  slug: string;
  title: string;
  status: string;
  city: string | null;
  cover_image: string | null;
  media_count: number;
}

export type PropertyStatus = 'draft' | 'published' | 'unavailable' | 'maintenance';

export interface AdminOverview {
  properties_total: number;
  bookings_confirmed: number;
  media_pending: number;
  invoices_pending: number;
}

export interface AdminBookingRow {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
  guests: number;
  guest_email: string;
  guest_name: string | null;
  property_title: string;
  property_slug: string;
  created_at: string;
}

export interface AdminPropertyRow {
  id: string;
  slug: string;
  title: string;
  status: PropertyStatus;
  city: string | null;
  price_per_night: number;
  host_email: string;
  media_count: number;
  bookings_count: number;
  created_at: string;
}

export interface AdminPendingMedia {
  id: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
  property_id: string;
  property_title: string;
  property_slug: string;
  created_at: string;
}

export interface AdminPendingInvoiceRow {
  id: string;
  bookingId: string;
  status: string;
  guestEmail: string | null;
  guestName: string | null;
  alegraError: string | null;
  alegraInvoiceId: string | null;
  createdAt: string;
  booking?: {
    id: string;
    status: string;
    property?: { title: string };
  };
}

export interface BookingDetail {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  feesBreakdown: BookingQuote['fees'] | null;
  guestEmail: string | null;
  guestName: string | null;
  property: {
    id: string;
    slug: string;
    title: string;
    city: string | null;
    country?: string;
  };
  payments: Array<{
    id: string;
    status: string;
    provider: string;
    amount: string | number;
    currency: string;
    externalId?: string | null;
  }>;
}

export interface PaymentIntentResponse {
  payment_id: string;
  provider: 'wompi' | 'bold' | 'stripe';
  mode: 'live' | 'mock';
  checkout_url?: string;
  client_secret?: string;
  publishable_key?: string;
  amount: number;
  currency: string;
  reused?: boolean;
  already_paid?: boolean;
  quote?: FxQuoteInfo;
}

export interface FxQuoteInfo {
  id: string;
  charge_currency: string;
  charge_amount_minor: number;
  display_currency: string;
  display_amount_minor: number;
  rate: number;
  expires_at: string;
}

export interface DisclosurePayload {
  version: string;
  locale: 'es' | 'en';
  text: string;
  hash: string;
}
