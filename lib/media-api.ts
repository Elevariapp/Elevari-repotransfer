import { clearSession, getToken } from '@/lib/auth-session';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Same limits as the API (`api/src/lib/media-process.ts`); nginx allows 80 MB request bodies. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
export const MAX_MEDIA_PER_PROPERTY = 60;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MEDIA_ACCEPT = [...IMAGE_TYPES, ...VIDEO_TYPES].join(',');
export const MEDIA_FORMATS_HINT = 'JPG, PNG, WebP o GIF hasta 10 MB · MP4, WebM o MOV hasta 80 MB';

// Browsers often send no type for .mov/.webm files; the API falls back to the extension too.
const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

export const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión de nuevo para continuar.';
export const NETWORK_ERROR_MESSAGE =
  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

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

export class MediaApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'MediaApiError';
  }
}

function mediaKind(file: File): 'image' | 'video' | null {
  let type = file.type.split(';')[0].trim().toLowerCase();
  if (!type || type === 'application/octet-stream') {
    type = EXTENSION_TYPES[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? '';
  }
  if (IMAGE_TYPES.includes(type)) return 'image';
  if (VIDEO_TYPES.includes(type)) return 'video';
  return null;
}

/** Client-side pre-check so people learn about a bad file before waiting for the upload. */
export function validateMediaFile(file: File): string | null {
  const kind = mediaKind(file);
  if (!kind) {
    return `«${file.name}» no tiene un formato compatible. Usa JPG, PNG, WebP, GIF, MP4, WebM o MOV.`;
  }
  if (file.size === 0) return `«${file.name}» está vacío.`;
  if (kind === 'image' && file.size > MAX_IMAGE_BYTES) {
    return `«${file.name}» supera el máximo de 10 MB para imágenes.`;
  }
  if (kind === 'video' && file.size > MAX_VIDEO_BYTES) {
    return `«${file.name}» supera el máximo de 80 MB para videos.`;
  }
  return null;
}

/**
 * Picks a Spanish message for a failed API call. Our API answers with a Spanish `error` plus a domain
 * `code`; framework and proxy errors (Fastify, rate limit, nginx HTML) carry none, so they are mapped by status.
 */
export function apiErrorMessage(status: number, body: unknown, fallback: string): string {
  const { error, code } = (body && typeof body === 'object' ? body : {}) as {
    error?: unknown;
    code?: unknown;
  };
  if (typeof error === 'string' && error && typeof code === 'string' && !code.startsWith('FST_')) {
    return error;
  }
  if (status === 401) return SESSION_EXPIRED_MESSAGE;
  if (status === 403) return 'Tu cuenta no tiene permiso para hacer esto.';
  if (status === 404) return 'No encontramos lo que buscabas.';
  if (status === 413) {
    return 'El archivo es demasiado grande. Las imágenes pueden pesar hasta 10 MB y los videos hasta 80 MB.';
  }
  if (status === 429) return 'Hiciste muchas solicitudes seguidas. Espera un momento e inténtalo de nuevo.';
  if (status >= 500) return 'Tuvimos un problema al procesar la solicitud. Inténtalo de nuevo en unos minutos.';
  return fallback;
}

function codeOf(body: unknown): string | undefined {
  const code = (body as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

/** Same rule as lib/api-client: a 401 means the API no longer accepts this session, unless a newer login replaced it. */
export function dropSessionOn401(status: number, sentToken: string | null) {
  if (status === 401 && sentToken && getToken() === sentToken) clearSession();
}

async function mediaRequest<T>(
  path: string,
  init: RequestInit & { auth?: boolean },
  fallback: string,
): Promise<T> {
  const { auth, ...fetchInit } = init;
  const token = auth ? getToken() : null;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1${path}`, {
      ...fetchInit,
      headers: token ? { ...fetchInit.headers, Authorization: `Bearer ${token}` } : fetchInit.headers,
    });
  } catch {
    throw new MediaApiError(NETWORK_ERROR_MESSAGE, 0, 'NETWORK_ERROR');
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    dropSessionOn401(res.status, token);
    throw new MediaApiError(apiErrorMessage(res.status, data, fallback), res.status, codeOf(data));
  }
  return data as T;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function uploadPropertyMedia(
  propertyId: string,
  file: File,
  options: { onProgress?: (percent: number) => void } = {},
): Promise<{ media: PropertyMediaItem }> {
  const invalid = validateMediaFile(file);
  if (invalid) return Promise.reject(new MediaApiError(invalid, 400, 'INVALID_UPLOAD'));

  // property_id goes first so the API can check ownership before it reads the file.
  const form = new FormData();
  form.append('property_id', propertyId);
  form.append('file', file);

  // XMLHttpRequest instead of fetch: it is the only way to report upload progress.
  return new Promise((resolve, reject) => {
    const token = getToken();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/v1/media/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 10 * 60 * 1000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      const data = parseJson(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300 && data && typeof data === 'object' && 'media' in data) {
        resolve(data as { media: PropertyMediaItem });
        return;
      }
      dropSessionOn401(xhr.status, token);
      reject(
        new MediaApiError(
          apiErrorMessage(xhr.status, data, 'No pudimos subir el archivo. Inténtalo de nuevo.'),
          xhr.status,
          codeOf(data),
        ),
      );
    };
    xhr.onerror = () => reject(new MediaApiError(NETWORK_ERROR_MESSAGE, 0, 'NETWORK_ERROR'));
    xhr.ontimeout = () =>
      reject(
        new MediaApiError(
          'La subida tardó demasiado. Revisa tu conexión e inténtalo con un archivo más liviano.',
          0,
          'TIMEOUT',
        ),
      );
    xhr.send(form);
  });
}

export async function listPropertyMediaPublic(propertyId: string): Promise<PropertyMediaItem[]> {
  const data = await mediaRequest<{ media?: PropertyMediaItem[] }>(
    `/media/property/${encodeURIComponent(propertyId)}`,
    {},
    'No pudimos cargar las fotos.',
  );
  return data.media ?? [];
}

export async function listPropertyMediaManage(propertyId: string): Promise<PropertyMediaItem[]> {
  const data = await mediaRequest<{ media?: PropertyMediaItem[] }>(
    `/media/property/${encodeURIComponent(propertyId)}/manage`,
    { auth: true },
    'No pudimos cargar las fotos y videos.',
  );
  return data.media ?? [];
}

export async function deletePropertyMedia(mediaId: string): Promise<void> {
  await mediaRequest<unknown>(
    `/media/${encodeURIComponent(mediaId)}`,
    { method: 'DELETE', auth: true },
    'No pudimos eliminar el archivo.',
  );
}
