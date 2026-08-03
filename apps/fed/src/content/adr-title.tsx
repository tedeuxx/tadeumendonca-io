// The inline markup an ADR heading may carry, rendered as React nodes (#318).
//
// WHY THIS EXISTS. ADR titles are authored markdown headings and several carry inline markup. Rendered
// as flat text they publish their own syntax — cosmetic for most of them (backticks around a filename,
// a route or a parameter name; bold in 0038) and NOT cosmetic for one:
//
// No count here, deliberately. The first version said "five … cosmetic for four of them" and named
// three; it is six and five. A number about the library, in the comment justifying the module, on a
// public repo whose pitch is that its claims are checkable — the same defect this slice shipped twice
// in reader-facing copy, reappearing in the file written to fix that class. The count that IS kept true
// lives in the test, where an assertion can fail; prose that cannot fail does not carry counts.
//
//   0032 — "Internationalize the site — light in-repo locale layer, ~~English-pinned crawlable baseline~~"
//
// The strikethrough IS the meaning: it is how that record marks half of its own decision as retired
// (ADR-0036 removed it). Flattened, the row asserts the site has an English-pinned crawlable baseline —
// untrue today, and contradicted by this very page four sections earlier, which says every route is
// prerendered in both locales. A published row that contradicts the page carrying it is worse than a
// missing one. Found by `marketing-lead`.
//
// NO `dangerouslySetInnerHTML`, and that is the whole design constraint rather than a preference. The
// artifact is generated from repo markdown, but this is the first place a *title* becomes markup, and
// `security` reviewed the flat version specifically on the ground that React escapes text children. That
// property must survive: this returns an array of React elements built from matched spans, so no string
// is ever interpreted as HTML and the escaping guarantee is unchanged.
import type { ReactNode } from 'react';

/**
 * One pattern, alternating, so a single pass keeps the spans in document order and nothing can nest —
 * ADR headings do not nest markup, and refusing to support it is what keeps this small enough to trust.
 * Order matters only in that each alternative is anchored to its own delimiter, so they cannot overlap.
 */
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~)/g;

export function renderAdrTitle(title: string): ReactNode[] {
  return title.split(INLINE).map((part, i) => {
    const key = `${i}-${part}`;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    // `<del>`, not a class: the retirement is semantic, and a screen reader announcing "deleted" is the
    // point. Styling it as decoration would reproduce the flat-text defect for a non-sighted reader.
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return <del key={key}>{part.slice(2, -2)}</del>;
    }
    return part;
  });
}
