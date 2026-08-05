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
import { library } from '../data/library';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useLocale } from '../i18n';

export function LibraryPage() {
  const { t } = useLocale();
  const entries = library;

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
            is also what stops a broken data import reading as an intentional empty shelf.

            The non-empty arm is slice 2's (cards + covers, #166): while `library` is `[]` by design there
            is nothing for it to render, and inventing a card layout here would be building the next
            slice's deliverable inside this one. */}
        {entries.length === 0 && (
          <p data-testid="library-empty" className="max-w-[62ch] text-[17px] leading-relaxed text-muted-foreground">
            {t('library.empty')}
          </p>
        )}
      </section>
    </div>
  );
}
