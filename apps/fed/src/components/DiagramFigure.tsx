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
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// THE EXPAND OVERLAY (#473), and the measurement that made it necessary rather than nice.
//
// Every figure here ships `width="100%"` with an inline `max-width` at its natural width, so its render
// scale on a phone is `canvas ÷ natural width` and nothing else. At 390px that is 2.6–3.9px of painted
// type on the three mermaid figures — roughly half what `VennDiagram.tsx`'s own comment already calls
// "present, 'visible' to every assertion, and unreadable". PR #550 raised it to 2.95–4.47px by taking
// width out of the drawings themselves and measured that as NOT ENOUGH. Nothing that keeps the figure
// inside the article column can be enough: the lanes grid's node boxes alone are ~1166px wide.
//
// So the overlay does not try to make a wide drawing fit a narrow phone. It stops asking it to fit.
// The reader gets the figure at its NATURAL size — scale 1.0, 15px type, the size it was drawn at — in
// a full-viewport scroller, and pans it there instead of squinting at it in the column. The in-flow
// figure keeps being the overview; this is the read. Stated as a trade because it is one: at 390px the
// widest figure shows about a quarter of itself at a time.
//
// PROMOTED, NOT DUPLICATED — the <figure> itself becomes the dialog. The obvious build is a second copy
// of the drawing inside a portal, and it is wrong twice here: every mermaid SVG carries a pinned `id`
// plus `aria-labelledby`/`aria-describedby` pointing at ids inside itself, so a second copy puts
// duplicate ids in the document and the overlay's own name resolves to the hidden copy's; and the Venn
// reaches this component's canvas by ref, with a `ResizeObserver` that would go on observing the
// detached box. Promoting the one element in place keeps the ids unique, keeps `canvasRef` pointing at
// the box that is really on screen, and gets the Venn's re-centring for free — the promotion IS a
// resize, so its observer re-centres the intersection at the new width without knowing this exists.
//
// A WRAPPER DIV HOLDS THE PLACE. A fixed-position figure is out of flow, so the page below it would
// jump up by the figure's height while the overlay is open and the browser would clamp the scroll
// offset — the reader would close the overlay somewhere else on the page. The wrapper takes the
// figure's measured height for as long as it is promoted, and carries the block margins so nothing
// collapses differently.
import { useCallback, useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useT } from '../i18n';
import { useDialogFocus } from '../hooks/useDialogFocus';

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
 * Take the figure's natural width off its own `max-width` and make it a FLOOR instead of a ceiling.
 *
 * This is the whole of the overlay's rendering change, and it is imperative rather than a CSS rule for
 * a reason no stylesheet can work around: the natural width is per-figure and lives in an inline style
 * the generator wrote (`style="max-width: 1628.453125px"` — and `1000px` on the Venn, from
 * `VennDiagram.tsx`). CSS cannot read one declaration to compute another, so a rule could only pick a
 * single constant for four figures of different widths.
 *
 * Returns the restore function, so the two halves cannot drift: whatever was captured is what goes
 * back. A figure with no inline `max-width` is left completely alone rather than given a guessed one.
 */
export function floorToNaturalWidth(svg: SVGSVGElement | null): () => void {
  if (!svg) return () => {};
  const maxWidth = svg.style.maxWidth;
  const minWidth = svg.style.minWidth;
  if (!maxWidth) return () => {};
  svg.style.minWidth = maxWidth;
  // `none`, not "unset the property": with `max-width` gone the figure also fills a viewport WIDER
  // than its natural size, which is the desktop case — a 1074px drawing on a 1440px screen is read at
  // 1.3× rather than at the size it happened to compile to.
  svg.style.maxWidth = 'none';
  return () => {
    svg.style.minWidth = minWidth;
    svg.style.maxWidth = maxWidth;
  };
}

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
 * because it is the only figure that can overflow in the flow (see the `min-width` note in
 * VennDiagram.tsx). In the overlay every figure overflows, which is the point.
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
  const t = useT();
  const [open, setOpen] = useState(false);
  /** The in-flow height to hold open while the figure is out of flow. Null when it is not promoted. */
  const [placeholder, setPlaceholder] = useState<number | null>(null);
  const figure = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLDivElement | null>(null);

  // One element, two refs: this component needs the scroller to find the SVG, and the Venn needs it to
  // place the initial scroll. A callback ref rather than two elements, because there is exactly one box
  // and every rule in the stylesheet and every E2E selector says so.
  const attachCanvas = useCallback(
    (el: HTMLDivElement | null) => {
      canvas.current = el;
      if (canvasRef) canvasRef.current = el;
    },
    [canvasRef],
  );

  useEffect(() => {
    if (!open) return;
    return floorToNaturalWidth(canvas.current?.querySelector('svg') ?? null);
  }, [open]);

  const canvasProps = { ref: attachCanvas, className: CANVAS, tabIndex: open ? 0 : undefined };

  // The trigger and the close control are THE SAME BUTTON, which is not a shortcut — it is what makes
  // focus restoration trivially correct. `ShareModal` has to be handed its trigger because the trigger
  // lives in another component; here the control never unmounts, so "return focus to the trigger" and
  // "leave focus where it is" are the same act, and there is no captured node that can go stale.
  useDialogFocus({ panel: figure, onClose: () => setOpen(false), returnFocusTo: toggle, active: open });

  return (
    <div className="my-8" style={placeholder !== null ? { height: placeholder } : undefined}>
      {/* No role and no aria-label on this wrapper, deliberately. `role="img"` is a LEAF role: assistive
          technology presents the whole subtree as one graphic, so the SVG's own <title> and — worse —
          its entire <desc>, authored per locale, become unreachable. A screen reader would get the
          caption and nothing else, while a test three files away asserts the description is present. Each
          SVG carries role="graphics-document" with aria-labelledby and aria-describedby pointing at both;
          the <figure> and its <figcaption> name it for everyone else.

          WHILE PROMOTED IT IS A DIALOG AND NOT A FIGURE, and that swap is deliberate: a modal that keeps
          announcing itself as a figure gives a screen-reader user no signal that the page behind is now
          inert, which is the one thing `aria-modal` exists to say. The accessible name does not change —
          it is the caption either way, so the reader hears the same words for the same drawing.

          Wide diagrams scroll INSIDE this box — the page body must never scroll sideways, which the
          320px width sweep asserts and this would otherwise be the first thing to break. */}
      <figure
        ref={figure}
        className={cn('diagram', open && 'diagram-overlay')}
        aria-label={caption}
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
      >
        <div className="mb-2 flex justify-end">
          <button
            ref={toggle}
            type="button"
            onClick={() => {
              // Measured BEFORE the promotion, because a fixed element has no in-flow height to read
              // afterwards. Read from the figure rather than remembered across opens — the column is a
              // different width after a rotation, and a stale height is a visible gap in the page.
              setPlaceholder(open ? null : (figure.current?.getBoundingClientRect().height ?? null));
              setOpen(!open);
            }}
            // The VISIBLE label is one word and the ACCESSIBLE name names the figure, because a page
            // with four of these otherwise offers a screen-reader user four controls called "Expand".
            // WCAG 2.5.3 (Label in Name) needs the visible label to be contained in the accessible one,
            // which is why the long form is built by extending the short one rather than replacing it.
            aria-label={`${t(open ? 'diagram.collapse' : 'diagram.expand')}: ${caption}`}
            aria-haspopup={open ? undefined : 'dialog'}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 px-2 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {/* NO ICON, AND IT IS NOT A STYLE CALL — a lucide glyph is an <svg>, and three of this
                repo's measurement suites read a figure's drawing as `el.querySelector('svg')`
                (`e2e/diagram-bleed.spec.ts:58`, and the unit tests for both figure kinds). An icon
                inside the <figure> makes the FIRST svg in every figure a 14px decoration, so every one
                of those measurements silently retargets. Caught by three red tests on the first run;
                left as text because the label already says the whole word and this row is mono
                uppercase like the caption under it. */}
            {t(open ? 'diagram.collapse' : 'diagram.expand')}
          </button>
        </div>
        {/* The two branches stay two branches — the class has to sit on the SVG's DIRECT parent, and
            `dangerouslySetInnerHTML` cannot coexist with children — but everything they SHARE is
            written once. It was written twice for one revision of this slice and both copies had to be
            edited twice; the second edit is the one that gets missed.

            `tabIndex` only while promoted: a scrollable region a mouse can pan and a keyboard cannot is
            unreachable, and in the overlay panning IS the feature (the same reason `Markdown`'s table
            wrapper carries it). In the flow the box scrolls nowhere for three of the four figures, so a
            permanent tab stop would be a stop that does nothing. */}
        {html !== undefined ? (
          <div {...canvasProps} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div {...canvasProps}>{children}</div>
        )}
        <figcaption className={FIGCAPTION_CLASS}>{caption}</figcaption>
      </figure>
    </div>
  );
}
