# 0041. Per-article OG cards — generated at build time, keyed by the article key, derived in code

- **Status:** accepted (safe class — ratified by the `critical-reviewer` on merge, per
  [ADR-0003](./0003-trunk-based-single-environment.md)'s 2026-07-30 amendment, which is also what makes
  `proposed` the wrong status here: the amendment that made reader-facing `product` work safe to decide
  without the owner is the same one that removed it from their queue, so leaving it `proposed` would
  assign the flip to nobody. Same call, same reasoning, as ADR-0039 and ADR-0040.)
- **Date:** 2026-07-30
- **Deciders:** the owner
- **Supersedes / superseded by:** —
- **Driven by:** Issue [#269](https://github.com/tedeuxx/tadeumendonca-io/issues/269) · scope narrowed by
  [#270](https://github.com/tedeuxx/tadeumendonca-io/issues/270) closing the same day (Instagram is not a
  distribution surface) · constrained-by [ADR-0037](./0037-localized-article-slugs.md) (slugs are
  per-locale and editable) and [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) (OG per locale) ·
  extends [ADR-0005](./0005-og-coverage-every-public-url.md) · same architectural shape as
  [ADR-0040](./0040-build-time-mermaid-diagrams.md), deliberately

## Context & problem
Every route on the site advertises the same `og:image` — `public/og-default.png`
([`src/lib/site.ts`](../../apps/fed/src/lib/site.ts)). It is a good card, and it is the *only* card. So the
two articles a reader meets in a timeline unfurl as **the same link**: identical image, differing only in a
title line that most surfaces render small and grey beneath it. The share affordances shipped by
[#267](https://github.com/tedeuxx/tadeumendonca-io/issues/267) and the campaign tagging of
[ADR-0039](./0039-share-campaign-tagging.md) both assume the shared link is worth clicking; a card that
cannot be told apart from the last one is where that assumption fails, before any of the measurement
starts.

**The property that shapes every other decision in this record: an OG card is the least reversible
artifact on this site.** A scraper pins the card it first fetches. A wrong card therefore **outlives the
merge that fixed it** — permanently, on the post that already carried it, while every later share is
correct. This repo has already paid for that once:
[#213](https://github.com/tedeuxx/tadeumendonca-io/issues/213) served the home page's card to every scraper
because nothing objected. Three of the five decisions below look like over-caution read on their own and
are simply this property applied; they are recorded together for that reason.

## Decision drivers
- **Two shared articles must not look like the same link** — the whole point.
- **A wrong or missing card cannot be taken back**, so the failure has to be a *red build*, never a
  degradation on a served page (the ADR-0040 rule, for a stricter reason: a diagram is wrong on a page a
  reader can revisit; a card is wrong in someone else's timeline forever).
- **Identity is the article KEY, not a URL** ([ADR-0037](./0037-localized-article-slugs.md)) — slugs are
  per-locale and expected to be corrected after publication.
- **Nothing is re-typed** — the card's text is the article's own frontmatter title, like `/cv.pdf` is
  printed from `profile.ts` ([ADR-0034](./0034-build-time-cv-pdf-static-artifact.md)).
- **Build time, not runtime** ([ADR-0002](./0002-fully-static-spa-no-backend.md),
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)) — there is no renderer to call, and a scraper
  does not execute JavaScript.
- **Per locale, because the title is per locale** ([ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)).
- **Lean by design** ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)) — the smallest card that
  fixes the problem, not the most informative one.
- **`iac/` untouched** — cards are static objects like every other, served by the existing behaviour.

## Considered options

### What goes on the card
1. **The existing card art, with the article's TITLE over it** (chosen, owner 2026-07-30). One line
   changes relative to `og-default.png`; the design, palette, mark and footer meta are the same, so the
   two cards read as one family. *Trade-off:* the card carries no date, so a two-year-old article unfurls
   looking as current as today's — the timeline gives the reader no age signal at all.
2. **Title + date + tag** — explicitly rejected. The information is **free** (both are already in the
   frontmatter, both already pass the cross-edition fact check in `content.ts`), which is exactly why it
   needed rejecting on purpose rather than by omission. *Why not:* an OG card renders **small** in a feed;
   every element added competes for the space that makes the title legible at thumbnail size, and the
   title is the thing that distinguishes two articles. Cheap to add is not the same as free to carry.
3. **Title + the campaign signature** — rejected, and for a different reason than option 2: it is not a
   design call at all. The signature belongs to
   [#271](https://github.com/tedeuxx/tadeumendonca-io/issues/271), which is `content` backlog — the
   **owner's voice**, and a boundary class the reviewer does not merge (ADR-0003's 2026-07-30 amendment).
   Putting it here would couple a mechanical slice to a decision that has not been made and cannot be made
   by this slice.

### How many aspect ratios the generator emits
Chosen: **one — 1200×630.** [#183](https://github.com/tedeuxx/tadeumendonca-io/issues/183) originally
bundled a 1080×1920 Story output with this work.
[#270](https://github.com/tedeuxx/tadeumendonca-io/issues/270) closed the same day on the finding that
**Instagram is not a distribution surface** for this site
([ADR-0038](./0038-content-distribution-linkedin-and-x.md) names LinkedIn and X), which removes the only
consumer the second ratio had. *Rejected — emitting it anyway "since the layout is already there":* it
would double the committed binary per article to serve a surface nobody publishes to, and a second layout
is a second thing that can overflow, silently, on a card nobody looks at.

### What the card file is named after
1. **The article KEY plus the locale — `/og/<key>.<locale>.png`** (chosen). The key is the filename base,
   the identity `lib/content.ts` already treats as stable and never exposes as a URL. *Trade-off:* the
   public URL of a card is therefore not derivable from the article's public URL — `/en/blog/my-commitment`
   advertises `/og/my-commitment.en.png` only because the EN slug happens to equal the key by convention;
   for `/pt/blog/meu-compromisso` the two differ, and anyone reading the served HTML sees a filename that
   matches neither the path nor the title.
2. **The per-locale slug** — *Why not, and it is the decisive argument:* ADR-0037 makes slugs **per-locale
   and editable after publication**; correcting one is expected maintenance. A slug-named card is
   orphaned the moment that happens. And an orphaned card is **not** a broken image on a page — the page
   is fine. It is an **`og:image` URL that 404s**, which every scraper that already fetched it has
   pinned. That is the least reversible failure this feature can have, so the naming removes it **by
   construction** rather than by remembering.

3. **The site-wide DEFAULT card, added by #167 and decided the other way — `og-default.png` for English,
   `og-default.<locale>.png` for everything else.** Asymmetric on purpose. The article cards were named
   into an empty namespace, so option 1 cost nothing; `/og-default.png` has been serving since launch and
   is pinned by every link already shared. Renaming it to `og-default.en.png` would **manufacture the
   404 that option 2 is rejected for** — same failure, arriving from the opposite direction. The suffix
   is therefore *additive*, and English keeping the bare name is also true rather than merely convenient:
   English is the x-default edition (ADR-0024).
   *Considered and rejected:* rename to `og-default.en.png` **and leave a byte-identical copy** at the old
   path, which buys the symmetry with no 404. Rejected because two files with identical bytes and **no gate
   keeping them in sync** is drift-by-remembering — the thing option 2 above is rejected for. A
   regeneration that updated one and not the other would be silent, permanent, and invisible.

### Where `ogImage` comes from
1. **Derived in code, in `buildEditions`, after the parity loop** (chosen) —
   `editions[locale].ogImage = '/og/<key>.<locale>.png'`. *Trade-off:* an author cannot override the card
   for one article by writing frontmatter; the derivation overwrites whatever was authored.
2. **Authored per article in frontmatter** — *Why not, two independent reasons, either sufficient:*
   (a) an author who forgets the line **silently gets the generic card** and nothing objects — the #213
   failure mode restored as the default path; (b) it is **not available**: `ogImage` is in `FACT_KEYS`, the
   set of facts the two editions must agree on, and a per-locale card **cannot** agree by construction, so
   authoring one would make **every** article throw at module load.

**The ordering is part of the decision, not an implementation detail.** The derivation runs *after* the
fact-parity loop precisely so the guard stays intact for anything an author *does* write: authored
`ogImage` values are still compared across editions and still throw when they disagree, and only then is
the generated path written over the top.

### What happens when a card is missing, stale, or cropped
Chosen: **a red build, in every direction that can be detected in Node** (below). *Rejected — falling back
to `og-default.png` when a card is absent:* it is the current behaviour, it is the defect, and as a
*fallback* it is worse than as a default, because it hides the very thing that was just built to be
visible.

## Decision outcome
Chosen: **`npm run gen-og-articles` (`apps/fed/scripts/gen-og-articles.mjs`) renders one 1200×630 PNG per
article per locale into `apps/fed/public/og/`, committed**; `lib/content.ts` derives the `og:image` path
from the key and locale; two mechanical gates assert the set is right.

**This is deliberately the same architectural shape as
[ADR-0040](./0040-build-time-mermaid-diagrams.md)** — a build-time artifact rendered in the Playwright
Chromium the prerender already installs, committed to the repo, guarded by a **bidirectional set-equality
test** in Node. It is not re-derived here. The precedent is followed on purpose: the alternatives (a
runtime renderer, an uncommitted artifact regenerated in CI, a new browser toolchain) were argued and
rejected in 0040 against ADR-0002/0004 and ADR-0021's `--ignore-scripts` floor, and none of those
constraints changed. `scripts/og-cards.mjs` is the pure half, split from the generator for 0040's reason:
everything that decides *which* cards must exist is decision logic and belongs where a test reaches it
without a browser.

**The generator deletes before it writes.** Every `.png` in `public/og/` is removed and the set rendered
whole. *Rejected — an incremental write:* it leaves the card of a **retired** article behind, and a card
that outlives its article is the exact failure this feature cannot take back.

**The generator refuses to publish an overflowing title.** The card layout is `overflow:hidden`, so a
title too long for the canvas produces a **valid PNG with the words cut off** — a screenshot of an
overflowing box is still a screenshot, and nothing in the pipeline can see the difference. So after
rendering, the generator measures `document.body.scrollHeight > clientHeight` and **throws**, naming the
article, the locale, the size and the title. A three-step size ladder (104 / 80 / 62px, keyed off title
length) exists because the default card's hook was two short lines a designer controlled and an article
title is neither: it is authored for the page, in two languages, and **pt-BR runs longer than en for the
same sentence** — the two editions are authored independently and can land on different rungs.

**Failure is a red build, both directions** (`apps/fed/scripts/og-cards.test.mjs`): the card set must
equal the article set. `missing` ships the 404 defect described above. `orphaned` **breaks nothing at
all**, which is precisely why `public/og/` would quietly accumulate cards for articles that no longer
exist and nobody would ever look. Plus a guard against the **false green**: with no articles found both
lists are empty and the set-equality assertion passes *having compared nothing* — the shape a glob bug
takes, and indistinguishable from a healthy repo. That guard is 0040's amendment lesson applied at
authoring time rather than after the fact.

**An E2E follows the advertised URL rather than trusting the generator ran**
(`apps/fed/e2e/seo.spec.ts`): for each locale's article it reads `og:image` out of the **served** HTML,
asserts it is not `og-default`, fetches it and requires **200 + `image/png`**, and asserts the two
editions do not resolve to one card — which would satisfy every other assertion while defeating the
feature entirely. **Verified by mutation:** removing one card from the built artifact turns it red and
names the URL.

## Consequences

**Good**
- ~~Two shared articles stop unfurling as the same link — the reader in a timeline can tell them apart,
  which is the whole objective.~~ **Overstated at the time of writing; discharged by #167 (2026-07-31).**
  The card became *distinct*, and in the same commit stopped rendering at the size where distinctness is
  visible. `useDocumentHead` gated `og:image:width/height/type/alt` on `img === DEFAULT_OG_IMAGE` — a
  condition that was correct while "a custom image" meant "a size we do not know", and that this ADR's own
  decision falsified: every article card is rendered at exactly 1200×630 by our generator. So every article
  shipped with the dimension block **stripped**, and the code's own comment says what that costs — *"without
  it they fetch first and guess, and the fallback guess is the small square thumbnail."* On WhatsApp and
  LinkedIn, the two surfaces ADR-0038 names as the distribution channels, the reader got a small square of a
  card built to be told apart at a glance. The article also lost `og:image:alt` entirely, which is the
  accessibility half of the same line. Corrected in #167: the condition is now *"did this build generate the
  card"*, and `alt` is derived from the article's own title rather than shared — size is a fact about every
  card, the description of the picture is not.

  Recorded rather than quietly fixed, and this is the second time in this record: the amendment above about
  the one-axis overflow guard, and this one, are the same failure at different altitudes. **Nothing here was
  caught by a gate.** The card set matched, the E2E followed the advertised URL to a 200 `image/png`, the
  build was green, and the defect was in the four tags *beside* the one everything was asserting. A test
  suite organised around "is there a card" cannot see "is the card usable" — that is the standing lesson,
  not the specific tag.
- The card's text is the article's own frontmatter title, so it **cannot be re-typed wrongly**; there is
  no second place to update when a title changes.
- The naming survives a slug correction by construction, so the maintenance ADR-0037 explicitly expects
  cannot orphan an `og:image` a scraper has pinned.
- A forgotten card is a **red build**, not a silent fall back to the generic card — the #213 failure mode
  is closed on the path where it actually happened.
- An overflowing title is caught in the generator rather than discovered in someone's feed.
- No new toolchain, no new browser, no `iac/`, no runtime cost: it reuses the Chromium the prerender,
  `/cv.pdf` and the E2E already require.

**Bad / accepted costs**
- **A committed binary per article per locale, growing with the archive.** Two PNGs for every article,
  forever, in a repo that is otherwise text. Bounded and small today; it is a curve, not a constant.
- **The size ladder is a heuristic, not a layout engine.** It keys off *character count*, so a short title
  containing one very long word can still overflow. The measurement catches it — on **both axes** — but as
  a **build failure the author has to resolve** (shorten the title, or widen the ladder), not as something
  the generator solves. That is the deliberate trade: refusing is safe, guessing is not.

  *Both axes, and stated that way because an earlier revision of this bullet claimed the coverage the code
  did not have.* The first implementation measured `scrollHeight` only. Since the ladder keys off character
  count, an ordinary pt-BR word — `Contrarrevolucionarios`, 22 characters, therefore rendered at 104px —
  runs 169px past the canvas, is sliced by `overflow:hidden`, and never grows `scrollHeight`, because the
  text still fits **vertically**. The generator wrote the PNG, the set-equality test saw a file at the
  derived path, and the E2E saw `200` and `image/png`. Every gate green, on a card with a word cut in
  half, on the one artifact this record is organised around being unable to take back. Found by the
  `critical-reviewer` driving the shipped layout in a browser rather than reading it — and worth recording
  as a defect in the RECORD as much as in the code: a decision record that is wrong in the direction of
  false safety tells the next author the guard covers the case it misses.
- **Regeneration rewrites every PNG, and the diff is binary and unreviewable by reading.** There is no
  equivalent of 0040's deterministic element ids here — a screenshot has no stable identity to pin. The
  set-equality test is what stands in for reviewing the changeset, and it is a weaker substitute; stated
  rather than implied.
- **Nothing verifies the card's CONTENT matches the article's current title.** Every gate here checks that
  a file *exists at the derived path*. CI never runs the generator (the artifact is committed, exactly as
  in 0040), so a card rendered from an **older** title — or hand-replaced entirely — satisfies the unit
  test, the E2E, the build and the prerender. Editing a title and regenerating produces a correct card;
  editing a title and *not* regenerating produces a stale one that is green everywhere. **The guarantee
  this pipeline offers is "a card exists for every article", not "this card was generated from this
  title."** Re-rendering in CI to diff would be worse for 0040's reason — the render is
  font-environment dependent, so it would flake, and a red that means "the CI image differs" trains
  everyone to ignore the red that means "the card is wrong."
- **The card carries no date**, per the decision above: an old article unfurls looking current.
- **The residue that has no fix:** every one of the above, when it does bite, bites *permanently on the
  posts already shared*. The gates shorten the window; nothing closes it retroactively. The owner has
  accepted this class of cost before (ADR-0003's 2026-07-30 amendment records the same OG-pinning residue
  for reader-facing copy) — it is a bounded per-post cost, not a threat to the site.

**Neutral**
- **`iac/` untouched.** The cards are static objects under the existing S3/CloudFront behaviour
  ([ADR-0013](./0013-s3-cloudfront-hosting.md)); no cache-behaviour, edge or Terraform change.
- One aspect ratio only; nothing here decides whether a Story-format card ever returns, and #270 removed
  the surface that wanted one.

## Links
- **Implements** Issue [#269](https://github.com/tedeuxx/tadeumendonca-io/issues/269); scope narrowed by
  [#270](https://github.com/tedeuxx/tadeumendonca-io/issues/270) (Instagram is not a distribution surface,
  so the 1080×1920 Story output [#183](https://github.com/tedeuxx/tadeumendonca-io/issues/183) bundled
  here is out).
- **Deliberately does not couple to** the campaign-signature decision (issue
  [#271](https://github.com/tedeuxx/tadeumendonca-io/issues/271)) — `content` backlog, the owner's voice,
  a boundary class per [ADR-0003](./0003-trunk-based-single-environment.md)'s 2026-07-30 amendment.
- **Constrained by [ADR-0037](./0037-localized-article-slugs.md)** — per-locale, editable slugs are the
  reason the card is keyed by the article key.
- **Constrained by [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)** — one card per locale,
  because the head is per locale and the title is per locale.
- **Extends [ADR-0005](./0005-og-coverage-every-public-url.md)** — OG completeness now means *distinct*,
  not merely *present*, on the article route.
- **Same architectural shape as [ADR-0040](./0040-build-time-mermaid-diagrams.md)** — build-time generated
  artifact, committed, guarded by a bidirectional set-equality test with a false-green guard. Followed as
  precedent rather than re-derived; its "the artifact is not proven to come from the source" cost applies
  here too, and is restated above.
- **Constrained by [ADR-0002](./0002-fully-static-spa-no-backend.md) /
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)** — build time, nothing rendered at runtime.
- **Consistent with [ADR-0034](./0034-build-time-cv-pdf-static-artifact.md)** — the same principle as
  `/cv.pdf`: a published artifact is *printed from* the canonical source, never re-typed.
- **Consistent with [ADR-0008](./0008-brutalist-mono-identity.md)** — the card is the identity's palette,
  mark and type, one line changed from `og-default.png`.
- **Consistent with [ADR-0013](./0013-s3-cloudfront-hosting.md)** — static objects, `iac/` untouched.
- **Serves [ADR-0039](./0039-share-campaign-tagging.md) and
  [ADR-0038](./0038-content-distribution-linkedin-and-x.md)** — the shared and distributed link now
  carries a card that identifies the article it points at.
- Implementation: `apps/fed/scripts/gen-og-articles.mjs`, `apps/fed/scripts/og-cards.mjs`,
  `apps/fed/scripts/og-cards.test.mjs`, `apps/fed/src/lib/content.ts` (the derivation in
  `buildEditions`), `apps/fed/e2e/seo.spec.ts`, `apps/fed/public/og/`.
