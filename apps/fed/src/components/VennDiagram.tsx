// The three-pillar figure on /architecture: three overlapping circles with the claim in the intersection.
//
// WHY THIS IS NOT A MERMAID FENCE. mermaid draws no Venn — not in flowchart, block or architecture-beta,
// and not through a plugin the build-time compile could load. Every other figure on this page goes
// through `gen-diagrams.mjs`; this one cannot, so it is authored JSX over a fixed geometry. That is a
// second rendering path on one page, which is a real cost and is stated rather than buried:
//
//   · a ```venn fence renders on GitHub as a code block, not a picture — unlike a ```mermaid fence. The
//     spec is therefore written to read as plain text (see `lib/vennSpec.ts`), so the copy-as-markdown
//     payload and the raw file still carry every word of the figure.
//   · nothing compiles it, so nothing can go stale — but equally, no artifact pins what it renders. The
//     unit tests and the E2E are the only things standing where `diagrams.json` stands for the others.
//
// WHAT IT DOES SHARE, deliberately: the <figure>, the `.diagram-canvas` box, the centring rule, the
// scroll-inside-the-box contract and the caption-from-the-source rule all come from `DiagramFigure`, so
// the two kinds of figure cannot drift apart on the properties a reader actually experiences.
import { useEffect, useRef } from 'react';
import { parseVennSpec, type VennSpec } from '../lib/vennSpec';
import { DiagramFigure } from './DiagramFigure';

// THE GEOMETRY, fixed here and not authored, because a spec that could move the circles would be a
// layout engine — and a layout engine is what this file exists to avoid.
//
// Three circles of radius R centred on the vertices of a triangle, close enough that all three overlap at
// once. The numbers are not arbitrary and they are not eyeballed — two properties have to hold, and both
// are asserted in `VennDiagram.test.tsx` against the REAL authored content of both editions rather than
// left to the eye, because "the words fell outside the circle" is the failure a picture hides best:
//
//   · the triple intersection exists at all, which needs the centroid within R of each centre (158 < 270
//     here). Slide the circles apart and the label in the middle stops being in the middle;
//   · every authored line sits inside its own circle AND outside the other two, at a deliberately
//     PESSIMISTIC glyph width. An over-long pillar title is then a red test at authoring time instead of
//     a word crossing a stroke on the published page.
const VIEW_W = 1000;
const VIEW_H = 900;
const R = 270;
/** Circle centres, and the anchor each pillar's text block is built around — in its own free lobe. */
const CIRCLES = [
  { cx: 380, cy: 350, tx: 266, ty: 268 },
  { cx: 660, cy: 350, tx: 774, ty: 268 },
  { cx: 520, cy: 570, tx: 520, ty: 700 },
] as const;
const CENTRE = { x: 520, y: 423 };

const TITLE_SIZE = 18;
const ITEM_SIZE = 15;
const CENTRE_SIZE = 21;
const LINE = 21;
/** Title baselines sit above the anchor; items start on it. */
const TITLE_OFFSETS = [-48, -26];

/**
 * The width below which the figure scrolls inside its box instead of shrinking.
 *
 * THE TRADE, stated because it is the one thing this figure does that no other on the page does: an SVG
 * with `width="100%"` and no floor scales down without limit, and at a 390px phone this one's 16px item
 * type would land near 5px — present, "visible" to every assertion, and unreadable. The alternative is
 * the box's own overflow contract, which `Diagram.tsx` has always declared and which mermaid's
 * `width="100%"` has so far kept inert: the picture stays legible and the reader pans it sideways.
 * Legible-and-panned beats complete-and-microscopic, and the page body still never scrolls.
 */
const MIN_WIDTH = 680;

/**
 * A DOM id derived from the figure's own title, so `aria-labelledby` and `aria-describedby` resolve
 * without a random id — which would differ between the prerendered HTML and the hydrated app and produce
 * exactly the mismatch this page's build-time render exists to avoid.
 *
 * Accented characters are dropped rather than transliterated. The id is never read by a human and the
 * two editions carry different titles anyway, so the only property that matters is that it is stable and
 * that there is one figure of this kind per page.
 */
const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'figure';

export function VennDiagram({ spec }: { spec: VennSpec }) {
  const id = `venn-${slug(spec.accTitle)}`;
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const canvas = useRef<HTMLDivElement | null>(null);

  // WHERE THE READER LANDS WHEN THE FIGURE DOES NOT FIT — and this is the half the `min-width` alone did
  // not deliver, measured in a browser rather than reasoned about: at 390px the box shows 352 of 712px,
  // and the intersection label sits ~370px in, so a phone reader arriving at scrollLeft 0 saw one circle,
  // four bullets, and the claim cut mid-word or missing entirely. Every assertion passed — the E2E asked
  // only that nothing sat left of the origin, and the geometry test works in viewBox units where the
  // label is perfectly centred.
  //
  // So the scroll OPENS on the intersection. The reader lands on the claim and pans outward to the
  // pillars, which is the figure's own reading order anyway. `min-width` is deliberately NOT lowered:
  // shrinking further is what makes the type unreadable, and unreadable-but-whole was the trade this
  // figure exists to refuse.
  //
  // `data-pannable` is the affordance. Nothing in a scroller tells a touch reader there is more —
  // overlay scrollbars are invisible until you already scrolled — so the box takes an inset edge shadow
  // when, and only when, it actually scrolls. Set from here rather than in CSS because "does this
  // overflow" is a layout question no selector can ask.
  useEffect(() => {
    const box = canvas.current;
    if (!box) return;
    const place = () => {
      const overflow = box.scrollWidth - box.clientWidth;
      if (overflow <= 0) {
        box.removeAttribute('data-pannable');
        return;
      }
      box.setAttribute('data-pannable', '');
      const centre = (CENTRE.x / VIEW_W) * box.scrollWidth - box.clientWidth / 2;
      box.scrollLeft = Math.max(0, Math.min(overflow, centre));
    };
    place();
    // A resize can cross the fits/does-not-fit boundary in either direction, and a reader rotating a
    // phone is the ordinary case rather than an exotic one.
    //
    // Feature-detected rather than assumed: jsdom has no ResizeObserver, and an unguarded `new` there
    // throws inside an effect — which took down every test that renders this page, including three that
    // are about something else entirely. The first placement above is what actually matters and it has
    // already run; the observer only keeps it true.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(place);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <DiagramFigure caption={spec.accTitle} canvasRef={canvas}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        // `preserveAspectRatio` left at its default (xMidYMid meet) on purpose: the figure must never be
        // stretched, and the box centres it through `.diagram-canvas > svg { margin-inline: auto }`.
        style={{ maxWidth: `${VIEW_W}px`, minWidth: `${MIN_WIDTH}px`, fontFamily: 'inherit' }}
        role="graphics-document"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        {/* <title> and <desc> rather than an aria-label, matching what mermaid emits for the other four
            figures — so a screen reader gets the same two things from every diagram on this page. */}
        <title id={titleId}>{spec.accTitle}</title>
        <desc id={descId}>{spec.accDescr}</desc>

        {/* The circles first, so every word is painted over them and nothing is occluded. The fill is
            faint and additive: three overlapping strokes at one-tenth opacity make the shared centre
            visibly denser than any single circle, which is the whole point of the figure and costs no
            extra element to say. */}
        {CIRCLES.map(({ cx, cy }, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={R}
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />
        ))}

        {spec.pillars.map((pillar, i) => {
          const { tx, ty } = CIRCLES[i];
          return (
            <g key={i}>
              {pillar.title.map((line, j) => (
                <text
                  key={j}
                  x={tx}
                  y={ty + TITLE_OFFSETS[j]}
                  textAnchor="middle"
                  fontSize={TITLE_SIZE}
                  fontWeight={700}
                  fill="hsl(var(--primary))"
                >
                  {line}
                </text>
              ))}
              {pillar.items.map((item, j) => (
                <text
                  key={j}
                  x={tx}
                  y={ty + j * LINE}
                  textAnchor="middle"
                  fontSize={ITEM_SIZE}
                  fill="hsl(var(--foreground))"
                >
                  {item}
                </text>
              ))}
            </g>
          );
        })}

        {spec.centre.map((line, i) => (
          <text
            key={i}
            x={CENTRE.x}
            y={CENTRE.y - 11 + i * (LINE + 3)}
            textAnchor="middle"
            fontSize={CENTRE_SIZE}
            fontWeight={700}
            fill="hsl(var(--foreground))"
          >
            {line}
          </text>
        ))}
      </svg>
    </DiagramFigure>
  );
}

/** Exported for the geometry test, which is the only thing standing where `diagrams.json` stands for the
 *  mermaid figures. */
export const VENN_GEOMETRY = {
  VIEW_W,
  VIEW_H,
  R,
  CIRCLES,
  CENTRE,
  TITLE_OFFSETS,
  LINE,
  MIN_WIDTH,
  TITLE_SIZE,
  ITEM_SIZE,
  CENTRE_SIZE,
};

/** The renderer for a ```venn fence body — parse strictly, then paint. */
export function VennFence({ body }: { body: string }) {
  return <VennDiagram spec={parseVennSpec(body)} />;
}
