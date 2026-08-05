// The curated reading shelf behind the Biblioteca / Library surface (#166).
//
// SHAPE: modelled on `repoCards.ts`, deliberately not on `catalog.ts` or `profile.ts`. A flat array
// whose FACTS (title, authors, publisher, year, url) are authored ONCE and carry no locale — a book's
// title and its author are the same in every edition — with exactly ONE reader-facing prose leaf typed
// `Record<Locale, string>`. That leaf type is the whole point: a missing translation is a COMPILE error,
// which is the contract `catalog.ts` lacked when it served Portuguese on `/en/portfolio` for three days
// (#235). `catalog.ts`'s unions and cross-entry invariants and `profile.ts`'s derived fields are both
// more machinery than a shelf needs.
//
// READER-FACING BY PATH: `takeaway` is reader-facing bilingual prose, so despite living under `src/data/`
// a change to one is copy, not app data — the same note `repoCards.ts` carries. It is NOT an owner gate
// (ADR-0003's 2026-07-30 amendment made reader-facing content safe class); what it still is, is the
// trigger for `product-lead`.
//
// ONLY-READ IS THE MODEL (owner, 2026-08-05). There is no `status` field and no discriminated union:
// every entry on the shelf is a book that was read and rated. Queued and in-progress books are not
// represented, so `rating` needs no "may be absent" case and the type stays flat. If that ever changes,
// the honest shape is a discriminated union so that *an unread book carrying a rating* is a compile
// error — adding a discriminant to a small array later is mechanical; guessing at one now bakes in the
// wrong shape and the guess becomes invisible.
import { LOCALES, type Locale } from '../i18n';

/**
 * A 1–5 reading rating, as a LITERAL UNION rather than `number`.
 *
 * The meter renders `rating` filled squares out of `RATING_MAX`, so a `0` or a `6` would ship and draw
 * wrong with nothing able to object — the component would be doing exactly what it was told. The union
 * makes it a compile error at zero runtime cost. `assertLibraryShape` re-checks it anyway, because a
 * compile-time union is erased at runtime and a single `as Rating` anywhere would restore the hole.
 */
export type Rating = 1 | 2 | 3 | 4 | 5;

/** The rating scale's endpoints — the meter's square count and the validator's bounds read the same two
 *  constants, so the UI and the guard cannot disagree about what "out of five" means. */
export const RATING_MIN = 1;
export const RATING_MAX = 5;

export interface LibraryEntry {
  /** The book's title as its publisher spells it — a fact, authored once. */
  title: string;
  /** Author names, in the order the cover credits them — facts. At least one. */
  authors: string[];
  /** Publisher, when it says something a reader uses (an O'Reilly spine is a signal) — a fact. */
  publisher?: string;
  /** Edition year — a fact. Optional: an edition year that is not certain is better absent than guessed. */
  year?: number;
  /**
   * The book's canonical public page (publisher or equivalent) — a fact, AND THE IDENTITY KEY.
   *
   * Identity is the URL and never the title, for the reason `catalog.test.ts` keys on `repoUrl`: a guard
   * keyed on a name went red the day the name changed (#329), and a title is exactly the field an
   * edition or subtitle rewrite churns. A rewrite must not orphan a guard.
   *
   * Outbound links to a publisher are what `/ramp-up` already does and are fine. AFFILIATE / TRACKING
   * links are a different object entirely and are not permitted here (ADR-0002's third-party rule).
   */
  url: string;
  rating: Rating;
  /** What the owner took from the book — reader-facing prose, authored per locale. */
  takeaway: Record<Locale, string>;
}

/**
 * The shelf.
 *
 * EMPTY ON PURPOSE in this slice, and this is a decision rather than a placeholder awaiting content:
 * a stand-in book is reader-facing prose in the owner's voice that ships and is then removed, and it is
 * exactly the class of artifact an OG scraper pins permanently (ADR-0005/0041). The surface's empty state
 * is chrome copy in the message catalog instead, which is a sentence the site can honestly stand behind
 * while the shelf is being filled.
 */
export const library: LibraryEntry[] = [];

/** `url` normalised for identity comparison: trimmed, trailing slashes dropped, lowercased — the same
 *  normalisation `repoCards.ts` applies to a repo URL, so a stray slash or a casing difference cannot
 *  smuggle the same book onto the shelf twice. */
export function normalizeBookUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

// An absolute https URL. `http:` is rejected rather than upgraded: a link the site publishes is a claim
// about where a reader is being sent, and silently rewriting a scheme is not this module's call.
const BOOK_URL = /^https:\/\/[^\s/]+\.[^\s/.]+(?:\/\S*)?$/;

// The plausible window for an edition year. A floor and a ceiling, not a precise range: the value being
// guarded against is a typo (`202` / `20255`) or a placeholder, not an unusual-but-real year.
const YEAR_MIN = 1900;
const yearMax = () => new Date().getFullYear() + 1;

/**
 * The shape guard — A PURE VALIDATOR OVER WHATEVER IT IS HANDED, and that is the load-bearing design
 * choice in this file rather than a style preference.
 *
 * `library` is empty in this slice. Any guard written as `for (const e of library) expect(...)` is
 * therefore GREEN FOREVER while asserting nothing, and stays green through the whole window in which the
 * shelf is being filled — which is precisely the window it exists to protect. An assertion that cannot
 * fail is worse than no assertion, because it reads as coverage. This repo has shipped that defect more
 * than once.
 *
 * So the rules live in a function that takes its input, and the tests hand it SYNTHETIC FIXTURES that
 * violate each rule one at a time. The corpus is irrelevant to whether the rules are proven: they are
 * exercised at full strength against an empty shelf, a one-book shelf and a shelf that will never exist.
 * Same injected-seam reasoning as `buildBlogEditions` in `scripts/routes.mjs` and `buildEditions` in
 * `lib/content.ts`, both of which are pure for the same reason — the real content can never reach the
 * branch that throws.
 *
 * Called on the real `library` at module load (below), the way `content.ts` throws on a missing
 * translation at load: a violation fails the build, the prerender and the test run, so it cannot ship.
 *
 * WHAT IS DELIBERATELY NOT HERE: whether the takeaway is any GOOD, and whether the book belongs on the
 * shelf at all. Both are curation — `product-lead`'s lens and the owner's call — and a validator that
 * pretended to check them would be asserting taste.
 */
export function assertLibraryShape(entries: readonly LibraryEntry[]): void {
  const seen = new Set<string>();

  for (const entry of entries) {
    // Identify the offender by URL where possible; a malformed entry may not have one, and an error
    // message that says `undefined` is an error message that costs a debugging session.
    const where = entry.url?.trim() || entry.title?.trim() || '<an entry with neither url nor title>';
    const fail = (why: string): never => {
      throw new Error(`library: ${where} ${why}`);
    };

    if (!entry.title?.trim()) fail('has no title');
    if (entry.authors.length === 0) fail('credits no author — at least one is a fact every book has');
    if (entry.authors.some((author) => !author.trim())) fail('credits a blank author');
    // No `?? ''` guard: `RegExp.test` coerces its argument, so a cast-in `undefined` is tested as the
    // string "undefined", fails the pattern, and reaches this same message. The nullish fallback was
    // there and was UNREACHABLE — a defensive branch no fixture could enter, which is the same class of
    // thing as an assertion that cannot fail, one layer down.
    if (!BOOK_URL.test(entry.url)) {
      fail(`has no usable canonical URL — it must be an absolute https URL (${BOOK_URL.source})`);
    }
    if (entry.publisher !== undefined && !entry.publisher.trim()) {
      fail('carries a blank publisher — omit the field rather than shipping an empty one');
    }
    if (entry.year !== undefined && (!Number.isInteger(entry.year) || entry.year < YEAR_MIN || entry.year > yearMax())) {
      fail(`carries an implausible year "${entry.year}" — expected an integer in ${YEAR_MIN}..${yearMax()}`);
    }
    // Re-checked at runtime even though `Rating` is a compile-time union: the union is erased, and one
    // `as Rating` anywhere restores the hole this guard exists to close.
    if (!Number.isInteger(entry.rating) || entry.rating < RATING_MIN || entry.rating > RATING_MAX) {
      fail(`is rated "${entry.rating}" — the scale is ${RATING_MIN}..${RATING_MAX}`);
    }
    // Every locale, read from LOCALES rather than spelled out, so a third edition inherits the check.
    for (const locale of LOCALES) {
      if (!entry.takeaway?.[locale]?.trim()) fail(`has no ${locale} takeaway`);
    }

    const key = normalizeBookUrl(entry.url);
    if (seen.has(key)) fail('appears on the shelf twice — the canonical URL is the identity key');
    seen.add(key);
  }
}

assertLibraryShape(library);
