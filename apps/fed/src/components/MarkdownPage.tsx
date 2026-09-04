// Shared shell for the long-form markdown content pages (/ramp-up, /architecture). Both surfaces are the
// same object: a document head (canonical + OG + Article JSON-LD), a header with a kicker + ShareButton +
// H1, and a markdown body rendered by the shared <Markdown>. Only the resolved copy, the canonical path,
// the JSON-LD type and the already-resolved body string differ — so those are props, and the shell is
// authored once here (retires the duplication flagged in #113).
//
// The body is passed in ALREADY resolved: the ramp-up page runs its markdown through withYears() first,
// the architecture page passes its body as-is. This component is body-agnostic on purpose — it never
// transforms the string it renders.
import { Markdown } from './Markdown';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { absoluteUrl } from '../lib/site';
import { useLocalePath } from '../i18n';
import { ShareButton } from './ShareButton';
import { ShareLinks } from './ShareLinks';
import { ContactLinks } from './ContactLinks';

interface MarkdownPageProps {
  /** Kicker label above the heading (font-mono, uppercase). */
  kicker: string;
  /** Document <title> + OG title + ShareButton title + JSON-LD headline. */
  title: string;
  /** Meta description for the document head. */
  description: string;
  /** Visible H1. */
  heading: string;
  /** Canonical route path (e.g. '/ramp-up'); also the ShareButton url and the JSON-LD url source. */
  canonicalPath: string;
  /** schema.org @type for the JSON-LD (e.g. 'Article'). */
  jsonLdType: string;
  /** Already-resolved markdown body string — rendered verbatim, never transformed here. */
  body: string;
  /**
   * Renders the closing block after the body: the contact route, then the share deeplinks.
   *
   * OPT-IN, AND DEFAULTING TO FALSE IS THE WHOLE POINT (#450). This shell is shared with /ramp-up, and
   * that page is a personal plan in progress that nobody decided to distribute — rendering the block
   * unconditionally would hand it a distribution affordance and a contact CTA as a SIDE EFFECT of a slice
   * about a different page. `MarkdownPage.test.tsx` asserts the default arm renders neither, and it is
   * mutation-checked by flipping this default to `true`.
   *
   * ONE FLAG FOR BOTH BLOCKS, not two. They are one decision — "this page asks the reader for something"
   * — taken once, for one page; two booleans that are only ever set together are redundant state, and the
   * first caller to set one and not the other would be a page in a half-state nobody designed.
   */
  endMatter?: boolean;
}

export function MarkdownPage({
  kicker,
  title,
  description,
  heading,
  canonicalPath,
  jsonLdType,
  body,
  endMatter = false,
}: MarkdownPageProps) {
  // `canonicalPath` is the UNPREFIXED logical path; useDocumentHead prefixes it per locale for the
  // canonical + hreflang. The ShareButton and JSON-LD url want the concrete locale URL, so prefix here.
  const lp = useLocalePath();
  const localizedPath = lp(canonicalPath);
  useDocumentHead({
    title,
    description,
    canonicalPath,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': jsonLdType,
      headline: title,
      url: absoluteUrl(localizedPath),
      author: { '@type': 'Person', name: 'Luiz Tadeu Mendonça' },
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <article className="px-[--gutter] py-6">
        <header className="mb-[clamp(1.8rem,3vw,2.6rem)] border-b-2 border-border-strong pb-[clamp(1.4rem,3vw,2rem)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            <span>{kicker}</span>
            {/* ShareButton prepends the origin — it takes a PATH, not an absolute URL. `body` is the
                ALREADY-RESOLVED string this shell renders below, which is what makes copy-as-markdown
                (#387) free and correct on /ramp-up: the caller resolved `{{years}}` before handing it
                here, so the clipboard gets the same text the reader is looking at. Passing the import
                instead would put a literal `{{years}}` in someone's notes. */}
            {/* `slug` for `share_open` (#597) is the UNPREFIXED canonical path with its leading slash
                dropped — `ramp-up`, `architecture`. Derived here rather than added as a fourth prop
                because, unlike an article slug, it is NOT per-locale: ADR-0036 prefixes one English
                path twice, so there is no edition to resolve and nothing for a caller to know that this
                component does not. `localizedPath` is deliberately not the source — it carries the
                locale, which is already its own dimension on the same event. */}
            <ShareButton title={title} url={localizedPath} slug={canonicalPath.replace(/^\//, '')} body={body} size="sm" />
          </div>
          {/* THE HEADING RUNS THE FULL MEASURE OF THE RULE BENEATH IT (#392) — and `text-balance` was
              the bigger half of the cause, not `max-w-[22ch]`. Deleting the cap alone is the obvious
              move and would have left the symptom almost intact. Measured in Chromium on the built
              site, en `/architecture` (the longest heading that ships, 41 chars), at a 1280px viewport
              against a 921.6px header measure:

                before        h1 box 912.4px · WIDEST DRAWN LINE 619.8px  (67% of the measure)
                cap removed   h1 box 921.6px · widest drawn line 619.8px  (67% — visually unchanged)
                both changed  h1 box 921.6px · widest drawn line 900.8px  (98%)

              The cap was worth 9.2px there. It is a `ch` measure on a clamped font, so it scales WITH
              the text and only ever bit in a middle band — measured across a 320→1600 sweep: at the 2rem
              floor it resolves to 456.2px, which is wider than the content box at 500px and below, so it
              was inert there; at the 4rem ceiling it resolves to 912.4px, wider than the 896px content
              box at 1600px, so it was inert again at the top (the crossover sits somewhere between 1280
              and 1600 and was not measured). The largest gap in the sweep was 135.2px, at 1024px. Inert
              at 320px is the part that matters for #159: the narrowest width, where a cap could have
              been load-bearing against an unbreakable token, is exactly where it was already doing
              nothing — so removing it cannot reopen that.

              `text-wrap: balance` is what actually held the title back. It redistributes a wrapped
              heading into EVEN lines, which is the deliberate opposite of filling the measure, and both
              shipped headings wrap at the wide clamp. It was the right choice FOR a 22ch line and stops
              being right the moment the line is no longer constrained.

              `text-pretty` replaces it rather than nothing, because what `balance` was bought for — no
              lone word stranded on the last line — is still wanted; `pretty` keeps the orphan guard
              without redistributing width. It is also the safe degradation: where it is unsupported the
              computed value falls back to `normal`, which fills the line, i.e. what this change asks
              for. The numbers above are re-measurable — `e2e/page-heading-measure.spec.ts` asserts the
              98% case and fails on either half of the mutation. It was `markdown-page-heading.spec.ts`
              and was scoped to THIS component, which is how the identical header in `ArticlePage` and
              `LibraryPage` kept the squeezed title after this fix landed; it is now scoped to the
              property and covers all ten heading routes. */}
          <h1 className="mt-4 text-pretty text-[clamp(2rem,5.5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
            {heading}
          </h1>
        </header>

        {/* `data-testid` marks the BODY as a distinct region from the closing block below it. The
            edition-parity checks compare every source a body cites between pt and en, and the share
            deeplinks the closing block renders are locale-specific BY DESIGN — so an unscoped comparison
            would go red on correct output the moment `endMatter` is passed. The seam is explicit here
            rather than a positional `article > div` selector in the test. */}
        <div
          data-testid="markdown-body"
          className="max-w-none text-[17px] leading-relaxed text-foreground/90"
        >
          <Markdown>{body}</Markdown>
        </div>

        {endMatter && (
          <>
            {/* THE CONTACT ROUTE SITS DIRECTLY UNDER THE BODY'S CLOSING ASK, and it is a COMPONENT rather
                than a link in the markdown for one reason: `contactChannels.ts` declares itself the single
                source of truth for the owner's public channels, and a hardcoded mailto in a content file
                would be a second one — the exact drift that file exists to have already fixed once (X was
                in the directory only, e-mail in the CTA only). `ContactLinks` is reused whole rather than
                a bespoke row: it is the existing "where to find me" directory, already published on the
                landing, and it renders CONTACT_CHANNELS in the shared order. */}
            <div className="mt-[clamp(2rem,4vw,3rem)] border-t border-border pt-5">
              <ContactLinks />
            </div>

            {/* AND THE DEEPLINKS CLOSE THE PAGE — the placement ArticlePage records verbatim and this
                honours rather than re-derives: "A reader who has just finished is the one with something
                to say about it" (#183). Offering the share above the ask would invert both. The header's
                compact ShareButton stays; it is the phone affordance.

                `labelKey` IS PASSED AND ITS DEFAULT IS NOT USED HERE. The group's accessible name defaults
                to `share.linksLabel` — "Compartilhar este artigo" — which is true where ArticlePage renders
                it and false on every page this shell serves: /ramp-up and /architecture are sections of the
                site, not pieces of writing. The pages this shell renders are the whole reason the sibling
                key exists, so this call site is where the override belongs; ArticlePage keeps the default
                and does not change. */}
            <div className="mt-[clamp(2rem,4vw,3rem)] border-t border-border pt-5">
              <ShareLinks title={title} path={localizedPath} labelKey="share.linksLabelPage" />
            </div>
          </>
        )}
      </article>
    </div>
  );
}
