// OG image route (/backend/og-image-generator) — public, no auth. Cache-aside against S3:
//   GET /og/{type}/{slug}.png  → if cached, 302 to the CDN; else generate, store, then 302.
// The PNG bytes are NEVER served through API Gateway — we 302 to the CloudFront /og/* behavior
// (→ og-images S3 bucket), so the image is delivered over the CDN and the binary stays off the API.
// og:image URLs point here (config.apiOrigin) so the first scrape populates S3 on demand.
import type { BffApp } from '../../shared/types/app';
import { getProfile } from '../profile/repository';
import { generateOgImage } from './generator';
import { objectExists, putImage } from '../../shared/s3/client';
import { config } from '../../shared/config';
import { NotFoundError } from '../../shared/errors/http-errors';

export function registerOgImage(app: BffApp): void {
  app.get('/og/:type/:filename', async (c) => {
    const { type, filename } = c.req.param();
    const slug = filename.replace(/\.png$/, '');
    if (type !== 'profile') throw new NotFoundError(`no og image for type ${type}`); // Phase 1: profile only

    const key = `${type}/${slug}.png`;
    if (!(await objectExists(key))) {
      const profile = await getProfile();
      if (!profile) throw new NotFoundError('profile not found');
      await putImage(key, await generateOgImage(profile));
    }
    // Deliver via the CDN (CloudFront /og/* → S3), not through the API.
    return c.redirect(`${config.spaOrigin}/og/${key}`, 302);
  });
}
