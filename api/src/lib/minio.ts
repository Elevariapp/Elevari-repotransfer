import {
  S3Client,
  PutObjectCommand,
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
    });
  }
  return client;
}

export function getPublicUrl(key: string): string {
  const { publicBase, bucket } = getConfig();
  if (publicBase.endsWith(bucket)) {
    return `${publicBase}/${key}`;
  }
  return `${publicBase.replace(/\/$/, '')}/${key}`;
}

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const { bucket } = getConfig();
  const s3 = getS3Client();

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return getPublicUrl(key);
}

export async function deleteObject(key: string): Promise<void> {
  const { bucket } = getConfig();
  const s3 = getS3Client();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
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
