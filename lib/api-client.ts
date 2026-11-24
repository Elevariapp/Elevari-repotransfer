import { clearSession, getToken } from './auth-session';
import { humanizeApiError } from './api-errors';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// A stalled connection must end in an error the user can act on instead of a spinner that never stops.
const BROWSER_REQUEST_TIMEOUT_MS = 25_000;

function defaultSignal(): AbortSignal | undefined {
  if (typeof window === 'undefined' || typeof AbortSignal === 'undefined') return undefined;
  return typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(BROWSER_REQUEST_TIMEOUT_MS) : undefined;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getToken();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit & { auth?: boolean }): Promise<T> {
  const token = options?.auth ? getAuthToken() : null;
  // Fastify answers 400 to an empty body that claims to be JSON, so only declare it when there is one.
  const hasBody = typeof options?.body === 'string';

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      signal: options?.signal ?? defaultSignal(),
      next: options?.next,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new ApiError(humanizeApiError('', 'timeout'), 0, undefined, 'timeout');
    }
    throw new ApiError(humanizeApiError('Network error'), 0, undefined, 'network_error');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // The API no longer accepts this session (expired, revoked or account removed): drop it so the
    // UI falls back to the signed-out state. Skipped if another login replaced the token meanwhile.
    if (res.status === 401 && token && getAuthToken() === token) clearSession();
    const raw = typeof data.error === 'string' ? data.error : 'Request failed';
    const code = typeof data.code === 'string' ? data.code : undefined;
    throw new ApiError(humanizeApiError(raw, code, res.status), res.status, data.details, code);
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
  updated_at?: string | null;
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
  phone: string | null;
  role: 'guest' | 'host' | 'admin';
  /** False for accounts created with Google that never set a password. */
  has_password: boolean;
}

export interface AccountPayment {
  id: string;
  booking_id: string;
  property_title: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  refunded_amount: number;
  created_at: string;
}

export interface AccountInvoice {
  id: string;
  booking_id: string;
  property_title: string;
  invoice_number: string | null;
  status: 'issued' | 'pending';
  total: number | null;
  currency: string;
  created_at: string;
}

export type AppNotificationType =
  | 'booking_confirmed'
  | 'booking_expired'
  | 'booking_cancelled'
  | 'checked_in'
  | 'stay_completed'
  | 'host_new_booking'
  | 'host_booking_cancelled'
  | 'check_in_soon'
  | 'payment_failed'
  | 'password_changed';

export interface AppNotification {
  id: string;
  type: AppNotificationType | (string & {});
  title: string;
  body: string;
  booking_id: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  email: { reminders: boolean; host_bookings: boolean };
  push: { bookings: boolean; reminders: boolean; host_bookings: boolean };
}

export type NotificationPreferencesPatch = {
  email?: Partial<NotificationPreferences['email']>;
  push?: Partial<NotificationPreferences['push']>;
};

export type HostBookingScope = 'upcoming' | 'past' | 'cancelled';

export interface HostBookingRow {
  id: string;
  status: string;
  property: { id: string; title: string; slug: string };
  /** Null when the guest deleted their account. */
  guest_name: string | null;
  guests: number;
  check_in: string;
  check_out: string;
  nights: number;
  host_receives: number | null;
  currency: string;
  created_at: string;
}

export interface HostBookingsPage {
  data: HostBookingRow[];
  pagination: { page: number; page_size: number; total: number; has_more: boolean };
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

  updateProfile: (body: { name?: string; phone?: string | null }) =>
    request<{ user: AuthUser }>('/api/v1/auth/me', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(body),
    }),

  /** Returns a fresh token: changing the password revokes the one used for the request. */
  changePassword: (body: { current_password?: string; password: string }) =>
    request<{ success: boolean; token: string }>('/api/v1/auth/change-password', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),

  deleteAccount: (body: { password?: string; confirm_email?: string }) =>
    request<{ success: boolean }>('/api/v1/auth/delete-account', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),

  billing: () =>
    request<{ payments: AccountPayment[]; invoices: AccountInvoice[] }>('/api/v1/account/billing', {
      auth: true,
    }),

  notifications: () =>
    request<{ data: AppNotification[] }>('/api/v1/notifications', { auth: true }),

  getNotificationPreferences: () =>
    request<{ preferences: NotificationPreferences }>('/api/v1/notifications/preferences', { auth: true }),

  updateNotificationPreferences: (patch: NotificationPreferencesPatch) =>
    request<{ preferences: NotificationPreferences }>('/api/v1/notifications/preferences', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(patch),
    }),

  /** Returns a fresh token: the role travels inside the session, so the old one would still say "guest". */
  becomeHost: () => request<{ token: string; user: AuthUser }>('/api/v1/auth/become-host', { method: 'POST', auth: true }),

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
    request<{
      booking: { id: string; status: string };
      cancellation: { refund_amount: number; reason: string };
    }>(`/api/v1/bookings/${id}/cancel`, {
      method: 'POST',
      auth: true,
    }),

  listHostProperties: () =>
    request<{ data: HostPropertySummary[] }>('/api/v1/host/properties', { auth: true }),

  listHostBookings: (params: { scope?: HostBookingScope; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.scope) q.set('scope', params.scope);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    const query = q.toString();
    return request<HostBookingsPage>(`/api/v1/host/bookings${query ? `?${query}` : ''}`, { auth: true });
  },

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
    sort?: string;
    min_price?: number;
    max_price?: number;
    amenities?: string;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.city) q.set('city', params.city);
    if (params?.guests) q.set('guests', String(params.guests));
    if (params?.check_in) q.set('check_in', params.check_in);
    if (params?.check_out) q.set('check_out', params.check_out);
    if (params?.sort) q.set('sort', params.sort);
    if (params?.min_price !== undefined) q.set('min_price', String(params.min_price));
    if (params?.max_price !== undefined) q.set('max_price', String(params.max_price));
    if (params?.amenities) q.set('amenities', params.amenities);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    const query = q.toString();
    return request<{
      data: PropertyListItem[];
      meta: { count: number; limit: number; offset: number; total: number; sort: string };
    }>(`/api/v1/properties${query ? `?${query}` : ''}`, { next: { revalidate: 60 } });
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
  status: PropertyStatus;
  city: string | null;
  cover_image: string | null;
  media_count: number;
  pending_media_count?: number;
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
  provider: 'wompi';
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
