import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PhotoFigure } from './PhotoFigure';
import { photoFor } from '../data/photos';
import type { PhotoAsset } from '../data/photos';

const knuth = photoFor('/photos/knuth-cv-museum.jpg') as PhotoAsset;

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

  it('is a figure, tagged for the photograph spec to find', () => {
    const { container } = render(<PhotoFigure photo={knuth} alt="a" caption="b" />);
    const figure = container.querySelector('figure[data-photo]');
    expect(figure).not.toBeNull();
    expect(figure!.querySelector('img')).not.toBeNull();
  });
});
