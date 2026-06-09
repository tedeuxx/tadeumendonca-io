// OG image route (/backend/og-image-generator) — public, no auth. Cache-aside against S3:
//   GET /og/{type}/{slug}.png  → if cached, 302 to the CDN; else generate, store, then 302.
// The PNG bytes are NEVER served through API Gateway — we 302 to the CloudFront /og/* behavior
// (→ og-images S3 bucket), so the image is delivered over the CDN and the binary stays off the API.
// og:image URLs point here (config.apiOrigin) so the first scrape populates S3 on demand.
import type { BffApp } from '../../shared/types/app';
import { getProfile } from '../profile/repository';
import { objectExists, putImage } from '../../shared/s3/client';
import { config } from '../../shared/config';
import { NotFoundError } from '../../shared/errors/http-errors';

export function registerOgImage(app: BffApp): void {
  app.get('/og/:type/:filename', async (c) => {
    const { type, filename } = c.req.param();
    const slug = filename.replace(/\.png$/, '');
    if (type !== 'profile') throw new NotFoundError(`no og image for type ${type}`); // Phase 1: profile only

    // S3 key = the full public path under /og (CloudFront's /og/* behavior forwards the URI verbatim
    // to the bucket — it does NOT strip the matched prefix), so the object must live at og/<type>/<slug>.png.
    const path = `og/${type}/${slug}.png`;
    if (!(await objectExists(path))) {
      const profile = await getProfile();
      if (!profile) throw new NotFoundError('profile not found');
      // Lazy-import the generator: it statically imports the resvg .wasm + Inter .woff (embedded by
      // esbuild's binary loader at build, inlined into this single bundle). Keeping it out of the
      // module's top-level imports means tooling that just loads the app (the OpenAPI build script
      // under tsx, vitest) never has to resolve those binary assets — only a live /og request does.
      const { generateOgImage } = await import('./generator');
      await putImage(path, await generateOgImage(profile));
    }
    // Deliver via the CDN (CloudFront /og/* → S3), not through the API.
    return c.redirect(`${config.spaOrigin}/${path}`, 302);
  });
}
