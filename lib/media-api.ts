import { authHeaders } from '@/lib/auth-session';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface PropertyMediaItem {
  id: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
  status: string;
  content_type?: string | null;
  size_bytes?: number | null;
}

export async function uploadPropertyMedia(
  propertyId: string,
  file: File,
): Promise<{ media: PropertyMediaItem }> {
  const form = new FormData();
  form.append('property_id', propertyId);
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/media/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Upload failed');
  }
  return data as { media: PropertyMediaItem };
}

export async function listPropertyMediaPublic(propertyId: string): Promise<PropertyMediaItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/media/property/${propertyId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Failed to load media');
  return (data.media as PropertyMediaItem[]) ?? [];
}

export async function listPropertyMediaManage(propertyId: string): Promise<PropertyMediaItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/media/property/${propertyId}/manage`, {
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Failed to load media');
  return (data.media as PropertyMediaItem[]) ?? [];
}

export async function deletePropertyMedia(mediaId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/media/${mediaId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Delete failed');
  }
}
