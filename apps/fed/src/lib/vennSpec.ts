// The authored form of the three-pillar figure on /architecture.
//
// WHY A SECOND DIAGRAM LANGUAGE EXISTS AT ALL, since one more is exactly the thing this repo argues
// against: mermaid cannot draw a Venn. It has flowcharts, sequences, state, class, block and
// architecture-beta — none of them draws overlapping circles, and there is no plugin path that adds one
// through the build-time compile in `gen-diagrams.mjs`. The owner's design for this figure is three
// circles with a shared intersection and topic items inside each circle, so the choice was between
// drawing it or not drawing it.
//
// So this is deliberately the SMALLEST thing that can be: a line-oriented spec parsed here and painted
// by `VennDiagram.tsx`. No layout engine, no compile step, no generated artifact. The geometry is fixed
// in the component; this file only decides WHAT the words are, which is the half that is per-locale and
// therefore the half that can drift between the two editions.
//
// It parses STRICTLY and throws rather than degrading, for the reason `diagrams.ts` gives at length: on a
// static site the prerender bakes whatever happened into the served bytes, so a half-drawn figure is not
// a moment, it is an artifact. Throwing fails the build, the prerender, the unit tests and the E2E at
// once.

/** One circle: a two-line title and the topic items that sit inside its own lobe. */
export interface VennPillar {
  /** Exactly two lines. Two rather than one because a single line long enough to name a pillar does not
   *  fit inside a circle at this radius — measured, not assumed; see the geometry note in the component. */
  title: [string, string];
  items: string[];
}

export interface VennSpec {
  /** The reader-visible caption AND the accessible name, from one place — the same contract mermaid's
   *  `accTitle:` has, so the two figure kinds cannot diverge on the rule that matters most. */
  accTitle: string;
  accDescr: string;
  /** The label in the shared intersection, in two lines for the same reason a pillar title is. */
  centre: [string, string];
  pillars: [VennPillar, VennPillar, VennPillar];
}

const PILLARS = 3;
const TITLE_LINES = 2;
/**
 * The lobe holds five items at the authored type scale.
 *
 * CORRECTED, and the correction is the reason this comment now says how the number was obtained. It read
 * `4`, with the note *"five overflows the circle silently"* — which was an assumption, never measured,
 * and false. Five fits. A cap that refuses a legal arrangement is the same class of defect as one that
 * admits an illegal one; it survived because it was phrased like a measurement.
 *
 * WHAT ACTUALLY BINDS IS WIDTH, NOT COUNT. Items stack downward from the pillar's anchor, so each row
 * sits nearer the circle below it and has less room than the one above. Running the geometry test's own
 * arithmetic (`VennDiagram.test.tsx` — same pessimistic 0.62em glyph width, same in-own-circle /
 * out-of-the-other-two predicate) over the fixed geometry gives, in characters per row:
 *
 *   side pillars (0 and 1):  29 | 28 | 27 | 26 | 20 | 14
 *   bottom pillar (2):       50 | 48 | 44 | 40 | 35 | 28
 *
 * Five is where the cap sits because the SIXTH row affords 14 characters in a side pillar, which is not a
 * line anyone writes — so refusing it here costs nothing and keeps the figure from growing into a list.
 *
 * This stays a COARSE guard on purpose: it counts, it cannot see width, so a thirty-character fifth item
 * passes here and is caught by the geometry test, which is the check that actually knows.
 */
const MAX_ITEMS = 5;

// A FUNCTION DECLARATION, not a const arrow, and that is a type-system requirement rather than style:
// TypeScript only uses a `never` return to narrow the code after the call when the callee is a function
// declaration or an explicitly annotated const. As an arrow it compiled to "centre may still be null"
// three lines below its own null check.
function fail(why: string): never {
  throw new Error(`Invalid venn diagram spec: ${why}.`);
}

const twoLines = (raw: string, what: string): [string, string] => {
  const parts = raw.split('|').map((s) => s.trim());
  if (parts.length !== TITLE_LINES || parts.some((p) => !p)) {
    fail(`${what} must be two non-empty lines separated by "|", got ${JSON.stringify(raw)}`);
  }
  return [parts[0], parts[1]];
};

/**
 * Parse the body of a ```venn fence.
 *
 * The grammar is four keys and a bullet list, in this order:
 *
 *   accTitle: <caption>
 *   accDescr: <one paragraph, the whole figure in words>
 *   centre: <line one> | <line two>
 *   pillar: <line one> | <line two>
 *   - item
 *   - item
 *   (repeated, exactly three times)
 *
 * Chosen so the fence stays READABLE AS TEXT, which is not decoration: `shareMarkdown.ts` copies this
 * page's body verbatim, and a reader who copies it — or who reads the file on GitHub, where a `venn`
 * fence renders as a plain code block rather than as a picture — still gets every word of the figure.
 * That is this rendering path's real cost, and keeping the spec legible is what bounds it.
 */
// THE TWO LINE GRAMMARS, hoisted out of the loop and written so the quantifiers cannot overlap.
//
// `\s*(.+)` and `\s+(.+)` are both ambiguous — `.` matches a space too, so on a long run of whitespace the
// engine has a choice at every position and backtracks super-linearly. `(\S.*)` removes the choice by
// requiring the capture to START at a non-space, which is what the surrounding code already assumed:
// every line is trimmed before it reaches here, so a value that is nothing but whitespace cannot exist,
// and both spellings reject the same inputs. Behaviour identical, one path through the matcher.
const KEY_LINE = /^(accTitle|accDescr|centre|pillar):\s*(\S.*)$/;
const ITEM_LINE = /^-\s+(\S.*)$/;

/**
 * Everything that must be true once the whole fence has been read.
 *
 * SPLIT OUT OF `parseVennSpec` rather than inlined, and not only to satisfy a complexity threshold: these
 * are two different jobs. Above, a line is turned into structure and the failures are SYNTAX. Here the
 * structure is complete and the failures are about the FIGURE — an unlabelled circle, a missing
 * intersection, items spilling over a stroke. Each is a real authoring mistake that would otherwise reach
 * a reader as a figure that is merely wrong rather than absent, which a picture hides better than prose.
 */
function assertComplete(
  accTitle: string,
  accDescr: string,
  centre: [string, string] | null,
  pillars: VennPillar[],
): asserts centre is [string, string] {
  if (!accTitle) fail('accTitle is missing — it is the accessible name and the visible caption');
  if (!accDescr) fail('accDescr is missing — it is the whole figure for a reader who cannot see it');
  if (!centre) fail('centre is missing — the intersection is the claim this figure makes');
  if (pillars.length !== PILLARS) fail(`expected ${PILLARS} pillars, got ${pillars.length}`);
  for (const p of pillars) {
    if (p.items.length === 0) fail(`pillar "${p.title[0]}" has no items — a circle with no contents`);
    if (p.items.length > MAX_ITEMS) {
      fail(`pillar "${p.title[0]}" has ${p.items.length} items; ${MAX_ITEMS} is what the circle holds`);
    }
  }
}

export function parseVennSpec(body: string): VennSpec {
  const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  let accTitle = '';
  let accDescr = '';
  let centre: [string, string] | null = null;
  const pillars: VennPillar[] = [];

  for (const line of lines) {
    const key = KEY_LINE.exec(line);
    if (key) {
      const [, name, value] = key;
      if (name === 'accTitle') accTitle = value.trim();
      else if (name === 'accDescr') accDescr = value.trim();
      else if (name === 'centre') centre = twoLines(value, 'centre');
      else pillars.push({ title: twoLines(value, 'a pillar title'), items: [] });
      continue;
    }
    const item = ITEM_LINE.exec(line);
    if (!item) fail(`unrecognised line ${JSON.stringify(line)}`);
    const open = pillars.at(-1);
    if (!open) fail(`item ${JSON.stringify(line)} appears before any "pillar:"`);
    open.items.push(item[1].trim());
  }

  assertComplete(accTitle, accDescr, centre, pillars);

  return { accTitle, accDescr, centre, pillars: pillars as [VennPillar, VennPillar, VennPillar] };
}
