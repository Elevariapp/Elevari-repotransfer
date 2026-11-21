import { cookies } from 'next/headers';
import { ApiError, type BookingDetail } from './api-client';
import { apiBase } from './api-base';



async function serverRequest<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('elevari_token')?.value;

  if (!token) {
    throw new ApiError('Authentication required', 401);
  }

  const res = await fetch(`${apiBase()}${path}`, {
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

/** Authenticated booking fetch for Server Components (reads elevari_token cookie). */
export async function getServerBooking(id: string) {
  return serverRequest<{ booking: BookingDetail }>(`/api/v1/bookings/${id}`);
}
