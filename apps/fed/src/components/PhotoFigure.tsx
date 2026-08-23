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
// `Readonly<…>` on the props satisfies SonarCloud's `typescript:S6759`, and it is the FIRST use of that
// wrapper in this codebase — every other component still declares props bare. That inconsistency is
// deliberate and is not a cleanup someone forgot: the rule fires 29 more times on `main`, and sweeping
// them would turn a content PR into a lint pass. It surfaced here only because `main`'s SonarCloud
// baseline for this file is empty — `sonarqube-scan` is path-filtered and skips on content merges, so
// `main`'s newest analysis predates this file's last change and every issue in it reads as NEW code.
export function PhotoFigure({
  photo,
  alt,
  caption,
}: Readonly<{
  photo: PhotoAsset;
  alt: string;
  caption: string;
}>) {
  // A PORTRAIT PHOTOGRAPH IS NOT GIVEN THE FULL COLUMN, and the reason is arithmetic rather than taste.
  //
  // `w-full` was written when every registered photograph was landscape, and for those it is right: the
  // widest of them is 1600×704, so at the 920px the body gets inside `max-w-5xl` at 1280 it lays out
  // 920×405 — a band. The first portrait photograph (the badge on the-problem-stopped-changing) shipped
  // at 900×1360 and laid out under the same rule at 900×1360: taller than a 900px viewport, so the reader
  // met a picture with no text on screen beside it and had to scroll a full screen to reach the sentence
  // it belongs to. On top of that, `w-full` would upscale it on any body wider than its own width — a
  // blurrier wall. That file is now 450×540 (recropped onto the badge), which shrinks the problem
  // without removing it: `w-full` would upscale a 450px-wide raster 2× in a 920px column.
  //
  // So the cap is on the WIDTH and the ratio is left alone. `mx-auto` centres what no longer fills the
  // column — the same treatment the diagrams already get, so it reads as one page rule rather than an
  // exception.
  //
  // THE CAP IS 224px, HALVED FROM `max-w-md` (448px) ON THE OWNER'S CALL — "a foto do crachá precisa ser
  // menor, no máximo metade do tamanho atual". Written as an arbitrary value rather than a scale step
  // because Tailwind's `max-w` scale has nothing between `max-w-xs` (320px, 71% of the old cap) and
  // zero: only `max-w-[224px]` is actually half, and the instruction was a ratio.
  //
  // THE NUMBER IS UNCHANGED BY THE RECROP AND THAT IS A DECISION, NOT AN OMISSION — BUT UNTIL THIS SLICE
  // IT WAS NOT A CAP AT ALL. `.markdown img` in `styles/index.css` was specificity (0,1,1) and beat this
  // utility (0,1,0), so both 448px and 224px were inert and the badge laid out at the full 922px column
  // at 1280. That is the real reason "reduzida no tamanho" kept not happening, and it is fixed there, not
  // here; `e2e/content-photo.spec.ts` now measures the computed box so it cannot come back silently.
  //
  // With the cap actually applying, 224px is kept. Measured on the rendered page rather than argued:
  // the image lays out 224×268 inside a 922px column, and the badge fills ~81% of that frame instead of
  // the ~59% it filled before the crop — a closer subject in a smaller box. Going below was rendered and
  // rejected: at 180px "tadeumen@" goes soft, and 224px is the ceiling the owner already ratified.
  //
  // At 450px intrinsic the cap is 2× the CSS box — down from 4× at the old 900px, still a retina-grade
  // reserve, and the badge's own type ("Luiz Tadeu", "tadeumen@") survives it; checked by rendering the
  // committed file down to 224px and reading it, not assumed.
  //
  // WHAT ELSE IT MOVES: nothing today. The branch is keyed off `photo.height > photo.width`, and
  // `data/photos.json` registers exactly one portrait file — this article's badge. The other two
  // (`knuth-cv-museum`, `may-week-montage`, both on /architecture) are landscape and take the other
  // branch untouched. A FUTURE portrait photograph gets 224px too, which is the intended reading: the
  // rule is about what a portrait does to a reading column, not about this one picture. The
  // `width`/`height` attributes are untouched, which is the part that matters for the reason this
  // component exists: they set the intrinsic ratio, so the box is still reserved before the bytes arrive
  // and the page still does not jump.
  //
  // Keyed off the FILE's own shape rather than a flag in the registry: a recrop that turns a photograph
  // portrait should change how it is laid out without anyone remembering to also flip a field, and
  // `photo-assets.test.mjs` already proves these two numbers are the binary's real ones.
  const portrait = photo.height > photo.width;
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
        className={
          portrait
            ? 'mx-auto block h-auto w-full max-w-[224px] border border-border'
            : 'block h-auto w-full border border-border'
        }
      />
      <figcaption className={FIGCAPTION_CLASS}>{caption}</figcaption>
    </figure>
  );
}
