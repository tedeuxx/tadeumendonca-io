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

/** Is any node reachable from itself? A left-to-right flow that loops back reads as a cycle, and the
 *  request diagram is now asserted to have none — see the convergence block below. */
function hasCycle(graph) {
  const adj = new Map();
  for (const e of graph.edges) {
    const [a, b] = e.split('->');
    adj.set(a, [...(adj.get(a) ?? []), b]);
  }
  return graph.nodes.some((start) => {
    const queue = [...(adj.get(start) ?? [])];
    const seen = new Set(queue);
    while (queue.length) {
      const cur = queue.shift();
      if (cur === start) return true;
      for (const next of adj.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return false;
  });
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

/** ```venn fences — the one figure kind mermaid cannot draw, so it never reaches `mermaidFences`. Counted
 *  here because the page publishes a TOTAL that includes it. */
const vennFences = (markdown) => [...markdown.matchAll(/^```venn[ \t]*$/gm)].length;

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

// THE PUBLISHED COUNT OF THE FIGURES, against the file's own contents.
//
// The limitations section says "Sete desenhos acima" / "Seven drawings above" and then splits it — four
// you can check, three you cannot. Those are hand-typed numbers ABOUT THIS FILE, and they went stale once
// already: the page said "four" while carrying six, and a person caught it rather than a gate. The page's
// own rule is the argument for closing it — it excuses the reader-facing feature list from carrying a
// total on the grounds that nothing can check one, and here something can, because this suite is already
// parsing every fence in both editions.
//
// THE NOUN MOVED IN #415, from `figuras`/`figures` to `desenhos`/`drawings`, and the reason is what this
// block counts: `mermaidFences + vennFences` is the number of DRAWN figures, and four photographs landed
// on the page above this sentence. "Seven figures" was true against the fence scan and false to any
// reader counting what they see — a total that is only correct if you already know which things it was
// silently excluding. Each edition now reuses the noun its own sentence already opens with ("Os desenhos
// mostram o formato" / "The drawings show the shape of a thing"), so no new term was coined and this
// suite still asserts the number rather than the word.
describe('the published figure count matches the figures', () => {
  // Written out because the prose spells them, and the mapping is what makes the assertion a real one:
  // a number that only ever appears as a word cannot be compared to an integer without it.
  // The trailing `; **` is load-bearing, not decoration. `/(\S+) figuras acima/` alone matched the
  // dev-loop section's "As **duas** figuras acima" three hundred lines earlier and read the total as
  // two — a regex finding a real sentence that is not the one being asserted about, which is the failure
  // mode a looser pattern hides best. It is STILL load-bearing after the #415 noun change and for the
  // same reason, one collision further up: "Os dois desenhos acima mostram tempo" / "The two drawings
  // above show time" sits three hundred lines earlier and would read the total as two.
  const WORDS = {
    en: {
      total: /(\S+) drawings above; \*\*/,
      split: /\*\*(\S+)\*\* of them you can check/,
      rest: /The other (\S+) you cannot check/,
    },
    pt: {
      total: /(\S+) desenhos acima; \*\*/,
      split: /\*\*(\S+)\*\* você consegue conferir/,
      rest: /As outras (\S+) você não consegue conferir/,
    },
  };
  const NUMERALS = {
    en: { three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, Seven: 7, Six: 6, Eight: 8 },
    pt: { três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, Sete: 7, Seis: 6, Oito: 8 },
  };

  it.each([
    ['en', 'architecture.en.md'],
    ['pt', 'architecture.pt.md'],
  ])('states the real number of figures in the %s edition, and splits it consistently', (locale, file) => {
    const body = read(file);
    const drawn = mermaidFences(body).length + vennFences(body);
    expect(drawn, 'the fence scan found nothing — the assertions below would be vacuous').toBeGreaterThan(0);

    const words = WORDS[locale];
    const numerals = NUMERALS[locale];
    const read1 = (re, what) => {
      const m = re.exec(body);
      if (!m) throw new Error(`the ${what} count sentence is gone from the ${locale} edition`);
      const n = numerals[m[1]];
      if (n === undefined) throw new Error(`unknown number word "${m[1]}" in the ${locale} edition`);
      return n;
    };

    expect(read1(words.total, 'total'), 'the published total does not match the figures on the page').toBe(
      drawn,
    );
    // And the split has to add up. A total that is right while its two halves are not is the shape a
    // one-number check would let through, and this slice moved BOTH halves.
    expect(read1(words.split, 'checkable') + read1(words.rest, 'uncheckable')).toBe(drawn);
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

  // THE DIAGRAM WAS REDRAWN, not rewired again. The owner's verdict on it was blunt — it is hard to read
  // — and the previous round answered that by removing the backward edges while keeping six nodes and a
  // decision diamond. This version is four nodes and four edges: ask, rewrite, and one fork whose two
  // branches end in the same place. The separate `viewer-request` node and the `Cached at the edge?`
  // diamond are gone, both folded into labels, because neither was a STEP — one was where the function
  // runs and the other was a question about the node before it.
  //
  // So the fork now hangs off F rather than off a diamond, and the assertions move with it. Pinned as
  // EDGES rather than as reachability, for the reason the previous version recorded: `reaches(F, P)` is
  // satisfied through the miss branch, so it would stay green with the hit arrow pointing anywhere.
  it('converges on the served page, from the cached branch and through the origin', () => {
    expect(graph.edges, 'a cache hit must end at the served page').toContain('F->P');
    expect(graph.edges, 'a miss must go to the origin').toContain('F->S');
    expect(reaches(graph, 'S', 'P'), 'the origin must reach the same served page').toBe(true);
    // And it really is four steps. A count is a weak assertion on its own; it earns its place here
    // because "hard to read" was the defect, and the fix WAS the reduction — a later edit that grows the
    // graph back has to argue with this line rather than slip past it.
    expect(graph.nodes.sort()).toEqual(['F', 'P', 'R', 'S']);
  });

  // The other half, and the one that fails on a restored backward edge: nothing points at an earlier
  // step. Mutation-checked by putting `S --> C` back — `hasCycle` goes true and this fails.
  //
  // The second expectation is NOT redundant, though it is subsumed today: every node here is reachable
  // from R, so any edge into R is already a cycle. It earns its place only for an edge into R from a node
  // the reader cannot reach — which no mutation of the current five edges can produce, and which is the
  // shape a later addition could. Said out loud rather than left to look stronger than it is.
  it('flows one way — nothing returns to the reader or to an earlier step', () => {
    expect(hasCycle(graph), 'an edge points backwards in a left-to-right flow').toBe(false);
    expect(graph.edges.filter((e) => e.endsWith('->R'))).toEqual([]);
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
  //
  // THE THREE RETURN EDGES NOW MEET IN ONE NODE, and that is the redraw rather than a re-styling. The
  // owner's verdict was that the picture is hard to read; three separate arrows climbing back to the
  // build node across the whole height of the graph is what made it so, and turning `LR` into `TD` moved
  // them without removing them. `V` is a join, not an invented step — it is labelled with the STATE the
  // work is in, and it is the only edge that re-enters the build.
  //
  // So the property is asserted as REACHABILITY, which is what "work comes back" always meant, plus the
  // single re-entry as an edge. Written this way on purpose: `reaches` alone would stay green if the
  // three were split apart again, and the single channel is the claim being made.
  it('lets work come back — from the gates, from the reviewer, and from the human', () => {
    expect(reaches(graph, 'G', 'B'), 'a red gate must return the work').toBe(true);
    expect(reaches(graph, 'R', 'B'), 'a reviewer must be able to send it back').toBe(true);
    expect(reaches(graph, 'H', 'B'), 'a no-go must return the work').toBe(true);
    expect(graph.edges, 'one return channel, not three').toContain('V->B');
    expect(graph.edges.filter((e) => e.endsWith('->B')), 'nothing else re-enters the build').toEqual([
      'P->B',
      'V->B',
    ]);
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
// here and checked by nothing. The page carries that limit in its honest-limitations section — the check
// covers only the parts that are NAMES, never what those parts do — rather than beside the diagram,
// where the sentence naming the glosses themselves was cut as redundant with it.
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
  const accDescrOf = (source) => {
    const m = /^\s*accDescr:(.*)$/m.exec(source);
    if (!m) throw new Error('the fence carries no accDescr');
    return m[1];
  };

  // The knowledge library is a `skill-library` row now, not five `command-family` rows: the plugin moved
  // `commands/<family>/<name>.md` to `skills/<family>/<name>/SKILL.md`. This guard follows the manifest,
  // because its job is to prove the assertions below have something to bite on — pointing it at a kind
  // the manifest no longer carries would make it fail for the wrong reason and teach the next reader to
  // delete it.
  it('is asserting against a real manifest, not an empty one', () => {
    expect(of('persona').length).toBeGreaterThan(0);
    expect(of('hook').length).toBeGreaterThan(0);
    expect(of('skill-library').length).toBeGreaterThan(0);
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
