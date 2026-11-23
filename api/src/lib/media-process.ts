import sharp from 'sharp';

export interface ProcessedImage {
  full: Buffer;
  thumb: Buffer;
  card: Buffer;
}

/** The buffer is not a decodable image (spoofed mime type, corrupt file or oversized canvas). */
export class InvalidImageError extends Error {
  constructor(cause?: unknown) {
    super('Invalid image');
    this.name = 'InvalidImageError';
    this.cause = cause;
  }
}

// A tiny file can declare a gigantic canvas; refuse to decode it instead of exhausting memory.
const MAX_INPUT_PIXELS = 80_000_000;

export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  const input = () => sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();
  try {
    const full = await input().webp({ quality: 85 }).toBuffer();
    const thumb = await input().resize(480, 360, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
    const card = await input().resize(1200, 900, { fit: 'inside' }).webp({ quality: 82 }).toBuffer();
    return { full, thumb, card };
  } catch (err) {
    throw new InvalidImageError(err);
  }
}

export const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

const MP4_ATOMS = new Set(['ftyp', 'moov', 'mdat', 'free', 'wide', 'skip', 'pnot']);

/** Cheap container check so arbitrary binaries cannot be stored in the public bucket as "video". */
export function hasVideoSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'video/webm') {
    return buffer.length > 4 && buffer.readUInt32BE(0) === 0x1a45dfa3;
  }
  return buffer.length > 12 && MP4_ATOMS.has(buffer.toString('latin1', 4, 8));
}
