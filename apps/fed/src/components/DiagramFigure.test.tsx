// The expand overlay (#473) — the behaviour half. What a browser has to say (that the promoted figure
// really paints legible type, and that the page underneath does not move) is in
// `e2e/diagram-expand.spec.ts`, because jsdom has no layout engine and reports zero-sized rects: a
// scale assertion here would pass identically in the broken and the fixed world.
//
// What jsdom CAN settle is everything that is a DOM fact — the control exists and is named, the role
// swaps, the inline styles are floored and restored exactly, `Escape` closes, focus comes back, the
// scroller becomes a tab stop. Those are the assertions below, and each one names the mutation it fails
// against.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { DiagramFigure, FIGCAPTION_CLASS, floorToNaturalWidth } from './DiagramFigure';

/** A stand-in for a compiled mermaid figure: `width="100%"` plus an inline `max-width` at its natural
 *  width, which is the exact shape `gen-diagrams.mjs` emits and the only shape the floor reads. */
const HTML =
  '<svg id="d-1" width="100%" style="max-width: 1628.453125px;" viewBox="0 0 1628.453125 475.5"><title>Drawing</title></svg>';

const drawing = (container: HTMLElement) => container.querySelector('.diagram-canvas svg') as SVGSVGElement;

const expandButton = () => screen.getByRole('button', { name: /Enlarge/ });

afterEach(() => vi.restoreAllMocks());

describe('DiagramFigure — the expand affordance', () => {
  it('offers a control on every figure, named with the figure it expands', () => {
    render(<DiagramFigure caption="The lanes and the tiers" html={HTML} />);
    const button = expandButton();
    // WCAG 2.5.3: the accessible name must CONTAIN the visible label. Asserted as containment rather
    // than as two literals, because that is the property — a caller free to reword either one is free
    // to break it, and the visible/accessible split exists precisely because four identical "Ampliar"
    // buttons on one page are indistinguishable by voice.
    expect(button).toHaveAccessibleName('Enlarge: The lanes and the tiers');
    expect(button.getAttribute('aria-label')).toContain(button.textContent!.trim());
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
  });

  // THE CONTROL MUST NOT READ AS A LABEL, and this is the assertion that would have caught the defect
  // the copy lens found: the trigger shipped with FIGCAPTION_CLASS's five properties and nothing else,
  // so its only pressable signal was `hover:bg-muted` — and a phone has no hover. The whole measured
  // value of this feature is behind a press, on the device the feature exists for.
  //
  // Stated as the property rather than as a class literal: with every HOVER/FOCUS variant stripped, the
  // control must still declare a boundary the caption does not. A treatment swap (border → background →
  // an outline) keeps this green; deleting the non-hover signal reddens it, which is the only shape of
  // change that reintroduces the defect.
  it('keeps a pressable signal that survives with every hover variant removed', () => {
    render(<DiagramFigure caption="A caption" html={HTML} />);
    const nonHover = (el: Element) =>
      el.className.split(/\s+/).filter((c) => c.length > 0 && !c.includes(':'));
    const button = nonHover(expandButton());
    const caption = nonHover(screen.getByText('A caption'));

    expect(button).toContain('border');
    // The caption is the control it must not be mistaken for, so the assertion is COMPARATIVE. Asserting
    // only "the button has a border" would stay green if the caption grew one too.
    expect(caption).not.toContain('border');
    expect(FIGCAPTION_CLASS.split(/\s+/)).not.toContain('border');
  });

  // THE ICON REGRESSION, pinned rather than remembered. The first build put a lucide glyph in this
  // button, which made the FIRST <svg> inside the <figure> a 14px decoration — and
  // `e2e/diagram-bleed.spec.ts:58` reads a figure's drawing as exactly `el.querySelector('svg')`, as do
  // the unit tests for both figure kinds. Three suites silently retarget; none of them says so.
  it('puts no svg of its own inside the figure — the first svg is the drawing', () => {
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    const figure = screen.getByRole('figure', { name: 'A caption' });
    expect(figure.querySelector('svg')).toBe(drawing(container));
  });

  it('promotes the figure itself to a modal dialog rather than rendering a second copy', () => {
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    const figure = screen.getByRole('figure', { name: 'A caption' });

    fireEvent.click(expandButton());

    // ONE drawing in the document, not two. A portal-rendered copy would duplicate the SVG's pinned id
    // and its aria-labelledby target, and the overlay's own accessible name would resolve to the copy
    // behind it — invisible to every assertion that only counts what is on screen.
    expect(container.querySelectorAll('.diagram-canvas svg')).toHaveLength(1);
    expect(figure.getAttribute('role')).toBe('dialog');
    expect(figure.getAttribute('aria-modal')).toBe('true');
    expect(figure.className).toContain('diagram-overlay');
    // The name does not change with the role: the reader hears the same words for the same drawing.
    expect(screen.getByRole('dialog', { name: 'A caption' })).toBe(figure);
  });

  it('floors the drawing to its natural width while promoted, and restores it exactly on close', () => {
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    const svg = drawing(container);
    expect(svg.style.maxWidth).toBe('1628.453125px');
    expect(svg.style.minWidth).toBe('');

    fireEvent.click(expandButton());
    // The ceiling becomes the FLOOR. This is the whole rendering change: `width="100%"` inside a 390px
    // viewport paints 2.6px type, and the same SVG with a 1628px floor paints it at the size it was
    // drawn at, panned.
    expect(svg.style.minWidth).toBe('1628.453125px');
    expect(svg.style.maxWidth).toBe('none');

    fireEvent.click(screen.getByRole('button', { name: /^Close/ }));
    // Restored from what was captured, not from a remembered constant — a figure left with a 1628px
    // floor in the flow would push the page sideways at 320px, which is the one thing this page's
    // overflow sweep forbids.
    expect(svg.style.minWidth).toBe('');
    expect(svg.style.maxWidth).toBe('1628.453125px');
  });

  // The Venn arrives as JSX children with its OWN inline `min-width` (its 680px floor, which #473
  // forbids touching). The floor must raise it while promoted and put the authored value back, not zero
  // it — the failure would be silent in the flow until the next resize.
  it('raises and restores a floor the figure already had', () => {
    const canvasRef = createRef<HTMLDivElement>();
    const { container } = render(
      <DiagramFigure caption="Three pillars" canvasRef={canvasRef as never}>
        <svg width="100%" style={{ maxWidth: '1000px', minWidth: '680px' }} />
      </DiagramFigure>,
    );
    // `canvasRef` reaches the scroller, which is what VennDiagram places its initial scroll on.
    expect(canvasRef.current).toBe(container.querySelector('.diagram-canvas'));
    const svg = drawing(container);

    fireEvent.click(expandButton());
    expect(svg.style.minWidth).toBe('1000px');
    fireEvent.click(screen.getByRole('button', { name: /^Close/ }));
    expect(svg.style.minWidth).toBe('680px');
    expect(svg.style.maxWidth).toBe('1000px');
  });

  it('leaves a drawing with no natural width completely alone', () => {
    const { container } = render(
      <DiagramFigure caption="A caption" html='<svg width="100%"><title>t</title></svg>' />,
    );
    fireEvent.click(expandButton());
    // Not "sets it to something harmless" — sets nothing. A guessed floor on a figure whose author
    // declared none is a width invented by this component.
    expect(drawing(container).style.minWidth).toBe('');
    expect(drawing(container).style.maxWidth).toBe('');
  });

  it('holds the figure’s place in the flow while it is out of flow', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 321,
    } as DOMRect);
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    const shell = container.firstElementChild as HTMLElement;
    expect(shell.style.height).toBe('');

    fireEvent.click(expandButton());
    // Without this the page below jumps up by the figure's height and the browser clamps the scroll
    // offset, so closing the overlay returns the reader somewhere else on the page.
    expect(shell.style.height).toBe('321px');

    fireEvent.click(screen.getByRole('button', { name: /^Close/ }));
    expect(shell.style.height).toBe('');
  });

  it('makes the scroller a keyboard tab stop only while promoted', () => {
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    const canvas = container.querySelector('.diagram-canvas')!;
    // In the flow three of the four figures scroll nowhere, so a permanent tab stop is a stop that does
    // nothing — the same reason `data-pannable` is set from layout rather than declared.
    expect(canvas.hasAttribute('tabindex')).toBe(false);

    fireEvent.click(expandButton());
    expect(canvas.getAttribute('tabindex')).toBe('0');
  });
});

// The keyboard contract comes from `useDialogFocus`, shared with `ShareModal` — but "the hook is right"
// and "this dialog is wired to it" are different claims, and the second is the one that ships. A figure
// a mouse can expand and a keyboard cannot leave is worse than no overlay.
describe('DiagramFigure — the keyboard path', () => {
  it('moves focus into the dialog on open', () => {
    render(<DiagramFigure caption="A caption" html={HTML} />);
    fireEvent.click(expandButton());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Close/ }));
  });

  it('opens from the keyboard, closes on Escape, and returns focus to the trigger', () => {
    render(<DiagramFigure caption="A caption" html={HTML} />);
    const trigger = expandButton();
    trigger.focus();
    // A native <button> activates on Enter as a click; asserting the click is asserting the keyboard
    // path, and the control is a real button precisely so that stays true.
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'A caption' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    // The trigger and the close control are the same button, so "focus returns to the trigger" is
    // checkable as the control still holding focus after the role swaps back.
    expect(document.activeElement).toBe(expandButton());
  });

  // THE PLACEHOLDER HAD TWO CLOSE PATHS AND ONLY ONE OF THEM RELEASED IT (#655). The button cleared the
  // held height; `Escape` went through `useDialogFocus`, which only cleared the open flag — so the
  // wrapper kept holding the figure's measured height with the figure back inside it. Invisible on the
  // screen it was written on, because the height it holds is the height it measured, and wrong from the
  // next rotation onward. The two controls and the key call one function now.
  it('releases the held height on Escape, not only on the button', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 321 } as DOMRect);
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    const shell = container.firstElementChild as HTMLElement;

    fireEvent.click(expandButton());
    expect(shell.style.height).toBe('321px');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(shell.style.height).toBe('');
  });

  it('traps Tab inside the promoted figure, scroller included', () => {
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    fireEvent.click(expandButton());
    const canvas = container.querySelector('.diagram-canvas') as HTMLElement;

    // jsdom does not implement sequential focus navigation, so a Tab keydown moves focus nowhere on its
    // own — the wrap is the only thing that can move it, which is what makes this assertion falsifiable.
    canvas.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Close/ }));

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(canvas);
  });
});

// THE AFFORDANCE THE OWNER ACTUALLY REACHED FOR (#655).
//
// The overlay shipped with one way in — a bordered control in a row above the figure. Reading a held
// article preview on a phone, he tapped the DRAWING and asked for exactly what he had just tried:
// «uma miniatura/recorte que vc clica e maximiza». The mechanism existed; the gesture was not wired to
// it. These assertions are about the wiring and about the three things it must not cost: the drawing
// must not become a control, a text selection must not open it, and a tap inside the promoted scroller
// (which is where panning happens) must not close it.
describe('DiagramFigure — the drawing itself is the trigger (#655)', () => {
  /** A compiled figure as mermaid really emits one: the accessible description lives in a <desc> INSIDE
   *  the SVG and is reached by the SVG's own aria-describedby. It is the screen-reader reader's only
   *  access to the figure, so anything wrapped around it has to leave that pair resolvable. */
  const DESCRIBED =
    '<svg id="d-1" width="100%" style="max-width: 1628px;" viewBox="0 0 1628 475"' +
    ' role="graphics-document document" aria-labelledby="chart-title-d-1"' +
    ' aria-describedby="chart-desc-d-1"><title id="chart-title-d-1">Drawing</title>' +
    '<desc id="chart-desc-d-1">Four lanes, three tiers.</desc></svg>';

  const canvasOf = (container: HTMLElement) =>
    container.querySelector('.diagram-canvas') as HTMLElement;

  it('maximises when the reader clicks the drawing, not only when they find the button', () => {
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(canvasOf(container));

    // The same promotion the button performs — one overlay, one drawing, the figure itself promoted.
    expect(screen.getByRole('dialog', { name: 'A caption' })).toBeInTheDocument();
    expect(container.querySelectorAll('.diagram-canvas svg')).toHaveLength(1);
    // And the state the button owns moved with it, which is what says the two paths are ONE path: a
    // click that set `open` without measuring the placeholder would leave the page jumping.
    expect((container.firstElementChild as HTMLElement).style.height).not.toBe('');
  });

  // A MOUSE READER SELECTING A LABEL RELEASES THE POINTER ON THE CANVAS, and mermaid labels are real
  // selectable text. Covering the page with the thing they were reading is worse than not having the
  // gesture at all. Asserted by faking the selection rather than by dragging, because jsdom has no
  // selection engine to drag with — the handler's read is what ships, and it is what is mutated here.
  it('ignores a click that lands on a live text selection', () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false } as Selection);
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);

    fireEvent.click(canvasOf(container));

    expect(screen.queryByRole('dialog')).toBeNull();
    // Not "nothing visible happened" — the held height is the state that would have moved, and a
    // version that opened and closed again would pass a dialog-only assertion on the next tick.
    expect((container.firstElementChild as HTMLElement).style.height).toBe('');
  });

  // INSIDE THE OVERLAY THE CANVAS IS THE PANNING SURFACE, so the handler comes OFF while promoted.
  //
  // THE OBVIOUS ASSERTION HERE CANNOT FAIL, and it was written first: "the dialog is still open after a
  // second click" passes on a handler left live, because that handler re-opens an already-open figure
  // and the dialog never goes anywhere. Mutation-checked by leaving it live — still green, on a build
  // that is genuinely wrong. What the live handler really breaks is the HELD HEIGHT: it re-measures a
  // figure that is now `position: fixed` at viewport size, so the wrapper in the flow swells from the
  // figure's height to the viewport's and the page underneath shifts — the exact defect the wrapper
  // exists to prevent, appearing while the reader is panning over it.
  //
  // So the reading is the held height, and the mock returns a DIFFERENT height on the second call: the
  // correct build never takes it, a live handler takes it immediately.
  it('does not re-measure when the promoted scroller is clicked — panning is not re-opening', () => {
    const heights = [321, 900];
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ height: heights.shift() ?? 900 }) as DOMRect,
    );
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    const shell = container.firstElementChild as HTMLElement;

    fireEvent.click(canvasOf(container));
    expect(shell.style.height).toBe('321px');

    fireEvent.click(canvasOf(container));

    expect(screen.getByRole('dialog', { name: 'A caption' })).toBeInTheDocument();
    expect(shell.style.height, 'the promoted figure was re-measured at viewport size').toBe('321px');
  });

  // THE DRAWING STAYS A DRAWING. `role="button"` here would be a LEAF role: assistive technology
  // presents the subtree as one control and the <desc> below becomes unreachable — the same failure the
  // component's wrapper already refuses for `role="img"`. And a second tab stop over an act the real
  // button already offers announces nothing, so the pointer path adds neither.
  it('leaves the drawing a drawing: no control role, and no second tab stop while collapsed', () => {
    const { container } = render(<DiagramFigure caption="A caption" html={HTML} />);
    const canvas = canvasOf(container);
    expect(canvas.getAttribute('role')).toBeNull();
    expect(canvas.hasAttribute('tabindex')).toBe(false);
    // The keyboard path is the button, and it is unchanged by the pointer path existing.
    expect(screen.getByRole('button', { name: /Enlarge/ })).toBeInTheDocument();
  });

  // THE accDescr MUST NOT BE ORPHANED, in either state, and this is the assertion that says so rather
  // than the comment that promises it. The compiled description is a <desc> inside the SVG, reached by
  // the SVG's own aria-describedby — so it survives exactly as long as nothing re-parents, duplicates or
  // role-overrides the drawing. A portal copy would put a SECOND element on that id, which is why the
  // count is asserted next to the resolution.
  it('keeps the compiled accDescr reachable, collapsed and promoted', () => {
    const { container } = render(<DiagramFigure caption="A caption" html={DESCRIBED} />);
    const described = () => {
      const svg = container.querySelector('.diagram-canvas svg')!;
      const id = svg.getAttribute('aria-describedby')!;
      return {
        matches: container.ownerDocument.querySelectorAll('#' + id).length,
        text: container.ownerDocument.getElementById(id)?.textContent,
      };
    };

    expect(described()).toEqual({ matches: 1, text: 'Four lanes, three tiers.' });

    fireEvent.click(canvasOf(container));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(described()).toEqual({ matches: 1, text: 'Four lanes, three tiers.' });
  });
});

describe('floorToNaturalWidth', () => {
  // Exported and tested directly because it is the one piece of this component that is pure, and the
  // restore half is a function it RETURNS — a version that restored from a re-read of the live style
  // would pass every test that only opens.
  it('is a no-op on nothing to floor', () => {
    expect(() => floorToNaturalWidth(null)()).not.toThrow();
  });
});
