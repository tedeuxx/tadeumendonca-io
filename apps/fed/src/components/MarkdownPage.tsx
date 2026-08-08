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
}

export function MarkdownPage({
  kicker,
  title,
  description,
  heading,
  canonicalPath,
  jsonLdType,
  body,
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
            {/* ShareButton prepends the origin — it takes a PATH, not an absolute URL. */}
            <ShareButton title={title} url={localizedPath} size="sm" />
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
              for. The numbers above are re-measurable — `e2e/markdown-page-heading.spec.ts` asserts the
              98% case and fails on either half of the mutation. */}
          <h1 className="mt-4 text-pretty text-[clamp(2rem,5.5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
            {heading}
          </h1>
        </header>

        <div className="max-w-none text-[17px] leading-relaxed text-foreground/90">
          <Markdown>{body}</Markdown>
        </div>
      </article>
    </div>
  );
}
