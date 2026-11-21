// Shapes mirror the Fastify API (api/src/routes/*). Field names are snake_case
// where the route serializes them that way; raw Prisma rows are camelCase.

export type UserRole = 'guest' | 'host' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PropertyMedia {
  id: string;
  type: 'image' | 'video';
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

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_per_night: number;
  max_guests: number;
  status: string;
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

export interface PropertiesResponse {
  data: Property[];
  meta: { limit: number; offset: number; count: number; total: number; sort: string };
}

export interface HostProperty {
  id: string;
  slug: string;
  title: string;
  status: string;
  city: string | null;
  cover_image: string | null;
  media_count: number;
}

export interface HostPropertiesResponse {
  data: HostProperty[];
}

export interface CreateHostPropertyBody {
  title: string;
  description: string;
  city: string;
  price_per_night: number;
  max_guests: number;
  amenities: string[];
}

export interface ElevariFees {
  base_amount: number;
  platform_fee_percent: number;
  platform_fee_amount: number;
  total_amount: number;
  total_charge_to_guest: number;
  host_receives: number;
  subtotal: number;
  nights: number;
  price_per_night: number;
}

export interface QuoteRequest {
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
}

export interface QuoteResponse extends QuoteRequest {
  nights: number;
  available: boolean;
  fees: ElevariFees;
  currency: string;
}

export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled';

export interface CreateBookingBody extends QuoteRequest {
  idempotency_key: string;
}

/** Raw Prisma booking row (camelCase) as returned by POST /bookings and GET /bookings/:id. */
export interface BookingRecord {
  id: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  guests: number;
  feesBreakdown: ElevariFees | null;
  property?: { id: string; slug: string; title: string; city: string | null; country: string };
}

export interface CreateBookingResponse {
  booking: BookingRecord;
  reused: boolean;
}

export interface BookingDetailResponse {
  booking: BookingRecord;
}

/** GET /bookings/me item. */
export interface MyBooking {
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

export interface MyBookingsResponse {
  data: MyBooking[];
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded';

export interface PaymentIntentBody {
  booking_id: string;
  idempotency_key: string;
  return_url: string;
  display_currency: 'COP';
  locale: 'es';
}

/**
 * POST /payments/intent. A fresh intent returns `payment_id` + `checkout_url`;
 * a reused intent returns `payment` (row) instead; an already paid booking
 * returns `already_paid: true`.
 */
export interface PaymentIntentResponse {
  payment_id?: string;
  payment?: { id: string; status: PaymentStatus };
  provider?: string;
  mode?: string;
  checkout_url?: string;
  already_paid?: boolean;
  amount?: number;
  currency?: string;
}

export interface PaymentSyncResponse {
  status: PaymentStatus;
  booking_id?: string;
  refund_required?: boolean;
}

export interface PaymentsByBookingResponse {
  payments: Array<{ id: string; status: PaymentStatus; idempotencyKey: string }>;
}
