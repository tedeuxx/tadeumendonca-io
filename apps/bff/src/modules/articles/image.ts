// Inline article-image processing (/backend/lambda-handler), mirroring the avatar pipeline but tuned for
// body images: the long edge is capped while the aspect ratio is preserved (NO square crop), with jimp
// (pure-JS — no native binary in the bundle). Output is PNG: lossless keeps screenshots/diagrams crisp
// and preserves transparency (trade-off: larger than JPEG for photos — fine behind the immutable CDN).
// Kept separate from routes.ts so the route is testable without the heavy image pipeline.
import { createHash } from 'node:crypto';
import { Jimp } from 'jimp';
import { AppError, BadRequestError } from '../../shared/errors/http-errors';

export const ARTICLE_IMAGE_MAX_DIM = 1600; // px — cap on the long edge (aspect preserved, no upscale)
const MAX_DECODED_BYTES = 10 * 1024 * 1024; // 10 MB cap on the decoded upload (before resize)

export interface ProcessedImage {
  body: Uint8Array;
  contentType: 'image/png';
  width: number;
  height: number;
  // Content-addressed key: articles/<hash>.png. The hash is over the RESIZED bytes, so an identical
  // re-upload is idempotent (same key, immutable CDN cache) and any change yields a new key.
  key: string;
}

// Decode a base64 image, reject oversized/undecodable input, downscale only if larger than the cap.
export async function processArticleImage(base64: string): Promise<ProcessedImage> {
  const input = Buffer.from(base64, 'base64');
  if (input.length === 0) throw new BadRequestError('invalid image data');
  if (input.length > MAX_DECODED_BYTES) throw new AppError(413, 'payload_too_large', 'image too large (max 10 MB)');

  let image;
  try {
    image = await Jimp.read(input);
  } catch {
    throw new BadRequestError('unsupported or corrupt image');
  }

  // Only shrink — never upscale a small source. scaleToFit fits within the box, preserving aspect.
  const longEdge = Math.max(image.bitmap.width, image.bitmap.height);
  if (longEdge > ARTICLE_IMAGE_MAX_DIM) image.scaleToFit({ w: ARTICLE_IMAGE_MAX_DIM, h: ARTICLE_IMAGE_MAX_DIM });

  const body = await image.getBuffer('image/png');
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 16);
  return { body, contentType: 'image/png', width: image.bitmap.width, height: image.bitmap.height, key: `articles/${hash}.png` };
}
