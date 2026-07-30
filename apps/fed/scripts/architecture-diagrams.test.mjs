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
import { mermaidFences } from './diagram-source.mjs';

const contentDir = resolve(import.meta.dirname, '..', 'src', 'content');
const read = (f) => readFileSync(join(contentDir, f), 'utf8');

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
  const graph = graphOf(en[0].source);

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
    expect(en[0].source).toMatch(/index\.html/);
    expect(pt[0].source).toMatch(/index\.html/);
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
  const graph = graphOf(en[1].source);

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
