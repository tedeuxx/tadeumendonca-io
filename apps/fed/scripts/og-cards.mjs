// The pure half of the per-article OG card pipeline (#269): which cards must exist, and where they live.
//
// Split from the generator for the same reason scripts/diagram-source.mjs is: the rendering half needs a
// browser and cannot be unit tested, while everything that decides WHICH cards exist is decision logic and
// belongs where a test can reach it without one.
import { readdirSync } from 'node:fs';

/** Locales the site publishes, in the order the generator emits them. Mirrors src/i18n/config.ts. */
export const LOCALES = ['pt', 'en'];

/**
 * The public path of an article's card.
 *
 * Keyed by the article's KEY (the filename base) and the locale — NEVER by the slug. The slug is
 * per-locale and editable after publication (ADR-0037); the key is the identity `lib/content.ts` already
 * treats as stable. Naming the file after the slug would orphan a card the day a slug is corrected, and
 * an orphaned card is not a broken image: the page keeps serving a 404 URL in `og:image`, which scrapers
 * pin. That is the least reversible failure this feature can have, so the naming avoids it by
 * construction rather than by discipline.
 */
export const cardPath = (key, locale) => `/og/${key}.${locale}.png`;

/** Every card the current content requires, as `{ key, locale, path }`. */
export function requiredCards(articleKeys) {
  return articleKeys.flatMap((key) => LOCALES.map((locale) => ({ key, locale, path: cardPath(key, locale) })));
}

/**
 * The article KEYS present in a content directory — the filename base of `<key>.<locale>.md`, deduped.
 *
 * Deliberately derived from the filesystem rather than from a list: a list is a second place to update,
 * and the failure it produces (a new article with no card) is invisible until a reader shares it.
 */
export function articleKeysIn(blogDir) {
  const keys = new Set();
  for (const file of readdirSync(blogDir)) {
    const m = /^(.+)\.([^.]+)\.md$/.exec(file);
    if (m && LOCALES.includes(m[2])) keys.add(m[1]);
  }
  return [...keys].sort();
}

/** The card files actually present in `public/og/`, as public paths. */
export function generatedCardsIn(ogDir) {
  let files = [];
  try {
    files = readdirSync(ogDir);
  } catch {
    return []; // the directory not existing is the same finding as it being empty
  }
  return files.filter((f) => f.endsWith('.png')).map((f) => `/og/${f}`).sort();
}

/**
 * Compare required against generated, BOTH ways.
 *
 * `missing` is the case that ships a broken card: an article exists and its image does not, so `og:image`
 * advertises a URL that 404s and every scraper that fetches it pins the miss. `orphaned` never breaks a
 * page, which is exactly why nobody would notice `public/og/` accumulating cards for articles that no
 * longer exist — and why it is checked here rather than left to a reader.
 */
export function diffCards(required, generated) {
  const have = new Set(generated);
  const want = new Set(required.map((c) => c.path));
  return {
    missing: required.filter((c) => !have.has(c.path)),
    orphaned: generated.filter((p) => !want.has(p)),
  };
}
