import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhotoFigure } from './PhotoFigure';
import { photoFor } from '../data/photos';
import type { PhotoAsset } from '../data/photos';

const knuth = photoFor('/photos/knuth-cv-museum.jpg') as PhotoAsset;
const badge = photoFor('/photos/five-year-badge.jpg') as PhotoAsset;

describe('PhotoFigure', () => {
  it('reserves the box with the committed file’s own intrinsic size', () => {
    const { container } = render(
      <PhotoFigure photo={knuth} alt="A wall" caption="Where I was standing" />,
    );
    const img = container.querySelector('img')!;
    // Asserted against the REGISTRY value rather than a literal, so the pair moves together: a recrop
    // updates `photos.ts`, `photos.test.ts` proves the number matches the binary, and this proves the
    // component actually emits it. A literal here would let the component stop passing them through
    // while every number in the repo stayed correct.
    expect(img).toHaveAttribute('width', String(knuth.width));
    expect(img).toHaveAttribute('height', String(knuth.height));
    expect(knuth.width).toBeGreaterThan(0);
  });

  it('carries the alt and the caption as two different strings, in two different places', () => {
    const { container } = render(
      <PhotoFigure photo={knuth} alt="What is in the frame" caption="Why it is on the page" />,
    );
    expect(container.querySelector('img')).toHaveAttribute('alt', 'What is in the frame');
    expect(container.querySelector('figcaption')).toHaveTextContent('Why it is on the page');
    // The caption is NOT the accessible name of the image. A screen-reader user gets the frame described
    // and the reason stated, in that order, rather than the reason twice.
    expect(container.querySelector('img')).not.toHaveAttribute('alt', 'Why it is on the page');
  });

  it('defers the bytes and decodes off the main thread', () => {
    const { container } = render(<PhotoFigure photo={knuth} alt="a" caption="b" />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  // THE ASSERTION THAT KEEPS A GATE GREEN, and it is the reason this component exists rather than a
  // second caller of DiagramFigure. `e2e/diagram-centred.spec.ts` selects `.diagram-canvas` PAGE-WIDE and
  // reads `querySelector('svg')` off every match; on a raster that is null, the measurements become NaN,
  // and NaN fails every comparison — at all four widths, in both editions. A later refactor that
  // "unified" the two figure boxes would turn eight e2e tests red and this one, cheaply, first.
  it('does NOT wear the diagram class the diagram spec measures svg inside', () => {
    const { container } = render(<PhotoFigure photo={knuth} alt="a" caption="b" />);
    expect(container.querySelector('.diagram-canvas')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });

  // THE PORTRAIT CAP, asserted from BOTH sides, because only one side of it can fail silently.
  //
  // Deleting the cap leaves a portrait photograph laying out at its full 900px inside a 920px body — 1360
  // tall, a full screen of picture before the sentence it belongs to. Nothing goes red; the page just gets
  // worse. Applying the cap to everything is the opposite mistake and is just as quiet: every landscape
  // photograph on /architecture would shrink to 448px in a 920px column, and the e2e geometry spec would
  // still pass, since a smaller image is still inside its figure.
  //
  // The fixtures are the REGISTRY's own entries rather than hand-made objects, so the two cases stay real:
  // if the badge is ever recropped to landscape this test starts asserting the wrong branch of the
  // component and says so, instead of testing a shape nothing ships.
  it('caps a PORTRAIT photograph and centres it, rather than giving it the whole column', () => {
    expect(badge.height, 'the portrait fixture is not portrait any more').toBeGreaterThan(badge.width);
    const { container } = render(<PhotoFigure photo={badge} alt="a" caption="b" />);
    const img = container.querySelector('img')!;
    expect(img.className).toContain('max-w-md');
    expect(img.className).toContain('mx-auto');
    // The ratio is still the file's own — the cap is on width only, so the reservation stays honest.
    expect(img).toHaveAttribute('width', String(badge.width));
    expect(img).toHaveAttribute('height', String(badge.height));
    expect(img.className).toContain('h-auto');
  });

  it('does NOT cap a landscape photograph — it still gets the full column', () => {
    expect(knuth.width, 'the landscape fixture is not landscape any more').toBeGreaterThan(knuth.height);
    const { container } = render(<PhotoFigure photo={knuth} alt="a" caption="b" />);
    const img = container.querySelector('img')!;
    expect(img.className).not.toContain('max-w-');
    expect(img.className).toContain('w-full');
  });

  it('is a figure, tagged for the photograph spec to find', () => {
    const { container } = render(<PhotoFigure photo={knuth} alt="a" caption="b" />);
    const figure = container.querySelector('figure[data-photo]');
    expect(figure).not.toBeNull();
    expect(figure!.querySelector('img')).not.toBeNull();
  });
});
