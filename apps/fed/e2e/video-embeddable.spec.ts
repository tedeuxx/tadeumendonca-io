import { test, expect } from '@playwright/test';
// The import ATTRIBUTE is required and is not decoration: Playwright's loader runs this file in Node,
// where a JSON module without `with { type: 'json' }` is a TypeError at import time. Vitest and Vite
// both accept the bare form, which is why `VideoEmbed.tsx` does not carry it — the two loaders differ,
// and this is the one that is strict.
import videos from '../src/content/videos.json' with { type: 'json' };

// #591 — the link-preview form, against the SERVED artifact.
//
// WHY THIS EXISTS ALONGSIDE VideoEmbed.test.tsx, which already asserts the branch in jsdom. The defect
// this slice fixes lives on the far side of a CLICK: a video whose owner disabled embedding renders a
// perfectly correct play button, and only the reader finds out. jsdom proves the component reads the
// flag; only the served build proves the flag survives the JSON import, the bundle and the markdown
// pipeline that turns a lone URL into a facade. A flag correct in `videos.json` and dropped by any one
// of those three ships the original defect with a green unit suite.
//
// WHAT IT CANNOT DO, said here rather than left to be assumed: it cannot verify that the other videos
// PLAY. Playwright can mount their iframe, but the failure renders INSIDE a cross-origin frame and no
// assertion available here can read it. That question belongs to `npm run check-video-embeddable`,
// which asks YouTube directly and is deliberately not a gate.
//
// THE FLAGGED SET IS DERIVED FROM THE MANIFEST; THE ROUTE IS LISTED. The route is listed because this
// app carries no `@types/node` on purpose (see tsconfig.json) and the E2E suite IS typechecked, so a
// spec cannot read the content tree to find which article embeds a flagged id. The consequence is
// named rather than hidden: a video flagged in some OTHER article is not visited by this file. It is
// not silent, though — the last assertion requires every flagged id to have been found here, so
// flagging one elsewhere reddens this suite and asks for the route to be added.
test.use({ locale: 'pt-BR' });

/** Every id `src/content/videos.json` declares non-embeddable. Absent means UNKNOWN, never "yes". */
const FLAGGED = Object.entries(videos)
  .filter(([, entry]) => 'embeddable' in entry && entry.embeddable === false)
  .map(([id]) => id);

/**
 * The article that carries today's only flagged video, in both editions, and the id each visit expects.
 *
 * THE TWO PATHS ARE NOT THE SAME STRING WITH A DIFFERENT PREFIX — slugs are per-locale (ADR-0037), so
 * the Portuguese edition answers at its own. Writing `/pt/blog/<english-slug>` renders the SPA's
 * not-found shell, which carries no article and no video of any kind, so every count below would have
 * been trivially satisfied. That is why the render assertion comes first, and it is written from the
 * mistake rather than from caution: the first run of this file made exactly that error.
 *
 * `id` IS DECLARED HERE AND CHECKED AGAINST THE MANIFEST, rather than accumulated across tests. A `Set`
 * filled by one test and read by another is empty in a parallel worker — measured on the run before
 * this one, where the coverage assertion reported zero visits after both visits had passed.
 */
const ROUTES = [
  { id: 'pqlWNihgdjI', path: '/pt/blog/tres-loops-de-agentes-um-mes', play: 'Reproduzir vídeo' },
  { id: 'pqlWNihgdjI', path: '/en/blog/three-agent-loops-one-month', play: 'Play video' },
] as const;

test.describe('a video whose owner disabled embedding is served as a link preview', () => {
  // THE RULER, and it does two jobs. With an empty flag set every assertion below is about nothing, and
  // an empty `FLAGGED` reads exactly like a healthy manifest. And it is what makes the LISTED routes
  // safe to list: flagging a video in an article this file does not visit reddens HERE, asking for the
  // route, instead of going quietly unchecked.
  test('the routes below cover exactly the videos the manifest flags', () => {
    expect(FLAGGED.length, 'src/content/videos.json declares no non-embeddable video').toBeGreaterThan(0);
    expect(
      [...new Set(ROUTES.map((r) => r.id))].sort(),
      'add the route that embeds it to ROUTES, or drop the stale flag',
    ).toEqual([...FLAGGED].sort());
  });

  for (const { id, path, play } of ROUTES) {
    // `?preview` so the journey works whether the article is held or published — a held draft resolves
    // at its final URL only behind that parameter (ADR-0049), and a published one ignores it.
    test(`${path}: the flagged video offers a link out, never a player`, async ({ page }) => {
      await page.goto(`${path}?preview`);
      await page.waitForLoadState('networkidle');

      // The page must have rendered. `<article>` is ArticlePage's own element (MarkdownPage's
      // `markdown-body` seam belongs to the section pages and is absent here). A wrong slug renders the
      // not-found shell, which carries no article, no video and no player — so every assertion below is
      // satisfied by a page that never loaded the thing under test.
      await expect(page.locator('article')).toBeVisible();

      const preview = page.locator('[data-testid="video-preview"]');
      await expect(preview).toHaveCount(1);
      await expect(preview).toHaveAttribute('href', `https://www.youtube.com/watch?v=${id}`);
      await expect(preview).toHaveAttribute('target', '_blank');
      // The poster INSIDE the preview, which is what pins it to this video rather than to one of the
      // three others on the same page.
      await expect(preview.locator(`img[src="/video/${id}.png"]`)).toHaveCount(1);

      // No third-party frame anywhere on the page before any interaction — the facade's standing
      // property, re-asserted here because this page carries the new branch.
      await expect(page.locator('iframe')).toHaveCount(0);

      // THE CONTROL. Without it, a change that replaced every player with a preview passes this file.
      // This article embeds four videos and only one is flagged, so the other three must still play.
      await expect(page.getByRole('button', { name: play }).first()).toBeVisible();
    });
  }
});
