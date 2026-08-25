// The personal journey photographs on /me (#127) — four frames from 2020–2022, as a fifth numbered block
// under the CV.
//
// WHY A STRIP AND NOT FOUR `PhotoFigure`s. `PhotoFigure` is a figure inside a CONTENT BODY: it takes the
// reading column, it is read one at a time, and its caption carries an argument the surrounding prose is
// making. These four are read as a SET — that is the whole reason they were curated as four rather than
// picked as one — and a set read as a set needs them side by side at one size. The cost of getting this
// wrong was MEASURED rather than estimated: collapsing the grid to one column (as a deliberate mutation,
// to check the E2E assertion could fail) spread the four tiles over 3,634px at 1280 — that much extra
// scroll on a page whose job is to be scanned by someone deciding. `e2e/journey-strip.spec.ts` is what
// holds them on one row, because the failure is otherwise silent: every photograph still renders.
//
// WHY THE TREATMENT IS BAKED INTO THE FILES RATHER THAN APPLIED IN CSS. The four are colour photographs
// from four different cameras across three years, and left alone they fight the palette in four different
// directions — a turquoise t-shirt, magenta sticky notes, a violet Summit wall, warm office tungsten. The
// design system is near-black, off-white and ONE accent, so they are shipped as grayscale JPEGs.
//
// `filter: grayscale(1)` was the alternative and is the worse trade here, for a reason that is arithmetic
// rather than taste: it ships three colour channels the reader is never shown, and
// `scripts/photo-assets.test.mjs` caps every photograph in this repo at 1 MB TOTAL, and the three files
// that predate this slice already spend 572 KB of it (`may-week-montage.jpg` alone is 395 KB). These four
// add 259 KB, taking the registry to 831 KB against a 1,024 KB ceiling.
//
// WHAT IS NOT CLAIMED, because it was not measured: that four COLOUR files would have broken that
// ceiling. No colour encode at these dimensions was ever produced — every candidate was grayscale from
// the first pass — so the payload half of this argument is a margin, not a proof, and is written as one.
// What the encode-time treatment does buy without qualification is that it cannot be undone by a
// stylesheet regression, which for the magenta sticky notes in
// the home-office frame is the difference between "on brand" and "on brand until someone edits a CSS
// file". What it costs is stated plainly: colour is gone from the committed bytes and cannot be recovered
// from them. The originals are outside the repo, so the decision is reversible by re-encoding, not by an
// edit — see `src/data/journey.ts` on provenance.
//
// RADIUS 0, NO SHADOW, NO HOVER REVEAL. The border is `border-border`, the same 1px rule `PhotoFigure`
// and the diagram box use, so the three figure kinds read as one page decision. The round portrait
// (`.avatar-round`) is this design system's single carved exception and is deliberately NOT extended
// here — it is round because a face is a face, and these are not portraits.
//
// AND IT IS HIDDEN IN PRINT, which is load-bearing rather than tidy — and MEASURED rather than assumed.
// `/cv.pdf` is printed from /en/me at build time and `e2e/cv-pdf.spec.ts` holds it to two A4 sheets.
// Dropping this one attribute and rebuilding produces a THREE-page PDF (the guard reports
// `Received length: 3`), so without it the CV overruns its budget for a reason that has nothing to do
// with the CV — and the guard's own comment warns, correctly, against raising the number to go green.
//
// `data-print` is the ONE stable hook the print stylesheet targets (never a Tailwind utility class), so
// the block opts out through the same mechanism the metadata row and the download control already use.
import { JOURNEY_PHOTOS } from '../data/journey';
import { Block } from './CVSection';
import { FIGCAPTION_CLASS } from './DiagramFigure';
import { useLocale, useT } from '../i18n';

export function JourneyStrip() {
  const t = useT();
  // `useLocale()` returns the whole context (`{ locale, setLocale, t }`), not the locale string — the
  // destructuring is load-bearing. Indexing `alt` with the context object yields `undefined`, React then
  // omits the attribute entirely, and the page ships four photographs with NO alt text at all: invisible
  // on screen, catastrophic for a screen reader, and green under any assertion that only checks `src`.
  // Caught here by the assertions in `JourneyStrip.test.tsx` that read `alt` rather than assume it.
  const { locale } = useLocale();

  // THERE IS NO EMPTY-SET BRANCH HERE, and that is a decision rather than an omission. An
  // `if (JOURNEY_PHOTOS.length === 0) return null` reads as prudent and is unreachable: the set is locked
  // to four named files by `data/journey.test.ts`, so emptying it is already a red test demanding a
  // deliberate edit. A branch no test can honestly reach is worse than no branch — it inflates the
  // coverage denominator with a line nobody can exercise, and it invites the next reader to believe the
  // empty case has been thought about and handled, when what has actually happened is that it has been
  // made impossible one file over. `LibraryPage`'s empty state is the opposite case and is right to
  // exist: that shelf really can be empty, and its empty state is authored copy someone reviewed.
  return (
    // `data-print="hide"` sits on a wrapper rather than on the <section>, because the <section> is
    // `Block`'s own element and the print stylesheet selects `section` positionally within
    // `[data-print='cv']`. A wrapper keeps the two mechanisms from sharing an element.
    <div data-print="hide" data-journey="">
      <Block index="05" title={t('cv.journey')}>
        {/* A list, because it is four items and their ORDER is authored (see `journey.ts`).
            THE GAP IS REAL SPACE, NOT `gap-px`. The exposed-grid device the skills block and the metadata
            row use — `gap-px`, or negative margins collapsing borders into one shared rule — is right for
            elements whose CONTENT is flat: a keyword chip against a keyword chip reads as one table. Four
            photographs butted edge to edge read as a contact sheet, and the 1px border stops separating
            them because each one is then also the neighbour's border. The vertical gap is larger than the
            horizontal one on purpose: at two columns it separates a caption from the photograph BELOW it,
            which is a different job than separating two tiles side by side. */}
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {JOURNEY_PHOTOS.map(({ photo, alt, caption }) => (
            <li key={photo.src}>
              <figure data-journey-photo="">
                <img
                  src={photo.src}
                  alt={alt[locale]}
                  // The intrinsic size of the COMMITTED file, proved against the JPEG's own SOF marker in
                  // `scripts/photo-assets.test.mjs`. This is what reserves the box before the bytes
                  // arrive; without it every tile reflows under the reader as it loads.
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  // `h-auto` is load-bearing beside the width/height attributes: they set the intrinsic
                  // ratio, and `w-full` alone would let the ATTRIBUTE height win and squash the picture.
                  className="block h-auto w-full border border-border"
                />
                <figcaption className={FIGCAPTION_CLASS}>{caption[locale]}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}
