// What the /architecture diagrams have to SAY, not merely that they compiled (#170).
//
// The pipeline tests next door prove a diagram exists, is in the palette and is real text. Every one of
// them would pass on two decorative box lists. The owner's constraint on this issue is editorial and was
// stated as a rejection: the infra diagram "must not restate the prose … it earns its place only by
// showing what a sentence cannot — the request path and where the rewrite happens. If it ends up as a
// labelled box list, it is decoration and should be cut."
//
// So the falsifiable form of that sentence is asserted here: there is a DIRECTED PATH from the reader,
// through the rewrite, to the origin. A box list has nodes and no path, and fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { mermaidFences, normalise } from './diagram-source.mjs';

const contentDir = resolve(import.meta.dirname, '..', 'src', 'content');
const read = (f) => readFileSync(join(contentDir, f), 'utf8');
const generated = (f) => JSON.parse(readFileSync(join(contentDir, 'generated', f), 'utf8'));

/** Node ids and directed edges, labels discarded — the graph's SHAPE, which both editions must share. */
function graphOf(source) {
  const edges = [];
  for (const line of source.split('\n')) {
    // A mermaid comment line is not part of the graph. Skipped before anything else because BOTH
    // matchers below would otherwise read it: a comment containing `-->` or `~~~` (explaining an edge,
    // say) would enter the graph as a real edge, and the parity test compares graphs — so a comment
    // present in one edition and not the other would red describing a structural difference that does
    // not exist. Harmless on today's fences, which carry comments but none containing either token;
    // this branch is the first to put comments inside a fence at all, so it is the right moment.
    if (line.trimStart().startsWith('%%')) continue;
    // Strip node shapes and edge labels FIRST, then match the arrow. Matching them in one pattern means
    // the label — which is the part that differs per locale and contains slashes, dots and accents — has
    // to be described by a regex, and getting that subtly wrong yields an empty graph that compares
    // equal to another empty graph. Two editions passing because neither parsed is the exact false
    // green this file exists to prevent.
    const clean = line
      .replace(/"[^"]*"/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\{[^}]*\}/g, '');
    // matchAll, not exec: `exec` takes the FIRST arrow per line, so a chained `A --> B --> C` would
    // contribute only A→B and the rest of the line would vanish silently. Neither fence chains today,
    // which is exactly why this is worth fixing now rather than when one does.
    for (const m of clean.matchAll(/([A-Za-z0-9_]+)\s*(?:--[^>]*?)?-->\s*([A-Za-z0-9_]+)/g)) {
      edges.push([m[1], '->', m[2]]);
    }
    // MERMAID'S INVISIBLE LINK, and it is not cosmetic to parse it. Measured over the three fences on
    // this page, in both editions: `[0]` (lanes) carries 6 directed edges, `[1]` (tiers) carries 24, and
    // `[2]` — the COMPONENTS GRID — carries none at all. So exactly ONE fence parses empty when the
    // `~~~` handling below is removed (`nodes=0 edges=0`), and the parity test further down would then
    // have passed having compared two empty graphs — the exact false green the comment above exists to
    // prevent.
    //
    // Which is why `parses a non-trivial graph at all` iterates EVERY fence in BOTH editions rather than
    // sampling one: the fence that can parse empty is not the first one, and a guard that reads `en[0]`
    // only is blind in precisely the place the defect lives. (It was, until #463.)
    //
    // Kept as its own edge kind (`~`, never `->`) on purpose: an invisible link is a LAYOUT constraint,
    // not a path, so folding it into the directed set would let a grid satisfy a reachability assertion
    // written about a flow.
    if (clean.includes('~~~')) {
      const parts = clean.split('~~~').map((p) => p.match(/[A-Za-z0-9_]+/g) ?? []);
      for (let i = 0; i < parts.length - 1; i++) {
        const a = parts[i].at(-1);
        const b = parts[i + 1][0];
        if (a && b) edges.push([a, '~', b]);
      }
    }
  }
  const nodes = [...new Set(edges.map((e) => [e[0], e[2]]).flat())].sort();
  return { nodes, edges: edges.map((e) => e.join('')).sort() };
}

// `hasCycle` LIVED HERE and went with the request-path diagram it was written for (#448). It asserted
// that a left-to-right flow never pointed backwards, and the only fence it was ever applied to was
// `How a request becomes a page`, which the restructure cut. Recorded rather than silently dropped: a
// future left-to-right fence that needs the same property has to bring the helper back with it, and
// this note is where whoever writes it will find out that it once existed and why it left.

/** Is `to` reachable from `from` by following directed edges? */
function reaches(graph, from, to) {
  const adj = new Map();
  for (const e of graph.edges) {
    // `~` edges are invisible links — layout, not reachability. Skipped explicitly rather than left to
    // `split('->')`, which would hand back the whole string as a node id and quietly widen the graph.
    if (!e.includes('->')) continue;
    const [a, b] = e.split('->');
    adj.set(a, [...(adj.get(a) ?? []), b]);
  }
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) return true;
    for (const next of adj.get(cur) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

const en = mermaidFences(read('architecture.en.md'));
const pt = mermaidFences(read('architecture.pt.md'));

// A `vennFences` helper lived here — ```venn is the one figure kind mermaid cannot draw, so it never
// reaches `mermaidFences`, and it was counted only so the published TOTAL could include it. It is deleted
// with the self-audit sentence that published that total (see the block comment further down). Nothing
// else in this file reads the venn fence — every other block here scans mermaid fences. Said plainly
// rather than left implied: this file no longer looks at the venn figure at all.

/**
 * The accessible description authored on a fence — what a screen-reader user gets INSTEAD of the
 * picture, which is why several blocks here assert against it separately from the drawing. Throws on a
 * fence that carries none, for `byTitle`'s reason: a silent `undefined` would flow into a `.includes`
 * and read as "the text does not mention it" rather than "there is no text".
 */
function accDescrOf(source) {
  const m = /^\s*accDescr:(.*)$/m.exec(source);
  if (!m) throw new Error('the fence carries no accDescr');
  return m[1];
}

/**
 * Pick a fence by its `accTitle` rather than by its position in the page.
 *
 * The first version of this file addressed them as `en[0]` and `en[1]`. That is a coupling to
 * DOCUMENT ORDER, and adding a diagram ABOVE them silently re-pointed every assertion below at a
 * different graph — which is what happened: three infra assertions and four dev-loop assertions all
 * failed at once, describing a diagram they were never written about. Position is not identity.
 *
 * `accTitle` is the right key because it is not optional decoration: the accessibility rule already
 * requires every fence to carry one, so a diagram cannot lose its handle without failing that rule
 * first. Throwing on a miss is deliberate — returning `undefined` here would surface as an
 * unreadable crash inside `graphOf` rather than as "the diagram this suite is about is gone".
 */
function byTitle(fences, title) {
  const found = fences.filter((f) => f.source.includes(`accTitle: ${title}`));
  if (found.length !== 1) {
    throw new Error(
      `expected exactly one mermaid fence with accTitle "${title}", found ${found.length} — ` +
        'the diagram was renamed, removed, or duplicated',
    );
  }
  return found[0];
}

describe('the two editions describe the same system', () => {
  // Long-form is one file per locale (ADR-0032), so the two CAN drift — and a diagram drifting is worse
  // than prose drifting, because nobody re-reads a picture to check it. Counting first: a missing fence
  // in one edition is the failure a structural comparison would otherwise skip over silently.
  it('carries the same number of diagrams in both editions', () => {
    expect(en.length).toBeGreaterThan(0);
    expect(pt.length).toBe(en.length);
  });

  // Guards the false green above: two editions whose graphs BOTH failed to parse compare equal, and the
  // parity test would pass having compared nothing.
  //
  // EVERY FENCE, BOTH EDITIONS — and the iteration is the whole assertion, not tidiness. This read
  // `en[0]` alone until #463: the lanes flow, which parses to 8 nodes / 6 edges even with `graphOf`'s
  // `~~~` handling deleted, so it cleared this bar comfortably while the components grid — the only
  // fence that ever parsed to nothing — was never looked at. The guard written to catch that exact
  // false green was blind to it. Deleting the `~~~` block in `graphOf` now reds here, by fence index.
  it('parses a non-trivial graph at all', () => {
    // Named `en[2]` / `pt[2]`, not by position in the concatenation: a bare index over `[...en, ...pt]`
    // reports the pt grid as "fence 5", which is a number appearing nowhere else and sends whoever reads
    // the failure counting. This is the same notation the comment in `graphOf` uses.
    [...en.map((f, i) => [`en[${i}]`, f]), ...pt.map((f, i) => [`pt[${i}]`, f])].forEach(([name, fence]) => {
      const g = graphOf(fence.source);
      expect(g.nodes.length, `${name} parsed to an empty graph`).toBeGreaterThan(3);
      expect(g.edges.length, `${name} parsed to an empty graph`).toBeGreaterThan(3);
    });
  });

  it('draws the same graph in both editions — labels translated, structure identical', () => {
    en.forEach((fence, i) => {
      expect(graphOf(pt[i].source), `diagram ${i} differs in structure between editions`).toEqual(
        graphOf(fence.source),
      );
    });
  });

  it('translates the labels rather than shipping the English diagram twice', () => {
    en.forEach((fence, i) => expect(pt[i].source).not.toBe(fence.source));
  });

  // The accessible name is authored ON the fence, so it cannot drift from the diagram it names.
  it('declares accTitle and accDescr in both editions', () => {
    [...en, ...pt].forEach((fence) => {
      expect(fence.source).toMatch(/^\s*accTitle:\s*\S/m);
      expect(fence.source).toMatch(/^\s*accDescr:\s*\S/m);
    });
  });
});

// THE PUBLISHED FIGURE-COUNT BLOCK WAS HERE, and it is deleted with the sentence it was written about.
//
// It parsed the limitations section's self-audit — "Quatro desenhos acima; **dois** você consegue
// conferir" / "Four drawings above; **two** of them you can check" — and asserted the published total
// against `mermaidFences + vennFences`, plus that the two halves of the split added up to it. Those were
// hand-typed numbers about this file and they had gone stale once before a gate existed for them.
//
// The owner cut the whole `## Onde esta abordagem ainda não prova o que promete` / `## Where this
// approach still does not prove what it promises` section, which is where every one of those three
// sentences lived. `read1` THROWS ("the total count sentence is gone") when its pattern finds nothing, so
// leaving the block in place would have failed the file loudly against prose nobody decided to keep.
//
// What is lost, stated rather than left to be rediscovered: nothing now compares a figure count printed
// in the prose against the fences actually in the file, because the prose no longer prints one. The rest
// of this suite is unaffected — it asserts each fence's existence, palette, accessibility metadata and
// content directly, none of which depended on a total. If a self-audit sentence ever returns, this block
// returns with it.
// THE REQUEST-PATH BLOCK WAS HERE, and #448 removed it with the fence it was written about.
//
// It asserted the owner's editorial constraint on `How a request becomes a page` — that the figure earns
// its place by showing a directed path from the reader, through the rewrite, to the origin, and that it
// would be decoration if it degenerated into a labelled box list. The restructure cut the figure under
// Budget B, so the block is deleted rather than left pointing at nothing: `byTitle` THROWS on a missing
// accTitle, so keeping it would have failed the whole file at collection, naming a diagram nobody had
// decided to keep.
//
// What was lost, said plainly rather than left for someone to discover: nothing now asserts that the
// rewrite is drawn before the origin, because nothing draws it. The CLAIMS that figure carried survive
// as prose the page still makes checkable by link — the ten executable lines, their unit tests, and the
// post-deploy comparison — and `architecture-links.test.ts` proves those three targets still resolve.
// If the figure ever returns, this block returns with it, along with `hasCycle` above.

// The owner's constraint on the SECOND diagram, and it is a harder one to make mechanical: "it has to
// show the human's position, not just the steps — where the agent proves 'done' and where the owner's
// go/no-go actually sits. A flow that shows only boxes is the corporate flowchart the page's voice is
// arguing against."
//
// The falsifiable form of that used to be "there is EXACTLY ONE human node, and it sits on the edge into
// production". The redraw makes a STRONGER claim and this block follows it: the owner appears at BOTH
// ends — as the only origin of demand, and as the go/no-go on the boundary class — and the whole stretch
// between them is AFK. So "exactly one" becomes "exactly two, and they are the two ends", plus the claim
// the old fence could not express at all: a route from the `ready` label to the merge with no human on
// it. Two human boxes is the opposite of a human at every stage only if the middle is provably empty,
// which is why the AFK assertion is the load-bearing one here rather than the count.
// WHAT THIS FILE CAN AND CANNOT GUARANTEE, said plainly because the first version of it overstated
// both. Node ids are an authoring convention: the test knows a node is CALLED `H`, never that it is a
// human. So this pins the shape the author declared — a real drift guard across edits and between the
// two editions — and it is not "the diagram cannot lie about where the human is". The `H`-prefix rule
// below is what makes the convention enforceable rather than decorative.
const humanNodes = (graph) => graph.nodes.filter((n) => /^H/.test(n));

/**
 * The tier fence, addressed by accessible title in each edition's own language — never by position.
 * `byTitle`'s docstring records what positional addressing cost this file the one time it was used.
 *
 * Hoisted to module scope on #431's second slice rather than copied a third time, for the reason
 * `accDescrOf` was hoisted on its first: three blocks now address this same fence, and three literal
 * copies of the two accTitles are three chances for a rename to fix two of them.
 */
const TIER_FENCE = {
  en: () => byTitle(en, 'How work crosses the agent tiers'),
  pt: () => byTitle(pt, 'Como o trabalho atravessa os tiers de agente'),
};
const LOCALES = Object.keys(TIER_FENCE);

describe('the dev-loop diagram shows where the human stands', () => {
  const graph = graphOf(byTitle(en, 'How work crosses the agent tiers').source);

  // Counted over the PREFIX, not over `nodes` filtered to a single id. An earlier version asserted
  // `nodes.filter(n => n === 'H').length === 1` against a list built from a Set — which cannot contain
  // 'H' twice, so it could never fail, while its comment claimed it caught an approval ladder. It did
  // not: adding `P --> H2` left every assertion green. This version fails on that mutation.
  //
  // THE `H`-PREFIX CONVENTION IS LOAD-BEARING AND IT CONSTRAINS THE AUTHOR, not just the test: no node id
  // in this fence may start with `H` except the two human ends. That is why harness-lead is drawn as
  // `LM`/`LB` and not `HL` — an `HL` node would be silently counted as a third human here, and the
  // assertion below would fail describing something that is not wrong.
  it('has exactly two human decision points, and they are the two ends', () => {
    expect(humanNodes(graph)).toEqual(['H', 'HO']);
  });

  it('puts the owner on the edge into production', () => {
    expect(graph.edges).toContain('HO->M');
    // And the ONLY thing that reaches a human is the gate handing up the boundary class. Asserted as
    // "the only inbound edge to any `H*` node" rather than as the absence of one specific edge: the
    // previous form (`not.toContain('G->H')`) named one wrong edge, so any other route into the human —
    // a build step asking, a mechanical gate escalating — would have passed it.
    expect(graph.edges.filter((e) => /->H/.test(e)), 'only the gate may hand work up').toEqual([
      'QA->HO',
    ]);
  });

  // The other half of "human-residual", and the claim the previous fence could not express: the stretch
  // between the `ready` label and the merge is AFK. `reaches(RQ, M)` on the full graph is vacuous — it
  // is satisfied by a path THROUGH the owner. Removing both human nodes first is what turns it into the
  // property the name promises.
  it('shows a path from ready to production with no human on it', () => {
    const withoutHuman = {
      nodes: graph.nodes.filter((n) => !/^H/.test(n)),
      edges: graph.edges.filter((e) => !/(^|>)H/.test(e)),
    };
    expect(withoutHuman.nodes, 'the AFK stretch must still have nodes to walk').toContain('ORCH');
    expect(
      reaches(withoutHuman, 'RQ', 'M'),
      'every route from ready to production passes a human — the AFK claim is false',
    ).toBe(true);
  });

  // A go/NO-go that only has an outgoing edge to merge is a gate that always opens. Same for a gatekeeper
  // drawn as a pure fork: this very review is the counterexample, and a diagram that cannot show work
  // coming back describes a loop that never rejects anything.
  //
  // THE RETURN EDGES MEET IN ONE NODE, and that is the claim rather than a re-styling: `V` is a join, not
  // an invented step — it is labelled with the STATE the work is in. What changed with the redraw is
  // where it re-enters: never straight to whoever built it, always through the orchestrator, because the
  // orchestrator is the only thing that dispatches a persona.
  //
  // Asserted as REACHABILITY, which is what "work comes back" always meant, plus the single re-entry as
  // an edge: `reaches` alone would stay green if the two were split apart again.
  it('lets work come back — from the gate and from the human — through one channel', () => {
    expect(reaches(graph, 'QA', 'DEV'), 'a gate asking for changes must return the work').toBe(true);
    expect(reaches(graph, 'HO', 'DEV'), 'a no-go must return the work').toBe(true);
    expect(graph.edges, 'one return channel, not two').toContain('V->ORCH');
    expect(
      graph.edges.filter((e) => e.endsWith('->ORCH')),
      'nothing else re-enters the orchestrator',
    ).toEqual(['RQ->ORCH', 'V->ORCH']);
  });
});

// THE TIER FENCE AGAINST THE MANIFEST (#431) — the roster's MEMBERSHIP, not its size.
//
// Everything above this line about the tier fence asserts its SHAPE: two human ends, one return channel,
// an AFK stretch with nothing human on it. `graphOf` discards labels by construction, so none of it can
// see WHO is drawn. And `check-harness-drift.mjs`, one link back, compares the manifest to the plugin
// tree and never looks at this page. So the two surfaces converged the last time only because a human
// rewrote the prose — nothing compared them, and the next divergence would be as silent as that one was:
// the page would go on describing a loop that no longer exists, on the page whose whole claim is that it
// describes this one.
//
// This block is the comparison. It is one direction only, and the limit is written here rather than left
// to be rediscovered:
//
//   IT CHECKS: every persona the manifest carries is drawn on this fence, and named in its accessible
//   description, in both editions.
//
//   IT DOES NOT CHECK the reverse — a name on this fence that the manifest no longer carries. A RETIRED
//   persona left published here passes this block untouched. That direction is covered twice elsewhere
//   and neither of those covers it HERE: the components grid asserts `PS`'s label equals the manifest's
//   id list exactly (`names NO persona the manifest has retired`), and CLAUDE.md's `roster:dispatch`
//   fence is compared by `check-harness-drift.mjs`. Both are about a different surface. Closing this
//   direction on THIS fence needs an authored anchor the drawing does not have today — its persona names
//   are scattered across nine boxes and its own prose, so there is no enumeration to compare against, and
//   inventing one by scraping every capitalised token out of the labels would red on ordinary editing.
//   Stated as a residual, deliberately, rather than approximated.
//
// WHY THE COMPARISON IS BY WHOLE WORD and not `includes`. Every id in this roster is lowercase-and-hyphen
// and several share a stem. A future id that is a strict prefix of a live one would be satisfied by the
// live one's own text — the check would report a persona as drawn on the strength of a different
// persona's name. `matches a whole id, not a prefix of one` is the mutation guard for that: it derives
// truncations from the live ids and requires the matcher to reject them, so replacing `asWholeWord` with
// a substring test reddens by name instead of quietly widening what counts as drawn.
//
// NOT A FOURTH RESTATEMENT. This file already carries hand-authored restatements of loop rules, and a
// literal roster here would be one more list nothing generates — the exact drift shape the block exists
// to catch. Every name compared below comes out of `harness.json`.
describe('the dev-loop diagram draws every persona the manifest carries', () => {
  const personaIds = generated('harness.json')
    .filter((component) => component.kind === 'persona')
    .map((component) => component.id);

  /**
   * Every authored NODE label in a fence — the words a sighted reader meets inside a box.
   *
   * Edge labels are excluded deliberately, and it is a real choice rather than a parsing convenience: a
   * persona named only on an arrow would count as "drawn" under a whole-fence scan, and this fence draws
   * personas as boxes. The `acc*` lines are excluded for a sharper reason — the accessible description
   * names every persona in prose, so leaving it in would make the label assertion below satisfiable by
   * the description alone, which is precisely the two-surfaces conflation the components block measured.
   */
  const nodeLabels = (source) =>
    source
      .split('\n')
      .filter((line) => !/^\s*acc(?:Title|Descr):/.test(line))
      .flatMap((line) => [...line.matchAll(/[[({]\s*"([^"]*)"/g)].map((m) => m[1]));

  const ID_CHAR = '[A-Za-z0-9_-]';
  const asWholeWord = (haystack, id) =>
    new RegExp(`(?<!${ID_CHAR})${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!${ID_CHAR})`).test(haystack);

  // The anti-vacuity guard, and it carries M2: renaming the fence's accTitle makes `byTitle` throw HERE,
  // in a test that says the fence is gone, rather than letting the arms below compare an empty id set
  // against an empty label set and report green. Two empty parses agreeing is this file's named recurring
  // false green — `parses a non-trivial graph at all` exists for the same reason one describe up.
  it('is asserting against a real manifest and a real fence, not two empty sets', () => {
    expect(
      personaIds.length,
      'the manifest carries no personas — every assertion in this block would be vacuous',
    ).toBeGreaterThan(0);
    for (const locale of LOCALES) {
      const source = TIER_FENCE[locale]().source;
      expect(nodeLabels(source).length, `${locale}: the fence parsed to no node labels at all`).toBeGreaterThan(3);
      expect(
        accDescrOf(source).length,
        `${locale}: the accessible description is empty — the arm below would assert nothing`,
      ).toBeGreaterThan(200);
    }
  });

  // The matcher's own mutation guard. Derived from the live ids, so it needs no literal: a strict prefix
  // of an id that IS drawn must NOT match, which a substring test cannot satisfy. It bites only on ids
  // currently in the drawing — an id that is absent is absent under either matcher — and that is enough,
  // because the failure this guards against is a drawn name vouching for a different one.
  it('matches a whole id, not a prefix of one', () => {
    for (const locale of LOCALES) {
      const drawn = nodeLabels(TIER_FENCE[locale]().source).join('\n');
      const looseMatches = personaIds
        .map((id) => id.slice(0, -1))
        .filter((truncated) => asWholeWord(drawn, truncated));
      expect(
        looseMatches,
        `${locale}: a strict prefix of a live id matched — the comparison degraded to a substring test`,
      ).toEqual([]);
    }
  });

  it.each(LOCALES)('draws every persona the manifest carries, in the %s edition', (locale) => {
    const drawn = nodeLabels(TIER_FENCE[locale]().source).join('\n');
    const undrawn = personaIds.filter((id) => !asWholeWord(drawn, id));
    expect(undrawn, `${locale}: a persona is live in the manifest and is in no box on this fence`).toEqual([]);
  });

  // The same claim on the other surface, separately — a screen-reader user gets the description INSTEAD
  // of the drawing, so a fence whose boxes are complete and whose description is not publishes a
  // different roster to that reader. Asserted apart from the labels for the reason the components block
  // measured: a whole-fence scan is satisfied by either surface alone.
  it.each(LOCALES)('names every persona in the %s accessible description', (locale) => {
    const descr = accDescrOf(TIER_FENCE[locale]().source);
    const unnamed = personaIds.filter((id) => !asWholeWord(descr, id));
    expect(
      unnamed,
      `${locale}: a persona is live in the manifest and the accessible description does not name it`,
    ).toEqual([]);
  });
});

// THE TIER FENCE'S LANE TOPOLOGY (#431) — the half of that Issue nothing had ever asserted.
//
// #431 opened on a defect of SHAPE, not of membership: the published fence drew tier 1 as one intake box
// with no branching by issue type, and drew the `loop` lane reaching production without passing the gate.
// A human rewrote the prose and the two surfaces converged; nothing compared them, so the next divergence
// would be as silent as that one was. The persona-membership block above closed the "who is drawn" half.
// This block closes the "how the lanes run" half — and they are genuinely different failures: every
// assertion above is satisfied by a drawing with all seven names in one undifferentiated box.
//
// WHAT COUNTS AS THE TOPOLOGY, and it is the design question the Issue said was not obvious. The two
// surfaces this figure is drift-checked against are deliberately NOT identical — the `-skills` README is
// written for someone adopting the plugin, this page is written for a reader of this site, in two
// languages — so a checker demanding identical graphs would red on every legitimate editorial difference
// and be disabled inside a month, which is worse than no checker because a disabled gate reads as a
// passing one. So the invariant chosen here is the smallest one that still catches #431's actual defect:
//
//   INTAKE BRANCHES BY TYPE, THE SAME TYPES ARE DISPATCHED AT BUILD, EVERY LANE REACHES THE `ready`
//   LABEL, AND NO LANE REACHES THE MERGE WITHOUT PASSING THE GATE.
//
// WHAT IS DELIBERATELY LET DIFFER, written here so the next reader does not take the omission for an
// oversight:
//
//   THE LANE NAMES THEMSELVES. `H -- "product" --> PL` in English is `H -- "produto" --> PL` in
//   Portuguese, and translating the labels is the whole point of shipping two editions (`translates the
//   labels rather than shipping the English diagram twice`, one describe up, asserts the OPPOSITE of
//   name equality here). So every assertion below is WITHIN one edition, and the only thing compared
//   ACROSS them is how MANY lanes there are. A mistranslated lane label — `conteúdo` where the English
//   says `product` — is invisible to this block and to everything else in this repo. It would need a
//   glossary nobody maintains; stated as a residual rather than approximated.
//
//   THE LANE VOCABULARY'S TRUTH. Nothing here knows that the three types are `product`, `content` and
//   `loop`. That vocabulary lives in the plugin's `harness-engineering` skill as prose, and `harness.json`
//   — the one derived artifact this repo has from that tree — carries component kinds, not issue types.
//   Scraping the label set out of another repository's markdown would be a FOURTH independent derivation
//   of a rule two surfaces already state, which is the drift shape this whole mechanism exists to remove.
//   So what is asserted is that the drawing AGREES WITH ITSELF about which lanes exist — add a lane at
//   intake and forget it at build, or the reverse, and this reds. Renaming all six edges consistently
//   passes. That is a real hole and it is the deliberate one.
//
//   THE PROSE BENEATH THE FIGURE. The paragraph under this fence restates the no-bypass claim in words.
//   Nothing compares it to the drawing, for the reason the components block already records about column
//   titles: a sentence is not an enumeration, and the only mechanical form of "the prose agrees" this
//   file has ever found is a count, which this prose does not print.
//
// EVERY NAME AND NUMBER BELOW COMES OUT OF THE FENCE. There is no literal lane list in this block —
// a literal one would be the fourth restatement described above, wearing a test's clothes.
describe('the tier fence branches intake by issue type, and routes every lane through the gate', () => {
  /**
   * Every LABELLED directed edge in a fence, as `{ from, label, to }`.
   *
   * `graphOf` discards labels by construction — which is correct for it, since the two editions must
   * share a SHAPE and not a vocabulary — and that is exactly why nothing in this file could see a lane
   * before. The label is the only place the issue type appears on this fence: the lane subgraphs carry
   * translated titles and the build boxes carry translated glosses, but the routing decision itself is
   * drawn as the edge's text.
   *
   * Matched anchored end-to-end rather than with a loose scan. A permissive pattern would also catch the
   * dashed `H <-.-> ORCH` channel and `MR -- "dispatched by the orchestrator" --> QA`, neither of which
   * is a lane, and the lane sets would then agree only by accident.
   */
  const labelledEdges = (source) =>
    source
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('%%'))
      .flatMap((line) => {
        const m = /^\s*([A-Za-z0-9_]+)\s+--\s*"([^"]*)"\s*-->\s*([A-Za-z0-9_]+)\s*$/.exec(line);
        return m ? [{ from: m[1], label: m[2], to: m[3] }] : [];
      });

  const lanesOut = (source, from) => [
    ...new Set(labelledEdges(source).filter((e) => e.from === from).map((e) => e.label)),
  ].sort();
  const targetsOut = (source, from) => [
    ...new Set(labelledEdges(source).filter((e) => e.from === from).map((e) => e.to)),
  ].sort();

  // The anti-vacuity guard, and it carries the `byTitle` throw the same way the persona block's does: a
  // renamed fence reds HERE, saying the fence is gone, rather than letting every arm below compare two
  // empty sets and report green. Two empty parses agreeing is this file's named recurring false green.
  //
  // The floor is three because #431's defect was a fence with FEWER lanes than the loop has, and an arm
  // that accepts one lane accepts the drawing the Issue was filed about.
  it.each(LOCALES)('is asserting against a real fence with real lanes, in the %s edition', (locale) => {
    const source = TIER_FENCE[locale]().source;
    expect(labelledEdges(source).length, `${locale}: no labelled edge parsed at all`).toBeGreaterThan(6);
    expect(
      lanesOut(source, 'H').length,
      `${locale}: intake does not branch — tier 1 is drawn as one undifferentiated box`,
    ).toBeGreaterThanOrEqual(3);
  });

  // THE CORE ARM, and the one that catches "the missing lane and the missing persona are the same defect
  // seen from two sides" (the owner's words on this Issue). A type the owner can file but that nothing
  // dispatches at build is a lane that dead-ends; a type dispatched at build that intake cannot admit is
  // a builder nobody can reach. Both are drawings of a loop that does not exist.
  it.each(LOCALES)('dispatches at build exactly the types it admits at intake, in the %s edition', (locale) => {
    const source = TIER_FENCE[locale]().source;
    expect(
      lanesOut(source, 'ORCH'),
      `${locale}: the lanes the orchestrator dispatches are not the lanes intake admits`,
    ).toEqual(lanesOut(source, 'H'));
  });

  // Tier 1 closes at the `ready` label — that is the artifact the whole intake chain exists to produce,
  // and a lane that reaches the orchestrator without it is a lane with no precondition. Asserted per
  // lane rather than in aggregate so a failure names the one that is wrong.
  it.each(LOCALES)('closes every intake lane on the ready label, in the %s edition', (locale) => {
    const graph = graphOf(TIER_FENCE[locale]().source);
    const unclosed = targetsOut(TIER_FENCE[locale]().source, 'H').filter((n) => !reaches(graph, n, 'RQ'));
    expect(unclosed, `${locale}: an intake lane never reaches the ready label`).toEqual([]);
  });

  // #431's ORIGINAL sentence, in its falsifiable form: "the loop lane reaches the same MR to gate to
  // merge path rather than bypassing tier 3". Per-build-node first, so a red names the lane.
  it.each(LOCALES)('routes every build lane into the gate, in the %s edition', (locale) => {
    const graph = graphOf(TIER_FENCE[locale]().source);
    const unreviewed = targetsOut(TIER_FENCE[locale]().source, 'ORCH').filter((n) => !reaches(graph, n, 'QA'));
    expect(unreviewed, `${locale}: a build lane reaches production without the gate on its path`).toEqual([]);
  });

  // And the same claim in the form no per-lane arm can express: the gate is a CUT. `reaches(LB, QA)` is
  // satisfied by a lane that reaches the gate AND has a second edge going round it — which is precisely
  // the shape #431 was filed about, a `loop` lane drawn both ways. Deleting the node and re-asking is
  // what turns "the gate is on the path" into "the gate is on EVERY path".
  //
  // The guard above it is not decoration: with `RQ` or `M` misspelled, `reaches` returns false and the
  // assertion passes for the wrong reason — a cut test on a graph where the two ends were never connected
  // is vacuous, and this file has paid for that shape before.
  it.each(LOCALES)('makes the gate a cut, not merely a station, in the %s edition', (locale) => {
    const graph = graphOf(TIER_FENCE[locale]().source);
    expect(reaches(graph, 'RQ', 'M'), `${locale}: ready does not reach the merge — the cut is vacuous`).toBe(true);
    const withoutGate = {
      nodes: graph.nodes.filter((n) => n !== 'QA'),
      edges: graph.edges.filter((e) => !/(^|>)QA/.test(e)),
    };
    expect(
      reaches(withoutGate, 'RQ', 'M'),
      `${locale}: a lane reaches the merge with the gate removed — something goes round tier 3`,
    ).toBe(false);
  });

  // The only cross-edition claim this block makes, and it is a COUNT because the names are translated.
  // The graph-parity test one describe up compares node ids and edge structure with labels discarded, so
  // it is already satisfied by two editions that disagree about how many lanes those edges represent.
  it('draws the same number of lanes in both editions', () => {
    const counts = LOCALES.map((locale) => lanesOut(TIER_FENCE[locale]().source, 'H').length);
    expect(new Set(counts).size, `the editions branch intake differently: ${counts.join(' vs ')}`).toBe(1);
  });
});

// THE COMPONENTS DIAGRAM (#318, ADR-0043) — the one whose content is DERIVED from another repository.
//
// The chain has two links and this file is the second of them. `check-harness-drift.mjs`, in its own CI
// job, proves the committed manifest still matches the plugin tree. Nothing there looks at the page. So
// without this block a plugin change would update harness.json, go green, and leave the drawing saying
// the old thing — the manifest would be current and the published picture stale, which is the exact
// failure this whole mechanism was built to remove, one file further along.
//
// What this can and cannot guarantee, stated because ADR-0043 requires the page to be honest about it:
// it pins IDENTITY — names, events, matchers, counts, the orphan — and, since the redraw, the manifest's
// `enforcement` field as COLUMN MEMBERSHIP, into both editions. It says nothing about whether the column
// titles describe those components correctly. Those are authored here and checked by nothing. The page
// carries that limit in its honest-limitations section — the check covers only the parts that are NAMES,
// never what those parts do — rather than beside the diagram, where the sentence naming the glosses
// themselves was cut as redundant with it.
describe('the components diagram carries the inventory it was generated from', () => {
  const harness = generated('harness.json');
  const of = (kind) => harness.filter((c) => c.kind === kind);
  const enFence = byTitle(en, 'What the harness is made of');
  const ptFence = byTitle(pt, 'Do que o harness é feito');

  // THE TWO SURFACES OF ONE CLAIM, and asserting the fence as a whole conflates them. A count appears
  // twice in every fence here — once in the node a sighted reader sees, once in the `accDescr` a screen
  // reader receives AS the drawing — so a whole-fence `toContain` is satisfied by EITHER one alone.
  //
  // That is not theoretical. Measured on this slice: changing the library node from `69 skills` to
  // `68 skills`, and the command node from `2 commands` to `3 commands`, left a fence-wide assertion
  // GREEN both times, because the accDescr still carried the true number. The drawing would have
  // published a false count under a passing gate — with the accessible text right there disagreeing
  // with it, which is worse than either being wrong alone.
  //
  // So both are read separately. Same technique the persona test uses on `PS[...]`, and for the same
  // reason: the label is the enumeration the reader sees, so it is what must match.
  const nodeLabel = (source, id) => {
    const m = new RegExp(`${id}\\["([^"]*)"\\]`).exec(source);
    if (!m) throw new Error(`the drawing has no node \`${id}\` — it was renamed or removed`);
    return m[1];
  };
  // `accDescrOf` LIVED HERE and is now module-scope, above `byTitle`. It was hoisted rather than copied
  // when a second block needed it (#431): the accessible description is the same surface for every fence
  // on this page, and a per-block copy is how two readers of one field drift apart.

  // The knowledge library is a `skill-library` row now, not five `command-family` rows: the plugin moved
  // `commands/<family>/<name>.md` to `skills/<family>/<name>/SKILL.md`. This guard follows the manifest,
  // because its job is to prove the assertions below have something to bite on — pointing it at a kind
  // the manifest no longer carries would make it fail for the wrong reason and teach the next reader to
  // delete it.
  // EVERY KIND THE BLOCK BELOW ITERATES, and the omission is the whole reason this is spelled out as a
  // list rather than described. `command` was never in this guard, so `carries the typed commands`
  // looped over an empty list and passed asserting nothing — measured: strip every `kind: command` row
  // and it stayed green. This slice edited the very line above it (`command-family` -> `skill-library`)
  // and walked past it, which is the third instance of this shape in one MR and the second found by
  // somebody other than its author.
  //
  // So the rule this guard encodes, for whoever edits it next: a kind that any test below FILTERS FOR
  // belongs here. A filter over a kind this list omits is an assertion that cannot fail.
  it('is asserting against a real manifest, not an empty one', () => {
    expect(of('persona').length).toBeGreaterThan(0);
    expect(of('hook').length).toBeGreaterThan(0);
    expect(of('skill-library').length).toBeGreaterThan(0);
    expect(of('command').length).toBeGreaterThan(0);
  });

  // And the rule made mechanical, so the next kind cannot be forgotten the way `command` was. Every
  // `of('<kind>')` in this file is read out of its own source and required to appear in the guard above
  // — a filter added later fails HERE, in a test naming the omission, instead of passing silently in the
  // test that uses it. This is the answer to "sweep for a fourth": the sweep is now a test.
  it('guards every kind this file filters for', () => {
    // `import.meta.filename`, not `new URL(import.meta.url)` — the lint config does not expose `URL` as
    // a global to these scripts, and it landed in the same Node release as the `import.meta.dirname`
    // this file already relies on.
    const source = readFileSync(import.meta.filename, 'utf8');
    const filtered = [...source.matchAll(/\bof\('([a-z-]+)'\)/g)].map((m) => m[1]);
    const guarded = [...source.matchAll(/expect\(of\('([a-z-]+)'\)\.length\)\.toBeGreaterThan\(0\)/g)].map(
      (m) => m[1],
    );
    expect(filtered.length, 'the scan found no filters — this assertion would be vacuous').toBeGreaterThan(0);
    // `command-family` is deliberately excluded: it is filtered only by the guard that asserts it is
    // GONE, which is the one case where an empty list is the point rather than a defect.
    const unguarded = [...new Set(filtered)].filter((k) => k !== 'command-family' && !guarded.includes(k));
    expect(unguarded, 'a kind is filtered for and not in the anti-vacuity guard').toEqual([]);
  });

  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('names every persona in the %s edition', (_locale, fence) => {
    const source = fence().source;
    const absent = of('persona')
      .map((c) => c.id)
      .filter((id) => !source.includes(id));
    expect(absent, 'a persona is in the manifest and not in the drawing').toEqual([]);
  });

  // THE OTHER DIRECTION, and the one that was missing until a RETIRED persona was left published.
  //
  // The assertion above is a subset test: manifest ⊆ drawing. It is silent about a name in the drawing
  // that the manifest no longer has — which is exactly what a merge or a retirement in the plugin
  // produces, and exactly what happened when `marketing-lead` was folded into `product-lead`. The
  // manifest lost the row, the drift check stayed green (it compares the manifest to the plugin, never
  // the page to the manifest), and `/architecture` went on naming a component that does not exist.
  //
  // Asserted on the PS node's own label rather than on the whole fence, deliberately: the fence's prose
  // legitimately names `quality-assurance` and `security` in the accDescr, so a whole-fence scan could
  // only ever be a blocklist of dead names — a list somebody has to remember to append to, which is the
  // same failure one level up. The label is the enumeration the reader sees, so it is what must match.
  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('names NO persona the manifest has retired, in the %s edition', (_locale, fence) => {
    const label = /PS\["([^"]*)"\]/.exec(fence().source)?.[1] ?? '';
    expect(label, 'the persona node must exist and be labelled').toContain('agents/');
    // The first segment is the `N personas · agents/` header; the rest are the names.
    const drawn = label.split('<br/>').slice(1);
    expect(drawn.sort()).toEqual(of('persona').map((c) => c.id).sort());
  });

  // The `.sh` is stripped, deliberately: the drawing names the HOOK, and the manifest's id is its file.
  // Said out loud because it is a weakening — a hook renamed from `wip-guard.sh` to `wip-guard.bash`
  // would pass here. That rename is caught one link back, by the live drift check against the plugin.
  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('names every registered hook in the %s edition', (_locale, fence) => {
    const source = fence().source;
    const absent = of('hook')
      .map((c) => c.id.replace(/\.sh$/, ''))
      .filter((name) => !source.includes(name));
    expect(absent, 'a hook is registered in hooks.json and not in the drawing').toEqual([]);
  });

  // The library's SIZE and the directory it lives in — the two facts the manifest actually holds about
  // it (#424). This replaces the per-family `<family> <n>` assertion, which the plugin's split retired:
  // there are no `command-family` rows left to compare against, so that test could only ever have gone
  // green on an empty list, and the previous slice made it fail loudly rather than leave it there.
  //
  // WHAT IS DELIBERATELY NOT ASSERTED, because the page must not imply more than the manifest proves:
  // the five family names and their sizes are NOT pinned by anything. `collectSkills` emits one row with
  // a count, on purpose — a row per skill would redden this repo's next PR every time somebody renames a
  // skill over there. So the drawing publishes the count and the directory, the page says in its own
  // limitations section that the size is what is pinned, and this test does not pretend otherwise.
  //
  // The exact-one precondition is the anti-vacuity guard, and it is stronger than `> 0`: two library
  // rows would make `library[0]` an arbitrary pick, and a silent arbitrary pick is how a count assertion
  // stops meaning what it says.
  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('states the size of the skill library, and where it lives, in the %s edition', (_locale, fence) => {
    const library = of('skill-library');
    expect(
      library.length,
      'the manifest must carry exactly one skill-library row for this comparison to mean anything',
    ).toBe(1);
    const source = fence().source;
    const label = nodeLabel(source, 'SK');
    expect(label).toContain(`${library[0].skills} skills`);
    expect(label, 'the drawing must say WHICH directory the library is').toContain(`${library[0].file}/`);
    // `skills` is a loanword the pt edition already uses in its prose, so this token is the same in both
    // editions — which is why the accDescr half needs no per-locale noun and the command total below does.
    expect(accDescrOf(source), 'the accessible text must carry the same count as the node').toContain(
      `${library[0].skills} skills`,
    );
  });

  // The other direction, and the one a content edit alone would leave open: the retired framing must not
  // come back. Five command families is not merely stale, it is a claim about a directory that no longer
  // holds them — and nothing above would fail on a drawing that re-published it beside the new count.
  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('does not re-publish the retired command-family framing in the %s edition', (_locale, fence) => {
    expect(of('command-family'), 'the manifest carries command families again — this guard is now wrong').toEqual([]);
    expect(fence().source).not.toMatch(/command famil|famílias de comando/);
  });

  // The typed commands APPEAR rather than being filtered. A generator walking only the directories drops
  // them silently, and the plugin's own suite asserts the root count for exactly this reason. They were
  // "the commands in no family" until the split; there are no families left in `commands/`, so what makes
  // them their own node now is what they ARE — the two files a person types, and the only two that carry
  // an `argument-hint`.
  it('carries the typed commands in both editions', () => {
    for (const c of of('command')) {
      expect(enFence.source).toContain(c.id);
      expect(ptFence.source).toContain(c.id);
    }
  });

  // The totals, per kind and per hook event. The locale nouns are authored — the NUMBERS are not.
  it('states the totals the manifest holds, in each edition’s own words', () => {
    const pre = of('hook').filter((c) => c.event === 'PreToolUse').length;
    const session = of('hook').filter((c) => c.event === 'SessionStart').length;
    for (const source of [enFence.source, ptFence.source]) {
      expect(source).toContain(`${of('persona').length} personas`);
      expect(source).toContain(`${pre} hooks · PreToolUse`);
      expect(source).toContain(`${session} hooks · SessionStart`);
    }
    // The two library totals, in each edition's own noun. `skills` is a loanword the pt edition already
    // uses in its prose, so it is the same token in both — the COMMAND total is where the nouns diverge,
    // and asserting both keeps this from being an English-only check that the pt drawing rides along on.
    const commands = of('command').length;
    for (const [fence, noun] of [
      [enFence, 'commands'],
      [ptFence, 'comandos'],
    ]) {
      expect(nodeLabel(fence.source, 'CM')).toContain(`${commands} ${noun}`);
      expect(accDescrOf(fence.source)).toContain(`${commands} ${noun}`);
    }
  });

  // THE `enforcement` FIELD, read here for the first time. It has been in the manifest since ADR-0043
  // and NOTHING in this suite looked at it: the old drawing carried the same claim as EDGE STYLING, and
  // styling is not comparable to a JSON field, so the picture's central assertion — hooks deny, personas
  // advise, everything else documents — was authored by hand and checked by nobody. Flip
  // `permission-guard.sh` to `"advises"` in the manifest and every assertion in this file stayed green.
  //
  // The redraw moves that claim onto COLUMN MEMBERSHIP, which is comparable, and this is the pass that
  // compares it. The grid is a cartesian product — 4 kinds × 3 enforcement classes — so each of the
  // twelve cells is a falsifiable statement, and the SEVEN EMPTY ONES are the drawing's real argument.
  const CELLS = {
    denies: { hook: 'HKD', persona: 'PSD', 'skill-library': 'SKD', command: 'CMD' },
    advises: { hook: 'HKA', persona: 'PS', 'skill-library': 'SKA', command: 'CMA' },
    documents: { hook: 'HKR', persona: 'PSO', 'skill-library': 'SK', command: 'CM' },
  };
  // The em dash a cell opens with when it is empty. Read off the label rather than off a class list: a
  // reader sees the words, and `class … empty` could be applied to a populated cell without changing them.
  const drawnEmpty = (label) => label.startsWith('—');

  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('draws a cell empty if and only if the manifest says so, in the %s edition', (_locale, fence) => {
    const source = fence().source;
    const wrong = [];
    for (const [enforcement, byKind] of Object.entries(CELLS)) {
      for (const [kind, id] of Object.entries(byKind)) {
        const populated = harness.some((c) => c.kind === kind && c.enforcement === enforcement);
        if (populated === drawnEmpty(nodeLabel(source, id))) wrong.push(`${kind} × ${enforcement} (${id})`);
      }
    }
    expect(wrong, 'a cell contradicts the manifest it was generated from').toEqual([]);
  });

  // The claim the whole grid exists to make, derived rather than typed: exactly ONE kind can refuse, and
  // it is the hook. Give a persona `"enforcement": "denies"` in the plugin and this reddens — which is
  // the point, because at that moment the page's central sentence stops being true.
  it('derives the claim the grid makes: one kind refuses, and it is the hook', () => {
    const kinds = [...new Set(harness.map((c) => c.kind))];
    const refusing = kinds.filter((k) => harness.some((c) => c.kind === k && c.enforcement === 'denies'));
    expect(refusing, 'the grid claims exactly one kind can refuse').toEqual(['hook']);
  });

  // …and the count of empty cells, which is what both editions publish IN WORDS. Spelled numerals are
  // why this needs a table; the table THROWS on a number it does not carry rather than skipping the
  // assertion, so a plugin change that moves the count fails here by name instead of passing quietly.
  const NUMERALS = {
    5: { en: 'five', pt: 'cinco' },
    7: { en: 'seven', pt: 'sete' },
    12: { en: 'twelve', pt: 'doze' },
  };
  const word = (n, locale) => {
    const entry = NUMERALS[n];
    if (!entry) throw new Error(`no ${locale} word for ${n} — the grid's shape changed; extend NUMERALS`);
    return entry[locale];
  };

  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('publishes how much of the grid is empty, in the %s edition', (_locale, fence) => {
    const cells = Object.entries(CELLS).flatMap(([enforcement, byKind]) =>
      Object.keys(byKind).map((kind) => harness.some((c) => c.kind === kind && c.enforcement === enforcement)),
    );
    const empty = cells.filter((populated) => !populated).length;
    const descr = accDescrOf(fence().source);
    expect(descr).toContain(word(cells.length, _locale));
    expect(descr).toContain(word(cells.length - empty, _locale));
    expect(descr).toContain(word(empty, _locale));
  });

  // The lane column — the per-kind totals, in each edition's own noun. Derived from the manifest, never
  // typed: the whole reason this block exists is that it must redden when the plugin grows a persona or
  // loses a command. `skill-library` is the one row that carries its size in a FIELD rather than in a row
  // count, which is why it is read from `skills` and not from `.length`.
  it.each([
    ['en', () => enFence, 'commands'],
    ['pt', () => ptFence, 'comandos'],
  ])('carries the manifest’s per-kind totals in the %s lane column', (_locale, fence, commandNoun) => {
    const source = fence().source;
    const library = of('skill-library');
    expect(library.length, 'exactly one skill-library row, or the count below is an arbitrary pick').toBe(1);
    expect(nodeLabel(source, 'LH')).toContain(`hooks · ${of('hook').length}`);
    expect(nodeLabel(source, 'LP')).toContain(`personas · ${of('persona').length}`);
    expect(nodeLabel(source, 'LS')).toContain(`skills · ${library[0].skills}`);
    expect(nodeLabel(source, 'LC')).toContain(`${commandNoun} · ${of('command').length}`);
  });

  // The documents cell splits the hooks by EVENT, and both halves are derived. The leading total is the
  // count of hooks with no tool call in front of them — which is "every hook that is not PreToolUse",
  // stated that way so registering a hook on a fourth event moves the number here rather than leaving
  // the cell quietly under-counting.
  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('states the per-event hook counts in the %s edition', (_locale, fence) => {
    const subagent = of('hook').filter((c) => c.event.startsWith('Subagent')).length;
    const noCallToRefuse = of('hook').filter((c) => c.event !== 'PreToolUse').length;
    const label = nodeLabel(fence().source, 'HKR');
    expect(label.startsWith(`${noCallToRefuse} hooks · `), 'the cell must open with its own total').toBe(
      true,
    );
    expect(label).toContain(`${subagent} hooks · Subagent`);
  });
});

describe('the components diagram distinguishes a mechanism from a convention', () => {
  const svgs = generated('diagrams.json');
  const enFence = byTitle(en, 'What the harness is made of');
  const ptFence = byTitle(pt, 'Do que o harness é feito');

  // ADR-0043's non-negotiable: hooks deny, personas advise, and drawing them alike would assert a
  // mechanism that does not exist. Asserted on the COMPILED SVG rather than only on the fence, because
  // the fence is the intention and the SVG is what a reader gets — a classDef that mermaid silently
  // ignored would leave the source looking correct and the picture making the false claim.
  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('renders the deny node and the advise node differently in the %s edition', (_locale, fence) => {
    const svg = svgs[normalise(fence().source)];
    expect(svg, 'the fence must be compiled — run `npm run gen-diagrams`').toBeTruthy();
    const boxes = [...svg.matchAll(/class="basic label-container"[^>]*style="([^"]*)"/g)].map((m) => m[1]);
    const accented = boxes.filter((s) => /#FF5A00/i.test(s));
    const dashed = boxes.filter((s) => /stroke-dasharray/.test(s));
    expect(accented.length, 'no node is drawn as a mechanism').toBe(1);
    expect(dashed.length, 'no node is drawn as a convention').toBe(1);
    // Different treatments, not the same one twice — which is what would happen if both classes were
    // pointed at the same classDef, and it is the regression that reinstates the false equivalence.
    expect(accented[0]).not.toBe(dashed[0]);
  });

  // THE EDGE-STYLING TEST WAS HERE, and it went with the edges it was written about. It asserted exactly
  // one accent-coloured link and exactly one dashed link in the compiled SVG — the old drawing carried
  // ADR-0043's non-negotiable (hooks deny, personas advise, never drawn alike) as ARROW styling, and the
  // grid that replaced it has no directed edges at all, so the block would have failed against a picture
  // nobody had decided to keep.
  //
  // The requirement did not go anywhere; its CARRIER moved. It is now column membership, checked against
  // the manifest's `enforcement` field in the block above — which is strictly stronger, because a styled
  // arrow was authored by hand and a column is compared to JSON. The node-styling test above still holds
  // the visual half. ADR-0043 owes an amendment recording that move; that is `tech-lead`'s to write.

  // The other half of the same requirement, and the half a drawing cannot carry: a reader using a screen
  // reader gets the accDescr and nothing else. An accDescr that flattens deny into advise re-publishes
  // the false claim to exactly the reader who cannot see the arrow style — so each edition's description
  // has to make the distinction IN WORDS, in its own language.
  it.each([
    ['en', () => enFence, ['REFUSE', 'ADVISE', 'DOCUMENT', 'fails silently']],
    ['pt', () => ptFence, ['RECUSAM', 'ACONSELHAM', 'DOCUMENTAM', 'falha em silêncio']],
  ])('says deny, advise and document in the %s accessible description', (_locale, fence, words) => {
    const descr = /^\s*accDescr:\s*(.+)$/m.exec(fence().source)?.[1] ?? '';
    expect(descr.length, 'the accessible description must exist and say something').toBeGreaterThan(200);
    for (const word of words) expect(descr).toContain(word);
  });

  // The claim ADR-0043 forbids outright, checked as an ABSENCE rather than trusted: the two gatekeeper
  // personas hold their merge authority by convention, so nothing on this page may draw them denying.
  it('never puts a gatekeeper persona on the deny side', () => {
    for (const fence of [enFence, ptFence]) {
      const denyNode = /HKD\["([^"]*)"\]/.exec(fence.source)?.[1] ?? '';
      expect(denyNode).not.toContain('quality-assurance');
      expect(denyNode).not.toContain('security');
      expect(fence.source).toContain('class PS convention');
    }
  });
});
