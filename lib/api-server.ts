import { cookies } from 'next/headers';
import { ApiError, type BookingDetail } from './api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function serverRequest<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('wana_token')?.value;

  if (!token) {
    throw new ApiError('Authentication required', 401);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error ?? 'Request failed', res.status, data.details);
  }

  return data as T;
}

/** Authenticated booking fetch for Server Components (reads wana_token cookie). */
export async function getServerBooking(id: string) {
  return serverRequest<{ booking: BookingDetail }>(`/api/v1/bookings/${id}`);
}
