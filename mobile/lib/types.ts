export type UserRole = 'guest' | 'host' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  phone: string | null;
  // false for accounts created with Google: they confirm sensitive actions by typing their e-mail.
  has_password: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User | null;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// The previous token is revoked server-side as soon as the password changes: store `token` at once.
export interface ChangePasswordResponse {
  success: boolean;
  token?: string;
}

export interface ApiErrorBody {
  error?: string;
  code?: string;
  details?: unknown;
}

export interface PropertyMedia {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  sortOrder: number;
}

export interface PropertyReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at?: string;
}

export type PropertyStatus = 'draft' | 'published' | 'unavailable' | 'maintenance';

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_per_night: number;
  max_guests: number;
  status: PropertyStatus;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  amenities: unknown;
  updated_at: string | null;
  cover_image: string | null;
  media: PropertyMedia[];
  rating: number | null;
  review_count: number;
  reviews?: PropertyReview[];
}

export interface PropertyListResponse {
  data: Property[];
  meta: { limit: number; offset: number; count: number; total: number; sort: string };
}

export interface AvailabilityResponse {
  property_id: string;
  blocked_ranges: Array<{ start: string; end: string; source: string }>;
}

export interface FeesBreakdown {
  base_amount: number;
  platform_fee_percent: number;
  platform_fee_amount: number;
  total_charge_to_guest: number;
  nights: number;
  price_per_night: number;
}

export interface QuoteResponse {
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  available: boolean;
  fees: FeesBreakdown;
  currency: string;
}

export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled';

export interface BookingSummary {
  id: string;
  status: BookingStatus;
  check_in: string;
  check_out: string;
  guests: number;
  property_title: string;
  property_slug: string;
  property_city: string | null;
  created_at: string;
  total?: number;
}

export interface BookingsMeResponse {
  data: BookingSummary[];
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded';

export interface BookingPayment {
  id: string;
  status: PaymentStatus;
  externalId?: string | null;
  idempotencyKey?: string | null;
  createdAt?: string;
}

// `GET /bookings/:id` and `POST /bookings` return the raw booking row (camelCase).
export interface Booking {
  id: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  guests: number;
  feesBreakdown: FeesBreakdown | null;
  property?: { id: string; slug: string; title: string; city: string | null; country: string };
  payments?: BookingPayment[];
}

export interface BookingResponse {
  booking: Booking;
}

export interface CreateBookingResponse {
  booking: Booking;
  reused: boolean;
}

export interface CancelBookingResponse {
  booking: Booking;
  cancellation: {
    refund_eligible: boolean;
    refund_amount: number;
    reason: string;
  };
}

export interface PaymentIntentResponse {
  payment_id?: string;
  payment?: BookingPayment;
  provider?: string;
  mode?: 'live' | 'mock';
  checkout_url?: string | null;
  reused?: boolean;
  already_paid?: boolean;
}

export interface PaymentSyncResponse {
  status: PaymentStatus;
  booking_id?: string;
}

export interface BillingPayment {
  id: string;
  booking_id: string;
  property_title: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  refunded_amount: number;
  created_at: string;
}

export type InvoiceStatus = 'issued' | 'pending';

export interface BillingInvoice {
  id: string;
  booking_id: string;
  property_title: string | null;
  invoice_number: string | null;
  status: InvoiceStatus;
  total: number | null;
  currency: string;
  created_at: string;
}

export interface BillingResponse {
  payments: BillingPayment[];
  invoices: BillingInvoice[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  booking_id: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
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
  status: BookingStatus;
  property: { id: string; title: string; slug: string };
  // Null when the guest deleted their account.
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

export interface HostProperty {
  id: string;
  slug: string;
  title: string;
  status: PropertyStatus;
  city: string | null;
  cover_image: string | null;
  media_count: number;
  pending_media_count?: number;
}

export interface HostPropertiesResponse {
  data: HostProperty[];
}

export interface CreateHostPropertyInput {
  title: string;
  description: string;
  city: string;
  price_per_night: number;
  max_guests: number;
  amenities: string[];
}

export interface CreateHostPropertyResponse {
  property: HostProperty;
}
