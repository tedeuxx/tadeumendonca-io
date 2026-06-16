// OG image route (/backend/og-image-generator) — public, no auth. Cache-aside against S3:
//   GET /og/{type}/{slug}.png  → if cached, 302 to the CDN; else generate, store, then 302.
// The PNG bytes are NEVER served through API Gateway — we 302 to the CloudFront /og/* behavior
// (→ og-images S3 bucket), so the image is delivered over the CDN and the binary stays off the API.
// og:image URLs point here (config.apiOrigin) so the first scrape populates S3 on demand.
import type { BffApp } from '../../shared/types/app';
import { getProfile } from '../profile/repository';
import { getPost } from '../posts/repository';
import { getBySlug } from '../articles/repository';
import { objectExists, putImage } from '../../shared/s3/client';
import { config } from '../../shared/config';
import { NotFoundError } from '../../shared/errors/http-errors';

// Build the PNG for a (type, slug) on a cache miss. Lazy-imports the generator: it statically imports
// the resvg .wasm + Inter .woff (embedded by esbuild's binary loader, inlined into this single bundle),
// so tooling that just loads the app (the OpenAPI build script under tsx, vitest) never resolves those
// binary assets — only a live /og miss does.
async function render(type: string, slug: string): Promise<Uint8Array> {
  const gen = await import('./generator');
  if (type === 'profile') {
    const profile = await getProfile();
    if (!profile) throw new NotFoundError('profile not found');
    return gen.generateOgImage(profile);
  }
  if (type === 'posts') {
    const post = await getPost(slug);
    if (!post || !post.published) throw new NotFoundError('post not found');
    return gen.generatePostImage(post);
  }
  if (type === 'articles') {
    const article = await getBySlug(slug);
    if (!article || !article.published) throw new NotFoundError('article not found');
    return gen.generateArticleImage(article);
  }
  throw new NotFoundError(`no og image for type ${type}`);
}

export function registerOgImage(app: BffApp): void {
  app.get('/og/:type/:filename', async (c) => {
    const { type, filename } = c.req.param();
    const slug = filename.replace(/\.png$/, '');
    // S3 key = the full public path under /og (CloudFront's /og/* behavior forwards the URI verbatim
    // to the bucket — it does NOT strip the matched prefix), so the object must live at og/<type>/<slug>.png.
    const path = `og/${type}/${slug}.png`;
    if (!(await objectExists(path))) {
      await putImage(path, await render(type, slug));
    }
    // Deliver via the CDN (CloudFront /og/* → S3), not through the API.
    return c.redirect(`${config.spaOrigin}/${path}`, 302);
  });
}
