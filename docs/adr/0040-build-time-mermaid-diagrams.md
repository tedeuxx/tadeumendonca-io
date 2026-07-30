# 0040. Diagrams are Mermaid in the markdown body, compiled to inline SVG at build time

- **Status:** accepted (safe class — ratified by the `critical-reviewer` on merge, per
  [ADR-0003](./0003-trunk-based-single-environment.md)'s 2026-07-30 amendment)
- **Date:** 2026-07-30
- **Deciders:** the owner
- **Supersedes / superseded by:** —
- **Driven by:** Issue [#170](https://github.com/tedeuxx/tadeumendonca-io/issues/170) · constrained-by
  [ADR-0002](./0002-fully-static-spa-no-backend.md) and
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (no backend, no runtime XHR, resolve at build
  time) · collides-with [ADR-0021](./0021-application-security-posture.md)'s `--ignore-scripts`
  amendment (which is what decided the toolchain) · conforms-to
  [ADR-0008](./0008-brutalist-mono-identity.md) (amended below) · amends
  [ADR-0010](./0010-routing-landing-cv-split-redirects.md)'s orientation-layer claim for `/architecture`

## Context & problem
`/architecture` explains how a request becomes a page: a slash-less URL arrives at CloudFront, a
viewer-request function appends `index.html`, a cache hit answers at the edge and a miss falls through to
the prerendered object in S3. That is a **path with a branch on it**, and prose describes a path badly —
the reader has to hold four hops and a fork in their head while reading them one at a time. The page had
no diagram at all, and the owner's framing of the gap was a rejection as much as a request: a diagram
"must not restate the prose … it earns its place only by showing what a sentence cannot — the request path
and where the rewrite happens. If it ends up as a labelled box list, it is decoration and should be cut."

So the question is not *whether to draw a picture*. It is **what a diagram's source of truth is on a site
with no backend, no runtime fetch, and a hard requirement that `/architecture` be readable by a crawler
with JavaScript off** — and how a picture is prevented from doing the thing pictures do, which is go stale
without anyone noticing.

## Decision drivers
- **The diagram must survive JS being off** — `/architecture` is an exhibit, and the crawler and the
  no-JS reader are part of its audience (ADR-0004, ADR-0005).
- **Nothing may be fetched at runtime** (ADR-0002): whatever the reader gets, ships in the artifact.
- **Diagram labels must be real text** — crawlable, selectable, translatable, screen-readable. A picture
  of words is not words.
- **A stale diagram must fail loudly, at build time**, not degrade quietly on a served page. On a static
  site a silent failure is not a moment, it is an artifact: the prerender bakes it into the served bytes.
- **The identity applies to generated output too** (ADR-0008) — a default mermaid theme violates every
  clause of it.
- **CI installs with `npm ci --ignore-scripts`** (ADR-0021's 2026-07-27 amendment). Any tool whose browser
  arrives via a postinstall script cannot work here, by construction.
- **Lean by design** (ADR-0001): no bytes shipped to a reader to draw something that never changes.

## Considered options

### Where a diagram's source lives
1. **A ` ```mermaid ` fence in the long-form markdown body, compiled at build time** (chosen). The picture
   is authored beside the paragraph it illustrates, in the file the author is already editing, and it is
   *text* — so it diffs, reviews, and translates like the prose around it. *Trade-off:* the compiled SVG is
   a generated artifact that must be committed and kept in step with its source, which is a new
   obligation (guarded below, and its residue recorded as an accepted cost).
2. **A hand-drawn SVG (or an exported PNG) checked in as an asset** — *Why not:* this is the Issue's own
   reasoning and it is the decisive one. A hand-drawn diagram is a **liability, not an asset**: its source
   of truth is a tool outside the repo (or nothing at all), so it drifts silently and no check can even
   observe the drift. And an `<img>` makes every label a picture of a word — invisible to the crawler, to
   the screen reader, to selection and to translation, which is most of what the diagram is for here.
3. **Client-side mermaid, rendering in the browser** — *Why not:* it violates ADR-0002/ADR-0004 head-on.
   It would ship roughly 500kB to every reader to draw a picture that never changes, and a JS-less
   crawler on `/architecture` would get an empty box on the one page whose job is to be legible.

### Which renderer compiles the fence
1. **A Playwright/Chromium harness in `scripts/gen-diagrams.mjs`** (chosen).
2. **`@mermaid-js/mermaid-cli`** — the obvious answer, and *the reason it loses is a policy collision, not
   a preference*. mermaid-cli brings **Puppeteer**, which downloads its browser in a **postinstall
   script**; ADR-0021's amendment mandates `npm ci --ignore-scripts` in every CI install. It would
   therefore install **without a browser, by construction** — a tool that cannot run under this repo's
   supply-chain floor is not a tool this repo has. Mermaid has no pure-Node renderer either way (it needs
   a DOM), so the only real question was *which* browser — and Playwright's Chromium is **already
   installed** for the prerender, `/cv.pdf` and the E2E, with `scripts/gen-og-default.mjs` as the working
   precedent for driving it as a build tool. Zero new browser, zero new install path.

**Fonts are embedded as `data:` URIs in the harness page**, and this is load-bearing rather than
cosmetic: mermaid sizes every node box from the browser's **measured** text width. Rendered against a
fallback font, every box is laid out for metrics the site will never use and **every label overflows its
box — silently, and only on a machine other than the author's.**

### How the renderer finds a compiled diagram
1. **Keyed by the normalised source** (chosen) — `diagrams.json` is a map from the diagram's own
   normalised mermaid text to its SVG, and `Diagram.tsx` looks up the text it found in the markdown body.
   A plain string lookup, no arithmetic. Normalisation (CRLF, trailing whitespace, outer blank lines)
   exists so a re-indent does not invalidate the artifact: *a guard that cries wolf gets disabled, and
   then it guards nothing.*
2. **Keyed by a content hash recomputed in the browser** — the shape `lib/content.ts` uses to refuse a
   missing locale edition. *Why not:* the analogy is false. `content.ts` compares strings and checks key
   presence; hashing every fence at module load would **ship a sha256 implementation into the reader's
   bundle and run it on every page load** — to catch a mistake that can only be made inside this repo.
   The staleness check belongs in Node, where it costs a reader nothing.

**The hash survives, in the one place determinism is what it is for:** the SVG root element's id.
mermaid generates random ids by default, so identical input would produce a different SVG on every run —
the committed artifact would churn on every regeneration and its diff would never be reviewable.

### What happens when a diagram is wrong
1. **Fail at build time, loudly, with two guards** (chosen).
2. **Render-time fallback — an error card, an empty box, the raw source** — *Why not:* this repo has
   already paid for that failure mode twice. [#235](https://github.com/tedeuxx/tadeumendonca-io/issues/235)
   served Portuguese on `/en/portfolio` for three days and
   [#213](https://github.com/tedeuxx/tadeumendonca-io/issues/213) served the home page's OG card to every
   scraper — both because nothing objected. On a static site the prerender bakes whatever happened into
   the served bytes, and a scraper can pin it. `diagramSvg()` therefore **throws** rather than returning
   `undefined`, which fails the build, the prerender, the unit tests and the E2E together.

## Decision outcome
Chosen: **a ` ```mermaid ` fence in a long-form markdown body is a diagram's source.**
`npm run gen-diagrams` (`apps/fed/scripts/gen-diagrams.mjs`) compiles every fence found across the content
bodies to inline SVG into **`apps/fed/src/content/generated/diagrams.json`, which is committed**.
`Markdown.tsx` hooks **`pre`** — not `code` — and renders a `<Diagram>`.

**`pre`, not `code`, and that is not stylistic.** react-markdown delivers a fenced block as
`<pre><code class="language-mermaid">`, so returning a `<figure>` from a `code` handler nests it *inside* a
`<pre>`: invalid HTML, and a hydration mismatch on a prerendered page. For the same class of reason
`mermaid` is registered with rehype-highlight as **plain text** — highlighting rewrites the source into
`<span>`s, which the handler would then read back as its lookup key, and every diagram would silently miss.

**The pipeline is split so its decisions are testable without a browser.**
`scripts/diagram-source.mjs` is the pure half — which fences exist, how they normalise, how they hash,
and how the authored set compares to the committed artifact. The generator is a thin shell around tested
functions rather than an untestable blob that happens to contain logic.

**Two build-time guards, and both directions of the second one matter.**
1. **An unparseable fence exits non-zero, names the file, and writes NO partial artifact.** A half-written
   `diagrams.json` would make the *next* run's staleness check pass for whatever happened to compile —
   quietly shrinking the page instead of failing it.
2. **Staleness and orphans are checked in Node** (`scripts/diagram-source.test.mjs`), both ways.
   `missing` = a fence was edited without regenerating, so the page would render the previous picture or
   throw; `orphaned` = dead SVGs accumulating in the artifact, which breaks nothing, *which is exactly why
   nobody would ever notice*. **Verified by mutation:** editing a fence without regenerating fails that
   test and names the file.

**The accessible name is authored on the fence.** A diagram declares `accTitle:` (and `accDescr:`);
`Markdown.tsx` **throws** if `accTitle` is absent, and the same string becomes both the visible
`<figcaption>` and the figure's `aria-label`. mermaid alone would emit it as an SVG `<title>` — announced
to a screen reader, invisible to everyone else, i.e. labelled for the audit rather than for the audience.

**Identity conformance is asserted mechanically, not by discipline.** The renderer pins
`htmlLabels: false` (at the top level *and* under `flowchart` — the nested one alone does not take in
mermaid 11), `securityLevel: 'strict'`, and ADR-0008's palette including mermaid's error colours. The
tests then read the **rendered SVG** and assert palette-only colours, `rx`/`ry` = 0, no `filter`/gradient
**references**, no `<script>`, no `on*` handler, no `<foreignObject>`, and real `<text>`.
*Mermaid's boilerplate `<style>`/`<defs>` is stripped before those assertions* — it carries selectors for
shapes this diagram does not use and drop-shadow filters nothing references, so asserting over the whole
string would fail on **correct** output, and a test that fails on correct output is a test that gets
deleted.

**`dangerouslySetInnerHTML` is used, and the provenance claim is checked rather than trusted.** The string
comes from a build-generated, in-repo, committed file — the same trust level as importing a `.svg` asset,
which is what this replaces. It is not user input, not fetched, not reachable at runtime. The no-script /
no-handler / no-`foreignObject` tests are what make that a verified property instead of a comment.

**`mermaid` is a new devDependency, dev-only — it never reaches the browser bundle.** The exposure worth
recording: `audit-ci` gates **production** high/critical advisories only (ADR-0021), so a dev-tree advisory
here would **not** block CI. Verified at authoring time: `npm audit --omit=dev` shows no new advisory (the
two pre-existing moderates are react-router).

**This is slice one of two.** It ships the **mechanism** plus the **infrastructure diagram**. The
**dev-loop diagram** — which the owner calls "the harder one and the one that matters", because it must
show *the human's position*, where the agent proves done, and where the go/no-go sits — is **slice two**,
and nothing here decides it. The **layout question** (both diagrams full-width, versus the infrastructure
one collapsed into a detail) is **deliberately deferred by the owner**, to be answered against the
rendered draft rather than in the abstract.

## Consequences

**Good**
- The diagram is in the served HTML with JS off, as real text: crawlable, selectable, translatable,
  screen-readable — and costs a reader **zero** additional bytes of JavaScript.
- A diagram's source is **text in the repo, next to the prose it illustrates**, so it reviews and
  translates like prose and cannot live in a tool nobody else can open.
- Drift has a mechanical detector in both directions, and the failure is a red build that names the file
  rather than a wrong picture on a live page.
- The identity now holds on generated output by assertion, not by anyone remembering (ADR-0008,
  amended below).
- The toolchain adds **no new browser and no new install path** — it reuses the Chromium the prerender
  already needs.

**Bad / accepted costs**
- **Diagram source is a THIRD place every infrastructure change has to land** — the prose, the ADR, and
  now the diagram. And it is the worst of the three to leave behind: **a stale diagram is worse than an
  absent one**, because a picture reads as current in a way prose does not.
- **It is duplicated per locale.** Long-form is one file per locale (ADR-0032), so the two editions carry
  two fences that can disagree. **Mitigated but not eliminated** by a structural parity test (node ids +
  edge pairs, labels discarded) plus a fence-count check, itself guarded against the false green of two
  editions that both failed to parse comparing equal. Labels can still drift; only the *shape* is pinned.
- **A hand-edited SVG in `diagrams.json` passes every gate except the palette/safety assertions.** CI
  never runs `gen-diagrams`, and the key is the **source**, so the guarantee this pipeline offers is *"the
  source exists and is unchanged"*, **not** *"this SVG was generated from it"*. Stated plainly rather than
  implied, because the guard reads stronger than it is. Re-running the generator in CI to diff the output
  would be **worse**, not better: the render is font-environment dependent, so it would flake — a red that
  means "the CI image's font stack differs" trains everyone to ignore the check that also means "the
  diagram is wrong".
- **A new devDependency outside the audit gate's scope**, per above — a real, bounded exposure, not a
  hypothetical.
- The generated artifact is committed, so a regeneration shows up in every diff that touches a fence.
  Deterministic element ids keep that diff reviewable, but it is still noise in the changeset.

**Neutral**
- **`iac/` untouched.** Nothing at the edge, in the cache, or in Terraform changes; this is content
  pipeline and bundle only.

## Links
- **Implements** Issue [#170](https://github.com/tedeuxx/tadeumendonca-io/issues/170) (slice one of two —
  the mechanism plus the infrastructure diagram; the dev-loop diagram and the layout question are slice
  two).
- **Constrained by [ADR-0002](./0002-fully-static-spa-no-backend.md) and
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)** — build time, not runtime; nothing fetched.
- **Decided by [ADR-0021](./0021-application-security-posture.md)'s `--ignore-scripts` amendment** — the
  collision with Puppeteer's postinstall browser download is what ruled out mermaid-cli.
- **Conforms to [ADR-0008](./0008-brutalist-mono-identity.md)**, amended by this decision: the identity
  now has a generated surface, and conformance on it is mechanical.
- **Amends [ADR-0010](./0010-routing-landing-cv-split-redirects.md)** — `/architecture` now carries the
  first statement about the system that is not a pointer to one; see that amendment for why it is still
  an orientation layer.
- **Consistent with [ADR-0005](./0005-og-coverage-every-public-url.md)** — the diagram is in the
  prerendered HTML, like everything else on a public URL.
- **Consistent with [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)** — the fence is authored per
  locale, like the prose it sits in; parity is asserted rather than assumed.
- Implementation: `apps/fed/scripts/gen-diagrams.mjs`, `apps/fed/scripts/diagram-source.mjs`,
  `apps/fed/scripts/diagram-source.test.mjs`, `apps/fed/scripts/architecture-diagrams.test.mjs`,
  `apps/fed/src/content/diagrams.ts`, `apps/fed/src/content/generated/diagrams.json`,
  `apps/fed/src/components/Diagram.tsx`, `apps/fed/src/components/Markdown.tsx`,
  `apps/fed/src/content/architecture.{en,pt}.md`.

## Amendment (2026-07-30) — slice two shipped; and the "asserted mechanically" claim was PARTIAL, demonstrated by a defect that reached production
Everything above stands as the decision. Five things about it are now stale or incomplete, and the third
is the one worth reading.

**1. There is no slice two any more.** *"This is slice one of two"* (in **Decision outcome**) and
*"Implements #170 (slice one of two)"* (in **Links**) are superseded, not corrected: this slice ships the
**dev-loop diagram** — the one the owner called *"the harder one and the one that matters"*, because it must
show the human's position, where the agent proves done and where the go/no-go sits — and
[#170](https://github.com/tedeuxx/tadeumendonca-io/issues/170) closes with it. The mechanism decided above
carried the second diagram unchanged: a fence, the same generator, the same guards, no new decision.

**2. The layout deferral's premise is spent; the decision itself is NOT recorded here as ratified.** The
text above records the "both diagrams full width vs the infrastructure one collapsed into a detail" call
as **deliberately deferred by the owner, to be answered against the rendered draft**. That draft now
exists: both diagrams ship **full width** and were rendered and shown, so the reason the question could
not be answered is gone.

**What this amendment deliberately does not claim is that it was answered.** An earlier draft of this
paragraph said "the owner said proceed", sourced from a chat exchange. That is a relay, and
[ADR-0003](./0003-trunk-based-single-environment.md)'s 2026-07-29 amendment is explicit that a relay is
a notification and never the authority — ratification is a comment on the PR, which the reviewer
verifies as an artifact. Writing an unverifiable ratification into the permanent record is worse than
recording an open question, because the next reader has no way to tell the two apart. Caught by the
`critical-reviewer` on the MR that shipped slice two.

So: **the collapse question remains the owner's and remains open.** It is no longer *blocked* — it is
now an ordinary layout preference answerable at any time, which is a different state from where slice
one left it.

**3. THE IMPORTANT ONE — "identity conformance is asserted mechanically, not by discipline" was true of
membership and false of legibility, and the counterexample shipped.** The claim above (**Decision outcome**),
and the consequence *"the identity now holds on generated output by assertion, not by anyone remembering"*,
both read stronger than what the assertions actually check.

The theme set `lineColor: '#0A0A0A'` while the page's `--background` **is** `#0A0A0A`
(`apps/fed/src/styles/index.css:9-10`). **Every arrow in the infrastructure diagram was drawn in the page's
own background colour.** The diagram was **live on the apex with invisible edges from the moment slice one
merged until this slice** — a picture whose entire job is a path with a branch on it, served with no visible
path. Every palette assertion passed for the whole of that window, and would still pass today, because they
check **membership and presence, never contrast**: a diagram drawn wholly in `#0A0A0A` on a `#0A0A0A` canvas
satisfies both `used ⊆ palette` and `palette ⊆ used`. It was found by **rendering the page and looking at
it** — the one method this ADR had implicitly claimed to make unnecessary.

**What this slice added, and precisely how far it reaches.** `e2e/routes.spec.ts` now reads the **computed
stroke** of every `path.flowchart-link` and compares it to the **computed background** of `.diagram-canvas`,
failing if they are equal. That closes **this** hole — a diagram drawn in the canvas colour is now a red
test — and it closes **only** this hole. **A contrast check is not a legibility check.** Nothing mechanical
here will catch a diagram that is perfectly legible and wrong-looking: bad contrast that is not *equal*,
overlapping labels, an arrowhead pointing the wrong way, a layout that reads as a box list. The honest
version of the original claim is: *membership, presence and background-equality are asserted; looking at it
is still required.*

**The trap, recorded because it is the same class of error and whoever next touches this will meet it:**
the **first** version of that very assertion read the background from the `<figure>`, which has no
background of its own and computes to `rgba(0, 0, 0, 0)`. It therefore **passed on the exact defect it was
written for.** It was fixed only because the mutation was actually run. An assertion that is never seen to
fail is not evidence — it is the second copy of the first mistake, wearing the clothes of a guard. The spec
now also asserts the canvas colour is not transparent, so that failure mode is itself red.

**4. A new accepted cost the record did not carry — the print path is latent, and it is failure mode #3
again.** `apps/fed/src/styles/index.css:134-135` **inverts** the identity tokens under `@media print`
(near-black ink on an off-white sheet), while the diagram SVG's colours are **baked at build time** and
cannot invert with it. On a printed `/architecture`, the off-white strokes land on a white sheet — the same
mistake as above, with the canvas assumed rather than the colour. **Nothing shipping today is affected:**
`/cv.pdf` prints from `/en/me` (ADR-0034), which carries no diagram, and no other print path exists. So this
is **accepted, not fixed** — but it is now *latent and named* rather than unknown, which is the difference
that matters if a diagram ever reaches a printed surface.

**5. What the diagram-claim tests can and cannot guarantee.** `apps/fed/scripts/architecture-diagrams.test.mjs`
pins **the shape the author declared**. Node ids are an **authoring convention**: the test knows a node is
*called* `H`, never that it *is* a human. That makes it a real drift guard — between the two locale editions
and across future edits, and the mechanism by which the owner's "must not be a labelled box list" constraint
is falsifiable at all — and it does **not** make it *"the diagram cannot lie"*. The `H`-prefix counting rule
is what makes the convention enforceable: it is why adding a second human node fails instead of passing.

Recorded because the **first** version of that test asserted `nodes.filter(n => n === 'H').length === 1`
against a list built from a **Set** — which cannot contain `'H'` twice, so the assertion could never fail —
while carrying a comment claiming it caught an approval ladder. It did not: adding `P --> H2` left every
assertion green. Two of the five items in this amendment are the same failure, found twice in one slice:
**a green that was never observed to go red is not a gate.**

**Links added by this amendment**
- **Closes** Issue [#170](https://github.com/tedeuxx/tadeumendonca-io/issues/170) — the "slice one of two"
  wording in **Links** above is superseded by this amendment.
- **Narrows the conformance claim made to [ADR-0008](./0008-brutalist-mono-identity.md)** — the identity is
  still asserted on generated output; the assertions cover palette membership, presence and
  background-equality, not legibility.
- **Interacts with [ADR-0034](./0034-build-time-cv-pdf-static-artifact.md)** for item 4 — the print path is
  unaffected today only because the PDF prints from `/en/me`.
- Implementation added by this slice: `apps/fed/e2e/routes.spec.ts` (the stroke-vs-canvas assertion),
  `apps/fed/scripts/architecture-diagrams.test.mjs` (the dev-loop claims and the `H`-prefix rule),
  `apps/fed/scripts/gen-diagrams.mjs` (`lineColor` corrected to `#F5F4EF`).
