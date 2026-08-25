// The journey-photograph strip on /me (#127).
//
// WHAT THIS FILE CAN AND CANNOT PROVE. jsdom has no layout engine and no cascade: it reports zero-sized
// rects and it does not apply the print stylesheet, so "the strip is four across at 1280" and "the strip
// is absent from the PDF" are not assertable here. Those two live in `e2e/journey-strip.spec.ts` and
// `e2e/cv-pdf.spec.ts` respectively — the same split `PhotoFigure.test.tsx` and `content-photo.spec.ts`
// already make. What IS assertable here is everything structural: which files, in which order, with the
// attributes that reserve the box, with per-locale strings that actually differ, and with the print hook
// present in the markup.
import { describe, it, expect } from 'vitest';
import { renderWithLocale } from '../test-utils';
import { JourneyStrip } from './JourneyStrip';
import { JOURNEY_PHOTOS } from '../data/journey';

describe('JourneyStrip', () => {
  it('renders the approved set, in the authored order', () => {
    const { container } = renderWithLocale(<JourneyStrip />);
    const imgs = [...container.querySelectorAll('img')];
    // The count is read off the data rather than written as `4`, so cutting a photograph is a data edit
    // and not a two-file edit. That the count is FOUR today is the owner's decision and is asserted once,
    // below, where it belongs — against the approved set, not against the renderer.
    expect(imgs).toHaveLength(JOURNEY_PHOTOS.length);
    expect(imgs.map((i) => i.getAttribute('src'))).toEqual(JOURNEY_PHOTOS.map((p) => p.photo.src));
  });

  it('reserves every box with the committed file’s own intrinsic size', () => {
    const { container } = renderWithLocale(<JourneyStrip />);
    const imgs = [...container.querySelectorAll('img')];
    imgs.forEach((img, i) => {
      const { width, height } = JOURNEY_PHOTOS[i].photo;
      expect(img).toHaveAttribute('width', String(width));
      expect(img).toHaveAttribute('height', String(height));
      // Guards the guard: if `photos.json` ever yielded 0 the two assertions above would still pass while
      // reserving nothing, which is the exact defect the width/height attributes exist to prevent.
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });
  });

  it('defers the bytes and decodes off the main thread', () => {
    const { container } = renderWithLocale(<JourneyStrip />);
    for (const img of container.querySelectorAll('img')) {
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('decoding', 'async');
    }
  });

  it('gives a reader who cannot see them a description, not the caption', () => {
    const { container } = renderWithLocale(<JourneyStrip />);
    const imgs = [...container.querySelectorAll('img')];
    const captions = [...container.querySelectorAll('figcaption')];
    expect(captions).toHaveLength(imgs.length);
    imgs.forEach((img, i) => {
      const alt = img.getAttribute('alt') ?? '';
      expect(alt.length).toBeGreaterThan(0);
      // The two jobs are two strings. A component that passed the caption into `alt` would leave a
      // screen-reader user with the editorial line and no picture, and every other assertion here would
      // still be green.
      expect(alt).not.toBe(captions[i].textContent);
    });
  });

  it('renders each edition in its own language', () => {
    const pt = renderWithLocale(<JourneyStrip />, { locale: 'pt' }).container;
    const en = renderWithLocale(<JourneyStrip />, { locale: 'en' }).container;
    const altsOf = (c: HTMLElement) => [...c.querySelectorAll('img')].map((i) => i.getAttribute('alt'));
    const capsOf = (c: HTMLElement) => [...c.querySelectorAll('figcaption')].map((f) => f.textContent);
    // Asserted as DIFFERENCE rather than against literals, which is what catches the failure that
    // actually happens: one edition copied wholesale into the other (#235 shipped exactly that for three
    // days). A literal-by-literal check passes on a copy as long as someone updated the literals too.
    altsOf(pt).forEach((alt, i) => expect(alt).not.toBe(altsOf(en)[i]));
    capsOf(pt).forEach((cap, i) => expect(cap).not.toBe(capsOf(en)[i]));
  });

  it('is web-only chrome: it opts out of the print edition through the stable hook', () => {
    const { container } = renderWithLocale(<JourneyStrip />);
    const strip = container.querySelector('[data-journey]')!;
    // `/cv.pdf` is printed from /en/me and held to two A4 pages by `e2e/cv-pdf.spec.ts`. Without this
    // attribute four 3:4 photographs land on a third sheet and that guard goes red for a reason that has
    // nothing to do with the CV. Asserted on the ATTRIBUTE because jsdom applies no print stylesheet —
    // the rendered effect is the E2E's job, the hook being emitted is this file's.
    expect(strip).toHaveAttribute('data-print', 'hide');
  });

  it('is not numbered into the credential sequence', () => {
    const { container } = renderWithLocale(<JourneyStrip />);
    const section = container.querySelector('section')!;
    // THE CONTROL, FIRST. Every assertion below is an absence, and an absence passes trivially against a
    // component that rendered nothing at all. The heading is what says the block is really here.
    expect(section.querySelector('h2')?.textContent).toBeTruthy();

    // Blocks 01–04 are Experience, Education, Certifications and Skills — a credential sequence, printed
    // onto the CV. A numeral on this rail enrols four photographs in it, which is the exact reading
    // `data/journey.ts` keeps them out of the CV data to avoid. Asserted as "no two-digit label anywhere
    // in the block" rather than as "not 05", because the failure the next author produces is a number
    // added back for symmetry, and 06 would be just as wrong as 05.
    const labels = [...section.querySelectorAll('span')].map((s) => s.textContent ?? '');
    expect(labels.filter((text) => /^\s*\d+\s*$/.test(text))).toEqual([]);

    // And no print hook either: `data-print-block` is keyed to that same sequence, and a block outside it
    // has nothing for those rules to key on.
    expect(section.hasAttribute('data-print-block')).toBe(false);
  });

  it('sits outside the CV print tree entirely', () => {
    const { container } = renderWithLocale(<JourneyStrip />);
    // Belt to the braces of the hook above: even if `data-print="hide"` were dropped, the strip must not
    // be nested inside `[data-print="cv"]`, where the CV's positional print rules would restyle it.
    expect(container.querySelector('[data-print="cv"]')).toBeNull();
  });

  it('does not extend the round-portrait exception to a photograph', () => {
    const { container } = renderWithLocale(<JourneyStrip />);
    for (const img of container.querySelectorAll('img')) {
      // `.avatar-round` is this design system's single carved exception to radius 0 and belongs to the
      // portrait alone. Asserted rather than assumed because it is the one class an author reaching for
      // "make the photos look nice" would copy.
      expect(img).not.toHaveClass('avatar-round');
      expect(img).toHaveClass('border', 'border-border');
    }
  });
});
