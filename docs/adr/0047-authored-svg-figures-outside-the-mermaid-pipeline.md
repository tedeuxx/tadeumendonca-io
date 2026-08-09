# 0047. A figure mermaid cannot draw is authored as a typed fence over fixed geometry — its arrangement asserted arithmetically, not pinned by a build artifact

- **Status:** accepted (safe class — bundle and reader-facing content, no `iac/`, no new public URL and no
  new irreversible surface; ratified by the reviewer on merge, per
  [ADR-0003](./0003-trunk-based-single-environment.md)'s 2026-07-30 amendment). **The owner has not ruled
  on the second-path question and it is his to reverse** — see the "one-off or a convention" clause in
  **Decision outcome**, which is written to be the cheap thing to overturn.
- **Date:** 2026-08-08
- **Deciders:** `tech-lead`, on the gate's finding that the fence departed from ADR-0040 with no record
- **Supersedes / superseded by:** —
- **Driven by:** PR [#411](https://github.com/tedeuxx/tadeumendonca-io/pull/411) · **narrows the scope
  claim of** [ADR-0040](./0040-build-time-mermaid-diagrams.md) (amended there, pointing here) ·
  constrained by [ADR-0002](./0002-fully-static-spa-no-backend.md) and
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (nothing fetched, resolved before it is served)
  · touches [ADR-0035](./0035-static-repo-cards-in-longform.md)'s copy-as-markdown payload · conforms to
  [ADR-0008](./0008-brutalist-mono-identity.md) · per locale, per
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)

## Context & problem
[ADR-0040](./0040-build-time-mermaid-diagrams.md) decided what a diagram's source of truth is on this
site: a ` ```mermaid ` fence in the markdown body, compiled at build time by `gen-diagrams.mjs` into a
committed `diagrams.json`, looked up by its own normalised source text. Every figure on `/architecture`
has gone through that path since #170.

`/architecture` then acquired a figure of a kind that path cannot produce. The three-pillar drawing —
three overlapping circles, topic items inside each lobe, and the discipline's name in the shared
intersection — makes a claim no flowchart makes: **each pillar exists without the other two, and the
subject is what exists only where all three meet.** Drawn as boxes and arrows it becomes the labelled box
list ADR-0040's own driving Issue rejected in advance.

**mermaid draws no Venn.** Not flowchart, not block, not `architecture-beta`, and there is no plugin path
`gen-diagrams.mjs` could load through the build-time compile. The repo had no existing inline-SVG figure
path either — checked before the fence was written, and there is none. So the real choice was between
**opening a second rendering path** and **not drawing the figure**.

That makes the question a scope question rather than a taste one: **ADR-0040 states its rule as
universal** — *"a ` ```mermaid ` fence in a long-form markdown body is a diagram's source"* — and a figure
outside it is either a defect against that record or a boundary that record never had to consider. This
record decides which, and it exists because the difference is invisible from inside the diff: the gate
that blocked #411 could see the departure but not whether it was real.

**The purpose to test against, not the letter.** ADR-0040's actual objective is stated in its drivers:
*a stale diagram must fail loudly, at build time*, and *a hand-drawn diagram is a liability, not an
asset*, because its source of truth sits outside the repo where no check can observe the drift. Whether
this fence departs is therefore not "is there a `diagrams.json` entry" but **"can this picture go wrong
without something turning red"**.

## Decision drivers
- **Nothing may be fetched at runtime, and the reader with JS off must get the figure** (ADR-0002,
  ADR-0004, ADR-0005). This is non-negotiable and it is the first thing a second path could break.
- **Labels must be real text** — crawlable, selectable, translatable, screen-readable. ADR-0040's
  strongest argument against a checked-in asset was that an `<img>` makes every label a picture of a word.
  A second path that ships a raster reproduces exactly the liability that record rejected.
- **A wrong picture must fail before it is served.** On a static site the prerender bakes whatever
  happened into the served bytes and a scraper can pin it — ADR-0040 records two productions defects of
  precisely that shape (#235, #213).
- **A second authoring mechanism is a real cost even when each half is sound**, because the next author
  has to know which one applies. The bar for adding one is that it does a job the first cannot, not that
  it is more convenient.
- **Two editions, always** (ADR-0032) — a figure correct in one locale and overflowing in the other is
  not a correct figure.
- **The body travels** — `shareMarkdown.ts` copies this page verbatim into the reader's clipboard (#387,
  ADR-0035), so what a fence looks like *as text* is a reader-facing property, not an implementation
  detail.
- **Lean by design** (ADR-0001): ADR-0040 bought "zero additional bytes of JavaScript" for its diagrams,
  and any second path spends some of that.

## Considered options

### Whether to draw the figure at all
1. **Draw it through a second path** (chosen).
2. **Do not draw it — say it in prose and keep one mechanism.** *Why not, and this was the option worth
   the most scrutiny, because "one mechanism" is the thing this record spends:* the section's whole
   argument is a **shape** — three independent things with one non-empty intersection — and it is the one
   claim on the page that prose states worst, because a sentence has to name the three in an order and
   the order implies a hierarchy the drawing exists to deny. This is the same reasoning ADR-0040 accepted
   for the request path ("prose describes a path badly"), applied to the case where the shape is the
   content.
3. **Approximate it in mermaid** — three nodes converging on a fourth. *Why not:* it is the labelled box
   list, and it asserts the opposite of the figure's claim. Convergent arrows read as a pipeline with a
   terminus; the intersection is not a fourth thing the three produce, it is the region where they
   overlap. A mermaid approximation would have satisfied every mechanical gate on the page while being
   **wrong about the only thing it was drawn to say** — which is worse than the second path, not better.
4. **A hand-drawn SVG or an exported PNG checked in as an asset** — *why not:* ADR-0040 already rejected
   this and its reasoning is unchanged here. The source of truth would move to a tool outside the repo,
   the labels would stop being text, and the words in the circles would become invisible to the crawler,
   the screen reader, selection and translation. **This is the option the chosen path must not collapse
   into**, and the clause below about where the *words* live is what keeps it from doing so.

### Where such a figure's source lives
1. **A ` ```venn ` fence in the same markdown body, in a strict line-oriented grammar, parsed at render
   time** (chosen) — `accTitle`, `accDescr`, `centre`, and three `pillar:` blocks with their items
   (`apps/fed/src/lib/vennSpec.ts`). The **words** stay in the content file next to the prose, authored
   per locale, diffed and translated like everything around them; only the **geometry** lives in code.
   *Trade-off:* it is a second fence kind, so the markdown body now has three info strings with
   behaviour (`mermaid`, `adr-index`, `venn`) and the page's authoring surface is no longer one thing to
   learn.
2. **A TypeScript data structure in `src/data/`, with no fence at all** — *why not:* it would take the
   figure's words out of the file the translator edits and out of the copy-as-markdown payload entirely.
   The fence's whole value is that the *content* half stayed exactly where ADR-0040 put it.
3. **A `mermaid` fence with a custom info-string flag, reusing the existing pipeline shell** — *why not:*
   it buys the appearance of one mechanism and none of the substance. `gen-diagrams.mjs` would have to
   branch on a diagram it cannot compile, and `diagrams.json` would carry an entry for something no
   renderer produced. One name over two mechanisms is worse than two names, because the reader cannot see
   the seam.

### What pins the rendered arrangement, given there is no build artifact
1. **Fixed geometry in the component, asserted arithmetically against the authored words of both
   editions** (chosen). `VennDiagram.test.tsx` computes, for every authored line in both locales, whether
   it sits inside its own circle and outside the other two, at a deliberately pessimistic glyph width —
   and separately that the triple intersection exists (the centroid within `R` of all three centres). It
   carries a **mutation guard on itself**: `'would fail if the circles were pulled apart'` shoulders the
   centres apart and requires the check to go red, which is the discipline ADR-0040's amendment #5 was
   written to install after an assertion that could never fail shipped as a gate.
   *Trade-off, and it is the honest weakening:* see the residual clause below.
2. **Generate and commit an SVG for it too, so it has an artifact like the others** — *why not:* the
   artifact would have to be produced by rendering the component, which means a browser, which means the
   generator now compiles two unrelated languages; and the guarantee it would add is smaller than it
   looks. ADR-0040 states plainly that `diagrams.json` guarantees *"the source exists and is unchanged"*,
   **not** *"this SVG was generated from it"* — a hand-edited entry passes every gate. A committed SVG
   here would buy the same weak property at a materially higher cost.
3. **A visual-regression snapshot of the rendered figure** — *why not, on this repo specifically:*
   ADR-0040 already priced re-rendering in CI and rejected it, because the render is font-environment
   dependent and a red that means "the CI image's font stack differs" trains everyone to ignore the check
   that also means "the diagram is wrong". A pixel snapshot is that failure mode with a larger surface.

### How a figure that cannot shrink meets a phone
1. **A `min-width` floor of 680px, so the figure scrolls inside its own box** (chosen) — legible and
   panned, rather than complete and microscopic. An SVG at `width="100%"` with no floor scales without
   limit; at a 390px viewport this figure's 15px item type lands near 5px — present, "visible" to every
   assertion, and unreadable. The box's overflow contract already existed in `Diagram.tsx`; mermaid's
   figures have simply never exercised it. **The page body still never scrolls sideways**, which the
   320px sweep in `e2e/diagram-centred.spec.ts` asserts across all four widths.
   *Trade-off:* the reader must pan, which no other figure on this page asks of them.
2. **Let it shrink to fit** — *why not:* the failure is silent and total. Every check on the page passes
   on a figure whose words are 5px tall, because presence is what they test.
3. **A separate narrow layout for phones** — *why not:* a second arrangement of the same figure is a
   second thing to keep true, and the arithmetic check above pins exactly one geometry. Two geometries
   halve the value of the one guard this path has.

## Decision outcome
Chosen: **a figure mermaid cannot draw may be authored as a typed fence over a fixed geometry and painted
as inline SVG by a component — provided its words live in the markdown body, its arrangement is asserted
arithmetically against those words in both editions, and it ships in the prerendered bytes.** The three
conditions are the decision; the Venn is its first instance.

`Markdown.tsx`'s `pre` handler gains a second branch (`vennBlock`), `rehype-highlight` registers `venn`
as plain text alongside `mermaid` — for the reason ADR-0040 records, that highlighting rewrites the
source into `<span>`s the handler would then read back — and `VennFence` parses and paints.

**The mermaid pipeline is untouched and remains the default.** ADR-0040 governs every figure it can draw,
which is every figure on this page but one. Nothing here relaxes its guards, and a figure that mermaid
*can* draw and is authored this way instead is a defect against that record, not an exercise of this one.

**Is this a one-off or a convention? It is deliberately recorded as a bounded convention, and the bound
is the test above.** The next author who wants a figure mermaid cannot draw does **not** get to invent a
third path: they either extend this one (a new fence kind under the same three conditions, sharing
`DiagramFigure`) or they establish that the figure is not worth a second mechanism. What this record
refuses to do is pretend the question will not recur — `/architecture` is a page whose subject keeps
acquiring shapes, and "we'll decide when it happens" is how a page ends up with four rendering paths and
no rule. **The cheap thing to overturn is this clause**: deciding the Venn is a one-off costs one
sentence here plus a note on the fence, and changes no code.

**The shell is shared rather than copied**, and that is the part that makes two paths survivable.
`DiagramFigure.tsx` was extracted from `Diagram.tsx` and now owns the `<figure>`, the `.diagram-canvas`
box, the overflow contract, the centring rule and the caption-from-the-source rule for **both** kinds. The
`.diagram-canvas` class is load-bearing in four places outside the component — the CSS centring rule,
`e2e/diagram-centred.spec.ts`, and the background-equality check in `e2e/routes.spec.ts` — so two boxes
carrying it independently would be two things to keep in step, and the one that drifts is the one nobody
looks at.

**The accessibility contract is identical to mermaid's by construction, not by resemblance.** `accTitle`
is required and the parser throws without it; it becomes both the visible `<figcaption>` and the SVG
`<title>`. `accDescr` is required and becomes `<desc>` — the whole figure in words for a reader who
cannot see it — and the test requires it to exceed 400 characters in both editions, because a stub
satisfies presence. `role="graphics-document"` with `aria-labelledby`/`aria-describedby` is asserted to
**resolve by id lookup** rather than by string equality, since two attributes agreeing with each other and
pointing at nothing is the shape a naive check passes.

**It fails loudly rather than degrading.** `parseVennSpec` throws on every authoring mistake — a missing
caption, a missing description, a missing intersection label, the wrong number of pillars, an empty lobe,
a fifth item in a lobe that holds four. That is ADR-0040's "what happens when a diagram is wrong" clause
applied unchanged: the throw fails the build, the prerender, the unit tests and the E2E together.

**The page's published figure count is now checked against the file.** `architecture-diagrams.test.mjs`
counts ` ```venn ` fences alongside the mermaid ones and compares the total — and its two halves — to the
numbers the prose spells out in both editions. That number had already gone stale once and a person, not
a gate, caught it.

## Consequences

**Good**
- The figure is **in the prerendered bytes as real text** — asserted in `e2e/routes.spec.ts` by fetching
  `/pt/architecture/` over HTTP rather than through the app, which is the trap ADR-0040 recorded: a
  `page.goto` assertion passes whether or not anything was ever prerendered. Crawlable, selectable,
  translatable, screen-readable; no `<foreignObject>`.
- **The words stayed in the content file, per locale.** Structural parity between editions is asserted —
  same item counts, same centre — and so is the inverse: the title and description must **differ** between
  editions, which catches a locale copied across wholesale.
- **The arrangement has a mechanical guard where the mermaid figures have an artifact**, and it caught
  five real overflows during authoring. It is guarded against its own false green by a mutation that must
  turn it red.
- **Background-equality is asserted on this figure too** — the defect that shipped invisible arrows to
  production for the whole of ADR-0040's slice one cannot recur silently on the new path. The canvas is
  additionally asserted non-transparent, because the first version of that very check read the background
  from an element that has none and passed on the exact defect it was written for.
- **One box, one caption rule, one overflow contract for both kinds**, so the two cannot drift on the
  properties a reader actually experiences.

**Bad / accepted costs**
- **THE GUARANTEE IS GENUINELY WEAKER THAN ADR-0040'S ON ONE AXIS, AND IT IS THE AXIS ADR-0040 CALLED OUT
  BY NAME.** The overflow check uses an **estimated** glyph width (`text.length × size × 0.62`,
  `VennDiagram.test.tsx:244`), not a measured one. ADR-0040 records that mermaid sizes every box from the
  browser's **measured** text width and that rendering against a fallback font makes every label overflow
  *silently, and only on a machine other than the author's* — which is why it embeds the fonts as `data:`
  URIs in the harness page. **This path has no equivalent.** Its claim is "the words fit under an assumed
  metric that is pessimistic for this face at these sizes", not "the words fit as rendered". A font
  substitution, a face swap, or an item whose glyphs are wider than the estimate produces a word crossing
  a stroke on the published page with every test green. The estimate is deliberately loose, which makes
  this unlikely rather than impossible — and *unlikely rather than impossible* is the whole of the claim.
- **A second authoring path on one page is a fork in a convention.** Today the rule is legible because
  there is exactly one exception with a stated reason; the cost lands on the *third* figure kind, not on
  this one. The bound above is what is offered against that, and a bound is not an enforcement: nothing
  mechanical stops a fourth `pre` branch from appearing.
- **It ships component JavaScript, against ADR-0040's "zero additional bytes" for its diagrams.**
  `VennDiagram.tsx` and `vennSpec.ts` are statically imported by `Markdown.tsx`, so they land in whatever
  chunk serves every long-form page, not only `/architecture`. **The delta is not measured and there is no
  bundle-size gate in this repo** (`apps/fed/package.json` has no size check) — so this is an unmeasured,
  ungated cost, stated as one. It is small in absolute terms and it is not zero, and ADR-0001 is the
  record it is spent against.
- **It carries runtime behaviour, which no other figure on this page does.** A `useEffect` positions the
  initial scroll on the intersection and a feature-detected `ResizeObserver` keeps it true across a
  rotation. Both are progressive: the prerendered figure is complete without them. The cost is real
  though — the unguarded `new ResizeObserver` took down **every test rendering this page**, including
  three about something else, because jsdom has none. That is the class of blast radius a second path
  brings and the first one did not.
- **A phone reader pans this figure.** At 390px the box shows 352 of 712px. The scroll opens on the
  intersection so the reader lands on the claim and pans outward, and `data-pannable` gives the box an
  inset edge shadow when it really overflows, because overlay scrollbars are invisible until you have
  already scrolled. It remains the only figure on the site that asks the reader to move to see all of it.
- **A ` ```venn ` fence renders as a plain code block on GitHub**, unlike a ` ```mermaid ` fence, which
  GitHub renders natively. Anyone reading `architecture.en.md` in the repo sees the spec, not the picture.
  Mitigated only by the grammar being written to read as text.
- **`docs/adr` and the prose are still the third and fourth places a change has to land.** ADR-0040's
  "diagram source is a THIRD place every infrastructure change has to land" is unchanged and now has one
  more dialect.

**Neutral — and one of these is the gate's finding, checked rather than accepted**
- **The copy-as-markdown payload is unaffected, and this is measured, not argued.** `shareMarkdown.ts`
  strips exactly one fence kind — ` ```adr-index `, which the renderer expands into a live table and which
  would otherwise paste as three backticks and nothing. It **deliberately leaves mermaid fences alone**,
  with a test that says so (`shareMarkdown.test.ts:105`, *"leaves mermaid fences alone — GitHub and most
  readers render them"*). A ` ```venn ` fence therefore travels into the clipboard on **exactly the same
  terms as the four mermaid fences beside it**: verbatim, as its source. The one asymmetry is downstream —
  a mermaid fence pasted into GitHub becomes a picture and a venn fence stays a code block — and it is the
  reason the grammar is line-oriented and readable rather than a JSON blob. Recorded as neutral because
  **nothing about #387's behaviour changes**; the gate's concern here was a real question with, on
  inspection, an equal-treatment answer.
- **`iac/` untouched, and stated with the caution ADR-0041 earned:** no cache behaviour, no origin, no
  Terraform resource is involved — not merely that the output happens to be static.
- **No `og:title`, no URL and no OG card changes**, so nothing here is pinned by a scraper (ADR-0041).

## Links
- **Narrows the scope claim of [ADR-0040](./0040-build-time-mermaid-diagrams.md)**, which is amended to
  point here. That record's mechanism, guards and defaults are unchanged and still govern every figure
  mermaid can draw.
- **Constrained by [ADR-0002](./0002-fully-static-spa-no-backend.md) and
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)** — the figure is in the artifact, resolved
  before it is served; the runtime behaviour is an enhancement on top of a complete prerendered figure.
- **Consistent with [ADR-0005](./0005-og-coverage-every-public-url.md)** — it is in the prerendered HTML,
  asserted over HTTP.
- **Consistent with [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)** — authored per locale, with
  structural parity and non-identity of the prose both asserted.
- **Touches [ADR-0035](./0035-static-repo-cards-in-longform.md)** and #387 — the copy payload treats this
  fence exactly as it treats a mermaid fence; see the neutral clause above.
- **Conforms to [ADR-0008](./0008-brutalist-mono-identity.md)** — the figure paints from the identity
  tokens (`--primary`, `--foreground`, `--background`) rather than from literals, and the
  background-equality check that ADR-0040's amendment #3 installed applies to it.
- **Spends [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)** — a small, unmeasured amount of
  JavaScript, named above rather than implied.
- **Scope note added 2026-08-09 by
  [ADR-0048](./0048-content-photograph-is-a-captioned-figure.md)** — see the amendment below: this record's
  bound was tested against a photograph and reads as governing **drawn** figures, and its measured
  copy-payload claim no longer holds.
- Implementation: `apps/fed/src/lib/vennSpec.ts`, `apps/fed/src/lib/vennSpec.test.ts`,
  `apps/fed/src/components/VennDiagram.tsx`, `apps/fed/src/components/VennDiagram.test.tsx`,
  `apps/fed/src/components/DiagramFigure.tsx`, `apps/fed/src/components/Diagram.tsx`,
  `apps/fed/src/components/Markdown.tsx`, `apps/fed/scripts/architecture-diagrams.test.mjs`,
  `apps/fed/e2e/routes.spec.ts`, `apps/fed/e2e/diagram-centred.spec.ts`,
  `apps/fed/src/styles/index.css`, `apps/fed/src/content/architecture.{en,pt}.md`.

## Amendment (2026-08-09) — the no-third-path bound was tested against a photograph and governs DRAWN figures; and the copy-payload clause it MEASURED has stopped being true
Everything above stands as the decision. Two of its claims have been tested by a case it did not consider —
four photographs on `/architecture`, one of them a museum wall carrying a Knuth quotation — and one of them
is now false.

**1. The bound is about drawn figures.** **Decision outcome** offers the next author exactly two exits:
extend this path *"under the same three conditions, sharing `DiagramFigure`"*, or establish that the figure
is not worth a second mechanism. A photograph **satisfies none of the three conditions**, and the mismatch
is structural rather than an oversight: its subject is not words we author, so there is nothing for the
markdown body to hold; its arrangement is not arithmetically assertable, because there is no authored
geometry to compute over; and it is a **raster**, which option 4 above rejects by name.

So the bound is not stretched to cover it — it is **read as scoped**, which is what it always was. This
record governs a figure that is **drawn**. A figure that is **captured** is
[ADR-0048](./0048-content-photograph-is-a-captioned-figure.md), and merging the two would have required
either weakening the arithmetic condition to nothing or claiming for a raster a guarantee no test can
supply. **The no-third-path clause is not thereby dissolved:** a fourth *drawn* figure kind still extends
this path or is not drawn, and that is unchanged.

**One concrete finding worth carrying forward, because it is the cheapest way to see why the classes are
separate.** `DiagramFigure`'s box wears `.diagram-canvas`, and `e2e/diagram-centred.spec.ts` selects that
class **page-wide** and reads `el.querySelector('svg')`. On a photograph that is `null`, every measurement
becomes `NaN`, and `NaN` fails every comparison — at all four widths, in both editions, on the first run.
The shared shell that makes **two drawn** paths survivable is the wrong shell for a captured one, which is
why 0048 shares only the caption treatment, as an exported class string.

**2. THE ONE THAT IS NOW FALSE — the neutral clause *"the copy-as-markdown payload is unaffected, and this
is measured, not argued"*.** That was true, and it was measured: `shareMarkdown.ts` stripped exactly one
fence kind and deliberately left images alone, with a test saying so. It rested on a premise the source
itself recorded — **no content body embedded a root-relative image**, so the residual was inert.

Four photographs ended that premise. `shareMarkdown.ts` now **absolutizes image targets to the bare
origin** while links keep `localizePath`, and the passing test that asserted the old behaviour was
**inverted, with its comment rewritten** rather than joined by a second case — a suite asserting both would
describe a decision nobody made. The asymmetry is the decision: `Markdown.tsx` still registers no `img`
handler, so localizing an image here would produce `…/pt/photos/x.jpg`, an asset path that exists nowhere.

**This is a change to that record's mechanism, not to this one's.** The ` ```venn ` fence still travels
into the clipboard verbatim, on identical terms to the mermaid fences beside it, and nothing about this
figure's payload behaviour changed. What is no longer true is the *scope* of the sentence: **the payload as
a whole is not unaffected any more**, and a reader who takes that clause as a live statement about
`shareMarkdown.ts` would be reading a claim that expired. See
[ADR-0048](./0048-content-photograph-is-a-captioned-figure.md)'s payload option group for the argument and
the rejected alternatives.

**Links added by this amendment**
- **Scope noted by [ADR-0048](./0048-content-photograph-is-a-captioned-figure.md)** — this record's bound
  governs drawn figures; a captured one is decided there.
- **The copy-payload clause is narrowed**, and its underlying behaviour changed by that record —
  [ADR-0035](./0035-static-repo-cards-in-longform.md)/#387 now absolutize image targets to the origin.
