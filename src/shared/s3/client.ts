// S3 client singleton + the og-images cache helpers (/backend/og-image-generator, /infrastructure/s3).
// The bucket name comes from SSM → the BFF env (OG_IMAGES_BUCKET); never hardcoded. The Lambda exec
// role grants GetObject/PutObject on this bucket only (api.tf og_cache statement).
import { S3Client, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const s3 = new S3Client({}); // region from the Lambda env

const bucket = (): string => process.env.OG_IMAGES_BUCKET ?? '';
const assetsBucket = (): string => process.env.ASSETS_BUCKET ?? '';

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

// Generic asset store (ASSETS_BUCKET) for app-managed uploads (avatars/, …). `key` is feature-relative
// (e.g. avatars/<sub>-<hash>.png); the object lands at `assets/<key>` because the CloudFront /assets/*
// behavior forwards the URI verbatim (it does NOT strip the matched prefix), so the public URL is
// /assets/<key>. Callers use a content-addressed key so this immutable cache is safe across re-uploads.
export async function putAsset(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: assetsBucket(),
      Key: `assets/${key}`,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

// Best-effort delete of a previously-stored asset (old avatar after a re-upload). Same `assets/<key>`
// mapping as putAsset. Failures are swallowed: the new object is already live, so an orphan is harmless.
export async function deleteAsset(key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: assetsBucket(), Key: `assets/${key}` }));
  } catch {
    /* orphaned object is harmless; never fail the request because cleanup failed */
  }
}
