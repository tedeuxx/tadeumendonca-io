// The 1–5 reading rating on the Biblioteca / Library surface (#166), as filled and unfilled squares.
//
// WHY NOT STARS: `★` is a font-dependent glyph and stars are a decorative idiom this design system does
// not have. The brutalist answer to "show a level without stars" already exists on `/me` — `LevelMeter`
// in `CVSection.tsx`: `role="img"`, an `aria-label`, radius-0 squares, filled up to the level.
//
// WHY THIS IS A COPY OF `LevelMeter`'s TOKENS AND NOT A SHARED `<Meter>`, which is the decision worth
// reading before "cleaning this up":
//
//   `LevelMeter` is PRINT-BEARING. `/cv.pdf` is printed from `/en/me` at build time (ADR-0034,
//   scripts/prerender.mjs), with `printBackground: true` precisely so those filled squares survive onto
//   paper. Generalising it into something this surface also renders would couple the recruiter PDF to a
//   book card: a spacing tweak here would silently change a document nobody re-reads after the change.
//   Duplication risks two meters drifting visually — cheap, visible, and noticed by anyone looking at
//   both pages. Sharing risks altering an artifact in a way no test on this surface can see.
//
//   The scales are not the same thing either: `LevelMeter` is a 4-square AWS L100–L400 competency ladder,
//   this is a 5-point opinion about a book. One component asked to mean both would mean neither.
//
// ONE DEFECT DELIBERATELY NOT COPIED: `LevelMeter`'s label is a hardcoded English template literal with
// no `t()`, so a Portuguese screen-reader user hears English on `/me` today. Fixing that is out of this
// slice's scope (it changes a print-bearing component), but propagating it is not acceptable — this
// label goes through the message catalog like every other UI string.
import { RATING_MAX, type Rating } from '../data/library';
import { useT } from '../i18n';

const SQUARES = Array.from({ length: RATING_MAX }, (_, i) => i + 1);

export function RatingMeter({ rating }: { rating: Rating }) {
  const t = useT();
  // Two placeholders rather than a sentence per value: `{rating}` and `{max}` keep the catalog entry one
  // string per locale, and `{max}` is filled from the same constant the squares are generated from, so
  // the announced scale cannot disagree with the drawn one.
  const label = t('library.ratingLabel').replace('{rating}', String(rating)).replace('{max}', String(RATING_MAX));

  return (
    <span className="inline-flex gap-px" role="img" aria-label={label} data-testid="rating-meter">
      {SQUARES.map((i) => (
        <span key={i} className={`h-2 w-2 ${i <= rating ? 'bg-foreground' : 'bg-border'}`} />
      ))}
    </span>
  );
}
