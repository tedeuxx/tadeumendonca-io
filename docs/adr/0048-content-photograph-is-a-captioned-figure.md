# 0048. A photograph is evidence, not a carrier of words — a content photograph is a captioned figure whose load-bearing text is authored beside it

- **Status:** accepted (safe class — reader-facing content and bundle, no `iac/`, no new public URL, no new
  irreversible surface; ratified by the reviewer on merge, per
  [ADR-0003](./0003-trunk-based-single-environment.md)'s 2026-07-30 amendment). **What the owner may want
  to overturn is named in Decision outcome** — whether a photograph belongs on `/architecture` at all is an
  editorial call this record does not make; it decides only what happens once one is there.
- **Date:** 2026-08-09
- **Deciders:** `tech-lead`, on the design of the figure class; the builder declined to write the record and
  was right to — the decision is not the diff's
- **Supersedes / superseded by:** —
- **Driven by:** Issue [#415](https://github.com/tedeuxx/tadeumendonca-io/issues/415) · PR
  [#419](https://github.com/tedeuxx/tadeumendonca-io/pull/419) · **narrows the scope of**
  [ADR-0040](./0040-build-time-mermaid-diagrams.md) (amended there — its rejection of checked-in rasters is
  a rejection about **diagrams**) · **narrows one measured claim of**
  [ADR-0047](./0047-authored-svg-figures-outside-the-mermaid-pipeline.md) (amended there — its
  no-third-path bound governs **drawn** figures, and its copy-payload finding no longer holds) · changes
  the behaviour of [ADR-0035](./0035-static-repo-cards-in-longform.md)'s copy-as-markdown payload (#387) ·
  constrained by [ADR-0002](./0002-fully-static-spa-no-backend.md) and
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) · spends
  [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md) · per locale, per
  [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)

## Context & problem
`/architecture` acquired four photographs the owner took in Silicon Valley, one of them a museum wall
carrying a Donald Knuth quotation. That is a **third** kind of figure on a page that already had two, and
the two it had are both **drawings whose subject is words we author**:
[ADR-0040](./0040-build-time-mermaid-diagrams.md)'s mermaid fences, compiled to inline SVG and pinned by a
committed artifact, and [ADR-0047](./0047-authored-svg-figures-outside-the-mermaid-pipeline.md)'s
` ```venn ` fence over a fixed geometry, pinned arithmetically against the authored words of both
editions.

**A photograph satisfies none of ADR-0047's three conditions, and the mismatch is structural rather than
an omission.** That record's bound requires the figure's **words** to live in the markdown body, its
**arrangement** to be asserted arithmetically against those words, and the result to ship in the
prerendered bytes. A photograph's subject is not words we author — it is a thing that was in front of a
camera; its arrangement is not arithmetically assertable, because there is no authored geometry to compute
over; and what ships in the bytes is a raster, which
[ADR-0040](./0040-build-time-mermaid-diagrams.md)'s option 2 and ADR-0047's option 4 both rejected outright
in the same words: *"an `<img>` makes every label a picture of a word."*

So the question is not *may a photograph appear*. It is: **what is a photograph allowed to be
load-bearing for, and what carries the part it cannot?** The Knuth wall is the case that forces an answer.
Its words are the reason the photograph is on the page — and they are inside a JPEG, where they are
crawlable by nobody, selectable by nobody, translatable by nobody and measurable by no test.

**This was never a green field, and that is the third thing that makes it a decision.**
`apps/fed/src/styles/index.css` already carried a default for a markdown image on `main` before this
slice, so four `![…](/photos/x.jpg)` lines would have **rendered**: unlabelled, uncaptioned, with no
reserved box and no alt requirement, with **every gate green**. Doing nothing was not "not deciding". It
was shipping a silent default that no check in this repo could see, on the page whose stated thesis is
that its claims are checkable.

**The rule this record quoted was `.markdown img { max-width: 100%; border-radius: 0 }`, and it is not
what is at head.** It was rewritten to `:where(.markdown) img` in
[#492](https://github.com/tedeuxx/tadeumendonca-io/pull/492), for a reason this record has to hold
because it is the reason the rule matters: `.markdown img` has specificity **(0,1,1)**, which beats every
Tailwind utility **(0,1,0)**, so the width cap `PhotoFigure` emitted on its portrait branch — `max-w-md`
from #482, `max-w-[224px]` from #488 — **never applied**, and the badge laid out at the full column
through two slices that each believed they had shrunk it. `:where()` contributes zero specificity, so the
rule drops to (0,0,1): still the default for an image that declares no cap, no longer a silent veto over
one that does.

**Verify it at head** — the fixed-string match is against the selector, not against the paragraph of
comment above it, which is what the previous command in this record accidentally selected once the rule
changed. A command that returns a *comment* about the rule reads to whoever runs it as confirmation, and
that is worse than a command that returns nothing:

```console
$ grep -Fn ':where(.markdown) img {' apps/fed/src/styles/index.css
532::where(.markdown) img {
```

## Decision drivers
- **Words the page depends on must be real text** — crawlable, selectable, translatable, screen-readable.
  This is ADR-0040's strongest argument and ADR-0047 restates it; a photograph cannot satisfy it and must
  therefore not be asked to.
- **Legibility inside a raster is not assertable, and no amount of test-writing changes that.** The Venn's
  labels are text nodes with bounding rects, which is why ADR-0047 could compute over them. Type inside a
  JPEG is pixels. A test can prove the image decoded and sits inside its frame; it cannot prove a reader
  can read what is printed on the wall in it.
- **The page must not scroll sideways at 320px**, and a wide raster is the single most likely thing to
  break that (`e2e/responsive-overflow.spec.ts`, and ADR-0047's 320px sweep).
- **The body travels.** `shareMarkdown.ts` copies this page verbatim into the reader's clipboard (#387,
  [ADR-0035](./0035-static-repo-cards-in-longform.md)), so a reference that is correct on the page and dead
  in a document is a defect, not an implementation detail.
- **The layout must not shift when the bytes land.** Four unreserved images on one long page is cumulative
  layout shift on the page whose argument is that the machine is shown rather than claimed.
- **Two editions, always** ([ADR-0032](./0032-i18n-locale-layer-english-baseline.md)) — the file does not
  translate, the words beside it must.
- **Lean by design** ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)): no new dependency and
  no new tool class to put four JPEGs on a page.
- **Nothing fetched at runtime** ([ADR-0002](./0002-fully-static-spa-no-backend.md),
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)) — the assets are committed and served from the
  origin, like everything else.

## Considered options

### What a photograph is allowed to carry
1. **The photograph is evidence; the words it depicts are authored beside it in prose** (chosen). The
   Knuth quotation is a real markdown blockquote **above** its photograph, with the attribution, and the
   photograph's `alt` ~~carries the wall's words verbatim so a reader who cannot see it is not told there
   is a wall and left there~~ **describes the frame, per edition** — see condition 1 in **Decision
   outcome** for why the first version of this clause was struck the same day: a reader who cannot see the
   photograph has *already* been given the words by the blockquote, and repeating them in the `alt`
   delivers the same claim twice with no way to tell it is the same object.
2. **Let the photograph carry the quotation, with the caption pointing at it** — *why not, and this is the
   option the whole record exists to refuse:* it is exactly the failure ADR-0040 rejected a checked-in
   raster for, arriving through a different door. The quotation would be a picture of a word to the
   crawler, to the screen reader, to selection, to translation and to every assertion this repo can write.
   The page would then be *claiming* the words are Knuth's while making them unverifiable — on the one page
   whose thesis is the opposite of that.
3. **Strip the photographs to alt text in the copy-as-markdown payload** — *why not:* it treats the picture
   as decoration and loses the evidence. These four images are the only first-hand thing on a page
   otherwise made of diagrams and links; a payload that drops them hands the reader an argument with its
   only exhibit removed. This is also the option that would have made the payload question disappear, and
   it disappears by deleting the content rather than by resolving it.

### Which mechanism renders it
1. **The same lone-paragraph facade `Markdown.tsx` already uses three times** (chosen) — a paragraph that
   is nothing but `![alt](/photos/x.jpg "caption")` becomes a `<PhotoFigure>`; anything else, and any
   unregistered image target, stays exactly what the renderer would otherwise make of it. The caption is
   the **standard CommonMark title slot**, so authoring stays portable, renders on GitHub, and the words
   sit in the content file per locale where a translator sees them. *Trade-off:* the figure treatment is
   invisible in the markdown — a photograph is a figure because it is alone in its paragraph, which is a
   rule the author has to know.
2. **A ` ```photo ` fence, extending ADR-0047's path** — *why not, and it was the obvious move:* ADR-0047's
   bound offers exactly two exits, *extend this path under the same three conditions* or *do not draw the
   figure*, and a photograph **cannot meet the second condition**. Its arrangement is not asserted
   arithmetically against authored words, because there are no authored words to compute over. A fence
   whose whole justification is a guarantee it cannot provide is the appearance of one mechanism and none
   of the substance — the same reason ADR-0047 itself rejected reusing the `mermaid` info string.
3. **An `img` component handler** — *why not, and this is mechanical rather than a preference:*
   react-markdown delivers a lone image as `<p><img></p>`, so a handler on `img` returning a `<figure>`
   nests a block element inside an open paragraph — **invalid HTML and a hydration mismatch on a
   prerendered page**. `Markdown.tsx` already records that reasoning twice, for `mermaidBlock` and
   `isAdrIndex`, which is why both hook `pre` rather than `code`. Rejecting it a third time is consistency,
   not caution.
4. **Nothing — let `.markdown img` handle it** — *why not:* it is the silent default described above. It
   produces four unlabelled, unreserved images and no red anywhere, which is the failure mode this
   library's last three records were all written about.

### Which shell it wears
1. **Its own `<figure>`, sharing only the caption treatment, as an exported class string** (chosen).
   `FIGCAPTION_CLASS` is exported from `DiagramFigure.tsx` and used by `PhotoFigure.tsx`, so the two figure
   kinds read as one decision to the reader and remain two different things to a selector.
2. **Reuse `DiagramFigure` outright** — *why not, and it is checkable rather than taste:* that component
   puts `.diagram-canvas` on its box, and `e2e/diagram-centred.spec.ts` selects that class **page-wide**
   and reads `el.querySelector('svg')`. On a photograph that is `null`, every measurement in the spec
   becomes `NaN`, and **`NaN` fails every comparison** — at all four widths, in both editions, on day one.
   The CSS centring rule is `.diagram-canvas > svg` and would not select an `<img>` either, and
   `e2e/routes.spec.ts`'s background-equality check — the guard ADR-0040's amendment #3 installed after
   invisible arrows shipped — is meaningless on a raster. So the shared shell that made **two drawn**
   paths survivable is the wrong shell for the third class, and saying so here is what stops someone
   "simplifying" it back later.

### Where the intrinsic dimensions come from
1. **A committed `src/data/photos.json`, checked against each JPEG's SOF marker by a test in `scripts/`**
   (chosen). The app module types the table; `scripts/photo-assets.test.mjs` walks the JPEG segment chain
   off disk and compares, both ways — every registered file exists and is declared at the size it really
   is, and every file in `public/photos` is registered.
   **The split is forced by a recorded constraint, not by preference:** comparing numbers to a binary
   requires `node:fs`, and `tsconfig.json` records a deliberate decision that this app does not depend on
   `@types/node`. `scripts/` is outside the typechecked tree and is already where a test that reads content
   off disk lives (`architecture-diagrams.test.mjs`), so this is an existing seam rather than a new one.
   Same shape as `harness.json` and `diagrams.json`: one artifact, two readers.
2. **No dimensions at all — let the browser find out** — *why not:* "find out" is the cost. With no
   `width`/`height` the box is not reserved, the prose below is painted where the image will not be, and
   the page jumps under the reader on four figures.
3. **Hand-typed literals in the module** — *why not:* numbers about a binary are worth having only if
   something compares them to the binary. A recrop that changes a shape would leave the `<img>` reserving
   the old proportions with a green suite standing next to it.
4. **A build-time image optimiser** (sharp, an imagetools plugin, a CDN transform) — *why not:* a new
   dependency and a new tool class, against [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), to
   compress four files. The trade is only defensible while the files stay small, so **the bound is asserted
   rather than remembered**: the ~~four~~ **seven (2026-08-25, #127)** photographs are held under
   ~~1 MB~~ **1 MiB** in total by a test that names the weight when it fails. An unoptimised export dropped
   into the directory is caught there instead of in a reader's data allowance. **The bound is repo-wide and
   the count moved; the refusal of an optimiser did not — see the 2026-08-25 amendment.**

### What the copy-as-markdown payload does with an image target
1. **Absolutize to the bare origin, with no locale prefix** (chosen), while links keep `localizePath`.
2. **Leave image targets as authored** — *why not, and this is the clause that inverts:* it was the right
   rule for the world it was written in and is wrong now. `shareMarkdown.ts` recorded it as an **inert
   residual** on explicitly stated grounds — no content body embedded a root-relative image. Four
   photographs ended the premise, and inert became four dead references in every copied payload, on the one
   page whose whole point is that it travels into somebody's notes.
3. **Run images through `localizePath` too, so the two branches are one** — *why not:* `Markdown.tsx`
   registers **no `img` handler** (this slice added photographs and deliberately did not add one), so the
   renderer localizes anchors and nothing else and the browser resolves `/photos/x.jpg` against the origin.
   Localizing here would hand the reader `…/pt/photos/x.jpg`, an asset path that exists nowhere — the
   "true on the page, false in a document" defect the payload exists to close, manufactured by the fix
   rather than left by it. The asymmetry between the two branches is therefore the decision, and it is
   pinned by an assertion that fails if someone unifies them.

## Decision outcome
Chosen: **a photograph in a content body is a captioned figure that carries evidence, never words the page
depends on.** Concretely, three conditions, and they are the decision:

1. **Its load-bearing text is authored beside it, as prose — once, and in one place.** The Knuth quotation
   is a blockquote with its attribution, above the photograph. It appears **nowhere else**: not in a
   caption, and ~~repeated verbatim in the `alt`~~ **not in an `alt` either** — struck the same day, inside
   this record's own MR and before it had ever been in force, for the reason in the next paragraph. Asserted
   in both editions, in both directions: no caption and no `alt` may re-deliver the quotation, and the Knuth
   `alt` must **differ** between the editions.

   **Why the strike is kept rather than the line quietly rewritten.** This library has already done exactly
   this once — [ADR-0044](./0044-version-parts-deliberate-major-minor.md) struck two clauses inside its own
   MR, before they had ever been in force, and kept the strikes. The reason applies unchanged here: the
   deleted version is *evidence*, and this particular deletion is the most instructive sentence in the
   record. What is deliberately **not** done is add an `## Amendment` heading, which would publish
   *this decision has moved* about a decision that never shipped — the index derives that bit from such a
   heading (`scripts/adr-source.mjs`), and it would be false.

   **THE PRINCIPLE HAD ONE UNAPPLIED CORNER, AND IT WAS THE ONE READER IT MATTERED MOST TO.** This record's
   whole claim is that a photograph is evidence and the load-bearing words are authored beside it. The `alt`
   was the last place still treating the photograph as a **carrier** of those words — for the one reader who
   cannot see the photograph at all. A sighted reader met the quotation once, in type, with the picture as
   corroboration. A screen-reader user met it **twice, back to back**: the blockquote, then the byte-identical
   string announced as the image. **Duplication for a sighted reader is redundancy; for a screen-reader user
   it is the same claim delivered twice with no way to tell the two are the same object** — the second
   delivery reads as a second source. In the pt edition it was worse: an English paragraph read aloud by a
   pt-BR voice, the only English block in that edition. So the `alt` now does what condition 2 already asked
   of it and describes the frame — white serif lettering standing off a pale museum wall, Knuth's name and
   1974 below — authored per edition, in each edition's own language.

   **The two conditions were in tension from the first draft, and the code picked one.** Condition 1 as
   originally written asked the `alt` to carry the words; condition 2 asks it to describe the frame. Nothing
   in the record noticed, because for a sighted reader they never collide. Recorded as a finding rather than
   smoothed away: **a rule stated for the reader you can picture will have a corner where it is inverted for
   the reader you cannot**, and the copy lens is what found it, not any check here.

   **The assertion was inverted, not deleted** — the same move `shareMarkdown.ts`'s image case made in this
   slice, and for the same reason. A test required the `alt` to contain the quotation verbatim, to stop the
   two drifting apart; removing the quotation from the `alt` would have left that check pinning nothing.
   It now asserts the opposite — the quotation appears in no `alt` and no caption, on a distinctive fragment
   rather than the whole sentence, because a partial restatement is the realistic regression — plus the
   editions' Knuth `alt`s differing, which is what catches an `alt` left in English in the pt file. **The
   drift the old rule guarded against is still guarded; only the direction flipped.** A green that was never
   observed to go red is not a gate, and a green that survives the removal of its own subject is the same
   defect wearing better clothes.
2. **`alt` and `caption` are both required and are two different strings.** `alt` describes what is in the
   frame for a reader who never sees it; the caption says what the photograph is doing on the page for a
   reader who does. A missing one **throws at render**, which fails the build, the prerender, the unit
   tests and the E2E together — ADR-0040's "what happens when a figure is wrong" clause applied unchanged.
3. **Its box is reserved from the committed file's own measured size**, and the measurement is checked
   against the bytes rather than trusted.

**It is opt-in by `src`, and that is what keeps the facade narrow.** An unregistered image target returns
`null` from `photoFor` and stays whatever the renderer would otherwise make of it — the same shape
`repoCardFor` uses for an unregistered URL. A photograph has to be added to the registry, and therefore
measured, before it can render as a figure.

**Is this a third rendering path?** Yes, and it is deliberately **not** an extension of ADR-0047's bound,
which is why that record is amended rather than stretched. ADR-0047 governs **drawn** figures — things
whose subject is words we author and whose arrangement we can compute. This record governs **captured**
ones. The two bounds do not overlap, and merging them would have required either weakening ADR-0047's
arithmetic condition to nothing or claiming a guarantee for a raster that no test can supply.

**What this record does not decide, and it is the owner's:** whether photographs belong on `/architecture`
at all. That is an editorial judgement — `product-lead`'s lens, not this one — and the cheap thing to
overturn is the four `![…]` lines in two content files, which changes no mechanism. What this record fixes
is that *if* they are there, they are figures with authored words beside them rather than pictures of
words.

**The assets are produced out of band, and every property is asserted on the committed binary rather than
on the recipe.** There is no crop pipeline in this repo and none is proposed — four files, cropped once.
That choice is only safe because the artifact is what gets checked, and the slice paid for the lesson: an
export pass produced files whose **pixels were correct and whose EXIF `Orientation` tag said "rotate 90°"**,
which browsers honour by default (`image-orientation: from-image`). That is a photograph turned on its side
inside a box reserved from the un-rotated dimensions — a broken picture **and** a broken reservation, from
metadata no visual check of the pixels can see. It is now pinned as the **absence of any Exif block**,
rather than as "orientation equals 1", because absence is the property the export step actually establishes
and it cannot be satisfied by accident.

**The general form of that, which is the part worth keeping:** the tool reported success on both halves of
the crop, and one of the two commands was a **silent no-op** — correct exit code, unchanged image. Both
defects were found by looking at the output, not by reading the command that produced it. A record whose
guards live on the recipe would have been green for both.

## Consequences

### The honest bound — stated first, because it is the reason the design is shaped this way
**Nothing here proves the photograph is readable, and nothing can.** What the assertions actually prove,
in full:

- the page body **never scrolls sideways**, at 320 · 390 · 768 · 1280, in both editions;
- each image sits **inside its own figure** on both sides, and **actually decoded** (`naturalWidth > 0`) —
  without which a `src` that 404s still lays out a box from the width/height attributes and every geometry
  assertion passes on four broken images;
- **alt and caption are non-empty** as rendered, in both editions, and differ between them;
- **the quotation is delivered exactly once** — it appears in no `alt` and no caption, in either edition,
  and the Knuth `alt`s differ across editions, which is what catches one left untranslated. This is a
  check about the **screen-reader** reader specifically, and it is the only one here that is;
- the **quotation's own text node is inside the viewport** at 320 and 390 — measured in the *reader's*
  coordinates rather than the document's, which is the lesson ADR-0047's figure paid for, and guarded by a
  mutation that shoulders the element out of the viewport and requires the same measurement to go red.

That last one is the whole design in one assertion: **the quotation is checkable because it is prose, not
pixels.** The photograph's own legibility is not asserted because it is not assertable — and that is the
reason the words are authored beside the picture, not a caveat attached to a design that wishes it could
do better. A reviewer looking for the missing check should stop looking; there is no version of this where
it exists.

**Good**
- The words the page depends on are **real text in the prerendered bytes** — crawlable, selectable,
  translatable, screen-readable — with the photograph as corroboration rather than as the carrier. **And
  once**: the `alt` stopped being a second copy of them, which is the correction condition 1 records.
- **A silent default became an explicit one.** `.markdown img` would have rendered all four with no gate
  red; every one of them now fails loudly if it loses its alt, its caption, its file or its declared size.
- **The reservation is true by measurement**, both directions — a recrop that changes a shape and forgets
  the table turns the suite red rather than shipping a wrong box.
- **A dead reference in every copied payload was closed**, not merely noticed: an image target now
  absolutizes to the origin while a link still carries the reader's edition, and the asymmetry is pinned by
  an assertion that fails if the branches are unified.
- **Two figure kinds look like one decision and remain two things to a selector** — shared caption
  treatment, no shared class that a spec measures `svg` inside.

**Bad / accepted costs**
- **A THIRD figure class on one page.** ADR-0047 already recorded that a second authoring path is a fork in
  a convention and that the cost lands on the third kind. This is the third kind. The bound offered against
  it — drawn versus captured — is a rule, not an enforcement: nothing mechanical stops a fourth.
- **The figure treatment is invisible in the markdown.** A photograph is a figure because it is alone in
  its paragraph. An author who wraps a sentence around it silently gets an inline image instead, and the
  only thing that catches it is the parity probe's count.
- ~~**Four rasters ship unoptimised**~~ **Seven, since #127**, deliberately. The ~~1 MB~~ **1 MiB** total is
  a bound asserted by a test, not an optimisation, and ~~it will need revisiting the first time a fifth
  photograph is worth adding~~ **that revisit is done: the fifth photograph arrived as four, the trigger
  fired, and the bound was ruled to STAND with 193.0 KiB left — see the 2026-08-25 amendment**.
- **The assets have no in-repo producer.** They were cropped by hand with a tool that silently no-opped
  once; the repo checks the artifact and cannot check the recipe. A future recrop repeats the hand path.
- **It spends [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), unmeasured.** `PhotoFigure.tsx`
  and `data/photos.ts` are statically imported by `Markdown.tsx`, so they land in whatever chunk serves
  every long-form page, not only `/architecture`. **There is still no bundle-size gate in this repo**, so
  this is an unmeasured, ungated cost, stated as one — the same residual ADR-0047 recorded, now with one
  more contributor.
- **A `figcaption` class string is shared across two components by import.** It is the smallest shareable
  unit and it is still a coupling: a change to the diagram caption silently restyles every photograph.

**Neutral**
- **`iac/` untouched**, and stated with the caution ADR-0041 earned: no cache behaviour, no origin, no
  Terraform resource is involved — not merely that the output happens to be static. The JPEGs are served
  from the existing bucket and distribution as ordinary build output.
- **No `og:title`, no URL and no OG card changes**, so nothing here is pinned by a scraper
  ([ADR-0041](./0041-per-article-og-cards.md)). The photographs are not OG images.
- **The prerender contract is unchanged** — the figures are static markup with no runtime behaviour at all,
  which is one thing this class does **not** cost that ADR-0047's did.

## Links
- **Narrows the scope of [ADR-0040](./0040-build-time-mermaid-diagrams.md)**, which is amended to point
  here. Its rejection of a checked-in raster is a rejection about **diagrams**, and its argument — *"an
  `<img>` makes every label a picture of a word"* — is precisely **why** the quotation is authored in prose
  here. This record applies that reasoning rather than contradicting it.
- **Narrows two claims of [ADR-0047](./0047-authored-svg-figures-outside-the-mermaid-pipeline.md)**, which
  is amended to point here: its no-third-path bound governs **drawn** figures, and its measured
  *"the copy-as-markdown payload is unaffected"* clause no longer holds, because the payload now
  absolutizes image targets.
- **Changes [ADR-0035](./0035-static-repo-cards-in-longform.md)'s payload behaviour** (#387) — image
  targets are absolutized to the origin; links are unchanged.
- **Constrained by [ADR-0002](./0002-fully-static-spa-no-backend.md) and
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)** — committed assets, nothing fetched, everything
  resolved before it is served.
- **Consistent with [ADR-0005](./0005-og-coverage-every-public-url.md)** — the figures and the quotation are
  in the prerendered HTML like everything else on a public URL.
- **Consistent with [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)** — one file, two sets of
  words: the alt and the caption are authored per edition, with parity and non-identity both asserted.
- **Spends [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)** — no optimiser, no image library,
  a twenty-line JPEG header walk instead of a decoder; and a small, unmeasured amount of component
  JavaScript, named above rather than implied.
- Implementation: `apps/fed/src/components/PhotoFigure.tsx`, `apps/fed/src/components/PhotoFigure.test.tsx`,
  `apps/fed/src/components/Markdown.tsx`, `apps/fed/src/components/Markdown.test.tsx`,
  `apps/fed/src/components/DiagramFigure.tsx`, `apps/fed/src/components/shareMarkdown.ts`,
  `apps/fed/src/components/shareMarkdown.test.ts`, `apps/fed/src/data/photos.ts`,
  `apps/fed/src/data/photos.json`, `apps/fed/src/data/photos.test.ts`,
  `apps/fed/scripts/photo-assets.test.mjs`, `apps/fed/src/content/architecture-photos.test.ts`,
  `apps/fed/e2e/content-photo.spec.ts`, `apps/fed/public/photos/`,
  `apps/fed/src/content/architecture.{en,pt}.md`.

## Amendment, 2026-08-25 — the fifth photograph arrived as four; the bound STANDS and 193.0 KiB is what is left

**What this record said, in two places.** In *Considered options* → *Where the intrinsic dimensions come
from*, option 4: *"the four photographs are held under 1 MB in total by a test that names the weight when
it fails."* In *Consequences* → *Bad / accepted costs*: *"**Four rasters ship unoptimised**, deliberately.
The 1 MB total is a bound asserted by a test, not an optimisation, and it will need revisiting the first
time a fifth photograph is worth adding."* Both clauses are struck in place above and neither is deleted —
they are the reason this amendment exists.

**#127 is that fifth photograph, and it is four of them.** The `/me` journey strip adds
`journey-aws-summit.jpg`, `journey-corridor.jpg`, `journey-home-office.jpg` and `journey-sticker-lid.jpg`
to `apps/fed/public/photos/` — the directory `photo-assets.test.mjs` sums. **The bound was always
repo-wide**: the assertion sums every entry of the registry, not the four rasters this record was written
about, and its sibling arm *"knows about every file in public/photos"* makes the directory and the
registry the same set in both directions. So the count in both clauses is a claim about the repo, and it
is now wrong by three.

**Measured at named commits, with the commands that produce the figures:**

```
git ls-tree -l e496a8e apps/fed/public/photos/   # PR head:  7 blobs, 850,901 bytes
git ls-tree -l 64c8861 apps/fed/public/photos/   # main:     3 blobs, 585,682 bytes
```

- **At the head of #127 — 7 rasters, 850,901 B = 830.96 KiB**, against a ceiling of `1024 * 1024` =
  1,048,576 B. **81.15% spent; 197,675 B = 193.0 KiB left.**
- **At `main` before it — 3 rasters, 585,682 B = 571.95 KiB**, 55.9% spent.
- **This one slice spends 265,219 B = 259.0 KiB** — a quarter of the entire budget in a single PR.

**The figures are pinned to a commit on purpose, and the live falsifier is the test rather than this
paragraph.** The base of the measurement sits inside the diff that publishes it, which is the shape that
produces a number true only in the sentence that states it; naming the two SHAs is what makes it
re-derivable by anyone at any later head. The assertion recomputes the sum on every run and names the
weight when it fails — that is the reader which does not age, and it is why no standing total is written
into the clauses above.

**Ruling: the 1 MiB bound STANDS, and it is not to be raised to fit the next photograph.** #127's builder
declined to raise it and was right, for the reason the test states in its own comment — *"a ceiling that
tracks the payload it is meant to cap can never be exceeded, which is the shape of a gate that verifies
nothing."* Raising it now would spend the only mechanism this record retained: the build-time optimiser
was refused against [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), so the asserted total is
the whole of the remaining control on image payload, and a control retuned to whatever it just failed to
constrain is not a control. **The trade being accepted, stated plainly: photographs are a scarce resource
on this site, and the scarcity is the intended effect, not a side effect.**

**So the 193.0 KiB is a constraint the next slice MEETS, not capacity it may spend.** What it buys, at
this head's own weights: #127's four frames average 66,305 B (64.8 KiB), so the remainder is **under three
more frames of that class** — and `may-week-montage.jpg` alone is 404,534 B (395.0 KiB), **twice the
entire remaining headroom**. One more journey-class frame fits; a second montage does not, and no pair of
the two does. **The next photograph is therefore a real decision, and it arrives with one of three things
named in its Issue: a frame that fits the measured remainder, a re-encode of an existing raster that pays
for it, or an explicit reopening of ADR-0001's refused optimiser.** *"There is room"* is not a safe
default at 81% and must not be inferred from the struck clauses above.

**A wording correction the measurement forced.** Both clauses said *1 MB*; the assertion is
`toBeLessThan(1024 * 1024)`, which is **1 MiB — 1,048,576 bytes**, 4.9% above 1 MB decimal. The imprecision
was harmless while the set weighed half the budget and is worth correcting now that it is not: the two
readings differ by 48,576 B (47.4 KiB), about three-quarters of an average frame in this slice, so the
remainder at this head is **193.0 KiB under the asserted bound and 145.6 KiB under the decimal one**. The
assertion is the authority — read the bound as 1 MiB.

**One hazard about the corridor frame, recorded here because this is the only place a future re-encoder
would look.** The copy lens confirmed at 16× on the committed file that the frosted door in
`journey-corridor.jpg` carries an employer name which is **not recoverable from the committed bytes**.
**That invisibility is a property of the current derivative, not of the photograph**: the originals are
unchanged in the owner's library, and `journey.ts` documents that the grayscale conversion and the
provenance are reversible by re-encoding. **Any re-encode at a larger width re-opens it.** Re-check that
frame at magnification against the file that will actually ship — the check is on the derivative, never on
the decision that produced it, and a wider re-export is exactly the change that looks like an optimisation
and is also a disclosure.

**What is unchanged.** The three conditions, the rendering path, the registry and its two-way assertion,
the reserved box, the `alt`/caption contract, and the refusal of a build-time optimiser. This amendment
corrects two counts, rules on the bound, and records one re-encode hazard.
