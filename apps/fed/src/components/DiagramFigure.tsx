// The box every figure on /architecture sits in — extracted from Diagram.tsx when a SECOND kind of
// figure arrived (the three-pillar Venn, which mermaid cannot draw).
//
// Extracted rather than copied, and that is the whole reason this file exists: `.diagram-canvas` is
// load-bearing in four places outside this component — the centring rule in `styles/index.css`
// (`.diagram-canvas > svg`), the overflow contract that keeps the PAGE from scrolling sideways at 320px,
// `e2e/diagram-centred.spec.ts`, and the background-equality check in `e2e/routes.spec.ts`. Two boxes
// carrying that class independently is two things to keep in step, and the one that drifts is the one
// nobody looks at.
//
// `.diagram` on the <figure> is load-bearing too now (#464): it carries the DESKTOP BREAKOUT — above
// 1024px the figure pulls out of the article column with negative inline margins so a drawing renders
// at a legible scale while the prose stays exactly where it is. That rule lives in `styles/index.css`
// beside the centring one, its clearance is asserted by `e2e/diagram-bleed.spec.ts`, and `PhotoFigure`
// deliberately does NOT reuse this class — a photograph has a natural size and nothing to gain from
// breaking the measure.
import type { MutableRefObject, ReactNode } from 'react';

const CANVAS = 'diagram-canvas overflow-x-auto border border-border bg-background p-4';

/**
 * The caption treatment every figure on /architecture shares — exported so `PhotoFigure` can look
 * identical WITHOUT reusing this component (#415).
 *
 * A CLASS STRING RATHER THAN THE COMPONENT, and the distinction is checkable rather than stylistic.
 * `.diagram-canvas` is selected page-wide by `e2e/diagram-centred.spec.ts`, which reads
 * `el.querySelector('svg')` and measures from it. On a photograph that is `null`, every measurement
 * becomes `NaN`, and `NaN` fails every comparison — at all four widths, in both editions, on the first
 * run. The centring rule (`.diagram-canvas > svg`) does not select an `<img>` either, and the
 * background-equality check in `e2e/routes.spec.ts` is meaningless on a raster.
 *
 * So what is genuinely shared here is the CAPTION, and it is shared as the one thing that can be:
 * a string. A photograph and a drawing look like one decision to the reader and are two different
 * things to a gate, which is the outcome both halves of this need.
 */
export const FIGCAPTION_CLASS =
  'mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground';

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
 *
 * `canvasRef` reaches the SCROLLER, not the figure — a caller that needs to position the initial scroll
 * has to touch the element that scrolls, and that element is created here. Only the Venn path uses it,
 * because it is the only figure that can overflow (see the `min-width` note in VennDiagram.tsx).
 */
export function DiagramFigure({
  caption,
  html,
  children,
  canvasRef,
}: {
  caption: string;
  html?: string;
  children?: ReactNode;
  canvasRef?: MutableRefObject<HTMLDivElement | null>;
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
        <div ref={canvasRef} className={CANVAS} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div ref={canvasRef} className={CANVAS}>
          {children}
        </div>
      )}
      <figcaption className={FIGCAPTION_CLASS}>{caption}</figcaption>
    </figure>
  );
}
