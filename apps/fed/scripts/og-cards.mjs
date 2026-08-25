// The pure half of the per-article OG card pipeline (#269): which cards must exist, and where they live.
//
// Split from the generator for the same reason scripts/diagram-source.mjs is: the rendering half needs a
// browser and cannot be unit tested, while everything that decides WHICH cards exist is decision logic and
// belongs where a test can reach it without one.
import { load } from 'js-yaml';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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
 * The article KEYS a file list requires cards for — the pure half, over an injected reader.
 *
 * Split out at #510, when the answer stopped being derivable from filenames alone: a HELD article
 * (`draft: true`) requires no card and must not have one. Both directions matter and for different
 * reasons — a card that is not required is `orphaned` (harmless to a page, which is why nobody would
 * look), and a card advertised for an article the site does not list is a URL a scraper can pin.
 *
 * The injected reader is the same seam `buildBlogEditions(files, readFile)` and `buildDrafts(…)` already
 * use in this directory — one pattern rather than a per-module improvisation, and it is what lets the
 * held-key rule be tested without a fixture on disk.
 *
 * Only the frontmatter is scanned, anchored and bounded: a lazy any-character sweep over a whole article
 * body is super-linear (S8786) and a card decision has no reason to read past the fence. It is PARSED
 * (js-yaml) rather than pattern-matched, so `draft: true # promote after review` reads as held — the
 * same parser `routes.mjs` and `content.ts` use, which is what keeps the three derivations agreeing.
 */
const heldByFrontmatter = (raw) => {
  const fm = /^---\r?\n([^]*?)\r?\n---/.exec(raw);
  return (fm ? load(fm[1]) : null)?.draft === true;
};

export function articleKeysFrom(files, readFile) {
  const keys = new Set();
  const held = new Set();
  for (const file of files) {
    const m = /^(.+)\.([^.]+)\.md$/.exec(file);
    if (!m || !LOCALES.includes(m[2])) continue;
    keys.add(m[1]);
    // ANY edition held holds the key — the same conservative reading `routes.mjs` takes, for the same
    // reason: half a published article is worse than none.
    if (heldByFrontmatter(readFile(file))) held.add(m[1]);
  }
  for (const key of held) keys.delete(key);
  // Explicit comparator: a bare `.sort()` compares by string coercion, which is correct for these keys
  // and is still flagged (S2871) because the element type is not inferred through the Set. Stating the
  // comparison rather than suppressing the rule — the intent is alphabetical and now says so.
  return [...keys].sort((a, b) => a.localeCompare(b));
}

/**
 * The article KEYS present in a content directory that require a card.
 *
 * Deliberately derived from the filesystem rather than from a list: a list is a second place to update,
 * and the failure it produces (a new article with no card) is invisible until a reader shares it.
 */
export function articleKeysIn(blogDir) {
  return articleKeysFrom(readdirSync(blogDir), (file) => readFileSync(join(blogDir, file), 'utf8'));
}

/** The card files actually present in `public/og/`, as public paths. */
export function generatedCardsIn(ogDir) {
  let files = [];
  try {
    files = readdirSync(ogDir);
  } catch {
    return []; // the directory not existing is the same finding as it being empty
  }
  return files
    .filter((f) => f.endsWith('.png'))
    .map((f) => `/og/${f}`)
    .sort((a, b) => a.localeCompare(b));
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
