// A photograph inside a content body (#415) — the third figure class on /architecture, after the mermaid
// diagram and the authored-SVG Venn.
//
// IT IS NOT A `DiagramFigure`, AND THAT IS CHECKABLE RATHER THAN TASTE. Reusing that component would put
// `.diagram-canvas` on a raster, and `e2e/diagram-centred.spec.ts` selects that class PAGE-WIDE and reads
// `el.querySelector('svg')`. On a photograph that is `null`, every measurement in the spec becomes `NaN`,
// and `NaN` fails every comparison — at all four widths, in both editions, on the first run. The centring
// rule in `styles/index.css` is `.diagram-canvas > svg` and would not select an `<img>` either, and the
// background-equality check in `e2e/routes.spec.ts` that catches invisible strokes is meaningless on a
// raster. What is genuinely shared is the CAPTION TREATMENT, and it is shared as the one thing that can
// be shared without dragging the selector along: a class string, exported from `DiagramFigure.tsx`.
//
// WHAT THIS COMPONENT CANNOT DO, said plainly because the Issue that commissioned it asked for it and it
// is not deliverable: it cannot make the words INSIDE the photograph assertable. A text node has a
// bounding rect; type in a JPEG is pixels, and no test can measure its rendered glyph height. That is why
// the Knuth quotation is authored as a real markdown blockquote ABOVE its photograph rather than left for
// the reader to decode out of the raster — see ADR-0040's line, restated in 0047: "an <img> makes every
// label a picture of a word."
import { FIGCAPTION_CLASS } from './DiagramFigure';
import type { PhotoAsset } from '../data/photos';

/**
 * `alt` and `caption` are both authored, per locale, and they are NOT the same string.
 *
 * `alt` describes what is in the frame, for a reader who never sees it. `caption` says what the
 * photograph is doing on the page, for a reader who does — and the Issue's editorial bar is that a
 * caption which merely describes the frame has failed. They are two jobs, so they are two strings, and
 * the parity probe checks that the captions DIFFER between editions (catching a wholesale locale copy)
 * while the `src` and the order match.
 *
 * `data-photo` is the test hook, and it is on the <figure> rather than the <img> so a spec can measure the
 * image's box against the box it is supposed to sit inside. `.diagram` is deliberately NOT reused: the
 * rhythm is set here with the same `my-8` so the two figure classes read as one decision to a reader while
 * staying two different things to a selector.
 */
export function PhotoFigure({
  photo,
  alt,
  caption,
}: {
  photo: PhotoAsset;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="my-8" data-photo="">
      <img
        src={photo.src}
        alt={alt}
        // The intrinsic size of the COMMITTED file, checked against it in `data/photos.test.ts`. This is
        // what reserves the box before the bytes arrive; without it the page reflows under the reader on
        // every one of these figures.
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        // `h-auto` is load-bearing next to the `width`/`height` attributes: they set the intrinsic ratio,
        // and `w-full` alone would then let the ATTRIBUTE height win and squash the picture. The border
        // matches the diagram box so the two figure kinds sit on the page as one decision.
        className="block h-auto w-full border border-border"
      />
      <figcaption className={FIGCAPTION_CLASS}>{caption}</figcaption>
    </figure>
  );
}
