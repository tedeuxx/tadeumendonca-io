// The pure half of the per-article OG card pipeline (#269): which cards must exist, and where they live.
//
// Split from the generator for the same reason scripts/diagram-source.mjs is: the rendering half needs a
// browser and cannot be unit tested, while everything that decides WHICH cards exist is decision logic and
// belongs where a test can reach it without one.
import { load } from 'js-yaml';
import { createHash } from 'node:crypto';
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
export function frontmatterOf(raw) {
  const fm = /^---\r?\n([^]*?)\r?\n---/.exec(raw);
  const parsed = fm ? load(fm[1]) : null;
  return parsed && typeof parsed === 'object' ? parsed : {};
}

const heldByFrontmatter = (raw) => frontmatterOf(raw).draft === true;

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

// ---------------------------------------------------------------------------------------------------
// The COVER-DERIVED card (#710, ADR-0041's 2026-11-01 amendment).
//
// An article whose frontmatter sets `cover` gets a card built from that image, carrying the title, the
// published signature and an AI-generated mark; every other article keeps the title-only card. The
// selector is the existing `cover` key — no new field and no slug named in a script — read through
// `frontmatterOf`, the one YAML parse this file already uses for `draft`.
//
// What it adds that the title-only card never needed: PROVENANCE. A title-only card is drawn from words
// the article carries, so a stale one is at least a stale rendering of the article's own text. A cover
// card is drawn from a binary that can be replaced under the same name, and CI never runs the generator
// (ADR-0041: the cards are committed). So the generator writes, next to each cover card, a sidecar
// holding the hash of the cover it was built from, and a unit test recomputes it. It closes the "nothing
// verifies the card's content" gap for THIS field only — the title can still go stale, as before.
// ---------------------------------------------------------------------------------------------------

/** The cover an article declares, or undefined — the selector between the two card variants. */
export function coverOf(raw) {
  const cover = frontmatterOf(raw).cover;
  return typeof cover === 'string' && cover.trim() !== '' ? cover.trim() : undefined;
}

/** The sidecar beside a cover-derived card: `<key>.<locale>.cover.json`, in the card directory. */
export const coverSidecarName = (key, locale) => `${key}.${locale}.cover.json`;

/** SHA-256 of a file's bytes, hex. */
export const hashBytes = (bytes) => createHash('sha256').update(bytes).digest('hex');

/**
 * The file a public cover path names, under `publicDir`.
 *
 * Refuses anything that is not an absolute site path, or that climbs out of the public directory: the
 * cover is read at build time and published on a card, so a path that resolves outside `public/` would
 * put a file the site does not serve onto an image a scraper keeps.
 */
export function coverFile(publicDir, cover) {
  if (!cover.startsWith('/') || cover.split('/').includes('..')) {
    throw new Error(`cover "${cover}" must be an absolute site path inside public/ (e.g. /illustrations/x.jpg)`);
  }
  return join(publicDir, cover);
}

/**
 * Every cover-derived card the content requires, as `{ key, locale, cover }` — over an injected reader.
 *
 * Only PUBLISHED keys (`articleKeysFrom`): a held article gets no card at all, so it gets no cover card
 * and no sidecar either. Per edition, because the card is per edition; `cover` is a `FACT_KEYS` member in
 * `content.ts`, so the two editions cannot disagree without failing the build first.
 */
export function coverCardsFrom(files, readFile) {
  const published = new Set(articleKeysFrom(files, readFile));
  const cards = [];
  for (const file of files) {
    const m = /^(.+)\.([^.]+)\.md$/.exec(file);
    if (!m || !LOCALES.includes(m[2]) || !published.has(m[1])) continue;
    const cover = coverOf(readFile(file));
    if (cover) cards.push({ key: m[1], locale: m[2], cover });
  }
  return cards.sort((a, b) => coverSidecarName(a.key, a.locale).localeCompare(coverSidecarName(b.key, b.locale)));
}

/** Every cover-derived card the content directory requires. */
export function coverCardsIn(blogDir) {
  return coverCardsFrom(readdirSync(blogDir), (file) => readFileSync(join(blogDir, file), 'utf8'));
}

/**
 * Compare each cover card's sidecar with the cover as it is NOW, and report every disagreement.
 *
 * - `readSidecar(name)` returns the sidecar's text, or undefined when it does not exist;
 * - `hashCover(cover)` returns the current hash of the cover file;
 * - `sidecarNames` lists the sidecars present, so one left behind by an article that no longer has a
 *   cover — or no longer exists — is reported too. It would break nothing, which is exactly why it would
 *   accumulate unseen (ADR-0041's `orphaned` argument, applied to the sidecars).
 *
 * Returns human-readable problems; empty means every cover card was built from the cover it now names.
 */
export function coverSidecarProblems(cards, { readSidecar, hashCover, sidecarNames }) {
  const problems = [];
  const expected = new Set();
  for (const { key, locale, cover } of cards) {
    const name = coverSidecarName(key, locale);
    expected.add(name);
    const text = readSidecar(name);
    if (text === undefined) {
      problems.push(`${name} is missing — the ${key}.${locale} card has no record of the cover it was built from`);
      continue;
    }
    let sidecar;
    try {
      sidecar = JSON.parse(text);
    } catch {
      problems.push(`${name} is not valid JSON`);
      continue;
    }
    if (sidecar.cover !== cover) {
      problems.push(`${name} was built from ${sidecar.cover}, but the article now names ${cover}`);
      continue;
    }
    if (sidecar.sha256 !== hashCover(cover)) {
      problems.push(`${name}: ${cover} changed since the ${key}.${locale} card was built`);
    }
  }
  for (const name of sidecarNames) {
    if (!expected.has(name)) problems.push(`${name} is orphaned — no published article with a cover needs it`);
  }
  return problems;
}

/** The sidecars actually present in the card directory. */
export function coverSidecarsIn(ogDir) {
  try {
    return readdirSync(ogDir)
      .filter((f) => f.endsWith('.cover.json'))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}
