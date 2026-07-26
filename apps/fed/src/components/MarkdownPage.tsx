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
          <h1 className="mt-4 max-w-[22ch] text-balance text-[clamp(2rem,5.5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
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
