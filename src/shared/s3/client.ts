// S3 client singleton + the og-images cache helpers (/backend/og-image-generator, /infrastructure/s3).
// The bucket name comes from SSM → the BFF env (OG_IMAGES_BUCKET); never hardcoded. The Lambda exec
// role grants GetObject/PutObject on this bucket only (api.tf og_cache statement).
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export const s3 = new S3Client({}); // region from the Lambda env

const bucket = (): string => process.env.OG_IMAGES_BUCKET ?? '';

export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch (err) {
    const code = (err as { name?: string; $metadata?: { httpStatusCode?: number } });
    if (code.name === 'NotFound' || code.$metadata?.httpStatusCode === 404) return false;
    throw err; // a real error (perms, throttling) must surface, not masquerade as a cache miss
  }
}

export async function putImage(key: string, body: Uint8Array, contentType = 'image/png'): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      // Long, immutable — the key is deterministic (type/slug); regen = overwrite + CloudFront invalidate.
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}
