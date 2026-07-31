import { describe, it, expect } from 'vitest';
import { resolve, join } from 'node:path';
import { articleKeysIn, generatedCardsIn, requiredCards, diffCards, cardPath, LOCALES } from './og-cards.mjs';

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
