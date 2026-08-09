import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VennDiagram, VennFence, VENN_GEOMETRY } from './VennDiagram';
import { Markdown } from './Markdown';
import { parseVennSpec, type VennSpec } from '../lib/vennSpec';
import architectureEn from '../content/architecture.en.md?raw';
import architecturePt from '../content/architecture.pt.md?raw';

/** Every ```venn fence in a body, in document order — the same shape `mermaidFences` has for the other
 *  figure kind, and matched at the start of a line so an indented example inside another fence is not
 *  mistaken for one. */
const vennFences = (markdown: string): string[] =>
  [...markdown.matchAll(/^```venn[ \t]*\n([\s\S]*?)^```[ \t]*$/gm)].map((m) => m[1]);

const EDITIONS = [
  ['en', architectureEn],
  ['pt', architecturePt],
] as const;

const SPEC: VennSpec = parseVennSpec(
  [
    'accTitle: Three pillars',
    'accDescr: A description long enough to be a real one.',
    'centre: Centre one | Centre two',
    'pillar: Alpha | first',
    '- a one',
    '- a two',
    'pillar: Beta | second',
    '- b one',
    'pillar: Gamma | third',
    '- c one',
  ].join('\n'),
);

describe('VennDiagram', () => {
  it('is a labelled figure whose caption is also the accessible name', () => {
    render(<VennDiagram spec={SPEC} />);
    const fig = screen.getByRole('figure', { name: 'Three pillars' });
    expect(fig.querySelector('svg')).not.toBeNull();
    // The caption is queried on the <figcaption> itself, not by text: the accessible name comes from the
    // SVG's <title>, which carries the SAME string, so a text query matches both and would stay green on
    // a figure that lost its visible caption entirely.
    expect(fig.querySelector('figcaption')?.textContent).toBe('Three pillars');
  });

  // The same property `Diagram.test.tsx` pins for the mermaid figures, and it has to be pinned separately
  // here because it is a different component: `role="img"` is a LEAF role, so the <title> and the whole
  // <desc> stop being reachable and a screen reader gets the caption and nothing else.
  it('keeps title and desc reachable rather than collapsing behind a leaf role', () => {
    const { container } = render(<VennDiagram spec={SPEC} />);
    expect(container.querySelector('[role="img"]')).toBeNull();
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('graphics-document');
    expect(svg.querySelector('title')?.textContent).toBe(SPEC.accTitle);
    expect(svg.querySelector('desc')?.textContent).toBe(SPEC.accDescr);
    // aria-labelledby / aria-describedby must actually RESOLVE. Asserted by id lookup rather than by
    // string equality, because two attributes agreeing with each other and pointing at nothing is exactly
    // the shape that passes a naive check.
    expect(svg.querySelector(`#${svg.getAttribute('aria-labelledby')}`)?.tagName).toBe('title');
    expect(svg.querySelector(`#${svg.getAttribute('aria-describedby')}`)?.tagName).toBe('desc');
  });

  it('draws three circles and paints every authored word as real text', () => {
    const { container } = render(<VennDiagram spec={SPEC} />);
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    const words = [...container.querySelectorAll('svg text')].map((t) => t.textContent);
    for (const line of [
      ...SPEC.centre,
      ...SPEC.pillars.flatMap((p) => [...p.title, ...p.items]),
    ]) {
      expect(words, `"${line}" must be painted`).toContain(line);
    }
    // No <foreignObject> — the reason inline SVG was chosen at all. HTML labels are invisible to a
    // crawler reading the SVG and unreadable as text.
    expect(container.querySelector('foreignObject')).toBeNull();
  });

  // THE FLOOR THAT MAKES THE FIGURE LEGIBLE ON A PHONE, and the one thing this figure does that no other
  // on the page does. Without it a `width="100%"` SVG scales without limit and 16px item type lands near
  // 5px at 390px — present, "visible" to every assertion, unreadable. Pinned so it cannot be dropped as
  // "the diagram overflows on mobile", which is the whole intent.
  it('declares a width floor so it scrolls inside its box instead of shrinking to nothing', () => {
    const { container } = render(<VennDiagram spec={SPEC} />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg.style.minWidth).toBe(`${VENN_GEOMETRY.MIN_WIDTH}px`);
    expect(svg.style.maxWidth).toBe(`${VENN_GEOMETRY.VIEW_W}px`);
    // A viewBox, or it cannot size at all — the same assertion `diagram-source.test.mjs` makes of every
    // compiled mermaid SVG.
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${VENN_GEOMETRY.VIEW_W} ${VENN_GEOMETRY.VIEW_H}`);
  });
});

// WHERE THE READER LANDS, and the reason this is stubbed rather than left to the E2E: jsdom has no
// layout, so `scrollWidth === clientWidth === 0` and the overflow branch never executes on its own. That
// left the placement, the affordance and the observer teardown as the only uncovered lines in this
// slice — and they are the lines a copy lens had to catch in a browser, which is exactly the wrong place
// to be finding them.
//
// The browser half is NOT replaced by this: `e2e/diagram-centred.spec.ts` measures the real thing at
// 320/390/1280 and across a resize. What this adds is the arithmetic and the wiring, at unit speed and
// with the scroll value asserted directly rather than inferred from a rectangle.
describe('the pan placement, on a box that really overflows', () => {
  const SCROLL_W = 1000;
  const CLIENT_W = 300;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** Give jsdom the two numbers it cannot compute, and capture what the component writes back. */
  function overflowing() {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(SCROLL_W);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(CLIENT_W);
    // Spied on the SETTER rather than read back off the element: jsdom does no layout, so it silently
    // discards an assignment to `scrollLeft` and reading it always returns 0. Asserting the read value
    // would have passed on a component that never scrolled at all.
    const written: number[] = [];
    vi.spyOn(HTMLElement.prototype, 'scrollLeft', 'set').mockImplementation(function (v: number) {
      written.push(v);
    });
    return written;
  }

  it('opens centred on the intersection and marks the box pannable', () => {
    const written = overflowing();
    const { container } = render(<VennDiagram spec={SPEC} />);

    const box = container.querySelector('.diagram-canvas')!;
    expect(box.hasAttribute('data-pannable'), 'an overflowing box must advertise that it pans').toBe(true);

    // The intersection sits at CENTRE.x of a VIEW_W-wide viewBox, so it lands that fraction along the
    // scrollable width; half the visible box is then subtracted to centre it. 520/1000 * 1000 − 150.
    const expected =
      (VENN_GEOMETRY.CENTRE.x / VENN_GEOMETRY.VIEW_W) * SCROLL_W - CLIENT_W / 2;
    expect(written.at(-1)).toBeCloseTo(expected, 5);
    // …and it is inside the scrollable range, which is the half a bare formula gets wrong.
    expect(written.at(-1)).toBeGreaterThan(0);
    expect(written.at(-1)).toBeLessThanOrEqual(SCROLL_W - CLIENT_W);
  });

  it('clamps rather than overshooting when the intersection sits past the end', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(399);
    const written: number[] = [];
    vi.spyOn(HTMLElement.prototype, 'scrollLeft', 'set').mockImplementation(function (v: number) {
      written.push(v);
    });

    render(<VennDiagram spec={SPEC} />);
    // 520/1000 * 400 − 199.5 = 8.5, and the range is [0, 1]. Without the clamp the box would be told to
    // scroll eight times further than it can, which browsers silently absorb and a test would not.
    expect(written.at(-1)).toBe(1);
  });

  it('observes the box for resize, and disconnects when the figure goes away', () => {
    overflowing();
    const observed: Element[] = [];
    let disconnected = 0;
    let fire = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          fire = cb;
        }
        observe(el: Element) {
          observed.push(el);
        }
        disconnect() {
          disconnected += 1;
        }
      },
    );

    const { container, unmount } = render(<VennDiagram spec={SPEC} />);
    expect(observed, 'the scroller itself must be observed, not the figure').toEqual([
      container.querySelector('.diagram-canvas'),
    ]);

    // A resize that removes the overflow has to take the affordance off with it — a box advertising a
    // pan it can no longer perform is decoration that lies.
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(CLIENT_W);
    fire();
    expect(container.querySelector('.diagram-canvas')!.hasAttribute('data-pannable')).toBe(false);

    unmount();
    expect(disconnected, 'the observer must be disconnected on unmount').toBe(1);
  });

  // The guard that keeps the two above from being the whole story: with no ResizeObserver — jsdom's real
  // state, and the one that threw before it was feature-detected — the figure still renders and is still
  // placed. That is the property the guard exists for, not merely "it does not crash".
  it('still places the figure where the runtime has no ResizeObserver', () => {
    const written = overflowing();
    vi.stubGlobal('ResizeObserver', undefined);

    const { container } = render(<VennDiagram spec={SPEC} />);
    expect(container.querySelector('.diagram-canvas')!.hasAttribute('data-pannable')).toBe(true);
    expect(written.at(-1)).toBeGreaterThan(0);
  });
});

describe('Markdown venn fences', () => {
  it('turns a ```venn fence into the figure, taking its caption from accTitle', () => {
    render(<Markdown>{`\`\`\`venn\n${vennFences(architectureEn)[0]}\n\`\`\``}</Markdown>);
    expect(screen.getByRole('figure', { name: 'The three pillars, and what sits in the intersection' })).toBeInTheDocument();
  });

  // Hooked on `pre`, not `code`, for the reason the mermaid path documents: react-markdown delivers a
  // fence as <pre><code class="language-…">, so a `code` handler nests the <figure> INSIDE a <pre> —
  // invalid HTML, and a hydration mismatch on a prerendered page.
  it('replaces the <pre> entirely rather than nesting a figure inside one', () => {
    const { container } = render(<Markdown>{`\`\`\`venn\n${vennFences(architecturePt)[0]}\n\`\`\``}</Markdown>);
    expect(container.querySelector('pre')).toBeNull();
    expect(container.querySelector('figure svg')).not.toBeNull();
  });

  it('leaves an ordinary code fence alone', () => {
    const { container } = render(<Markdown>{'```json\n{"a":1}\n```'}</Markdown>);
    expect(container.querySelector('pre code')).not.toBeNull();
    expect(container.querySelector('figure')).toBeNull();
  });

  it('refuses a fence the grammar does not accept, rather than drawing half a figure', () => {
    expect(() => render(<VennFence body={'accTitle: only this'} />)).toThrow(/accDescr/);
  });
});

// THE GEOMETRY, CHECKED AGAINST THE WORDS THAT ACTUALLY SHIP.
//
// Two failures live here and neither is visible by reading the markdown: a pillar title long enough to
// cross its own circle's stroke, and a set of circles far enough apart that the label in the "centre" is
// not in any intersection. Both produce a page that renders, passes every other assertion, and is wrong —
// which is the failure mode a picture hides best, and the reason this is arithmetic rather than an eye.
describe('the three-pillar figure fits inside its own circles', () => {
  const { VIEW_W, VIEW_H, R, CIRCLES, CENTRE, TITLE_OFFSETS, LINE, TITLE_SIZE, ITEM_SIZE, CENTRE_SIZE } =
    VENN_GEOMETRY;

  /** A PESSIMISTIC glyph width. Real text at these sizes is nearer 0.5em per character in this face; 0.62
   *  buys headroom for an all-caps or wide-glyph line and keeps the check on the safe side of the stroke.
   *  Deliberately not a measurement: jsdom has no text metrics, so a "measured" width here would be a
   *  fabrication dressed as rigour. */
  const halfWidth = (text: string, size: number): number => (text.length * size * 0.62) / 2;
  const dist = (ax: number, ay: number, bx: number, by: number): number => Math.hypot(ax - bx, ay - by);

  it('has a real triple intersection — the centroid is inside all three circles', () => {
    const cx = CIRCLES.reduce((s, c) => s + c.cx, 0) / 3;
    const cy = CIRCLES.reduce((s, c) => s + c.cy, 0) / 3;
    for (const c of CIRCLES) expect(dist(cx, cy, c.cx, c.cy)).toBeLessThan(R);
    // …and the label really sits there, rather than at some other point that happens to be inside one
    // circle. Both ends of both centre lines are checked below.
    expect(dist(CENTRE.x, CENTRE.y, cx, cy)).toBeLessThan(R / 4);
  });

  it.each(EDITIONS)('carries exactly one venn fence in the %s edition', (_locale, body) => {
    expect(vennFences(body)).toHaveLength(1);
  });

  // Cross-edition parity, the rule this page's other checks apply to links and to mermaid graphs and that
  // a second figure kind would otherwise escape. One edition gaining an item is a pt reader and an en
  // reader being shown different pillars.
  it('draws the same figure in both editions — words translated, structure identical', () => {
    const [en, pt] = EDITIONS.map(([, body]) => parseVennSpec(vennFences(body)[0]));
    expect(pt.pillars.map((p) => p.items.length)).toEqual(en.pillars.map((p) => p.items.length));
    expect(pt.centre).toEqual(en.centre);
    // Translated, not shipped twice — the same assertion `architecture-diagrams.test.mjs` makes of the
    // mermaid fences, and the one that catches an edition copied across wholesale.
    expect(pt.accTitle).not.toBe(en.accTitle);
    expect(pt.accDescr).not.toBe(en.accDescr);
    // The description is the WHOLE figure for a reader who cannot see it, so a stub is a failure.
    for (const spec of [en, pt]) expect(spec.accDescr.length).toBeGreaterThan(400);
  });

  it.each(EDITIONS)('keeps every authored line inside its own circle and out of the other two (%s)', (_locale, body) => {
    const spec = parseVennSpec(vennFences(body)[0]);
    const problems: string[] = [];

    const check = (text: string, x: number, y: number, size: number, own: number | null) => {
      const h = halfWidth(text, size);
      for (const edge of [x - h, x + h]) {
        CIRCLES.forEach((c, i) => {
          const d = dist(edge, y, c.cx, c.cy);
          if (own === null) {
            // The centre label: must be inside ALL three.
            if (d > R) problems.push(`centre "${text}" leaves circle ${i} (${d.toFixed(0)} > ${R})`);
          } else if (i === own && d > R) {
            problems.push(`"${text}" leaves its own circle ${i} (${d.toFixed(0)} > ${R})`);
          } else if (i !== own && d < R) {
            problems.push(`"${text}" reaches into circle ${i} (${d.toFixed(0)} < ${R})`);
          }
        });
      }
    };

    spec.pillars.forEach((pillar, i) => {
      const { tx, ty } = CIRCLES[i];
      pillar.title.forEach((line, j) => check(line, tx, ty + TITLE_OFFSETS[j], TITLE_SIZE, i));
      pillar.items.forEach((item, j) => check(item, tx, ty + j * LINE, ITEM_SIZE, i));
    });
    spec.centre.forEach((line, i) => check(line, CENTRE.x, CENTRE.y - 11 + i * (LINE + 3), CENTRE_SIZE, null));

    expect(problems).toEqual([]);
  });

  // The guard on the guard, and it is not ceremony: the check above is a loop over authored strings, so
  // it reports "no problems" just as happily when the geometry is nonsense as when it is right. This
  // mutates the SOURCE of the arrangement — shoulder the circles apart — and requires the failure.
  it('would fail if the circles were pulled apart', () => {
    const spec = parseVennSpec(vennFences(architectureEn)[0]);
    const far = CIRCLES.map((c, i) => ({ ...c, cx: c.cx + (i === 0 ? -400 : i === 1 ? 400 : 0) }));
    const cx = far.reduce((s, c) => s + c.cx, 0) / 3;
    const cy = far.reduce((s, c) => s + c.cy, 0) / 3;
    expect(far.some((c) => dist(cx, cy, c.cx, c.cy) >= R), 'the triple intersection must vanish').toBe(true);
    // …and the centre label would then sit outside at least one circle, which is the reader-visible half.
    expect(far.some((c) => dist(CENTRE.x, CENTRE.y, c.cx, c.cy) > R)).toBe(true);
    expect(spec.centre).toHaveLength(2);
  });

  it('stays inside its own viewBox', () => {
    for (const c of CIRCLES) {
      expect(c.cx - R).toBeGreaterThanOrEqual(0);
      expect(c.cx + R).toBeLessThanOrEqual(VIEW_W);
      expect(c.cy - R).toBeGreaterThanOrEqual(0);
      expect(c.cy + R).toBeLessThanOrEqual(VIEW_H);
    }
  });
});
