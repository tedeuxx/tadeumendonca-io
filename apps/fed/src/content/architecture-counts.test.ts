// The figures /architecture publishes in PROSE, against the generated artifacts it claims to read them
// off (#636).
//
// WHY THIS FILE EXISTS RATHER THAN A BLOCK IN AN EXISTING ONE. The page's counts are pinned in two places
// already and neither can hold a prose figure: `scripts/architecture-diagrams.test.mjs` is about what the
// mermaid FENCES say — its own header says so — and `architecture-links.test.ts` is about whether a link
// RESOLVES. A number typed into a paragraph is a third object, and it had no home, which is a large part
// of why it went unchecked.
//
// WHAT WENT WRONG, because the page predicted it in its own prose and that is the whole argument. The ADR
// section used to say that the count was typed by hand and held up by nothing but the link below — and it
// was written on 2026-08-25, went false on 2026-09-04 when records 0050 and 0051 landed, and published
// `49` against a library of 51 for a week. Predicting a failure in prose is not a control.
//
// WHAT IT CANNOT DO, so a green is not read as more than it is: it compares a NUMBER against a generated
// artifact. It says nothing about whether the sentence around that number is true, and nothing about any
// other figure on the page — every other prose claim there is still held by review alone.
import { describe, it, expect } from 'vitest';
import architectureEn from './architecture.en.md?raw';
import architecturePt from './architecture.pt.md?raw';
import adrs from './generated/adrs.json';

const BODY: Record<string, string> = { en: architectureEn, pt: architecturePt };

// One SHAPE per figure per locale — the sentence with its number left as a capture — and the table THROWS
// on a missing entry rather than skipping, the same contract the diagram suite's `NUMERALS`/`word` uses.
// A single pattern loose enough to span both editions would go quiet the moment either sentence is
// reworded, and a check that goes quiet is this defect one layer up.
//
// WHY A SHAPE AND NOT A `toContain` OF THE EXPECTED LITERAL, which is what the accDescr half of this slice
// uses. Scope. There the haystack is ONE LINE, so a literal built from the manifest is tight. Here it is
// the whole 300-line document, where `toContain('There are 51 decisions')` is equally satisfied by the
// live sentence and by a struck quotation of a superseded figure — so a page whose live count had gone
// false again would pass on its own history. Capturing the number and requiring exactly ONE occurrence
// tells a declaration from a mention; `toContain` cannot.
//
// THE COST, stated rather than discovered: this forbids the figure's sentence shape from appearing twice
// at all, so the struck-not-deleted convention cannot quote one of these sentences verbatim. The
// correction that landed with this file is written to respect that — it says "publishing `49` against a
// library of 51" rather than re-quoting the old sentence. The failure message says so, because whoever
// trips it will be mid-edit and needs the constraint, not the history.
//
// TWO ENTRIES FOR ONE NUMBER, deliberately: the paragraph states the count and then reasons about a copy
// of that many rows. Pinning only the first would leave the second free to go stale in exactly the way
// the first just did, in the same paragraph.
const ADR_SHAPE: Record<string, Record<string, RegExp>> = {
  total: {
    en: /There are (\d+) decisions/g,
    pt: /São (\d+) decisões/g,
  },
  rowCopy: {
    en: /a (\d+)-row copy/g,
    pt: /uma cópia de (\d+) linhas/g,
  },
};

const adrShape = (key: string, locale: string): RegExp => {
  const byLocale = ADR_SHAPE[key];
  if (!byLocale) throw new Error(`no shape registered for \`${key}\` — extend ADR_SHAPE`);
  const shape = byLocale[locale];
  if (!shape) throw new Error(`no ${locale} shape for \`${key}\` — extend ADR_SHAPE`);
  return shape;
};

describe('the /architecture prose counts match the artifact they are read off (#636)', () => {
  // One case per FIGURE per LOCALE rather than one test looping over both. A loop stops at the first
  // failing expect, so a single mutation could only ever prove one selector live — four selectors with
  // one red between them is three that are green forever on a typo nobody would see.
  it.each(
    ['en', 'pt'].flatMap((locale) => Object.keys(ADR_SHAPE).map((key) => [locale, key])),
  )('pins the %s ADR count `%s` against adrs.json', (locale, key) => {
    const body = BODY[locale];
    expect(body?.length, 'the edition must exist and have a body').toBeGreaterThan(1000);
    // An empty index would make `0` the published truth and the comparison meaningless.
    expect(
      adrs.length,
      'the generated index is empty — this comparison would be about zero',
    ).toBeGreaterThan(0);
    const hits = [...body.matchAll(adrShape(key, locale))];
    // ONE, exactly: zero means the selector is dead — the sentence was reworded and the check would
    // otherwise have gone quiet — and more than one means it cannot tell which occurrence is the claim.
    expect(
      hits.length,
      `the ${locale} edition must carry this figure exactly once. Zero: the sentence was reworded, so ` +
        `update ADR_SHAPE. Two: a second occurrence (a quotation of a superseded count, say) makes the ` +
        `check ambiguous — paraphrase it instead of repeating the sentence shape`,
    ).toBe(1);
    expect(
      hits[0][1],
      `the ${locale} edition publishes a count adrs.json does not hold`,
    ).toBe(String(adrs.length));
  });
});
