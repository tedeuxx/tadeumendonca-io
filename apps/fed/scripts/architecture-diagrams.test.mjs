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
      edges.push([m[1], m[2]]);
    }
  }
  const nodes = [...new Set(edges.flat())].sort();
  return { nodes, edges: edges.map((e) => e.join('->')).sort() };
}

/** Is `to` reachable from `from` by following directed edges? */
function reaches(graph, from, to) {
  const adj = new Map();
  for (const e of graph.edges) {
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
  // parity test would pass having compared nothing. Asserted once, on the real content.
  it('parses a non-trivial graph at all', () => {
    const g = graphOf(en[0].source);
    expect(g.nodes.length).toBeGreaterThan(3);
    expect(g.edges.length).toBeGreaterThan(3);
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

describe('the infrastructure diagram earns its place', () => {
  const graph = graphOf(byTitle(en, 'How a request becomes a page').source);

  // THE OWNER'S CONSTRAINT, made falsifiable. A labelled box list has nodes and no path; this fails on
  // it. Node ids are asserted by ROLE rather than by label so a rewording does not break the test — R is
  // the reader, F the rewrite function, S the origin.
  it('shows a request path from the reader through the rewrite to the origin', () => {
    expect(graph.nodes).toEqual(expect.arrayContaining(['R', 'F', 'S']));
    expect(reaches(graph, 'R', 'F'), 'the reader must reach the rewrite function').toBe(true);
    expect(reaches(graph, 'F', 'S'), 'the rewrite must sit BEFORE the origin, not beside it').toBe(true);
  });

  it('shows the answer coming back, not a one-way pipe', () => {
    expect(reaches(graph, 'S', 'R')).toBe(true);
  });

  // The rewrite is the only logic in the path and the thing a sentence cannot place. If the diagram
  // stops naming it, it has become the box list the owner asked us to cut.
  it('names the rewrite as the step that changes the uri', () => {
    expect(byTitle(en, 'How a request becomes a page').source).toMatch(/index\.html/);
    expect(byTitle(pt, 'Como uma requisição vira uma página').source).toMatch(/index\.html/);
  });
});

// The owner's constraint on the SECOND diagram, and it is a harder one to make mechanical: "it has to
// show the human's position, not just the steps — where the agent proves 'done' and where the owner's
// go/no-go actually sits. A flow that shows only boxes is the corporate flowchart the page's voice is
// arguing against."
//
// The falsifiable form of that is not "a human node exists" — a flowchart with a human box at every
// stage satisfies that and means the opposite. It is that there is EXACTLY ONE, and that it sits on the
// edge into production. That is the claim "human-residual" makes, and it is the one a diagram can lie
// about most easily.
// WHAT THIS FILE CAN AND CANNOT GUARANTEE, said plainly because the first version of it overstated
// both. Node ids are an authoring convention: the test knows a node is CALLED `H`, never that it is a
// human. So this pins the shape the author declared — a real drift guard across edits and between the
// two editions — and it is not "the diagram cannot lie about where the human is". The `H`-prefix rule
// below is what makes the convention enforceable rather than decorative.
const humanNodes = (graph) => graph.nodes.filter((n) => /^H/.test(n));

describe('the dev-loop diagram shows where the human stands', () => {
  const graph = graphOf(byTitle(en, 'Where the human sits in the loop').source);

  // Counted over the PREFIX, not over `nodes` filtered to a single id. The first version asserted
  // `nodes.filter(n => n === 'H').length === 1` against a list built from a Set — which cannot contain
  // 'H' twice, so it could never fail, while its comment claimed it caught an approval ladder. It did
  // not: adding `P --> H2` left every assertion green. This version fails on that mutation.
  it('has exactly one human decision point in the merge path', () => {
    expect(humanNodes(graph)).toEqual(['H']);
  });

  it('puts the human on the edge into production', () => {
    expect(graph.edges).toContain('H->M');
    // Not on the gates: verification is mechanical, and a human standing on it would make the gates
    // an opinion rather than a proof.
    expect(graph.edges).not.toContain('G->H');
  });

  // The other half of "human-residual", and the half the previous version only claimed to test: most
  // work does NOT pass the human. `reaches(I, M)` on the full graph is vacuous — it is satisfied by a
  // path THROUGH H. Removing H first is what turns it into the property the name promises.
  it('shows a path to production that does not pass the human', () => {
    const withoutHuman = {
      nodes: graph.nodes.filter((n) => !/^H/.test(n)),
      edges: graph.edges.filter((e) => !/(^|>)H/.test(e)),
    };
    expect(reaches(withoutHuman, 'I', 'M'), 'every route to production passes a human').toBe(true);
  });

  // A go/NO-go that only has an outgoing edge to merge is a gate that always opens. Same for a reviewer
  // drawn as a pure fork: this very review is the counterexample, and a diagram that cannot show work
  // coming back describes a loop that never rejects anything.
  it('lets work come back — from the gates, from the reviewer, and from the human', () => {
    expect(graph.edges).toContain('G->B');
    expect(graph.edges).toContain('R->B');
    expect(graph.edges).toContain('H->B');
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
// it pins IDENTITY — names, events, matchers, counts, the orphan — into both editions. It says nothing
// about whether the short glosses on the edges describe those components correctly. Those are authored
// here and checked by nothing, and the page says so in both editions.
describe('the components diagram carries the inventory it was generated from', () => {
  const harness = generated('harness.json');
  const of = (kind) => harness.filter((c) => c.kind === kind);
  const enFence = byTitle(en, 'What the harness is made of');
  const ptFence = byTitle(pt, 'Do que o harness é feito');

  it('is asserting against a real manifest, not an empty one', () => {
    expect(of('persona').length).toBeGreaterThan(0);
    expect(of('hook').length).toBeGreaterThan(0);
    expect(of('command-family').length).toBeGreaterThan(0);
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

  // The counts, pinned as `<family> <n>` pairs. This is the assertion that fails when a command is added
  // to the plugin: the manifest moves, this does not match, and the page cannot ship the old number.
  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('states each command family with its current size in the %s edition', (_locale, fence) => {
    const source = fence().source;
    const wrong = of('command-family')
      .filter((c) => !source.includes(`${c.id} ${c.commands}`))
      .map((c) => `${c.id} should read ${c.commands}`);
    expect(wrong).toEqual([]);
  });

  // The orphan APPEARS rather than being filtered. A generator walking only the directories drops it
  // silently, and the plugin's own suite asserts `root_cmds -eq 1` for exactly this reason.
  it('carries the un-namespaced command in both editions', () => {
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
    expect(enFence.source).toContain(`${of('command-family').length} command families`);
    expect(ptFence.source).toContain(`${of('command-family').length} famílias de comando`);
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

  it.each([
    ['en', () => enFence],
    ['pt', () => ptFence],
  ])('draws the deny edge and the advise edge differently in the %s edition', (_locale, fence) => {
    const svg = svgs[normalise(fence().source)];
    const edges = [...svg.matchAll(/class="[^"]*flowchart-link"[^>]*style="([^"]*)"/g)].map((m) => m[1]);
    expect(edges.filter((s) => /#FF5A00/i.test(s)).length, 'no edge denies').toBe(1);
    expect(edges.filter((s) => /stroke-dasharray/.test(s)).length, 'no edge advises').toBe(1);
    // The plain ones must still exist, or "different" was achieved by styling everything.
    expect(edges.filter((s) => !/#FF5A00|stroke-dasharray/i.test(s)).length).toBeGreaterThan(1);
  });

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
