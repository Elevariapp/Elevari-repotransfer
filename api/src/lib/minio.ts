import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

let client: S3Client | null = null;

function getConfig() {
  const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = process.env.MINIO_PORT ?? '9000';
  const useSsl = process.env.MINIO_USE_SSL === 'true';
  const protocol = useSsl ? 'https' : 'http';
  const bucket = process.env.MINIO_BUCKET ?? 'wana-media';

  return {
    bucket,
    endpointUrl: `${protocol}://${endpoint}:${port}`,
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'wana_minio',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'wana_minio_password',
    publicBase:
      process.env.MINIO_PUBLIC_URL ?? `${protocol}://${endpoint}:${port}/${bucket}`,
  };
}

export function getS3Client(): S3Client {
  if (!client) {
    const cfg = getConfig();
    client = new S3Client({
      endpoint: cfg.endpointUrl,
      region: 'us-east-1',
      credentials: {
        accessKeyId: cfg.accessKey,
        secretAccessKey: cfg.secretKey,
      },
      forcePathStyle: true,
      // Fail fast when storage is down instead of hanging until the proxy times out.
      maxAttempts: 2,
      requestHandler: { connectionTimeout: 5_000, requestTimeout: 60_000 },
    });
  }
  return client;
}

/** Raised when the object store rejects or cannot be reached (never carries user input). */
export class StorageError extends Error {
  constructor(public readonly cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = 'StorageError';
  }
}

export function getPublicUrl(key: string): string {
  const { publicBase, bucket } = getConfig();
  if (publicBase.endsWith(bucket)) {
    return `${publicBase}/${key}`;
  }
  return `${publicBase.replace(/\/$/, '')}/${key}`;
}

/** Inverse of getPublicUrl: returns the object key for one of our public URLs, or null. */
export function keyFromPublicUrl(url: string): string | null {
  const prefix = getPublicUrl('');
  if (url.startsWith(prefix) && url.length > prefix.length) {
    return url.slice(prefix.length);
  }
  // URLs stored before MINIO_PUBLIC_URL changed still contain "/<bucket>/<key>".
  try {
    const marker = `/${getConfig().bucket}/`;
    const { pathname } = new URL(url);
    const at = pathname.indexOf(marker);
    return at >= 0 && pathname.length > at + marker.length ? pathname.slice(at + marker.length) : null;
  } catch {
    return null;
  }
}

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const { bucket } = getConfig();
  const s3 = getS3Client();

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  } catch (err) {
    throw new StorageError(err);
  }

  return getPublicUrl(key);
}

export async function deleteObject(key: string): Promise<void> {
  const { bucket } = getConfig();
  const s3 = getS3Client();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Bucket for sensitive objects (host identity documents). `deploy/scripts/storage-hardening.sh`
 * creates it with `mc anonymous set none`, so nothing stored here is reachable without the API.
 */
function privateBucket(): string {
  return process.env.MINIO_PRIVATE_BUCKET ?? 'wana-private';
}

export async function ensurePrivateBucket(): Promise<void> {
  const s3 = getS3Client();
  const Bucket = privateBucket();
  try {
    await s3.send(new HeadBucketCommand({ Bucket }));
  } catch {
    try {
      await s3.send(new CreateBucketCommand({ Bucket }));
    } catch (err) {
      // Racing another instance that created it first is fine.
      if (!/BucketAlreadyOwnedByYou|BucketAlreadyExists/i.test(String(err))) {
        throw new StorageError(err);
      }
    }
  }
}

/** Stores an identity document. Returns the object key, never a public URL. */
export async function uploadPrivateBuffer(key: string, body: Buffer, contentType: string): Promise<string> {
  const s3 = getS3Client();
  const Bucket = privateBucket();
  const put = () => s3.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));

  try {
    await put();
  } catch (err) {
    if (!/NoSuchBucket/i.test(String(err))) throw new StorageError(err);
    // The bucket is normally created by storage-hardening.sh; create it on a fresh install.
    await ensurePrivateBucket();
    try {
      await put();
    } catch (retryErr) {
      throw new StorageError(retryErr);
    }
  }
  return key;
}

/** Reads a private object for an admin review. */
export async function downloadPrivateObject(key: string): Promise<Buffer> {
  const s3 = getS3Client();
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: privateBucket(), Key: key }));
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) throw new Error('empty object');
    return Buffer.from(bytes);
  } catch (err) {
    throw new StorageError(err);
  }
}

/**
 * Creates the media bucket and its anonymous read-only policy when missing.
 * Retries while the storage container is still starting; never throws.
 */
export async function ensureBucket(log: { info: (m: string) => void; warn: (m: string) => void }): Promise<void> {
  const { bucket } = getConfig();
  const s3 = getS3Client();

  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      try {
        await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        log.info(`[storage] bucket ${bucket} created`);
      }
      await s3.send(
        new PutBucketPolicyCommand({
          Bucket: bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          }),
        }),
      );
      log.info(`[storage] bucket ${bucket} ready (public read)`);
      return;
    } catch (err) {
      log.warn(`[storage] bucket setup attempt ${attempt}/10 failed: ${err instanceof Error ? err.message : String(err)}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

export function isMinioConfigured(): boolean {
  return Boolean(process.env.MINIO_ACCESS_KEY || process.env.MINIO_ENDPOINT);
}
