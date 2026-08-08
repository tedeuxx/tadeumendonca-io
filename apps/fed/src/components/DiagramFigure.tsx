// The box every figure on /architecture sits in — extracted from Diagram.tsx when a SECOND kind of
// figure arrived (the three-pillar Venn, which mermaid cannot draw).
//
// Extracted rather than copied, and that is the whole reason this file exists: `.diagram-canvas` is
// load-bearing in four places outside this component — the centring rule in `styles/index.css`
// (`.diagram-canvas > svg`), the overflow contract that keeps the PAGE from scrolling sideways at 320px,
// `e2e/diagram-centred.spec.ts`, and the background-equality check in `e2e/routes.spec.ts`. Two boxes
// carrying that class independently is two things to keep in step, and the one that drifts is the one
// nobody looks at.
import type { ReactNode } from 'react';

const CANVAS = 'diagram-canvas overflow-x-auto border border-border bg-background p-4';

/**
 * `caption` is the reader-visible label, already in the active locale (each edition authors its own).
 *
 * The caption is a real <figcaption> and not only the SVG's internal <title>. mermaid emits accTitle as
 * <title>, which a screen reader announces but a sighted reader never sees — a diagram whose only label
 * is invisible to most readers is labelled for the audit, not for the audience.
 *
 * Exactly one of `html` and `children` is supplied. `html` is the mermaid path, where the SVG is a
 * build-compiled string; `children` is the authored-JSX path. They cannot be collapsed into one, because
 * the class has to sit on the element that is the SVG's DIRECT parent for the centring rule to select it.
 */
export function DiagramFigure({
  caption,
  html,
  children,
}: {
  caption: string;
  html?: string;
  children?: ReactNode;
}) {
  return (
    <figure className="diagram my-8" aria-label={caption}>
      {/* No role and no aria-label on this wrapper, deliberately. `role="img"` is a LEAF role: assistive
          technology presents the whole subtree as one graphic, so the SVG's own <title> and — worse —
          its entire <desc>, authored per locale, become unreachable. A screen reader would get the
          caption and nothing else, while a test three files away asserts the description is present. Each
          SVG carries role="graphics-document" with aria-labelledby and aria-describedby pointing at both;
          the <figure> and its <figcaption> name it for everyone else.

          Wide diagrams scroll INSIDE this box — the page body must never scroll sideways, which the
          320px width sweep asserts and this would otherwise be the first thing to break. */}
      {html !== undefined ? (
        <div className={CANVAS} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className={CANVAS}>{children}</div>
      )}
      <figcaption className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
