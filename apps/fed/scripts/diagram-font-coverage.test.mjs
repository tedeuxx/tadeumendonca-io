// Every character in a mermaid fence is one the site's own mono font can serve (#514).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// THIS ASSERTS **COVERAGE**, NOT **LEGIBILITY**, AND THE INCIDENT THAT PRODUCED IT WAS A LEGIBILITY
// FAILURE — READ THAT BEFORE TRUSTING IT.
//
// `⇄` (U+21C4) shipped in the tier fence in both editions, drawing the content build lane as
// `content-writer ⇄ content-reviewer`. It is outside every `unicode-range` JetBrains Mono is subset
// to, so it fell back to a system font — AND IT RENDERED PERFECTLY. The defect was that at the
// fence's own 15px it is not separable by eye from `≠`, so the page published
// `content-writer ≠ content-reviewer`: the inverse of the relation the box exists to carry.
//
// TWO AGENTS EXAMINED THAT GLYPH AND BOTH DIAGNOSED TOFU. Neither was wrong about the subset. Both
// were reasoning about the wrong failure.
//
// So this check would have caught that character on the day it landed, FOR THE WRONG REASON. What it
// actually buys is narrower and still worth having: nothing in these fences depends on a fallback
// font this repo does not control. What it does NOT buy:
//
//   · It is blind to every confusable INSIDE the subset. `–` (U+2013) and `—` (U+2014) both are, and
//     this page uses U+2014 ninety-seven times inside fences alone.
//   · Falling outside the subset is not itself a defect. The prose OUTSIDE these fences does it
//     sixteen times (`→` fourteen, `≥` twice), always has, and is fine. That is why this is
//     fence-scoped, where the type is smallest and a symbol carries a claim. A page-scoped version
//     would be red on arrival, and a gate that is red on arrival gets an exclusion list — and an
//     exclusion list is where the next `⇄` will hide.
//   · THE ONLY FALSIFIER FOR THE REAL DEFECT IS A HUMAN EYE AT THE PUBLISHED SIZE. No assertion in
//     this repo can hold it: the markdown carries the correct codepoint, the compiled SVG matches the
//     fence, and every layer agrees. IF YOU CHANGE A SYMBOL IN THESE FENCES, LOOK AT IT RENDERED AT
//     15px.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
//
// WHY THE RANGE SET IS HARDCODED HERE AND ALSO COMPARED TO node_modules. There are no `@font-face`
// blocks in this repository — `grep -rn 'unicode-range' src` returns nothing. The font arrives as
// `@fontsource/jetbrains-mono` at a CARET range, and the declarations live in `node_modules`, where a
// semver bump can move the subset with no commit here. Reading the installed CSS alone would mean the
// gate silently permits more the day the package widens its subset; hardcoding alone would mean it
// silently permits less than the font actually serves. So: the literal below is the gate, and a
// companion assertion requires it to still equal what is installed. A `@fontsource` bump then reddens
// LOUDLY, saying the font's subset moved, rather than quietly loosening what this file allows.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { collectFences } from './diagram-source.mjs';

const appRoot = resolve(import.meta.dirname, '..');
const contentDir = join(appRoot, 'src', 'content');

/**
 * The six `unicode-range` declarations `@fontsource/jetbrains-mono` ships, verbatim, one string per
 * `@font-face`. Kept as the raw CSS text rather than as parsed intervals so the comparison against
 * the installed package is a comparison of the same thing in the same shape — a parsed literal would
 * have to be trusted to have been transcribed correctly, and nothing would check that.
 */
const DECLARED_SUBSET = [
  'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F',
  'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF',
  'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB',
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
];

/** `U+0000-00FF,U+0131,…` → sorted `[lo, hi]` intervals. A bare `U+0131` is the interval `[0x131, 0x131]`. */
function parseRanges(declarations) {
  return declarations
    .join(',')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const m = /^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$/.exec(token);
      // Throws rather than skipping: a token this parser does not understand is a token the gate would
      // silently stop enforcing, which is the failure shape this whole file is a reaction to. A
      // wildcard form (`U+04??`) is legal CSS and unused by this package — if one ever appears, this
      // fails by name instead of quietly narrowing the covered set.
      if (!m) throw new Error(`unicode-range token not understood: ${token}`);
      const lo = Number.parseInt(m[1], 16);
      return [lo, m[2] === undefined ? lo : Number.parseInt(m[2], 16)];
    })
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

const COVERED = parseRanges(DECLARED_SUBSET);
const covers = (codePoint) => COVERED.some(([lo, hi]) => codePoint >= lo && codePoint <= hi);

/**
 * The `@fontsource/jetbrains-mono` weight stylesheets this app actually imports.
 *
 * Read out of `main.tsx` rather than hardcoded as `[400, 500, 700]`. The point of the companion
 * assertion is to notice the installed font moving; a weight added to the app and not to a literal
 * here would be a subset this gate never looked at, which is the same silent-drift shape one layer
 * over.
 */
function importedMonoStylesheets() {
  const main = readFileSync(join(appRoot, 'src', 'main.tsx'), 'utf8');
  return [...main.matchAll(/@fontsource\/jetbrains-mono\/([\w.-]+\.css)/g)].map((m) => m[1]);
}

const installedRangesOf = (cssFile) =>
  [...readFileSync(join(appRoot, 'node_modules', '@fontsource', 'jetbrains-mono', cssFile), 'utf8').matchAll(
    /unicode-range:\s*([^;]+);/g,
  )].map((m) => m[1].trim());

const fences = collectFences(contentDir);

describe('the mermaid fences stay inside the font the site ships', () => {
  // THE ANTI-VACUITY GUARD, and it carries four separate ways this file could go green having checked
  // nothing. Written as one test so a mutation that empties any of the four reddens HERE, in a test
  // that says what is empty, rather than letting the arms below compare empty against empty and pass.
  //
  // (1) No fences collected — a `mermaidFences` regex change, or a content move, and every arm below
  // iterates an empty list. (2) An empty covered set — a `DECLARED_SUBSET` gutted to `[]` makes the
  // membership test reject everything, which would red loudly; gutted to `['U+0000-10FFFF']` it accepts
  // everything and reds nothing, which is what the mutation guard below is for. (3) No non-ASCII in the
  // fences at all — if the fences were ever plain ASCII, the coverage arm would be satisfied by
  // construction and would keep reporting green long after it stopped being able to fail.
  //
  // (4) IS A PROPERTY OF `it.each` RATHER THAN OF ANYTHING HERE, and it was found by reviewing this file
  // rather than reasoned about while writing it: `it.each([])` REGISTERS NO TESTS AND REPORTS NO
  // FAILURE. Both parameterised arms below are driven by a derived list — the fences, and the
  // stylesheets `main.tsx` imports — so either list going empty deletes its whole arm from the run
  // silently while the file still says "passed". Item (1) already covers the fence list; nothing covered
  // the stylesheet list, so a `main.tsx` that stopped importing this font, or spelled the import
  // differently, would have taken the entire installed-font comparison out of the suite without a word.
  it('is asserting against real fences, a real subset, real stylesheets, and text that could violate it', () => {
    expect(fences.length, 'no mermaid fences were collected — every assertion below is vacuous').toBeGreaterThan(0);
    expect(COVERED.length, 'the declared subset parsed to no ranges at all').toBeGreaterThan(0);
    expect(
      importedMonoStylesheets(),
      'main.tsx imports no @fontsource/jetbrains-mono stylesheet — `it.each([])` would silently register ' +
        'no installed-font comparison at all, and this file would still report green',
    ).not.toEqual([]);
    const nonAscii = fences.flatMap((f) => [...f.source].filter((ch) => ch.codePointAt(0) > 0x7f));
    expect(
      nonAscii.length,
      'no fence carries a character above U+007F — the coverage arm cannot fail and proves nothing',
    ).toBeGreaterThan(0);
  });

  // THE MATCHER'S OWN MUTATION GUARD. `covers` is the whole gate, and a `covers` that returns true for
  // everything passes every other arm in this file. Two anchors, chosen because the incident supplied
  // both: `—` (U+2014) is the character these fences use ninety-seven times and MUST stay allowed, and
  // `⇄` (U+21C4) is the character that shipped and MUST NOT. Widening `DECLARED_SUBSET` to swallow
  // U+21C4 — the obvious way to make a future violation "go away" — reddens here by name.
  it('accepts what the font serves and rejects what it does not', () => {
    expect(covers(0x2014), 'the em dash is inside the subset and the matcher rejected it').toBe(true);
    expect(covers(0x00e3), 'a Portuguese accent is inside the subset and the matcher rejected it').toBe(true);
    expect(covers(0x21c4), 'U+21C4 is outside the subset and the matcher accepted it').toBe(false);
    expect(covers(0x2192), 'U+2192 is outside the subset and the matcher accepted it').toBe(false);
  });

  // The companion assertion the hardcoded literal exists for. See the header block: a caret dependency
  // can move the subset with no commit in this repo, and a gate that reads only the installed CSS would
  // follow it silently in whichever direction it moved.
  it.each(importedMonoStylesheets())('the hardcoded subset still equals what %s declares', (cssFile) => {
    const installed = installedRangesOf(cssFile);
    expect(
      installed.length,
      `${cssFile}: no unicode-range declarations found — the installed font could not be read`,
    ).toBeGreaterThan(0);
    // Compared as PARSED INTERVALS, not as raw strings: reordering the tokens or respacing them is not
    // a change to what the font covers, and a gate that reds on whitespace is a gate that gets muted.
    expect(
      parseRanges(installed),
      `${cssFile}: @fontsource/jetbrains-mono declares a different subset than this file hardcodes — ` +
        'the font moved under the gate. Re-measure, update DECLARED_SUBSET, and re-read the header block ' +
        'before assuming the change is safe.',
    ).toEqual(COVERED);
  });

  it.each(fences.map((f) => [f.file.split('/').at(-1), f]))(
    'every character in a %s fence is one the font can serve',
    (_name, fence) => {
      const violations = [...fence.source]
        .map((ch) => ch.codePointAt(0))
        .filter((cp) => !covers(cp))
        .map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')} ${String.fromCodePoint(cp)}`);
      expect(
        [...new Set(violations)],
        `${fence.file}: a fence carries a character outside every unicode-range JetBrains Mono is ` +
          'subset to, so it will render in a fallback font this repo does not control. Coverage is not ' +
          'legibility — read the header block of this file before choosing a replacement, and look at ' +
          'whatever you choose rendered at 15px.',
      ).toEqual([]);
    },
  );
});
