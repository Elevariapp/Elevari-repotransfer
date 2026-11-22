import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

export function isMinioConfigured(): boolean {
  return Boolean(process.env.MINIO_ACCESS_KEY || process.env.MINIO_ENDPOINT);
}
