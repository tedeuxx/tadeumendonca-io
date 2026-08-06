// The Biblioteca / Library surface (#166) — a curated reading shelf, and the second instance of the
// "typed data → thin page" pattern `/portfolio` established (the other content-surface pattern, markdown
// → `MarkdownPage`, is what `/ramp-up` and `/architecture` are).
//
// ONE COMPONENT, NOT A SECTION + PAGE PAIR. `/portfolio` is split that way only because the landing
// embeds a teaser of it; nothing embeds this one. Split it if and when a landing stripe is wanted.
//
// ADDRESSED BY ONE ENGLISH SLUG PREFIXED TWICE (ADR-0036): `/pt/library` and `/en/library`, with a
// bilingual label and a bilingual page — the same scheme as `/me`, `/portfolio`, `/ramp-up` and
// `/architecture`. The localized pair `/pt/biblioteca ⇄ /en/library` was proposed and declined by the
// owner (2026-08-05): the requirement was a URL that carries its language when a link is forwarded, and
// the locale PREFIX already does that. A localized slug word adds readability of the word, not language
// pinning, and would have cost a second permanent URL contract.
//
// That is why `useDocumentHead` needs no `alternates` here: with a shared slug the hook re-prefixes
// `canonicalPath` for both locales, which is correct — `/pt/library` and `/en/library` are both real,
// prerendered URLs. `alternates` exists for the route class whose path DIFFERS per locale (articles,
// ADR-0037), and passing it here would be machinery with nothing to do.
//
// The prerender waits for the canonical to match `canonicalFor(locale, '/library')` before snapshotting,
// so a wrong `canonicalPath` does not merely mislabel the page — it hangs the build on this route.
import { library, type LibraryEntry } from '../data/library';
import { RatingMeter } from '../components/RatingMeter';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useLocale } from '../i18n';

// THE CARD DOES NOT INVERT ON HOVER, and that is a decision rather than an omission — `PortfolioSection`'s
// card does (`hover:bg-foreground hover:text-background`) and copying it here would have been the obvious
// move. Two reasons, and the first is mechanical:
//
//   `RatingMeter` draws filled squares as `bg-foreground` and unfilled as `bg-border`. On an inverted card
//   the background IS `foreground`, so every filled square would vanish into it — the rating, which is
//   half of what an entry says, would disappear exactly while the reader was pointing at it. Nothing in
//   the meter's own tests could see that; it is a property of the surface that renders it.
//
//   And the card is not a link. A repo card offers several destinations and reacts as one surface to
//   signal that; a book has exactly one, its title carries it, and inverting the whole card would promise
//   an affordance that is not there.
//
// The hover moves the BORDER instead, which is the layout's own device (`--rule` / `--rule-strong`).
function BookCard({ book }: { book: LibraryEntry }) {
  const { locale } = useLocale();
  // Facts, authored once and carrying no locale — the author's name and the publisher's are the same in
  // every edition. `String(year)` rather than leaning on `filter(Boolean)` to coerce: an optional NUMBER
  // and an optional string want different narrowing, and `0` being falsy is the trap in the shape that
  // reads shorter.
  const facts = [book.authors.join(' · '), book.publisher, book.year === undefined ? undefined : String(book.year)]
    .filter((fact): fact is string => Boolean(fact))
    .join(' · ');

  return (
    <li className="flex flex-col gap-3 border border-border p-6 transition-colors duration-150 hover:border-foreground">
      {/* `min-w-0` + `overflow-wrap: anywhere` for the same reason PortfolioSection carries them (#160):
          a grid/flex item never shrinks below its min-content, and a long unbroken title would push the
          card past a 320px viewport. `anywhere` is deliberate over Tailwind's `break-words`, which does
          not shrink min-content — the sizing input that actually caused that overflow. */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="min-w-0 text-[1.4rem] font-bold leading-tight tracking-[-0.02em] [overflow-wrap:anywhere]">
          <a href={book.url} target="_blank" rel="noreferrer" className="hover:text-primary">
            {book.title} <span aria-hidden="true" className="text-primary">↗</span>
          </a>
        </h2>
        {/* One destination per book, so the title IS the link and there is no second anchor to the same
            URL — unlike a repo card, which genuinely offers repo, live site and releases. A duplicate
            link would read as a second destination to a sighted reader and announce the same URL twice to
            a screen reader. `shrink-0` keeps the meter whole when the title is long. */}
        <span className="mt-1.5 shrink-0">
          <RatingMeter rating={book.rating} />
        </span>
      </div>

      <p className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">{facts}</p>
      <p className="max-w-[62ch] text-[15px] leading-relaxed">{book.takeaway[locale]}</p>
    </li>
  );
}

/**
 * `entries` is an INJECTED SEAM with the real shelf as its default, and it exists for one reason: the
 * empty state is live copy, not dead code. Once the shelf has books, no route and no E2E journey can
 * reach that branch any more — and an arm nothing can render is an arm nothing can prove still works.
 * The seam lets the unit tests render it directly, which keeps a reviewed sentence covered for the day
 * the array is emptied, a data import breaks, or a filter is added upstream.
 *
 * Same reasoning as `assertLibraryShape` taking its input rather than reading the module: a branch you
 * can only reach by editing the corpus is a branch that goes untested the moment the corpus moves on.
 */
export function LibraryPage({ entries = library }: { entries?: readonly LibraryEntry[] } = {}) {
  const { t } = useLocale();

  useDocumentHead({
    title: t('library.title'),
    description: t('library.metaDescription'),
    canonicalPath: '/library',
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="px-[--gutter] py-6">
        <header className="mb-[clamp(1.8rem,3vw,2.6rem)] border-b-2 border-border-strong pb-[clamp(1.4rem,3vw,2rem)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <span>{t('library.kicker')}</span>
          </div>
          <h1 className="mt-4 max-w-[22ch] text-balance text-[clamp(2rem,5.5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
            {t('library.heading')}
          </h1>
          <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-foreground/90">{t('library.intro')}</p>
        </header>

        {/* The empty state is rendered off THE DATA, not unconditionally, and that is what makes it
            assertable. `vite preview` and CloudFront both fall a missing path through to `index.html`
            with a 200 (iac/frontend.tf), so "the route answered" proves nothing about this page — a
            journey has to anchor on something only this page can say. Conditioning on `entries.length`
            is also what stops a broken data import reading as an intentional empty shelf: with books on
            the shelf, an import that resolved to `[]` now renders the "still being put together"
            sentence, and the E2E anchors on a BOOK so that reads as the failure it is. */}
        {entries.length === 0 ? (
          <p data-testid="library-empty" className="max-w-[62ch] text-[17px] leading-relaxed text-muted-foreground">
            {t('library.empty')}
          </p>
        ) : (
          // A list, not a stack of divs: this is an enumeration of books and a screen reader should be
          // told how many there are before reading them. One column rather than the portfolio's grid —
          // the payload of an entry is a paragraph of prose, and prose in a narrow column is the thing
          // this layout exists to avoid.
          <ul data-testid="library-shelf" className="flex flex-col gap-4">
            {entries.map((book) => (
              <BookCard key={book.url} book={book} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
