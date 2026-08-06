// THE DRIFT GUARD BETWEEN /ramp-up AND /library (#166).
//
// The booked cost, accepted at intake: two hand-authored lists name the same O'Reilly books and nothing
// checks that they agree. `/ramp-up` lists them in markdown with a status marker; `/library` lists two of
// them as typed data with a rating and a takeaway. A title edit, a URL fix or a status change in one place
// leaves the other quietly wrong, on two pages one nav entry apart, and only a reader who visited both
// would ever see it. `tech-lead` scoped the mitigation to the slice where it stops being vacuous — over an
// empty shelf it could not fail — which is this one.
//
// IT CHECKS FACTS ONLY, NEVER PROSE. Titles, URLs and the finished/reading marker are facts two lists can
// disagree about mechanically. Whether the ramp-up blurb and the library takeaway say compatible things
// about a book is editorial, it is `product-lead`'s lens, and a test pretending to check it would be
// asserting taste.
//
// ── THE SHAPE IS NOT THE ONE PRESCRIBED, AND THE DEVIATION IS THE POINT ──────────────────────────────
//
// Intake prescribed "the set of publisher URLs in rampup.{pt,en}.md is a SUBSET of library.ts's url set".
// Written against an empty shelf, that reads as the obvious containment. Against the real content it is
// FALSE, and it would have been false the moment it was written: `/ramp-up` lists six books, four of them
// marked *(lendo)* / *(na fila)*, and the shelf's published rule is "only what I have finished gets in".
// A subset guard in that direction goes red on correct data, and the only ways to make it pass are to put
// unread books on the shelf or to delete the reading list — both worse than the drift.
//
// The reverse containment is no better. `/library` is a broader shelf by design (AI, distributed systems,
// infrastructure, software engineering) while `/ramp-up`'s list is AI-engineering only, so the first
// non-AI book would go red for a reason that is not a defect.
//
// Neither direction is an invariant. What IS one is that where the two lists OVERLAP they must agree —
// which is exactly the drift that was booked as a cost, since two lists can only contradict each other
// about a book they both name. So the guard is over the intersection, with an explicit non-vacuity
// assertion because an intersection-scoped check is the classic way an assertion stops being able to
// fail: change a URL on one side and every loop below iterates nothing, silently.
import { describe, it, expect } from 'vitest';
import rampUpEn from '../content/rampup.en.md?raw';
import rampUpPt from '../content/rampup.pt.md?raw';
import { library, normalizeBookUrl } from './library';

/** The finished marker, per edition. It is authored prose in a fixed shape, so it is pinned per locale. */
const FINISHED = { pt: '*(terminado)*', en: '*(finished)*' } as const;
const EDITIONS = { pt: rampUpPt, en: rampUpEn } as const;

/**
 * Every book bullet in the ramp-up's reading list: `- **[Title](url)** — … *(status)*`.
 *
 * Anchored on the bullet + bold-link shape rather than on "any O'Reilly URL in the file", so a URL cited
 * in a sentence elsewhere on the page is not mistaken for a list entry. `[^)]+` for the href stops at the
 * closing paren; `.*` captures the rest of the line, which is where the status marker lives.
 */
const BOOK_BULLET = /^- \*\*\[([^\]]+)\]\((https:\/\/[^)\s]+)\)\*\*(.*)$/gm;

interface RampUpBook {
  title: string;
  url: string;
  rest: string;
}

function booksIn(markdown: string): RampUpBook[] {
  const found: RampUpBook[] = [];
  for (const [, title, url, rest] of markdown.matchAll(BOOK_BULLET)) {
    found.push({ title, url, rest });
  }
  return found;
}

const RAMPUP_BOOKS = { pt: booksIn(EDITIONS.pt), en: booksIn(EDITIONS.en) };

/** The library entries `/ramp-up` also names, per edition, matched on the identity key. */
const sharedIn = (locale: 'pt' | 'en') =>
  library
    .map((book) => ({
      book,
      cited: RAMPUP_BOOKS[locale].find((cited) => normalizeBookUrl(cited.url) === normalizeBookUrl(book.url)),
    }))
    .filter((pair): pair is { book: (typeof library)[number]; cited: RampUpBook } => pair.cited !== undefined);

describe('the guard itself is not vacuous', () => {
  // Read this first. Every assertion below iterates the INTERSECTION of two lists, so all of them pass
  // trivially the moment that intersection is empty — and it empties on exactly the edit the guard exists
  // to catch (a URL changed on one side only). This is the assertion that goes red instead.
  it('finds the shipped shelf cited in both ramp-up editions', () => {
    expect(RAMPUP_BOOKS.pt.length, 'the bullet parser matched nothing — the list shape changed').toBeGreaterThan(0);
    expect(RAMPUP_BOOKS.en.length).toBe(RAMPUP_BOOKS.pt.length);
    for (const locale of ['pt', 'en'] as const) {
      // BOTH assertions, and the second is not redundant with the first: `toBe(library.length)` is
      // satisfied by 0 === 0 the moment the shelf is emptied, which is precisely the state that made
      // this whole guard impossible to write one slice ago. A non-vacuity check that can itself be
      // satisfied vacuously is the defect wearing a disguise.
      expect(sharedIn(locale).length, `no /library book is cited in rampup.${locale}.md`).toBe(library.length);
      expect(sharedIn(locale).length, `the intersection is empty — every check below would pass`).toBeGreaterThan(0);
    }
  });
});

describe('where /ramp-up and /library name the same book, they agree', () => {
  for (const locale of ['pt', 'en'] as const) {
    // The TITLE is a fact both lists author by hand, in the same words, and it is the field an edition or
    // subtitle rewrite churns. Compared exactly: a book whose title differs between two pages of one site
    // reads as two books.
    it(`spells every shared title identically in rampup.${locale}.md`, () => {
      for (const { book, cited } of sharedIn(locale)) {
        expect(cited.title, `"${book.url}" is titled differently on /ramp-up and /library`).toBe(book.title);
      }
    });

    // THE CONTRADICTION A READER COULD ACTUALLY SEE. `/library` publishes "only what I have finished gets
    // in" and puts a rating on every entry; `/ramp-up` publishes a per-book status. A book rated on the
    // shelf and marked *(lendo)* one route away is the two surfaces disagreeing about a fact, and it is
    // the specific drift the shelf's own copy makes checkable.
    it(`marks every shared book as finished in rampup.${locale}.md`, () => {
      for (const { book, cited } of sharedIn(locale)) {
        expect(cited.rest, `"${book.title}" is rated on /library but not marked finished on /ramp-up`).toContain(
          FINISHED[locale],
        );
      }
    });
  }

  // Both editions or neither. A book added to one markdown file and forgotten in the other is the drift
  // ADR-0032 warns about for two-file long-form, and the intersection tests above would each stay green
  // on their own edition while the pair was broken.
  it('cites the same shared books in both editions', () => {
    const key = (locale: 'pt' | 'en') => sharedIn(locale).map(({ book }) => normalizeBookUrl(book.url)).sort();
    expect(key('pt')).toEqual(key('en'));
  });
});

describe('the cross-link /ramp-up now carries', () => {
  // The link that sends a ramp-up reader to the shelf, deferred by `product-lead` to the slice that lands
  // the first entries — this one. Authored as the LOGICAL path in both editions; `Markdown`'s link handler
  // resolves it to the active locale's real, prerendered URL, which is why the two files can carry the
  // identical href and the ramp-up parity guard still compares equal.
  it('points at the logical path in both editions, never a locale-pinned or bare-prefixed one', () => {
    for (const locale of ['pt', 'en'] as const) {
      expect(EDITIONS[locale], `rampup.${locale}.md does not link the shelf`).toContain('](/library)');
      // A hardcoded prefix would pin one edition's readers to the other's language, and it is the exact
      // shape someone "fixing" the redirect would reach for.
      expect(EDITIONS[locale]).not.toContain('](/pt/library)');
      expect(EDITIONS[locale]).not.toContain('](/en/library)');
    }
  });
});
