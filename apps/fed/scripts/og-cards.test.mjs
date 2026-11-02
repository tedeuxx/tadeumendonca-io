import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

import {
  articleKeysIn,
  articleKeysFrom,
  generatedCardsIn,
  requiredCards,
  diffCards,
  cardPath,
  LOCALES,
  coverOf,
  coverFile,
  coverCardsFrom,
  coverCardsIn,
  coverSidecarName,
  coverSidecarProblems,
  coverSidecarsIn,
  hashBytes,
} from './og-cards.mjs';
import { HELD_KEY } from '../src/content/heldFixture';

const root = resolve(import.meta.dirname, '..');
const blogDir = join(root, 'src', 'content', 'blog');
const ogDir = join(root, 'public', 'og');

describe('the card set matches the article set', () => {
  // THE GATE. A missing card is not a broken image on a page — it is an `og:image` advertising a URL
  // that 404s, and a scraper that fetches it pins the miss. On this site that is the least reversible
  // failure available: the merge that adds the card does not fix the post that already unfurled.
  //
  // Both directions, for different reasons. `missing` ships that defect. `orphaned` breaks nothing at
  // all, which is exactly why public/og/ would quietly accumulate cards for articles that no longer
  // exist and nobody would look.
  it('has a card for every article in every locale, and no card without an article', () => {
    const keys = articleKeysIn(blogDir);
    const { missing, orphaned } = diffCards(requiredCards(keys), generatedCardsIn(ogDir));

    expect(missing.map((c) => c.path), 'run `npm run gen-og-articles`').toEqual([]);
    expect(orphaned, 'stale cards for retired articles — run `npm run gen-og-articles`').toEqual([]);
  });

  // Guards the false green above: with no articles found, `required` is empty and `diffCards` returns
  // two empty lists, so the assertion passes having compared nothing. That is the shape a glob bug
  // takes, and it reads identical to a healthy repo.
  it('found articles at all — an empty content dir must not pass as “in sync”', () => {
    const keys = articleKeysIn(blogDir);
    expect(keys.length).toBeGreaterThan(0);
    expect(generatedCardsIn(ogDir).length).toBe(keys.length * LOCALES.length);
  });
});

describe('card naming', () => {
  // The naming decision, asserted rather than left to the comment that explains it. Keyed by the
  // article KEY, so correcting a per-locale slug (ADR-0037 makes that legal and expected) cannot orphan
  // a card that scrapers have already pinned.
  it('is keyed by the article key and the locale, never by the slug', () => {
    expect(cardPath('my-commitment', 'pt')).toBe('/og/my-commitment.pt.png');
    expect(cardPath('my-commitment', 'en')).toBe('/og/my-commitment.en.png');
  });

  it('gives the two editions different cards — the whole point is a per-locale title', () => {
    expect(cardPath('k', 'pt')).not.toBe(cardPath('k', 'en'));
  });
});

describe('diffCards', () => {
  it('reports a card that should exist and does not', () => {
    const required = requiredCards(['a']);
    const { missing, orphaned } = diffCards(required, ['/og/a.pt.png']);
    expect(missing.map((c) => c.path)).toEqual(['/og/a.en.png']);
    expect(orphaned).toEqual([]);
  });

  it('reports a card left behind by a retired article', () => {
    const { missing, orphaned } = diffCards(requiredCards([]), ['/og/gone.pt.png']);
    expect(missing).toEqual([]);
    expect(orphaned).toEqual(['/og/gone.pt.png']);
  });
});

// #510 — ACCEPTANCE CRITERION 3, and it is a two-directional criterion for two different reasons.
//
// `missing` empty says the build does not DEMAND a card for a held article — otherwise merging a draft
// turns the gate above red and the hold is unusable. `orphaned` empty says no card was generated for it
// either — and that is the half that matters publicly: an OG card is a public URL under `/og/`, so a
// generated card for a held draft leaks the article's TITLE, in both languages, to anyone listing the
// directory or guessing the name. The card pipeline is the one part of this site whose mistakes a scraper
// pins permanently, which is why both directions are asserted rather than the convenient one.
describe('a held article requires no OG card, and has none', () => {
  const blogDir = join(root, 'src', 'content', 'blog');

  it('is not among the keys that require a card', () => {
    expect(articleKeysIn(blogDir)).not.toContain(HELD_KEY);
  });

  // Guards the vacuous read: `not.toContain` over an empty list is true, and an empty key list is exactly
  // what a broken directory scan produces.
  it('leaves the published keys requiring cards — the list is not simply empty', () => {
    expect(articleKeysIn(blogDir).length).toBeGreaterThan(0);
  });

  // BOTH directions, against the real committed content and the real committed cards. This is the
  // criterion itself: neither `missing` nor `orphaned` may name the held fixture.
  it('produces neither a missing card nor an orphaned one, for the held fixture', () => {
    const { missing, orphaned } = diffCards(requiredCards(articleKeysIn(blogDir)), generatedCardsIn(ogDir));
    expect(missing.map((c) => c.path).filter((p) => p.includes(HELD_KEY))).toEqual([]);
    expect(orphaned.filter((p) => p.includes(HELD_KEY))).toEqual([]);
  });
});

// The pure seam, over synthetic input — the same reason `buildBlogEditions` and `buildDrafts` have one:
// the real directory holds exactly one held pair, so the branch coverage a decision rule needs (held
// beside live, one edition held, an unparseable header) cannot be reached from it.
describe('articleKeysFrom — the held-key decision, without a filesystem', () => {
  const read = (files) => (f) => files[f];
  const held = '---\ndraft: true\n---\nbody';
  const live = '---\ntag: aws\n---\nbody';

  it('drops a held key and keeps the live ones', () => {
    const files = { 'a.en.md': held, 'a.pt.md': held, 'b.en.md': live, 'b.pt.md': live };
    expect(articleKeysFrom(Object.keys(files), read(files))).toEqual(['b']);
  });

  // ANY edition held holds the key — the same conservative reading `routes.mjs` takes. A card generated
  // for the published half of a half-held pair would advertise one edition of an article the site does
  // not list.
  it('drops the key when only ONE edition is held', () => {
    const files = { 'a.en.md': live, 'a.pt.md': held };
    expect(articleKeysFrom(Object.keys(files), read(files))).toEqual([]);
  });

  it('parses the frontmatter rather than pattern-matching it — a trailing comment still holds', () => {
    const files = { 'a.en.md': '---\ndraft: true # promote after review\n---\nbody' };
    expect(articleKeysFrom(Object.keys(files), read(files))).toEqual([]);
  });

  // `=== true`, not truthy: a quoted `"false"` is a YAML string and therefore truthy, and an absent flag
  // is every article written before this field existed. Reading either as held would un-publish the site.
  it('treats a quoted "false", and an absent flag, as published', () => {
    const files = { 'a.en.md': '---\ndraft: "false"\n---\nbody', 'b.en.md': '---\n---\nbody' };
    expect(articleKeysFrom(Object.keys(files), read(files))).toEqual(['a', 'b']);
  });

  it('ignores files that are not per-locale articles, and never reads them', () => {
    const files = { 'README.md': live, 'a.xx.md': live, 'notes.txt': live };
    expect(articleKeysFrom(Object.keys(files), read(files))).toEqual([]);
  });
});

// #710 — the COVER-DERIVED card, and the provenance gap it closes for the one field it adds.
//
// CI never runs the generator (ADR-0041), so a committed card is whatever the last local run wrote. For a
// title-only card that was an accepted cost; for a card drawn from a binary that can be replaced under
// the same name it is not, so the generator records the cover's hash in a sidecar and this recomputes it.
// Calibrated by changing the cover FILE (the subject), never this test.
describe('a cover-derived card was built from the cover the article names now', () => {
  const publicDir = join(root, 'public');
  const hashCover = (cover) => hashBytes(readFileSync(coverFile(publicDir, cover)));
  const readSidecar = (name) => {
    try {
      return readFileSync(join(ogDir, name), 'utf8');
    } catch {
      return undefined;
    }
  };

  it('has a sidecar for every cover card, matching the cover file’s current hash, and no orphan', () => {
    const problems = coverSidecarProblems(coverCardsIn(blogDir), {
      readSidecar,
      hashCover,
      sidecarNames: coverSidecarsIn(ogDir),
    });
    expect(problems, 'run `npm run gen-og-articles`').toEqual([]);
  });

  // The false green: with no cover article found, the check above compares nothing. The #687 article is
  // the one cover article today, in both editions — named here so a lost selector is a red, not a pass.
  it('finds the cover article at all, in both locales', () => {
    expect(coverCardsIn(blogDir).map((c) => `${c.key}.${c.locale}`)).toEqual([
      'ai-answers-in-seconds-you-dont-have-to.en',
      'ai-answers-in-seconds-you-dont-have-to.pt',
    ]);
  });
});

describe('coverOf — the variant selector', () => {
  it('reads `cover` through the YAML parse, trailing comment and quotes included', () => {
    expect(coverOf('---\ncover: /illustrations/a.jpg # the cover\n---\nbody')).toBe('/illustrations/a.jpg');
    expect(coverOf("---\ncover: '/illustrations/a.jpg'\n---\nbody")).toBe('/illustrations/a.jpg');
  });

  it('is undefined with no cover, an empty one, a non-string one, or no frontmatter', () => {
    expect(coverOf('---\ntitle: x\n---\nbody')).toBeUndefined();
    expect(coverOf('---\ncover: "  "\n---\nbody')).toBeUndefined();
    expect(coverOf('---\ncover: 3\n---\nbody')).toBeUndefined();
    expect(coverOf('no frontmatter')).toBeUndefined();
    expect(coverOf('---\njust a string\n---\nbody')).toBeUndefined();
  });
});

describe('coverFile — a cover must be a site path inside public/', () => {
  it('resolves an absolute site path under the public directory', () => {
    expect(coverFile('/pub', '/illustrations/a.jpg')).toBe(join('/pub', 'illustrations', 'a.jpg'));
  });

  it('refuses a relative path and a path that climbs out', () => {
    expect(() => coverFile('/pub', 'illustrations/a.jpg')).toThrow(/absolute site path/);
    expect(() => coverFile('/pub', '/illustrations/../../etc/passwd')).toThrow(/absolute site path/);
  });
});

describe('coverCardsFrom — which cards are cover-derived, without a filesystem', () => {
  const read = (files) => (f) => files[f];
  const withCover = '---\ncover: /illustrations/c.jpg\n---\nbody';
  const plain = '---\ntag: ai\n---\nbody';

  it('selects only the editions that set a cover, per locale', () => {
    const files = { 'a.en.md': withCover, 'a.pt.md': withCover, 'b.en.md': plain, 'b.pt.md': plain };
    expect(coverCardsFrom(Object.keys(files), read(files))).toEqual([
      { key: 'a', locale: 'en', cover: '/illustrations/c.jpg' },
      { key: 'a', locale: 'pt', cover: '/illustrations/c.jpg' },
    ]);
  });

  // A held article gets no card, so it gets no cover card either — and no sidecar the check would demand.
  it('skips a held article even when it sets a cover', () => {
    const held = '---\ndraft: true\ncover: /illustrations/c.jpg\n---\nbody';
    const files = { 'a.en.md': held, 'a.pt.md': withCover, 'notes.md': withCover };
    expect(coverCardsFrom(Object.keys(files), read(files))).toEqual([]);
  });
});

describe('coverSidecarProblems — every way a cover card can stop matching its cover', () => {
  const cards = [{ key: 'a', locale: 'en', cover: '/c.jpg' }];
  const sidecar = (over = {}) => JSON.stringify({ cover: '/c.jpg', sha256: 'H', ...over });
  const check = (sidecars, hash = 'H') =>
    coverSidecarProblems(cards, {
      readSidecar: (name) => sidecars[name],
      hashCover: () => hash,
      sidecarNames: Object.keys(sidecars),
    });

  it('is clean when the sidecar names the cover and its current hash', () => {
    expect(check({ 'a.en.cover.json': sidecar() })).toEqual([]);
  });

  it('reports a missing sidecar', () => {
    expect(check({})).toEqual([expect.stringMatching(/a\.en\.cover\.json is missing/)]);
  });

  it('reports a cover changed since the card was built', () => {
    expect(check({ 'a.en.cover.json': sidecar() }, 'OTHER')).toEqual([expect.stringMatching(/changed since/)]);
  });

  it('reports a card built from a different cover path', () => {
    expect(check({ 'a.en.cover.json': sidecar({ cover: '/old.jpg' }) })).toEqual([
      expect.stringMatching(/built from \/old\.jpg/),
    ]);
  });

  it('reports a sidecar that is not JSON', () => {
    expect(check({ 'a.en.cover.json': 'not json' })).toEqual([expect.stringMatching(/not valid JSON/)]);
  });

  it('reports a sidecar no cover card needs', () => {
    expect(check({ 'a.en.cover.json': sidecar(), 'gone.pt.cover.json': sidecar() })).toEqual([
      expect.stringMatching(/gone\.pt\.cover\.json is orphaned/),
    ]);
  });

  it('names the sidecar after the key and locale', () => {
    expect(coverSidecarName('k', 'pt')).toBe('k.pt.cover.json');
  });

  it('lists no sidecars for a directory that does not exist', () => {
    expect(coverSidecarsIn(join(root, 'no-such-dir'))).toEqual([]);
  });
});
