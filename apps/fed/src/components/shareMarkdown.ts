// The copy-as-markdown payload (#387) — the fifth share option's text.
//
// WHY THERE IS ANY WORK HERE AT ALL. "Put the string we already render into the clipboard" is nearly the
// whole feature: the body is in the bundle, parsed, and in hand at the call site, and `content.ts` has
// already stripped the frontmatter (it returns `body` as the remainder and never exports the raw glob), so
// no `slug`/`date`/`track` can leak. What is left is the set of things that are TRUE ON THE PAGE and FALSE
// IN A DOCUMENT, and each one is a defect the reader would meet and we would not:
//
//   1. a root-relative link (`[Biblioteca](/library)`) — resolved by the renderer through `useLocalePath`,
//      dead in every reader's notes;
//   2. the empty ` ```adr-index ` fence — expanded by the renderer into a live table, three backticks and
//      nothing in a paste;
//   3. `{{years}}` — NOT handled here, and that is the design: the callers pass the body they RENDER
//      (`RampUpPage` resolves it through `withYears` first), so reading the same string the reader reads
//      is what makes the token a non-issue. A transform here would be a second resolver for a problem
//      that only exists if you read the import instead.
//
// THE URL CARRIES NO UTM, and this is a decision rather than an omission. Everywhere else on this site a
// share URL is tagged (#272, ADR-0039), because it is a click target. This one is a CITATION: it travels
// into a model's context, someone's notes, a document footer, and if it resurfaces it resurfaces as the
// source. A tagged URL pasted into a document is the ordinary way the tagged variant becomes the one
// someone else links to, which splits the article's own traffic. Counting copies is a client-side event on
// the control, where it cannot contaminate the text.
import { SITE_URL } from '../lib/site';
import { isInternalHref } from '../lib/markdownLinks';

/** A markdown link/image target, with its optional `"title"` — `](/x)` and `](/x "y")` alike. */
const LINK_TARGET = /\]\(\s*([^()\s]+)((?:\s+"[^"]*")?)\s*\)/g;

/**
 * A fenced block whose info string opens with `adr-index`.
 *
 * Deliberately the same shape the renderer keys on — react-markdown turns the info string's first word
 * into `language-adr-index`, which is what `Markdown.tsx`'s `isAdrIndex` reads. The fence carries no
 * content by contract; the body group exists so a fence that somehow acquired one is still consumed
 * whole rather than leaving a stray closing ``` behind.
 */
const ADR_INDEX_FENCE = /^[ \t]*```[ \t]*adr-index[^\n]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm;

export interface MarkdownPayloadInput {
  /** The page title — becomes the generated H1. No body on this site authors one. */
  title: string;
  /** The LOCALE-PREFIXED page path (`/pt/blog/meu-compromisso`), exactly as `ShareButton` receives it. */
  path: string;
  /** The body string the page RENDERS — never the raw import. */
  body: string;
  /** Localizer for root-relative links, bound to the active locale (`useLocalePath`). */
  localizePath: (path: string) => string;
  /** Localized `Fonte` / `Source`. */
  sourceLabel: string;
  /** Localized link text standing in for the expanded ADR index. */
  adrIndexLabel: string;
  /** Where that link points — the ADR library. */
  adrIndexUrl: string;
}

/** Root-relative link targets → absolute URLs in the reader's own edition. External targets untouched. */
const absolutizeLinks = (body: string, localizePath: (path: string) => string): string =>
  body.replace(LINK_TARGET, (whole, target: string, title: string) =>
    isInternalHref(target) ? `](${SITE_URL}${localizePath(target)}${title})` : whole,
  );

/** The empty ADR-index marker → a link to the library it would have expanded into. */
const resolveAdrIndex = (body: string, label: string, url: string): string =>
  body.replace(ADR_INDEX_FENCE, `[${label}](${url})`);

/**
 * The article as markdown, ready for the clipboard.
 *
 * THE SOURCE LINE SITS AT THE TOP, under the title, rather than in a footer. This text is pasted, quoted
 * and truncated by people and by models, and the head is the part that survives all three — an attribution
 * that only exists after the last paragraph is an attribution that a partial quote drops.
 */
export function markdownPayload({
  title,
  path,
  body,
  localizePath,
  sourceLabel,
  adrIndexLabel,
  adrIndexUrl,
}: MarkdownPayloadInput): string {
  const canonical = `${SITE_URL}${path}`;
  const resolved = resolveAdrIndex(absolutizeLinks(body, localizePath), adrIndexLabel, adrIndexUrl);
  return `# ${title}\n\n> ${sourceLabel}: ${canonical}\n\n${resolved.trim()}\n`;
}
