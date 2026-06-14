// Avatar image processing (/backend/lambda-handler). Decodes a user-supplied image, normalizes it to a
// small square PNG with jimp (pure-JS — no native binary to ship in the Lambda bundle), and derives a
// content-addressed key so re-uploads bust the immutable CDN cache. Kept separate from routes.ts so the
// route is testable without exercising the (heavy) image pipeline.
import { createHash } from 'node:crypto';
import { Jimp } from 'jimp';
import { AppError, BadRequestError } from '../../shared/errors/http-errors';

export const AVATAR_SIZE = 256; // px — the single rendered avatar size (square)
const MAX_DECODED_BYTES = 5 * 1024 * 1024; // 5 MB cap on the *decoded* upload (before resize)

export interface ProcessedAvatar {
  body: Uint8Array;
  contentType: 'image/png';
  // Feature-relative key: avatars/<sub>-<hash>.png. The hash is over the RESIZED bytes, so an identical
  // re-upload is idempotent (same key) and any change yields a new key (cache-bust).
  key: string;
}

// Decode a base64 image, reject oversized/undecodable input, then cover-crop to a square PNG.
export async function processAvatar(sub: string, base64: string): Promise<ProcessedAvatar> {
  const input = Buffer.from(base64, 'base64');
  if (input.length === 0) throw new BadRequestError('invalid image data');
  if (input.length > MAX_DECODED_BYTES) throw new AppError(413, 'payload_too_large', 'image too large (max 5 MB)');

  let image;
  try {
    image = await Jimp.read(input);
  } catch {
    throw new BadRequestError('unsupported or corrupt image');
  }

  const resized = image.cover({ w: AVATAR_SIZE, h: AVATAR_SIZE });
  const body = await resized.getBuffer('image/png');
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 16);
  return { body, contentType: 'image/png', key: `avatars/${sub}-${hash}.png` };
}
