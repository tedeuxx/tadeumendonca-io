import { test, expect, type Page } from '@playwright/test';
// The import attribute is required by Playwright's Node loader (see video-embeddable.spec.ts).
import videos from '../src/content/videos.json' with { type: 'json' };

// #718 — two accessible names, against the SERVED artifact, in both locales.
//
// 1. Every video play button announced "Play video: Video": the markdown facade passes no title, so the
//    label fell back to the generic word. It now names the video (manifest title, else caption, else
//    channel) and opens with the word the button shows ("Watch" / "Assistir"), per WCAG 2.5.3.
// 2. /pt/me's skill meters announced "Proficiency level N of 4" in English, a literal in LevelMeter.
//
// THE ROUTE DECIDES THE LANGUAGE, NOT THE VISITOR (AGENTS.md, the prerender rule). So each locale's page
// is visited by a browser set to the OTHER language: a label that followed the visitor would announce
// the wrong language here and fail. And the raw served HTML is read as well as the hydrated page,
// because the prerender snapshots one browser and serves that HTML to everyone — a name that is right
// after hydration and wrong in the snapshot is wrong for a crawler and for the first paint. The raw
// fetch asks for the DIRECTORY form (`/pt/me/`): `vite preview` does not rewrite a clean URL to the
// prerendered file and would serve the SPA fallback (seo.spec.ts and per-locale.spec.ts, same reason).

type Locale = 'pt' | 'en';

const PLAY: Record<Locale, string> = { pt: 'Assistir: ', en: 'Watch: ' };
const GENERIC: Record<Locale, string> = { pt: 'Assistir: Vídeo', en: 'Watch: Video' };
const METER: Record<Locale, RegExp> = {
  pt: /^Nível de proficiência [1-4] de 4$/,
  en: /^Proficiency level [1-4] of 4$/,
};
const FOREIGN_METER: Record<Locale, string> = { pt: 'Proficiency level', en: 'Nível de proficiência' };
const OTHER_BROWSER: Record<Locale, string> = { pt: 'en-US', en: 'pt-BR' };

const manifest: Record<string, { channel: string; caption?: string; title?: string }> = videos;

/** The play buttons on a page, each with its accessible name and the video id its poster names. */
async function playButtons(page: Page) {
  return page.locator('button:has(img[src^="/video/"])').evaluateAll((buttons) =>
    buttons.map((b) => ({
      name: b.getAttribute('aria-label') ?? '',
      visible: (b.textContent ?? '').trim(),
      id: /\/video\/(.+)\.png$/.exec(b.querySelector('img')?.getAttribute('src') ?? '')?.[1] ?? '',
    })),
  );
}

for (const locale of ['pt', 'en'] as const) {
  test.describe(`/${locale}: accessible names follow the route locale (#718)`, () => {
    test.use({ locale: OTHER_BROWSER[locale] });

    test(`/${locale}/ramp-up: every play button names its own video`, async ({ page }) => {
      await page.goto(`/${locale}/ramp-up`);
      await page.waitForLoadState('networkidle');

      const buttons = await playButtons(page);
      // Nothing to check means nothing below can fail — the page must carry play buttons.
      expect(buttons.length, 'no play buttons rendered on the ramp-up plan').toBeGreaterThan(1);

      for (const { name, id, visible } of buttons) {
        // WCAG 2.5.3: the name opens with the word the button SHOWS, read off the rendered button.
        const word = visible.replace(/^[^\p{L}]+/u, '');
        expect(word.length, `button for ${id} shows no word`).toBeGreaterThan(0);
        expect(name.startsWith(`${word}: `), `"${name}" does not open with "${word}"`).toBe(true);
        const entry = manifest[id];
        expect(entry, `poster ${id} has no manifest entry`).toBeDefined();
        expect(name, id).not.toBe(GENERIC[locale]);
        expect(name, id).toBe(`${PLAY[locale]}${entry.title || entry.caption || entry.channel}`);
      }
      // Distinct posters, distinct names — the generic label made them all one.
      const ids = new Set(buttons.map((b) => b.id));
      expect(new Set(buttons.map((b) => b.name)).size).toBe(ids.size);

      // And the same names are in the prerendered HTML, before any script runs.
      const html = await (await page.request.get(`/${locale}/ramp-up/`)).text();
      for (const { name } of buttons) {
        expect(html, `prerendered HTML lacks "${name}"`).toContain(`aria-label="${name.replace(/&/g, '&amp;')}"`);
      }
      expect(html).not.toContain(`aria-label="${GENERIC[locale]}"`);
    });

    test(`/${locale}/me: every skill meter speaks the page's language`, async ({ page }) => {
      await page.goto(`/${locale}/me`);
      await page.waitForLoadState('networkidle');

      const meters = page.locator('[data-print-block="04"] [role="img"]');
      const names = await meters.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
      expect(names.length, 'no skill meters rendered on /me').toBeGreaterThan(0);
      for (const name of names) expect(name).toMatch(METER[locale]);

      const html = await (await page.request.get(`/${locale}/me/`)).text();
      expect(html, 'the prerendered /me carries no skill meter').toMatch(
        new RegExp(`aria-label="${METER[locale].source.slice(1, -1)}"`),
      );
      expect(html).not.toContain(`aria-label="${FOREIGN_METER[locale]}`);
    });
  });
}
