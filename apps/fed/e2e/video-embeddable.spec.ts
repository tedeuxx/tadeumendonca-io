import { test, expect } from '@playwright/test';
// The import ATTRIBUTE is required and is not decoration: Playwright's loader runs this file in Node,
// where a JSON module without `with { type: 'json' }` is a TypeError at import time. Vitest and Vite
// both accept the bare form, which is why `VideoEmbed.tsx` does not carry it — the two loaders differ,
// and this is the one that is strict.
import videos from '../src/content/videos.json' with { type: 'json' };

// The link-preview form, against the SERVED artifact.
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

    // A REGRESSION FOUND BY LOOKING AT THE PAGE, and one no assertion in this repository could have
    // reached before: the preview sits inside `.markdown`, whose `a:hover` rule repaints the anchor
    // near-black, and the note that tells the reader the video opens elsewhere INHERITED that and
    // disappeared on hover — black on black, in the one state where the reader is deciding.
    //
    // Asserted as CONTRAST rather than as an exact colour, so it survives a palette change and still
    // reds on the defect. Not reachable in jsdom, which computes no cascade: this is the class of
    // failure that only exists in a browser, which is what puts it in the E2E suite rather than beside
    // the component.
    test(`${path}: the note stays legible while the reader is hovering it`, async ({ page }) => {
      await page.goto(`${path}?preview`);
      await page.waitForLoadState('networkidle');

      // EVERY TEXT LINE IN THE CARD, not the one that failed first.
      //
      // The first version of this assertion targeted the disabled-playback note alone, and a SECOND
      // line went invisible on hover anyway — the call to action was `text-primary` on a background
      // `.markdown a:hover` paints `primary`. A per-element assertion only ever proves the element it
      // names, so this walks the card's own text nodes and requires each to separate from whatever is
      // actually behind it.
      const preview = page.locator('[data-testid="video-preview"]');
      await expect(preview).toHaveCount(1);
      await preview.hover();

      const worst = await preview.evaluate((card) => {
        const parse = (v: string) => (v.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const lum = ([r, g, b]: number[]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        // The nearest ancestor that actually paints — a transparent span sits on whatever is behind it,
        // so comparing against its own `backgroundColor` would compare against nothing.
        const painted = (el: Element): number[] => {
          for (let n: Element | null = el; n; n = n.parentElement) {
            const bg = getComputedStyle(n).backgroundColor;
            const parts = (bg.match(/[\d.]+/g) ?? []).map(Number);
            if (parts.length < 4 || parts[3] > 0) return parts.slice(0, 3);
          }
          return [0, 0, 0];
        };
        const lines = [...card.querySelectorAll('span')].filter(
          (el) => (el.textContent ?? '').trim().length > 0 && el.children.length === 0,
        );
        return {
          count: lines.length,
          min: Math.min(
            ...lines.map((el) => Math.abs(lum(parse(getComputedStyle(el).color)) - lum(painted(el)))),
          ),
        };
      });

      // The ruler: a card with no text lines would make the minimum vacuous.
      expect(worst.count, 'no text lines found in the card').toBeGreaterThan(2);
      // 0.25 sits far from both outcomes rather than at a threshold: a vanished line measures ~0.00.
      expect(worst.min, 'a line in the card is unreadable while hovered').toBeGreaterThan(0.25);
    });

    // THIS ROUTE IS SWEPT BY NOTHING ELSE, and that was published twice as the opposite.
    //
    // The claim was that responsive-overflow.spec.ts covers it once the article is published. It is
    // false on two independent counts, both read rather than reasoned: the article carries
    // `draft: true`, so it is absent from the sitemap and from dist/ entirely; and that suite's ROUTES
    // is six hardcoded SECTION routes with no blog article in it at all, so publishing would not have
    // put this route in the sweep either.
    //
    // The preview is the widest new box on the page - `aspect-video w-full` with a `max-w-[85%]` plate
    // inside it - and a plate that refuses to shrink is exactly how this repository's 320px overflows
    // have happened before (a grid item never shrinks below min-content). A hand measurement caught it
    // once; this is that measurement as a mechanism, so it does not depend on someone remembering.
    for (const width of [320, 390, 768, 1280]) {
      test(`${path}: the preview does not push the page sideways at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${path}?preview`);
        await page.waitForLoadState('networkidle');

        // The ruler: the preview must actually be on the page, or a not-found shell trivially fits.
        await expect(page.locator('[data-testid="video-preview"]')).toHaveCount(1);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `overflows by ${overflow}px at ${width}px wide`).toBeLessThanOrEqual(0);
      });
    }
  }
});
