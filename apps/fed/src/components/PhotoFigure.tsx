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
  // blurrier wall.
  //
  // So the cap is on the WIDTH and the ratio is left alone. `mx-auto` centres what no longer fills the
  // column — the same treatment the diagrams already get, so it reads as one page rule rather than an
  // exception.
  //
  // THE CAP IS 730px, AND IT IS THE FILE'S OWN WIDTH. Every number before it was capped by a decode,
  // not by a decision.
  //
  // The owner has said the same thing three times, and the last time named what he is comparing against:
  // "ainda radicalmente menor que a barra separadora acima" — the rule under the article title, which
  // spans the full reading column (measured 922px at 1280). #488 shipped 224 (half of a `max-w-md` that
  // `.markdown img` had been vetoing, so half of a number nobody was seeing), #492 made the cap apply,
  // and #493 raised it to 448 — the largest cap that did not upscale a 450px-wide file.
  //
  // 450px WAS THE MISTAKE, and it was made one slice earlier than anyone was looking. #492 cropped
  // `730:876:31:358` out of the 900×1360 original — a 730×876 region — and then scaled that down to
  // 450×540 for no reason the crop required. From then on every cap discussion was really a discussion
  // about a ceiling of 450, and 448 was the answer to a question the encode had already narrowed.
  //
  // So the file is re-encoded at the crop's NATIVE size: same geometry, no scale filter, one decode and
  // one encode from the original in git history, `-map_metadata -1 -q:v 3` unchanged from #492 so the
  // only variable that moved is resolution. 730×876, 101,681 bytes (46 KB → 99 KB). Reversibility is
  // unchanged: the uncropped original still lives only in git history, at
  // `git show ed1ed51:apps/fed/public/photos/five-year-badge.jpg`.
  //
  // 730 IS THE CEILING THAT DOES NOT UPSCALE, and it is also the one that answers his sentence. It is
  // 79.2% of the 922px column — no longer "radicalmente menor" than the rule, which is the complaint —
  // and it lays out 730×876 at an upscale factor of exactly 1.000. 448, 560, 640 and 730 were rendered
  // at 1280 with that rule in the same frame: at 448 and 560 the figure still reads as a small picture
  // inside a wide column, at 640 (69.4%) it is defensible, and at 730 it sits under the rule with 96px
  // of column either side and reads as deliberate. 640 was the alternative and was rejected for being
  // one more increment on a sentence he has now written three times.
  //
  // Written as an arbitrary value on purpose: the number is the contract here, and a scale-step name
  // would let the value move under a Tailwind config change with `PhotoFigure.test.tsx` still green.
  // `e2e/content-photo.spec.ts` measures the COMPUTED box on the real article, which is the assertion
  // that would have caught #482 and #488 and did not exist then.
  //
  // WHAT 730 COSTS, said plainly rather than left for the reader to hit. The figure is 876px tall, so at
  // 1280×900 the first paragraph's top sits at y=1305 instead of 1197 at 640 — the reader scrolls further
  // before the first sentence. That is a real cost and it is NOT the #482 defect returning: uncapped,
  // this file lays out 922×1106 and the prose starts at ~1535. It is also not a regression against what
  // shipped in the sense the old comment here claimed — at the 448 cap the prose already started at 967,
  // below a 900px fold. That sentence ("the first paragraph is on screen underneath it") was false when
  // it was written and is removed rather than re-tuned.
  //
  // THE BRANCH IS STILL A REAL DISTINCTION AT 730, and it is a narrower margin than before, so it was
  // measured rather than asserted: the landscape branch takes the full 922px column, the portrait branch
  // 730 — a 192px difference at 1280, and the column is 938 at 1024 and 896 at 1920, so the cap binds at
  // every desktop width. It would stop being meaningful at the column width itself; 730 is 79% of it.
  //
  // WHAT ELSE IT MOVES: nothing today. The branch is keyed off `photo.height > photo.width`, and
  // `data/photos.json` registers exactly one portrait file — this article's badge. The other two
  // (`knuth-cv-museum`, `may-week-montage`, both on /architecture) are landscape and take the other
  // branch untouched. A FUTURE portrait photograph gets 730px too, which is the intended reading: the
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
            ? 'mx-auto block h-auto w-full max-w-[730px] border border-border'
            : 'block h-auto w-full border border-border'
        }
      />
      <figcaption className={FIGCAPTION_CLASS}>{caption}</figcaption>
    </figure>
  );
}
