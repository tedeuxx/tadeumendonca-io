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
/** The lobe fits four items at the authored type scale. Five overflows the circle silently — which is
 *  precisely the failure a picture hides, so it is refused here instead. */
const MAX_ITEMS = 4;

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
export function parseVennSpec(body: string): VennSpec {
  const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  let accTitle = '';
  let accDescr = '';
  let centre: [string, string] | null = null;
  const pillars: VennPillar[] = [];

  for (const line of lines) {
    const key = /^(accTitle|accDescr|centre|pillar):\s*(.+)$/.exec(line);
    if (key) {
      const [, name, value] = key;
      if (name === 'accTitle') accTitle = value.trim();
      else if (name === 'accDescr') accDescr = value.trim();
      else if (name === 'centre') centre = twoLines(value, 'centre');
      else pillars.push({ title: twoLines(value, 'a pillar title'), items: [] });
      continue;
    }
    const item = /^-\s+(.+)$/.exec(line);
    if (!item) fail(`unrecognised line ${JSON.stringify(line)}`);
    if (pillars.length === 0) fail(`item ${JSON.stringify(line)} appears before any "pillar:"`);
    pillars[pillars.length - 1].items.push(item[1].trim());
  }

  // Every one of these is a real authoring mistake that would otherwise reach a reader as a figure that
  // is merely WRONG rather than absent — an unlabelled circle, a missing intersection, items spilling
  // over a stroke. A picture reads as current and complete in a way prose does not.
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

  return { accTitle, accDescr, centre, pillars: pillars as [VennPillar, VennPillar, VennPillar] };
}
