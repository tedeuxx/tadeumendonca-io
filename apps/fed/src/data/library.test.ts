import { describe, it, expect } from 'vitest';
import { LOCALES } from '../i18n';
import { assertLibraryShape, library, normalizeBookUrl, RATING_MAX, RATING_MIN, type LibraryEntry } from './library';

// THE POINT OF THIS FILE, stated before the tests because it is the reason for their shape.
//
// `library` was empty when this file was written. A guard written as `for (const entry of library)
// expect(...)` is green forever on an empty array and asserts NOTHING — and it stays that way through
// exactly the window the guard exists to protect, which is the shelf being filled one book at a time. An
// assertion that cannot fail is worse than an absent one, because it reads as coverage.
//
// So every rule is exercised against SYNTHETIC FIXTURES that violate it one at a time. Whether the real
// corpus is empty, one book or twenty is irrelevant to whether the rules are proven — the same injected-
// seam reasoning `buildBlogEditions` (scripts/routes.mjs) and `buildEditions` (lib/content.ts) are built
// on, both of which are pure because the real content can never reach the branch that throws.
//
// THE SHELF NOW HAS BOOKS ON IT, AND THIS FILE DELIBERATELY DID NOT CHANGE SHAPE. That is the second
// failure mode and it is the mirror of the first: once real data exists it is tempting to let the guard
// become a test OF that data, and then the rules quietly stop being proven — two books cannot exercise a
// blank author, an implausible year or a duplicate URL, so every one of those rules would be resting on
// a corpus that happens not to violate it. Both properties are wanted and both are asserted here:
//
//   · the RULES, proven on fixtures, corpus-independent      → every `describe` up to "the shipped shelf"
//   · the SHIPPED SHELF, checked against those rules and no longer vacuously → "the shipped shelf" below
//
// The second is the weaker claim and is labelled as such, so a later reader cannot mistake it for the
// first.
//
// The fixture is a REAL book on purpose: fixtures that are visibly fake ("Book A", "http://x") drift into
// shapes the corpus never takes, and then the accept-cases stop proving that real data passes.
const entry = (over: Partial<LibraryEntry> = {}): LibraryEntry => ({
  title: 'AI Engineering',
  authors: ['Chip Huyen'],
  publisher: "O'Reilly",
  year: 2025,
  url: 'https://www.oreilly.com/library/view/ai-engineering/9781098166298/',
  rating: 5,
  takeaway: { pt: 'O que eu tirei do livro.', en: 'What I took from the book.' },
  ...over,
});

const second = (over: Partial<LibraryEntry> = {}): LibraryEntry =>
  entry({
    title: 'Site Reliability Engineering',
    authors: ['Betsy Beyer', 'Chris Jones', 'Jennifer Petoff', 'Niall Richard Murphy'],
    url: 'https://sre.google/sre-book/table-of-contents/',
    rating: 4,
    ...over,
  });

describe('assertLibraryShape — what it accepts', () => {
  it('accepts a well-formed shelf', () => {
    expect(() => assertLibraryShape([entry(), second()])).not.toThrow();
  });

  // Named rather than left implicit: this case asserts that an empty shelf is LEGAL, which is the whole
  // premise of shipping the surface before the books. It proves nothing about the rules — the cases below
  // are what do that, and that division is the reason this file is written the way it is.
  it('accepts an empty shelf — legal, and proves nothing else', () => {
    expect(() => assertLibraryShape([])).not.toThrow();
  });

  it('accepts an entry with neither publisher nor year — both are optional facts', () => {
    expect(() => assertLibraryShape([entry({ publisher: undefined, year: undefined })])).not.toThrow();
  });

  it('accepts every rating on the scale', () => {
    for (const rating of [1, 2, 3, 4, 5] as const) {
      expect(() => assertLibraryShape([entry({ rating })]), `rating ${rating} must be legal`).not.toThrow();
    }
  });

  // The accept side of the URL rule. Without it, tightening the pattern until it rejects everything would
  // leave the reject cases below all passing — the classic way a validator's tests stay green while the
  // validator stops being usable.
  it('accepts the URL shapes real books take', () => {
    for (const url of [
      'https://www.oreilly.com/library/view/ai-engineering/9781098166298/',
      'https://sre.google/sre-book/table-of-contents/',
      'https://nostarch.com',
      'https://press.example.co.uk/books/1?ed=2',
    ]) {
      expect(() => assertLibraryShape([entry({ url })]), `expected "${url}" to be accepted`).not.toThrow();
    }
  });
});

describe('assertLibraryShape — the facts every entry owes', () => {
  it('rejects a blank title', () => {
    expect(() => assertLibraryShape([entry({ title: '   ' })])).toThrow(/has no title/);
  });

  // A cast is the only way a required field goes missing at runtime — `LibraryEntry` forbids it at compile
  // time. Worth covering because the failure must be the validator's sentence, not a TypeError from
  // reading `.trim()` of undefined, and because it is the one case that exercises the fallback in the
  // "which entry" label.
  it('names an entry that has neither url nor title, instead of throwing a TypeError', () => {
    expect(() => assertLibraryShape([{} as LibraryEntry])).toThrow(/<an entry with neither url nor title>/);
  });

  it('rejects an entry that credits no author', () => {
    expect(() => assertLibraryShape([entry({ authors: [] })])).toThrow(/credits no author/);
  });

  it('rejects a blank author sitting among good ones', () => {
    expect(() => assertLibraryShape([entry({ authors: ['Chip Huyen', '  '] })])).toThrow(/credits a blank author/);
  });

  it('rejects a publisher field that is present but blank', () => {
    expect(() => assertLibraryShape([entry({ publisher: '' })])).toThrow(/blank publisher/);
  });

  it('rejects an implausible year', () => {
    for (const year of [202, 20255, 1899, new Date().getFullYear() + 2, 2020.5]) {
      expect(() => assertLibraryShape([entry({ year })]), `expected year ${year} to be rejected`).toThrow(
        /implausible year/,
      );
    }
  });
});

describe('assertLibraryShape — the URL is the identity key', () => {
  it('rejects a URL that is not an absolute https URL', () => {
    for (const url of [
      'http://www.oreilly.com/library/view/ai-engineering/',
      'www.oreilly.com/library/view/ai-engineering/',
      '/library/ai-engineering',
      'https://localhost/book',
      'https:// oreilly.com/book',
      '',
    ]) {
      expect(() => assertLibraryShape([entry({ url })]), `expected "${url}" to be rejected`).toThrow(
        /no usable canonical URL/,
      );
    }
  });

  it('rejects the same book listed twice', () => {
    expect(() => assertLibraryShape([entry(), entry()])).toThrow(/appears on the shelf twice/);
  });

  // Identity is the NORMALISED url, so the duplicate cannot hide behind punctuation or host casing — the
  // same normalisation `repoCards.ts` applies. Two entries differing only by a trailing slash are one
  // book. The SCHEME stays lowercase in both fixtures on purpose: `https:` in another casing is rejected
  // by the URL rule before it ever reaches the identity check, so using it here would make this test pass
  // for the wrong reason.
  it('rejects a duplicate that differs only by trailing slash or host casing', () => {
    expect(() =>
      assertLibraryShape([
        entry({ url: 'https://www.oreilly.com/library/view/ai-engineering/9781098166298/' }),
        entry({ url: 'https://WWW.OReilly.COM/library/view/ai-engineering/9781098166298' }),
      ]),
    ).toThrow(/appears on the shelf twice/);
  });

  // Two DIFFERENT books must not be read as duplicates — the mutation that would make the check above
  // pass trivially (comparing nothing, or normalising everything to the same string) fails here.
  it('does not read two different books as the same one', () => {
    expect(() => assertLibraryShape([entry(), second()])).not.toThrow();
  });

  it('normalises a URL by trimming, dropping trailing slashes and lowercasing', () => {
    expect(normalizeBookUrl('  HTTPS://Example.COM/Book//  ')).toBe('https://example.com/book');
  });
});

describe('assertLibraryShape — the rating scale', () => {
  // `Rating` is a compile-time union and is ERASED at runtime, so a single `as Rating` anywhere restores
  // the hole. The cast here is the defect being simulated, not a shortcut around the type.
  it('rejects a rating off the scale, even when a cast smuggles it past the union', () => {
    for (const rating of [0, 6, -1, 2.5, RATING_MIN - 1, RATING_MAX + 1]) {
      expect(
        () => assertLibraryShape([entry({ rating: rating as LibraryEntry['rating'] })]),
        `expected rating ${rating} to be rejected`,
      ).toThrow(/the scale is 1\.\.5/);
    }
  });
});

describe('assertLibraryShape — a missing translation cannot ship', () => {
  // Looped over LOCALES rather than spelled out as pt and en: the rule is "every locale the site
  // publishes", and a third edition must inherit the check rather than need this test edited.
  it('rejects a takeaway missing in ANY locale', () => {
    for (const locale of LOCALES) {
      const takeaway = { ...entry().takeaway, [locale]: '' };
      expect(
        () => assertLibraryShape([entry({ takeaway })]),
        `expected a blank ${locale} takeaway to be rejected`,
      ).toThrow(new RegExp(`has no ${locale} takeaway`));
    }
  });

  // The key ABSENT, not merely blank — the case a cast produces and the compile-time `Record<Locale,
  // string>` cannot. Double cast because the single one is itself a compile error, which is the type
  // doing its job: this test simulates the one way past it.
  it('rejects a takeaway object with a locale key absent entirely', () => {
    const takeaway = { en: 'only English' } as unknown as LibraryEntry['takeaway'];
    expect(() => assertLibraryShape([entry({ takeaway })])).toThrow(/has no pt takeaway/);
  });
});

// The guard against the guard: everything above must keep proving the RULES, not the two rows that now
// ship. This is the assertion that says so mechanically rather than in a comment.
describe('assertLibraryShape reads its argument, never the shipped shelf', () => {
  // The failure this catches is specific and cheap to introduce: someone "simplifies" the validator to
  // iterate `library` instead of `entries`. Every reject case above would then run against a VALID shelf,
  // throw nothing, and this whole file would go green while asserting nothing about shape at all.
  //
  // It could not be written while `library` was empty — an empty corpus makes a param-ignoring validator
  // behave identically to a correct one on the accept cases. The shelf having books is what gives this
  // test its teeth, which is why it arrives in the same slice as the books.
  it('rejects a violating fixture even though the shipped shelf is valid and non-empty', () => {
    expect(library.length, 'this test is only meaningful against a non-empty shelf').toBeGreaterThan(0);
    expect(() => assertLibraryShape(library)).not.toThrow();
    // Same call, different argument, opposite outcome. A validator reading `library` cannot produce this.
    expect(() => assertLibraryShape([entry({ title: '   ' })])).toThrow(/has no title/);
  });

  it('accepts an empty shelf while the shipped one is full — the argument decides, not the module', () => {
    expect(() => assertLibraryShape([])).not.toThrow();
    expect(library.length).toBeGreaterThan(0);
  });
});

describe('the shipped shelf', () => {
  // THE WEAKER CLAIM, and labelled so nobody reads it as the coverage the fixtures above provide. It is
  // no longer vacuous — it was, by construction, for as long as the array was empty.
  it('passes its own guard', () => {
    expect(() => assertLibraryShape(library)).not.toThrow();
  });

  it('has books on it — the slice that made every real-corpus assertion here mean something', () => {
    expect(library.length).toBeGreaterThan(0);
  });

  // Facts only, never taste. Whether a takeaway is any GOOD is curation and belongs to `product-lead`
  // and the owner; what is checkable is that the two editions are two editions.
  it('carries a distinct takeaway per locale — never one language pasted into both', () => {
    for (const book of library) {
      const values = LOCALES.map((locale) => book.takeaway[locale].trim());
      expect(new Set(values).size, `"${book.title}" ships the same takeaway text in every locale`).toBe(LOCALES.length);
    }
  });

  // The order is authored (foundations, then the structure built on them) rather than sorted, so it is
  // pinned by URL — the identity key, for the reason `catalog.test.ts` keys on `repoUrl`: a title is
  // exactly the field an edition or subtitle rewrite churns, and a rewrite must not orphan a guard.
  it('renders in the authored order, keyed on the identity field', () => {
    expect(library.map((book) => normalizeBookUrl(book.url))).toEqual([
      'https://www.oreilly.com/library/view/ai-engineering/9781098166298',
      'https://www.oreilly.com/library/view/building-applications-with/9781098176495',
    ]);
  });

  // Not an aesthetic check. The shelf's published rule is "only what I have finished gets in", and a
  // rating is the claim that carries it; the `Rating` union is erased at runtime, so this is the layer
  // that would notice a `0` arriving through a cast on a real row.
  it('rates every shipped book on the published scale', () => {
    for (const book of library) {
      expect(book.rating, `"${book.title}"`).toBeGreaterThanOrEqual(RATING_MIN);
      expect(book.rating, `"${book.title}"`).toBeLessThanOrEqual(RATING_MAX);
    }
  });
});
