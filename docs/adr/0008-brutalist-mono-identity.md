# 0008. Brutalist mono visual identity, single theme

- **Status:** accepted
- **Capability:** `design-system-and-figures`
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** supersedes the earlier Borussia-Dortmund identity (History index)
- **Driven by:** [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through) (lean by design)

## Context & problem
The site needs a visual identity that reads as *an engineer's* — "engineering on display" — and that
backs the AI-Engineer positioning without looking like a template. An earlier identity (Borussia-Dortmund
palette: black/graphite + gold, Archivo/Inter) didn't express the positioning and was replaced.

## Decision drivers
- The look should signal engineering rigor and be memorable, not generic.
- One committed identity, not a themeable system — a personal site has one voice.
- ADR-0053 (lean by design): the design is owned and is part of the argument.

## Considered options
1. **Modern brutalist mono, single theme** (chosen) — near-black `#0A0A0A` on warm off-white `#F5F4EF`,
   **one** accent (safety orange `#FF5A00`), **radius 0, no shadow, no gradient**, a visible 12-column
   grid. Space Grotesk + JetBrains Mono (*Self-hosted type pairing* below; record 0009 until #456). No dark/light toggle. *Trade-off:* a strong, polarizing
   aesthetic — deliberately not for everyone.
2. **A conventional clean/rounded product look (soft shadows, rounded cards, a component kit)** — *Why
   not:* generic; reads as a template, not an engineer's own; and it's what a component library gives by
   default (the reason for *Own components, no component kit* below; record 0007 until #456).
3. **Dark/light themeable system** — *Why not:* two themes to design and maintain for one personal voice;
   the single committed identity is stronger and simpler (ADR-0053, lean by design).

## Decision outcome
Chosen: **brutalist mono, one accent, radius-0, single theme.** This is a **fixed decision**; it drives
*Own components, no component kit* (since a kit fights it) and *Self-hosted type pairing* (the type
pairing), both below — records 0007 and 0009 until #456 absorbed them here. The exposed grid and the
absence of shadow/gradient are the point — the structure is visible.

## Consequences
**Good**
- Memorable, singular, and legibly "an engineer's" — backs the positioning.
- Simple token system (one theme, one accent, zero radius) — little to maintain.

**Bad / accepted costs**
- Polarizing by design; a conventional audience may find it stark.
- Radius-0/no-shadow must be enforced (tokens collapse the radius scale) or a stray `rounded-*` breaks the
  look; a component kit couldn't be used off-the-shelf (*Own components, no component kit* below).

## Amendment (2026-07-23) — the portrait is round; radius 0 still holds everywhere else
The **portrait** (the `/cv` header image and the small greyscale one in the landing's aside) is now a
circle. Nothing else changes: cards, buttons, inputs, badges and rules stay **radius 0**.

*(`/cv` is the route as it was named when this amendment was written; it is `/me` — `/pt/me` · `/en/me` —
since ADR-0010's 2026-07-24 amendment and ADR-0036. Left as written per supersede-never-rewrite, and
flagged here because that convention is declared inside ADR-0010 and is invisible from this file. #234.)*

The reasoning is that "radius 0" is a rule about **surfaces** — the visible structure this ADR exists to
expose. A face is not a surface; a circular crop is the convention for a portrait, the way a rule is the
convention for a boundary. Applying the surface rule to a photograph was over-reach, not identity.

**How it is carved matters more than the change itself.** The Tailwind `borderRadius` scale stays
collapsed to `0` — `full` included — so the guard recorded under *accepted costs* above still works: a
stray `rounded-*` anywhere renders square. The exception is a hand-written utility,
`.avatar-round` in `src/styles/index.css`, deliberately **not reachable through Tailwind**. Opening the
scale to obtain one circle would have traded a named exception for an open door, which is precisely how
this identity would erode.

Same shape of decision as the `LocaleProvider` carve-out in
[ADR-0032](./0032-i18n-locale-layer-english-baseline.md): a deliberate, documented exception, recorded
so a later reader does not mistake it for drift — or, worse, cite it as precedent for rounding a card.

*Accepted cost:* `object-cover` crops harder inside a circle than a square, so the portrait loses more of
its edges; the framing is chosen for the round crop now.

## Amendment (2026-07-30) — the identity has a GENERATED surface now, and conformance on it is mechanical
The diagram pipeline (*Diagrams compiled from Mermaid at build time* below; record 0040 until #456) introduces the first pixels on this site **no human
authors**: diagrams compiled from a ` ```mermaid ` fence to inline SVG at build time
([#170](https://github.com/tedeuxx/tadeumendonca-io/issues/170)). Every previous surface was hand-written
markup wearing the tokens; this one is markup a library emits.

**That matters here because a default mermaid theme violates essentially every clause of this ADR** — its
own palette, rounded node corners, drop-shadow filters, gradients. Left alone it would not be a *drifting*
surface, it would be a **foreign** one, shipped whole on the page whose job is to exhibit how this site is
built.

**The rule is unchanged; only its reach is.** The identity binds generated output exactly as it binds
hand-written output. `gen-diagrams.mjs` therefore leaves nothing to mermaid's defaults: the palette
(`#0A0A0A` / `#F5F4EF`, one accent), the type pairing (*Self-hosted type pairing* below), `htmlLabels: false` and
`securityLevel: 'strict'` are all pinned — **including mermaid's error colours**, which it emits into every
diagram's `<style>` whether or not anything failed, so that a diagram which *does* error still looks like
this site.

**And the conformance is asserted, not trusted — the same shape as the guard in *accepted costs* above.**
Radius-0 is enforced by collapsing the Tailwind `borderRadius` scale, so a stray `rounded-*` renders
square rather than relying on anyone noticing. The generated surface gets the equivalent: unit tests read
the **rendered SVG** and assert palette-only colours, `rx`/`ry` = 0, no `filter`/gradient references, and
real `<text>` rather than `<foreignObject>` HTML. A mermaid upgrade that changes a default is then a red
test, not a slowly uglier page.

*Implementation note worth carrying, because it is where the assertion nearly went wrong:* mermaid's
boilerplate `<style>`/`<defs>` is stripped before those checks. It contains selectors for shapes the
diagram does not use and drop-shadow filters nothing references, so asserting the palette over the whole
string fails on **correct** output — and a test that fails on correct output is a test someone deletes.
The check reads the drawing, not the library's dead CSS.

This is a *widening of scope*, not an exception like the portrait: nothing is carved out, and every clause
of this ADR applies to the diagrams as written.

## Own components, no component kit

**Absorbed 2026-11-02 (#456) from the record that held it, 0007, decided 2026-07-22.** The decision is
unchanged and still binds; it is a **fixed decision** (`AGENTS.md`, *Fixed decisions*). The full record is
in git history: `git log --diff-filter=D -- 'docs/adr/0007-*'`.

### Context

The application needs a styling approach and a component layer. The default modern path is Tailwind plus
a component library such as shadcn/ui, whose opinionated defaults (rounded corners, shadows, its own
tokens) fight the radius-0, no-shadow identity above more than they help.

### The decision, as it binds

**Tailwind v3 with hand-written components, HSL design tokens and a `cn()` helper — no shadcn/ui.**
Tailwind supplies utilities; components live in `src/components/`; tokens are HSL CSS variables consumed
as `hsl(var(--x))`; `cn()` is clsx plus tailwind-merge — the convention shadcn popularised, with nothing
of its component library. The identity depends on owning the primitives.

### Rejected options that are still live

- **Tailwind plus shadcn/ui.** Its radius, shadow and token defaults contradict the identity; overriding
  them all costs more than owning a small set of components, and it dilutes the *"this is my design"*
  argument.
- **A CSS-in-JS or component framework (MUI, Chakra).** Heavier, more opinionated, further from the
  exposed-grid look, and it carries a runtime styling cost.

### Consequences still being paid

- **Every primitive is hand-built**, states included (`Column.tsx`). The static site has no forms left to
  build; the original record also named a `Form.tsx` that had already been deleted the day it was written.
- **No off-the-shelf accessibility or behaviour from a kit**: accessibility is done by hand.

## Self-hosted type pairing

**Absorbed 2026-11-02 (#456) from the record that held it, 0009, decided 2026-07-22.** The decision is
unchanged and still binds. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0009-*'`.

### The decision, as it binds

**Space Grotesk (display and body) and JetBrains Mono (labels and code), self-hosted through
`@fontsource`.** The font files are bundled and served from the site's own origin, so no font request
leaves it and the type voice is part of the shipped bundle rather than a CDN dependency.

### Rejected options that are still live

- **The Google Fonts CDN.** A third-party request on every load: a privacy leak, an external point of
  failure, and a dependency the self-contained static model avoids.
- **System fonts only.** Forfeits the identity, whose point is a specific, engineered type voice.

### Consequences still being paid

- **Font files add weight to the bundle**; subset to the weights actually used.
- **A font update is a dependency bump**, not automatic from a CDN.
- The same faces are embedded as `data:` URIs in the diagram harness (*Diagrams compiled from Mermaid at
  build time*, below), because mermaid sizes its boxes from measured text.

## Diagrams compiled from Mermaid at build time

**Absorbed 2026-11-02 (#456) from the record that held it, 0040, decided 2026-07-30 (#170).** The decision
is unchanged and still binds, with its amendments of 2026-07-30, 2026-08-08, 2026-08-09, 2026-09-18 and
2026-10-17 and its 2026-08-16 cross-link folded in below. The full record, including the round-by-round
evidence those amendments carried, is in git history: `git log --diff-filter=D -- 'docs/adr/0040-*'`.

### Context

`/architecture` explains a request path with a branch on it, which prose describes badly. A diagram there
must not restate the prose: it earns its place only by showing what a sentence cannot. The question was
what a diagram's source of truth is on a site with no backend and no runtime fetch, where `/architecture`
must be readable with JavaScript off, and how a picture is kept from going stale unnoticed. On a static site
a silent failure is not a moment but an artifact: the prerender bakes it into the served bytes.

### The decision, as it binds

- **Scope.** A ` ```mermaid ` fence in **any markdown body under `src/content`, at any depth**, is the
  source of **a diagram mermaid can draw**. Both halves are amendments: the 2026-08-08 narrowing (a figure
  mermaid cannot draw is *Figures mermaid cannot draw*, below; a figure mermaid *can* draw that is authored
  another way is a defect against this section) and the 2026-09-18 widening from the four long-form
  bodies to blog bodies, after the collector was found blind to `blog/` while the renderer reached it and
  threw, so a fence in an article could not be made to work by any authoring act.
- **Compiled at build time, committed.** `npm run gen-diagrams` (`apps/fed/scripts/gen-diagrams.mjs`)
  compiles every fence to inline SVG into `apps/fed/src/content/generated/diagrams.json`, which is
  committed. `contentFiles()` in `scripts/diagram-source.mjs` (the pure, tested half) is the recursive
  collector.
- **The renderer is a Playwright/Chromium harness**, the browser the prerender already installs, with the
  fonts embedded as `data:` URIs: mermaid sizes every box from measured text width, and against a fallback
  font every label overflows, silently and only on a machine other than the author's.
- **Looked up by normalised source text**, not by a hash computed in the browser. Normalisation (line
  endings, trailing whitespace, outer blank lines) keeps a re-indent from invalidating the artifact.
- **Deterministic output from two pinned sources**: the SVG root id is the fence hash, and since
  2026-10-17 (#758) `handDrawnSeed: 1` is a top-level `THEME` key, because mermaid's roughjs outlines
  otherwise seed from `Math.random` and the committed artifact churned. `e2e/diagram-determinism.spec.ts`
  renders twice and requires byte-identical text, against a local target only.
- **`Markdown.tsx` hooks `pre`, not `code`**, since a `<figure>` returned from a `code` handler nests
  inside `<pre>` (invalid HTML, a hydration mismatch); `mermaid` is registered with rehype-highlight as
  plain text so highlighting does not rewrite the lookup key.
- **A wrong diagram fails the build.** An unparseable fence exits non-zero, names the file and writes no
  partial artifact; `diagram-source.test.mjs` checks `missing` and `orphaned` both ways; `diagramSvg()`
  throws rather than returning `undefined`, which fails the build, the prerender, the unit tests and the
  E2E together.
- **The accessible name is authored on the fence.** `accTitle:` is required (`Markdown.tsx` throws
  without it) and becomes both the visible `<figcaption>` and the `aria-label`.
- **The identity binds the generated output.** `htmlLabels: false` (top level and under `flowchart`),
  `securityLevel: 'strict'`, the palette including mermaid's error colours, and `lineColor: '#F5F4EF'`.
  Tests read the rendered SVG, with mermaid's boilerplate `<style>`/`<defs>` stripped, and assert
  palette-only colours, `rx`/`ry` = 0, no filter or gradient references, no `<script>`, no `on*` handler,
  no `<foreignObject>`, real `<text>`; `e2e/routes.spec.ts` asserts every edge's computed stroke differs
  from the non-transparent `.diagram-canvas` background. `dangerouslySetInnerHTML` is acceptable because
  the string is build-generated and committed, and those tests make that a checked property.
- **Two editions of one figure.** A fence in a body exists in both locale editions (the one-file-per-locale
  rule of ADR-0032, reaching blog bodies), enforced by the pairing arm in `diagram-source.test.mjs`.
- **`mermaid` is a devDependency only** and never reaches the browser bundle.

### Rejected options that are still live

- **A hand-drawn SVG or exported PNG checked in, standing in for a diagram.** Its source of truth sits in
  a tool outside the repository, so it drifts where no check can see it, and an `<img>` makes every label a
  picture of a word. The 2026-08-09 amendment scoped this rejection to **diagrams**: it never decided
  photographs (*Content photographs as captioned figures*, below, applies its argument).
- **Client-side mermaid.** Roughly 500kB to every reader to draw a picture that never changes, and an empty
  box for a crawler without JavaScript, against ADR-0002.
- **`@mermaid-js/mermaid-cli`.** Its Puppeteer downloads the browser in a postinstall script, and every CI
  install runs `npm ci --ignore-scripts` ([ADR-0003, *The application security
  posture*](./0003-trunk-based-single-environment.md#the-application-security-posture)), so it would
  install without a browser by construction.
- **A content hash recomputed in the browser** as the lookup key: it ships a hash implementation to every
  reader to catch a mistake that can only be made inside the repository.
- **A render-time fallback** (an error card, an empty box, the raw source): the prerender bakes it into the
  served bytes and a scraper can pin it, the shape of #235 and #213.
- **Regenerating the artifact in CI to diff it**: the render depends on the font environment, so it would
  flake and train everyone to ignore it.

### Consequences still being paid

- **Membership, presence and background-equality are asserted; legibility is not.** A diagram drawn in
  the canvas colour shipped with every palette assertion green (2026-07-30); the stroke-versus-canvas check
  closes that hole only. Bad contrast that is not equality, overlapping labels or a box-list layout pass.
  **Looking at it is still required.**
- **The source is the guarantee, not the SVG**: a hand-edited entry in `diagrams.json` passes every gate
  except the palette and safety assertions, because CI never runs the generator.
- **A third place every infrastructure change has to land**, and a stale diagram is worse than an absent
  one because a picture reads as current.
- **Duplicated per locale.** On `/architecture` a structural parity test (node ids and edge pairs) plus a
  fence count pins the shape; `architecture-diagrams.test.mjs` reads its two files by name, so a blog
  article's two editions are pinned to the same **number** of figures, not the same figure. Node ids are an
  authoring convention (the `H`-prefix rule), not proof of what a node depicts.
- **The print path is latent**: `@media print` inverts the tokens while the SVG colours are baked, so
  off-white strokes would land on a white sheet. Nothing printed today carries a diagram (`/cv.pdf` prints
  `/en/me`).
- **A devDependency outside the audit gate**, which blocks production advisories only.
- **The committed artifact shows up in every diff that touches a fence.**
- **Width levers, measured and not decided** (cross-link of 2026-08-16): with `htmlLabels: false` mermaid
  wraps node labels itself, so node text is not a width lever; `rankSpacing`, unset in `THEME`, is the
  untaken one (639px of inter-rank gap on the widest figure).
- **Two latent residuals of the widening**: the recursive walk opens `src/content/generated/`, kept out of
  the authored set only by the `.md` filter; and `diagram-font-coverage.test.mjs` inherits the widened
  reach through `collectFences` without saying so.
- **Open, and the owner's**: whether the infrastructure diagram collapses into a detail (both ship full
  width; no ratification is recorded), and whether an `accDescr` counts against `published-voice` rule 9's
  word ceiling.

## Figures mermaid cannot draw

**Absorbed 2026-11-02 (#456) from the record that held it, 0047, decided 2026-08-08 (PR #411).** The
decision is unchanged and still binds, with its amendments of 2026-08-09 and 2026-08-16. The owner has not
ruled on the bounded-convention clause, and it remains his to reverse. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0047-*'`.

### Context

`/architecture` carries a three-pillar figure: three overlapping circles with the subject in the shared
intersection. Mermaid draws no Venn, and the claim — each pillar exists without the other two, and the
subject is only where all three meet — is the one a sentence states worst, because naming three things in
order implies the hierarchy the drawing exists to deny. The test is the purpose of the diagram section
above, not its letter: **can this picture go wrong without something turning red?**

### The decision, as it binds

**A drawn figure mermaid cannot draw may be authored as a typed fence over a fixed geometry and painted as
inline SVG by a component, on three conditions:** its words live in the markdown body, its arrangement is
asserted arithmetically against those words in both editions, and it ships in the prerendered bytes. The
` ```venn ` fence is the first instance (`apps/fed/src/lib/vennSpec.ts`, `VennDiagram.tsx`, a `vennBlock`
branch of the `pre` handler, `venn` registered with rehype-highlight as plain text).

- **A bounded convention, not a one-off.** The next drawn figure mermaid cannot draw extends this path under
  the same three conditions, sharing `DiagramFigure`, or is not drawn. No third drawn path. Overturning
  this clause costs one sentence and changes no code.
- **The mermaid pipeline stays the default.**
- **One shell.** `DiagramFigure.tsx` owns the `<figure>`, the `.diagram-canvas` box, overflow, centring and
  the caption rule for both drawn kinds.
- **The same accessibility contract by construction**: `accTitle` (required; caption and SVG `<title>`)
  and `accDescr` (required; `<desc>`, over 400 characters in both editions), with `aria-labelledby` and
  `aria-describedby` asserted to resolve by id.
- **It fails loudly**: `parseVennSpec` throws on every authoring mistake.
- **The published figure count is checked** against the prose in both editions by
  `architecture-diagrams.test.mjs`.
- **Width, since 2026-08-16.** A `min-width` floor at or below the desktop column measure is acceptable and
  produces phone-only panning; **a floor above the column measure is a legibility regression, not a config
  value.** The Venn keeps its 680px floor. Above 1024px every `.diagram` figure bleeds out of the article
  column with negative inline margins up to `--diagram-max-width` (1340px), with a 2rem inset so a
  classic scrollbar cannot push it past the shell; `--diagram-max-width: 0` reverts the page byte for byte.
- **Scope, since 2026-08-09**: the bound governs **drawn** figures. A captured figure is *Content
  photographs as captioned figures*, below.

### Rejected options that are still live

- **Do not draw it; say it in prose.** The section's argument is a shape.
- **Approximate it in mermaid** (three nodes converging on a fourth): convergent arrows assert a pipeline
  with a terminus, the opposite of the claim, while passing every gate.
- **A hand-drawn SVG or PNG asset**: the words would stop being text. The chosen path must not collapse
  into this.
- **A TypeScript structure with no fence**: it takes the words out of the file the translator edits and out
  of the copy-as-markdown payload.
- **A `mermaid` fence with a custom flag**: one name over two mechanisms hides the seam.
- **A committed SVG artifact, or a visual-regression snapshot**: a browser in the generator for the same
  weak *"the source is unchanged"* property, or a font-dependent flake.
- **Let it shrink to fit**, or **a separate phone layout**: words 5px tall pass every presence check, and a
  second geometry halves the one arithmetic guard.
- **A per-figure floor above the column measure**: a desktop reader who never finds the hidden overlay
  scrollbar sees a silently cropped figure.

### Consequences still being paid

- **The guarantee is weaker than the diagram pipeline's on one named axis**: the overflow check uses an
  estimated glyph width (`text.length × size × 0.62` in `VennDiagram.test.tsx`), not a measured one. A font
  substitution can put a word across a stroke with every test green. *Unlikely rather than impossible* is
  the whole claim.
- **A fork in a convention**, bounded by a rule and not by any mechanism: nothing stops a fourth `pre`
  branch.
- **Component JavaScript in the long-form chunk**, unmeasured; the repository has no bundle-size gate.
- **Runtime behaviour** (initial scroll on the intersection, a feature-detected `ResizeObserver`),
  progressive over a complete prerendered figure.
- **A phone reader pans this figure**; a ` ```venn ` fence renders as a code block on GitHub.
- **The suites assert geometry and never legibility.** Do not add an assertion of the form *"the figure is
  legible"*. `e2e/diagram-centred.spec.ts` branches on `overflows`, so a figure that starts overflowing
  silently trades its centring assertion for a trivially satisfied reachability one. Two nominal couplings
  nothing enforces: `--container` mirrors Tailwind's `maxWidth.screen` and `--rule-strong` mirrors
  `border-x-2`. Verified in Chromium only.
- **The 2026-08-08 claim that the copy-as-markdown payload was unaffected expired** on 2026-08-09: the
  payload now absolutizes image targets (*Content photographs as captioned figures*). The ` ```venn ` fence
  still travels verbatim, on the same terms as a mermaid fence.

## Content photographs as captioned figures

**Absorbed 2026-11-02 (#456) from the record that held it, 0048, decided 2026-08-09 (#415, PR #419).** The
decision is unchanged and still binds, with its amendments of 2026-08-25, 2026-08-27 and 2026-11-01.
Whether photographs belong on `/architecture` at all is an editorial call this section does not make. The
full record is in git history: `git log --diff-filter=D -- 'docs/adr/0048-*'`.

### Context

`/architecture` acquired photographs, one of a museum wall carrying a Donald Knuth quotation whose words
are the reason it is on the page and sit inside a JPEG. A photograph satisfies none of the drawn-figure
conditions above. Doing nothing was not neutral: the existing image rule would have rendered them
unlabelled, uncaptioned and unreserved with every gate green. That rule is
`:where(.markdown) img` since #492 (`grep -Fn ':where(.markdown) img {' apps/fed/src/styles/index.css`),
at zero specificity so a component's own width cap applies.

### The decision, as it binds

**A photograph in a content body is a captioned figure that carries evidence, never words the page depends
on.** Three conditions:

1. **Its load-bearing text is authored beside it, as prose, once.** The quotation is a blockquote with its
   attribution; it appears in no caption and no `alt`, asserted in both editions on a distinctive fragment,
   and the Knuth `alt`s must differ between editions. The `alt` describes the frame: repeating the words
   there delivered the same claim twice to a screen-reader user, as if from a second source.
2. **`alt` and `caption` are both required and are different strings**; a missing one throws at render.
3. **Its box is reserved from the committed file's measured size**: `src/data/photos.json`, checked
   against each JPEG's SOF marker by `scripts/photo-assets.test.mjs`, both ways (every registered file
   exists at its declared size; every file in `public/photos` is registered). The assets carry no Exif
   block, which is asserted, because an `Orientation` tag rotated a photograph inside a box reserved for
   the unrotated size.

- **Rendered by the lone-paragraph facade**: a paragraph that is only `![alt](/photos/x.jpg "caption")`
  becomes a `<PhotoFigure>`, the caption in the CommonMark title slot; it is opt-in by `src`
  (`photoFor` returns `null` for an unregistered target).
- **Its own `<figure>`**, sharing only the exported `FIGCAPTION_CLASS` with `DiagramFigure`.
- **The copy-as-markdown payload absolutizes image targets to the bare origin**, while links keep
  `localizePath`; the asymmetry is pinned.
- **A third figure class, deliberately**: captured, not drawn, so outside the drawn-figure bound.
- **The byte bound stands at 1 MiB** (`toBeLessThan(1024 * 1024)`) across every registered photograph,
  and is not raised to fit the next one. Photographs are scarce by intent. **The next photograph arrives
  with one of three routes named in its Issue**: a frame that fits the measured remainder, a re-encode of
  an existing raster that pays for it, or an explicit reopening of the refused optimiser. Re-derive the
  remainder with `git ls-tree -l HEAD apps/fed/public/photos/`; at the 2026-08-27 amendment it was
  120,561 B with eight rasters, so route one is unlikely to fit again.
- **A generated cover is not a photograph** (2026-11-01, #710): AI-generated illustrations under
  `public/illustrations/` say so in their `alt` and caption and stay outside `data/photos.ts` and its
  ceiling.

### Rejected options that are still live

- **Let the photograph carry the quotation**: the words become a picture of a word to the crawler, the
  screen reader, selection, translation and every assertion.
- **Strip photographs to alt text in the payload**: it removes the page's only first-hand exhibit.
- **A ` ```photo ` fence extending the drawn-figure path**: it cannot meet the arithmetic condition.
- **An `img` handler**: a `<figure>` inside the open `<p>`, invalid HTML and a hydration mismatch.
- **Nothing — the default image rule**: four unlabelled, unreserved images and no red anywhere.
- **Reusing `DiagramFigure`**: `e2e/diagram-centred.spec.ts` reads an `svg` inside every `.diagram-canvas`,
  so a photograph turns every measurement into `NaN`.
- **No dimensions, or hand-typed literals**: layout shift, or numbers nothing compares to the binary.
- **A build-time image optimiser**: a new dependency and tool class against ADR-0053, for a handful of
  files.
- **Localizing image targets in the payload**: `…/pt/photos/x.jpg` exists nowhere.
- **Raising the bound to fit a photograph**: a ceiling that tracks its payload can never be exceeded.

### Consequences still being paid

- **Nothing proves a photograph is readable, and nothing can.** What is asserted: the body never scrolls
  sideways at 320, 390, 768 and 1280 in both editions; each image decoded (`naturalWidth > 0`) inside its
  figure; alt and caption non-empty and differing; the quotation delivered exactly once; the quotation's
  text node inside the viewport at 320 and 390. The quotation is checkable because it is prose.
- **The figure treatment is invisible in the markdown**: wrap a sentence around the image and it renders
  inline.
- **The rasters ship unoptimised**, held only by the asserted total.
- **No in-repo producer for the assets**; a future recrop repeats the hand path.
- **Unmeasured component JavaScript** in the long-form chunk; no bundle-size gate.
- **A shared caption class**: restyling the diagram caption restyles every photograph.
- **Re-encode hazards, per file**: `journey-corridor.jpg` hides an employer name only at its current
  derivative size, so a wider re-export re-opens it; `journey-manila.jpg` contains identifiable faces that
  no derivative size suppresses, a choice the owner made knowingly. Re-check against the file that will
  ship, never against the decision.

## Curated repositories as static cards in long-form

**Absorbed 2026-11-02 (#456) from the record that held it, 0035, decided 2026-07-25 (#122).** The decision
is unchanged and still binds, with its 2026-08-08 amendment. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0035-*'`.

### The decision, as it binds

**A repository becomes a card only when its canonical URL is in `data/repoCards.ts`**, an owner-curated
allowlist. A paragraph that is nothing but a registered repository URL renders as a `<RepoCard>` through
the shared `Markdown` renderer's lone-URL facade (the same opt-in shape as `VideoEmbed`); any unregistered
URL stays a plain link. The match is case-insensitive and tolerates a trailing slash.

- **Static text plus one outbound anchor**: no image, no iframe, no third-party request; the whole card is
  one `<a>`. A **primary-language chip, deliberately not a star count**: a frozen star number misleads.
- **Facts once, prose per locale**: name, owner, language and URL are authored once (the split of
  ADR-0024); the description is a leaf-level `{pt,en}` field (ADR-0032's leaf rule) composed into a
  per-locale long-form page.
- **`data/repoCards.ts` is copy, not app data**: a description change goes through the copy lens.
- **The mechanism, since 2026-08-08.** With `remark-gfm` on the shared renderer, a lone bare URL arrives as
  an autolinked `<a>` whose label equals its `href`, and `loneUrl()` in `Markdown.tsx` takes its element
  branch. The string branch is kept as a fallback for an explicit CommonMark autolink. The authoring
  contract is unchanged, and the video facade shares it. GFM is live on every page the shared renderer
  serves.

### Rejected options that are still live

- **GitHub's OG-card image per repository**: a request to a GitHub CDN on every load, a stale star count,
  and no way to style it to the identity.
- **The live GitHub API, at build or at runtime**: runtime is out (ADR-0002); at build it adds a network
  dependency and a token for data that barely changes.
- **A separate record for `remark-gfm`**: the canonical companion of an already-decided dependency, with
  no runtime surface.

### Consequences still being paid

- **Owner-maintained facts**: a rename on GitHub needs a registry edit. Revisit only if the list grows.
- **A file whose data is copy**, recorded here and in the file's header.
- **Not a general provider registry**: one concrete repository match beside the video one.
- **GFM applies to all future content** (tables, strikethrough, task lists, autolinked URLs and emails);
  the sweep at #404 covered the corpus as it stood, not content written after it.

## A document title leads with the section label

**Absorbed 2026-11-02 (#456) from the record that held it, 0045, decided 2026-08-08 (#395).** The
decision is unchanged and still binds, with its 2026-11-01 amendment (#640). The first slice of #456
(#793) rejected the hypothesis that it is not a record: no mechanism refuses two of its rejected options,
so they are carried below. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0045-*'`.

### Context

The owner clicked *Arquitetura* and the tab read *"Como este site é construído"*: the word he clicked was
nowhere in it. The site had four title shapes and no recorded reason for any. The title is an **address**
(tab, bookmark, search result, unfurl), not the page's H1, which is its **argument**. The `og:title` half
is pinned by scrapers on first fetch (ADR-0041), on every route: `useDocumentHead` emits it
unconditionally. On the two `MarkdownPage` routes (`/architecture`, `/ramp-up`) one `title` prop also feeds
the share title and the JSON-LD headline.

### The decision, as it binds

**A document title leads with its section's `nav.*` label — the exact word the reader clicked — and
anything after it is optional and secondary.** It is sourced from the section's own `title` leaf in the
catalog, never from a heading. The visible H1 stays editorial.

- **An off-menu section** (since 2026-11-01, `/analytics`, ADR-0054) carries its lead word as its own
  `<group>.label` leaf; the check reads `nav.<group>` first and `<group>.label` second.
- **Enforced by derivation**: `messages.test.ts` takes every group owning a `title` leaf and asserts the
  lead in both locales, guarded against an empty set by asserting the derived set exactly
  (`analytics, architecture, library, portfolio, rampup`). `e2e/seo.spec.ts` asserts the composed title on
  the served bytes of every prerendered pair, with the lead words spelled out, and `og:title` equal to
  `<title>`.
- **Four exceptions**: `/` (the site, not a section; `tadeumendonca.io` bare); an article (its own name is
  its address, and so is the not-found state); `/me` (composed from `nav.profile` plus `profile.ts`,
  covered by `ProfilePage.test.tsx`); and **a conforming title is not rewritten** to fit a preferred
  phrasing, since that re-pins an `og:title` for nothing a reader perceives.

### Rejected options that are still live

- **The title EQUALS the `nav.*` label.** The strongest rejected option, and the owner's to reverse with a
  one-line change plus two strings. Rejected because it gains nothing on the tab, which truncates, and
  costs the LinkedIn card, which shows `og:title` plus the domain and drops the description; it would also
  force `/ramp-up` to the self-undescribing *"Ramp-up"*. **No mechanism refuses it.**
- **The title is the H1**: it deletes the argument from the H1 or bloats every tab.
- **Leave it a per-page judgement**: the state that produced the defect. **No mechanism refuses it**
  either; the derived check covers only sections that own a `title` leaf.
- **Reuse the section's `heading` key**: same string today, but a title sourced from a heading drifts
  whenever the argument is edited.
- **A hand-written route-to-title table**: it has to be remembered.
- **A `nav.analytics` leaf with no menu entry**: it reads as half a menu promotion.

### Consequences still being paid

- **A prefix test cannot judge the tail.**
- **`portfolio.title` and `portfolio.heading` hold the same string on purpose**, and look like a
  duplication to collapse.
- **`/me` sits outside the derived check.**
- **Nav labels are load-bearing for SEO**: a nav rename moves five document titles and their `og:title`s
  across ten prerendered URLs, every one pinned on first fetch. `nav.profile` is the live case: relabel it
  once, deliberately.
- **`/architecture` and `/ramp-up` carry a four-way title**; the others a two-way one. The unfurl half is
  irreversible everywhere.
- **The E2E spells its strings out**, so a deliberate title change updates it in the same commit.
- **The fallback is order-sensitive**, and the link text that reaches `/analytics` and its title's lead
  word are held by separate literals.
- **Out of scope**: the H1, meta descriptions, kickers and the nav labels themselves.

## Links
- Driven by ADR-0053 (lean by design) · drives *Own components, no component kit* and *Self-hosted type
  pairing* above · supersedes the Borussia-Dortmund identity (History index) · a fixed decision (see repo
  ~~`CLAUDE.md`~~ `AGENTS.md`, #721) · amended above for the portrait, within the same guard · amended
  (2026-07-30) for the **generated** surface introduced by *Diagrams compiled from Mermaid at build time* —
  same rule, wider reach, conformance asserted mechanically.
- **Absorbed 2026-11-02 (#456, the eighth slice)**: records 0007, 0009, 0035, 0040, 0045, 0047 and 0048,
  each a section above, every decision unchanged. Constrained by [ADR-0002](./0002-fully-static-spa-no-backend.md)
  and its section [*Content and OG resolved at build time*](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)
  · [ADR-0003, *The application security posture*](./0003-trunk-based-single-environment.md#the-application-security-posture)
  decided the diagram toolchain · per locale under [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)
  and [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) · titles constrained by
  [ADR-0041](./0041-per-article-og-cards.md) · facts once per [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)
  · the off-menu title source serves [ADR-0054](./0054-analytics-schema-page-derived-from-the-emitting-code-off-the-menu.md).
