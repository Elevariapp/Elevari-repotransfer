import sharp from 'sharp';

export interface ProcessedImage {
  full: Buffer;
  thumb: Buffer;
  card: Buffer;
}

export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  const full = await sharp(buffer).rotate().webp({ quality: 85 }).toBuffer();
  const thumb = await sharp(buffer).rotate().resize(480, 360, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
  const card = await sharp(buffer).rotate().resize(1200, 900, { fit: 'inside' }).webp({ quality: 82 }).toBuffer();
  return { full, thumb, card };
}

export const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
