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
import { DiagramFigure, floorToNaturalWidth } from './DiagramFigure';

/** A stand-in for a compiled mermaid figure: `width="100%"` plus an inline `max-width` at its natural
 *  width, which is the exact shape `gen-diagrams.mjs` emits and the only shape the floor reads. */
const HTML =
  '<svg id="d-1" width="100%" style="max-width: 1628.453125px;" viewBox="0 0 1628.453125 475.5"><title>Drawing</title></svg>';

const drawing = (container: HTMLElement) => container.querySelector('.diagram-canvas svg') as SVGSVGElement;

const expandButton = () => screen.getByRole('button', { name: /Expand/ });

afterEach(() => vi.restoreAllMocks());

describe('DiagramFigure — the expand affordance', () => {
  it('offers a control on every figure, named with the figure it expands', () => {
    render(<DiagramFigure caption="The lanes and the tiers" html={HTML} />);
    const button = expandButton();
    // WCAG 2.5.3: the accessible name must CONTAIN the visible label. Asserted as containment rather
    // than as two literals, because that is the property — a caller free to reword either one is free
    // to break it, and the visible/accessible split exists precisely because four identical "Ampliar"
    // buttons on one page are indistinguishable by voice.
    expect(button).toHaveAccessibleName('Expand: The lanes and the tiers');
    expect(button.getAttribute('aria-label')).toContain(button.textContent!.trim());
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
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

describe('floorToNaturalWidth', () => {
  // Exported and tested directly because it is the one piece of this component that is pure, and the
  // restore half is a function it RETURNS — a version that restored from a re-read of the live style
  // would pass every test that only opens.
  it('is a no-op on nothing to floor', () => {
    expect(() => floorToNaturalWidth(null)()).not.toThrow();
  });
});
