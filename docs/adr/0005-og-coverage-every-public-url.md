# 0005. Every public URL is SEO- and OG-complete

- **Status:** accepted · **amended 2026-11-08** (absorbs the rest of the `publication-and-distribution`
  capability, formerly records 0033, 0038, 0039, 0041, 0046, 0049, 0051 and 0054, as the sections
  *Per-article OG cards*, *A held article is isolated, not private*, *Distribution to LinkedIn and X*,
  *Which video-derived articles are published*, *Campaign tagging of shared links*, *Consent-gated GA4
  analytics*, *The GA4 event schema is immutable once it collects* and *The analytics schema page*;
  every decision is unchanged, #456)
- **Capability:** `publication-and-distribution`
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Supersedes / superseded by:** —
- **Driven by:** [ADR-0053](./0053-this-library-records-presence-and-site-architecture-one-document-per-capability.md#lean-by-design--the-keystone-every-record-is-read-through) (lean by design), [ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)

**This document is the whole `publication-and-distribution` capability.** The first half is the policy
every other section serves: each public URL is complete for a crawler and an unfurler in the HTML that
ships. The eight sections after its *Consequences* are the decisions about how a piece reaches a reader
and what the site learns when it does: the card a shared link unfurls as, how an unfinished article is
read before it is public, how a publication is distributed and which pieces are published at all, how a
shared link is tagged, how the site measures readers behind a consent gate, the event schema that
measurement emits, and the page that describes that schema. Each section was a record of its own until
#456 folded it here; each says where it came from.

## Context & problem
The site's strategic job is **presence** (ADR-0053, lean by design) — content and portfolio meant to be *found* and
*shared*. **SEO (search crawlers) and OG (social unfurlers) are the same problem here:** both read the
**served HTML** and neither reliably runs JS, so both need complete meta in the HTML that ships. When a
site URL is dropped into LinkedIn/WhatsApp/Slack it must unfurl richly, and when a crawler indexes it, it
must see title/description/canonical/structured data — or the presence is wasted. A client-only SPA
serves both an empty shell. So the site must decide **how completely** it exposes SEO/OG meta for its own
URLs.

## Decision drivers
- Shareability *is* presence — a URL that unfurls well is the point (ADR-0053, lean by design).
- Crawlers and unfurlers read the **served HTML** and do not reliably run JS.
- The mechanism to produce it already exists: build-time prerender (ADR-0002).

## Considered options
1. **Full coverage — every public route is OG/crawler-complete** (chosen) — each route is prerendered
   with per-route `og:title`/`description`, a canonical URL, a default OG image (`gen-og`), and JSON-LD
   `Person` on the CV. Any shared site URL unfurls richly. *Trade-off:* every public route must be
   prerendered, so build cost scales with the number of routes.
2. **Index-only OG (SPA default)** — meta only on `/`. *Why not:* every deep-linked article, the CV, and
   the portfolio would unfurl blank when shared — the common case for a content site — directly
   undercutting presence.
3. **Client-side meta injection only (react-helmet, no prerender)** — set tags in the browser. *Why not:*
   crawlers/unfurlers don't run JS reliably, so the tags aren't there when it counts.

## Decision outcome
Chosen: **full OG/crawler coverage on every public route**. This is the *policy* that ADR-0002's
build-time prerender exists to satisfy — the prerender must snapshot **every** public route ~~(`/`, `/cv`,
`/portfolio`, each `/blog/:slug`)~~ with complete meta in the served HTML. *(The enumeration is struck
because it drifted, #234: the CV route was renamed `/cv` → `/me` and the `/cv` REDIRECT dropped, in two separate 2026-07-24 amendments to ADR-0010; and every public URL is now
locale-prefixed (ADR-0036). **`STATIC_ROUTES` / `localizedRoutes()` in `apps/fed/scripts/routes.mjs` is the
source of truth** — cite the module, do not re-list here, or this line drifts again.)* It is the inverse of the
external-link unfurl we gave up (ADR-0002): we cannot unfurl *other* people's URLs, but we make *ours*
maximally unfurlable.

## Consequences
**Good**
- Every shared site URL — article, CV, portfolio — produces a rich preview; presence carries.
- Crawler-complete HTML means the SEO story holds without a server.

**Bad / accepted costs**
- Every public route must be prerendered; build time and the prerender's coverage list grow with the
  route count (a missed route silently ships blank — the build/prerender smoke guards this).
- OG/meta values are build-frozen (inherited from ADR-0002).
- ~~**Known SEO gap:** the site has **no `sitemap.xml` and no `robots.txt`** today.~~ **RESOLVED (Issue
  #51):** build now emits `sitemap.xml` (one `<loc>` per canonical route, generated from the same
  `scripts/routes.mjs` enumeration the prerender walks, so the two can't drift) and ships a static
  `public/robots.txt` (allow-all + a `Sitemap:` pointer). On-page SEO **and** crawl-directives/discovery are
  now both complete. An E2E journey (`e2e/seo.spec.ts`) guards both.

## Per-article OG cards

**Absorbed 2026-11-08 (#456) from the record that held it, 0041, decided 2026-07-30.** The decision is
unchanged and still binds, and so is its 2026-11-01 amendment (#710, the cover-derived card), written
below as the decision as it binds. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0041-*'`.

### Context

Until this decision every route advertised one `og:image`, `public/og-default.png`, so two articles a
reader meets in a timeline unfurled as the same link. **The property that shapes every clause below: an
OG card is the least reversible artifact on this site.** A scraper pins the card it first fetches, so a
wrong card **outlives the merge that fixed it**, permanently, on every post that already carried it.
#213 paid for that once, when every scraper was served the home page's card and nothing objected.

### The decision, as it binds

- **`npm run gen-og-articles` (`apps/fed/scripts/gen-og-articles.mjs`) renders one 1200×630 PNG per
  article per locale into `apps/fed/public/og/`, committed.** It is the same shape as
  [ADR-0040](./0040-build-time-mermaid-diagrams.md): a build-time artifact rendered in the Playwright
  Chromium the prerender already installs, committed, and guarded by a bidirectional set-equality test
  in Node. `scripts/og-cards.mjs` is the pure half, which decides *which* cards must exist where a test
  reaches it without a browser.
- **What goes on the card:** the existing card art with the article's TITLE over it, so every card
  reads as one family with `og-default.png`. The card's text is the article's own frontmatter title, so
  it cannot be re-typed wrongly. No date and no tag.
- **One aspect ratio, 1200×630.** Instagram is not a distribution surface (#270), so the 1080×1920 Story
  output #183 bundled with this work has no consumer.
- **The card file is named after the article KEY plus the locale, `/og/<key>.<locale>.png`**, never the
  per-locale slug: slugs are per-locale and editable ([ADR-0037](./0037-localized-article-slugs.md)), and
  a slug-named card is orphaned the moment one is corrected, as an `og:image` URL that every scraper has
  already pinned. **The site-wide default card is named the other way, on purpose:** `og-default.png`
  for English and `og-default.<locale>.png` for every other locale. `/og-default.png` has served since
  launch and is pinned by every link already shared, so renaming it would manufacture the same failure
  from the opposite direction. The suffix is additive, and English is the x-default edition.
- **`ogImage` is derived in code, in `buildEditions`, after the fact-parity loop**:
  `editions[locale].ogImage = '/og/<key>.<locale>.png'`. An author cannot override it in frontmatter.
  The ordering is part of the decision: an authored `ogImage` is still compared across editions and
  still throws when the two disagree, and only then is the generated path written over it.
- **The generator deletes before it writes.** Every `.png` in `public/og/` is removed and the set
  rendered whole, so a retired article's card cannot be left behind.
- **The generator refuses to publish an overflowing title, on both axes.** The layout is
  `overflow:hidden`, so a title too long for the canvas is a valid PNG with the words cut off. After
  rendering, the generator measures the text block's height **and** width and throws, naming the
  article, the locale, the size and the title. A three-step size ladder (104 / 80 / 62px, keyed off title
  length) exists because an article title is authored for the page, in two languages, and pt-BR runs
  longer than en for the same sentence. The first implementation measured `scrollHeight` only, and a
  22-character pt-BR word rendered at 104px ran 169px past the canvas with every gate green.
- **Failure is a red build, both directions** (`apps/fed/scripts/og-cards.test.mjs`): the card set must
  equal the article set. `missing` ships the 404 described above; `orphaned` breaks nothing, which is
  exactly why cards for retired articles would otherwise accumulate unseen. A guard against the false
  green asserts that articles were found at all, because two empty lists are equal having compared
  nothing.
- **An E2E follows the advertised URL rather than trusting that the generator ran**
  (`apps/fed/e2e/seo.spec.ts`): for each locale's article it reads `og:image` from the **served** HTML,
  asserts it is not `og-default`, fetches it, requires `200` **and** `image/png`, and asserts the two
  editions do not resolve to one card.
- **Every card this build generates carries `og:image:width`, `og:image:height`, `og:image:type` and an
  `og:image:alt` derived from the article's own title** (#167). The condition is *did this build
  generate the card*, never *is this the default image*: size is a fact about every card, the
  description of the picture is not.
- **A cover-derived card carries the signature (2026-11-01, #710; the owner's «Dividir» on #271 and
  «Card estreito»).** An article whose frontmatter sets the existing `cover` key gets a narrow card built
  from that cover: the title, the rule and the published signature `THIS IS WHAT I THOUGHT ·
  tadeumendonca.io` in a 640px left column, the cover in the right column with a solid-block AI-generated
  mark in the reader's locale (`Ilustração de capa gerada por IA` / `AI-generated cover illustration`),
  and the unchanged `META_LINE` in a full-width bottom row. The frame follows
  [ADR-0008](./0008-brutalist-mono-identity.md) (no radius, no shadow, no gradient); the cover inside it
  is a picture and keeps its own colours. **Every article without `cover` keeps the title-only card,
  byte-identical.** The selector is read through `frontmatterOf` in `scripts/og-cards.mjs`, the same
  js-yaml parse that decides `draft`; `cover` is already in `FACT_KEYS`, so the two editions agree on
  it. The card's `og:image:alt` is the title plus the catalog's `article.aiCover` in the page's locale,
  and `og-copy.test.mjs` asserts the printed mark and the alt suffix are the same words. #271 owns the
  signature's words; this card only places the published string.
- **The cover's provenance is checked; the title's is not.** Beside each cover-derived card the generator
  writes `apps/fed/public/og/<key>.<locale>.cover.json`, holding the cover path and the SHA-256 of the
  cover file it read, and `og-cards.test.mjs` recomputes the hash of the cover the article names now. A
  missing sidecar, a different path, a changed cover file, or a sidecar no cover card needs is a red unit
  test. The regeneration removes the sidecars before writing, and the overflow refusal also measures the
  cover card's text column.
- **`/og/*` is served from the fed origin, like every other static object.** Until 2026-07-31 the prefix
  had its own `ordered_cache_behavior` pointing at the bucket of the retired Lambda@Edge OG renderer, so
  the first cards were published where CloudFront never read them, and every article's `og:image` served
  the SPA's HTML for four hours. The behaviour and its origin were removed, which repaired the URLs
  already advertised rather than moving the cards, and the bucket itself was retired the same day.

### Rejected options that are still live

- **Title + date + tag on the card.** The information is free, which is why it was rejected on purpose:
  a card renders small in a feed, and every element competes with the title, which is the thing that
  tells two articles apart.
- **The campaign signature on a title-only card.** It was rejected while the signature was undecided
  `content` work; the 2026-11-01 reversal covers cover-derived cards only, and the rejection stands for
  every title-only card.
- **A second aspect ratio "since the layout is already there".** It doubles the committed binary to serve
  a surface nobody publishes to, and a second layout is a second thing that can overflow unseen.
- **The per-locale slug as the card name**, for the reason above.
- **Renaming the default card to `og-default.en.png`, or doing so and leaving a byte-identical copy at the
  old path.** The first 404s every pinned link; the second keeps two identical files that no gate holds
  in sync.
- **`ogImage` authored per article in frontmatter.** An author who forgets the line silently gets the
  generic card, and it is not available anyway: `ogImage` is in `FACT_KEYS`, and a per-locale card
  cannot agree across editions.
- **Falling back to `og-default.png` when a card is missing.** That was the defect, and as a fallback it
  hides exactly what was built to be visible.
- **An incremental write.** It leaves a retired article's card behind.
- **A runtime renderer, an uncommitted artifact regenerated in CI, or a new browser toolchain**, argued and
  rejected in ADR-0040 against ADR-0002 and the `--ignore-scripts` floor, none of whose constraints
  changed.

### Consequences still being paid

- **A committed binary per article per locale, growing with the archive.** Bounded and small today; it
  is a curve, not a constant.
- **The size ladder is a heuristic, not a layout engine.** The measurement catches an overflow as a build
  failure the author resolves (shorten the title, or widen the ladder); the generator does not solve it.
- **Regeneration rewrites every PNG, and the binary diff cannot be reviewed by reading.** The set-equality
  test stands in for reviewing the changeset, and it is a weaker substitute.
- **Nothing verifies the card's CONTENT matches the article's current title.** CI never runs the
  generator, because the cards are committed, so a card rendered from an older title, or hand-replaced,
  passes the unit test, the E2E, the build and the prerender. The guarantee is *a card exists for every
  article*, not *this card was generated from this title*. Re-rendering in CI to diff would flake on the
  font environment and teach everyone to ignore the red. The cover sidecar closes this gap for the cover
  only.
- **The card carries no date**, so an old article unfurls looking current.
- **A status code cannot see a missing card.** The distribution's `custom_error_response` maps 403 and 404
  to `/index.html` with a 200, so a missing card is served `200 text/html`. A check on a card must read
  the content type; in the 2026-07-31 incident only the `image/png` assertion caught the defect.
- **What a reviewer must carry forward:** a test suite organised around *is there a card* cannot see *is
  the card usable* (the 2026-07-31 dimension tags, #167); and a supersession that removes the *consumer*
  but leaves the *plumbing* is not finished (the `/og/*` behaviour that outlived the edge renderer).
- **The residue that has no fix:** every one of the above, when it bites, bites permanently on the posts
  already shared. The gates shorten the window; nothing closes it retroactively.
- **A cover article that does not set `cover` ships the title-only card, and nothing objects.** A
  `visualMode` contract and the `cover`/`ogImage` schema cleanup are deferred until a second cover
  article exists. That the cover does not read as a real photograph is held by the AI-generated mark and
  a reviewer's look, not by any gate.

## A held article is isolated, not private

**Absorbed 2026-11-08 (#456) from the record that held it, 0049, decided 2026-08-25.** The decision is
unchanged and still binds, and so are its four amendments (2026-08-29, the review affordances;
2026-10-16, the pending revision; 2026-11-01, the content Issue a preview item must name; 2026-11-01, the
promotion correction), written below as the decision as it binds. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0049-*'`.

**Decided by the orchestrator, not the owner**, on 2026-08-25
([#510 comment](https://github.com/tedeuxx/tadeumendonca-io/issues/510#issuecomment-5410347789)), under
his standing rule that a reversible decision with the evidence on the table is made rather than handed
back. He was asked the fork twice and answered sequencing both times.

### Context

The owner had no way to read a finished article at its real URL, in the real chrome, before it was
public. He framed it in two sentences that ask for different mechanisms: *"o problema é isolar trafego
organico"*, and *"isso deveria me ajudar com o requisito de **privacidade**"*. **Isolation and privacy are
not the same guarantee.** *Isolation* means nobody arrives by a link, a search result, a sitemap entry
or an unfurled card. *Privacy* means the text is not fetchable by someone who knows where to look. Under
ADR-0002 the markdown is compiled into the bundle and each route is prerendered; the two are separable,
and only the second is a per-route decision.

### The decision, as it binds

- **An article is HELD by an explicit `draft: true` frontmatter field**: built, compiled and reachable at
  its final URL, absent from every public enumeration, and rendered only to a visitor who arrives with
  the `?preview` parameter. `draft` is a **fact** (`FACT_KEYS` in `apps/fed/src/lib/content.ts`), so the
  two editions cannot disagree, and it is read as `fm.draft === true`, so a YAML string `"false"` cannot
  hold a finished article and a missing flag reads as published.
- **The readers that act on the flag:**

  | reader | what a held article loses |
  |---|---|
  | `src/lib/content.ts` | dropped from `byLocale`: the index, the feed, the track filters, the navigation |
  | `scripts/routes.mjs` | dropped from `localizedRoutes()`: **both** the sitemap and the prerender, together |
  | `scripts/og-cards.mjs` | no card is required, so none is generated and a stray one reddens the build |
  | `scripts/gen-distribution.mjs` | no LinkedIn/X draft kit |

- **The load-bearing line is a divergence, not an exclusion.** `byLocale` is the public enumeration and
  loses the article; `editionsBySlug` is the resolution index and keeps it, so
  `getPostBySlug`/`getEditions` still answer.
- **The gate sits in the caller**, in `ArticleRoute` (`App.tsx`), beside the retired-slug redirect, which
  runs **first**, so a held article whose slug was corrected is judged at the URL it answers to now.
- **`scripts/routes.mjs` drops held keys at the END of the build**, so the slug-shape contract is still
  enforced on a held article, and the sitemap and the prerender still shrink together from one
  enumeration.
- **`?preview` is presence, not a value**: `?preview`, `?preview=` and `?preview=1` all work. A value
  would read as a credential this mechanism cannot keep.
- **A held article declares `robots: noindex, nofollow`, written or removed on every route**, never merely
  left unwritten, so a lingering `noindex` cannot de-index the next article in a client-side navigation.
  It is the weaker half: it is emitted from the client head, and the real protection is that nothing
  links or prerenders the route.
- **The parameter alone gates the two review affordances (2026-08-29, #506)**, not `draft && parameter`,
  on the owner's *"esse argumento de query string pode permitir esses dois botoes visualizados tbm"*. A
  **published** article reached with `?preview` renders the review bar too, pinned by the assertion
  *renders for a PUBLISHED article too, when the parameter is present*. The copy payload's citation
  carries `?preview` and is pasted into a public `content` Issue every round, so the parameter is
  published on the tracker; that is the site's review machinery made visible, not a leak, and must not
  be narrowed.
- **The review artifact is the `content` Issue, carried in frontmatter as `contentIssue`**, a shared fact.
  A value that is present and unusable (`0`, `-3`, `506.5`, `abc`, `''`) throws at module load.
- **An item rendered under `?preview` must name its content Issue; only a published article may omit it
  (2026-11-01, #575).** The owner: «todo item publicado em modo preview precisa ter o botao», and «Sim,
  revisões também».

  | item | `contentIssue` absent | enforced in `apps/fed/src/lib/content.ts` |
  |---|---|---|
  | **held draft** (`draft: true` in both editions) | **build fails**, naming the edition and both `blog/` files | `assertHeldDraftNamesItsIssue`, called from `buildEditions` before the fact-parity check |
  | **pending revision** under `content/revisions/` | **build fails**, on the **published host**, never on the revision | `buildRevisions`, refusal 6 |
  | **published article** | **builds**, and the review bar renders no Issue button | nothing; every article published before #506 omits the field |

  The check is on the host because a revision's frontmatter is locked byte-equal to the published
  edition's, so the field lives on the `blog/` file and the revision inherits it.
- **Clipboard, never a prefilled URL.** A prefilled `?body=` is cut around 8 KB by browsers and servers,
  and the articles run 6–12 KB, so it would truncate the long pieces silently.
- **No prerendered snapshot can contain the bar, held or published**, because `prerender.mjs` navigates
  the `url` `routes.mjs` emits and that url never carries a query string. Pinned in
  `scripts/routes.test.mjs`, *"no prerendered route can carry the preview parameter (#506)"*. The first
  reason given for it, ~~The bar is client-rendered on a page that is already out of the sitemap and the
  prerender.~~, was true of a held article and false of a published one.
- **A PENDING REVISION of a published article is isolated the same way, without unpublishing it
  (2026-10-16, #741).** The hold cannot carry a correction: `draft: true` on a live article redirects its
  addresses and orphans its committed OG cards, and deleting those breaks the `og:image` every scraper
  pinned. A pending revision is a full copy of each edition at
  `apps/fed/src/content/revisions/<key>.<locale>.md`, both locales, keyed by the article key, with
  frontmatter byte-identical to the published edition and only the body corrected. `?preview` renders
  the revision at the real URL; every other visitor and every snapshot gets the published text. The
  review bar says *Pending revision* or *Published text, no pending revision*, and on a held article
  neither. A rendered revision carries `noindex, nofollow`. `content.ts` refuses, at module load: (1) an
  orphan key, (2) a half pair, (3) a held host, (4) frontmatter that is not byte-equal, (5) a body equal
  to the published one, and (6) a published host with no `contentIssue`.
- **Why a directory:** the enumerating readers read `blog/` flat, so a sibling file inside it would parse
  as a new article. The recursive walkers (`scripts/diagram-source.mjs`, `scripts/video-thumbs.mjs`) do
  see the revision, and must, to compile its diagrams and posters.
- **Release is two merges, and the second is one commit.** The revision merge adds
  `revisions/<key>.{en,pt}.md` and any regenerated diagrams and posters; without the parameter nothing a
  reader sees changes. The release merge is
  `git mv -f apps/fed/src/content/revisions/<key>.en.md apps/fed/src/content/blog/<key>.en.md`, the same
  for `.pt.md`, plus `gen-diagrams` if a fence changed, so the release diff on `blog/` is exactly the text
  that was read. **What records the owner's read is his comment on the release MR, naming the URLs he
  read.**
- **Promotion is one source edit, and not self-contained (2026-11-01, #635).** ~~Promotion is one edit~~
  — the source edit is `draft: false` plus the real date in both editions, and two manual steps follow:
  `npm --prefix apps/fed run gen-og-articles`, then commit `public/og/<key>.{pt,en}.png`; and
  `npm --prefix apps/fed run gen-distribution`, by hand, into the gitignored `.brand/distribution/`. The
  index, feed, landing list and sitemap come from `npm run build`; the prerendered addresses from
  `npm run build:static`; the cards and the kit from their own scripts, which the build does not run.
  With the cards missing the build stays green and the card URL answers `200 text/html`; the unit suite
  (`og-cards.test.mjs`, *"has a card for every article in every locale"*) is what turns it red, so the
  cards belong in the promotion merge request. Nothing fails when the kit is not generated.

### The consequence, stated plainly

**While a held draft or a pending revision is deployed, its full text ships in the public bundle, in both
locales, fetchable by anyone with no parameter at all.** Nobody stumbles into it; anybody who knows to
look will find it. Measured on the committed fixture pair:

```
npm --prefix apps/fed run build:static              # dist/ is not committed
grep -c HELDNONCE apps/fed/dist/assets/index-*.js   # -> 2, one per locale
grep -rl HELDNONCE apps/fed/dist                    # -> only that file
```

**And the edge gate cannot cover it.** `iac/frontend.tf`'s `ordered_cache_behavior` for `/assets/*`
carries no `function_association`; the only one is the `viewer-request` on the default behaviour. A
viewer-request gate protects the rendered page and leaves the text on a different cache behaviour. **So
`?preview` is concealment, not enforcement**, on three counts: the body is in the bundle regardless; the
check runs in the browser on code the visitor already holds; and a per-article secret cannot exist in a
public repository. It buys **isolation**, which is the problem the owner named.

**Two rules that follow, for any future implementer:**

1. **An HTTP assertion about prerendering cannot be written against `vite preview`**, ever, for this
   site's architecture: it answers the SPA fallback for every nested path. Assert on the enumeration
   pre-merge (`scripts/routes.test.mjs`); assert on bytes only against a deployed target.
2. **Every held-state assertion carries the same mutation**: flip the fixture's flag to `false` and
   confirm the assertion reddens. That is why the fixture pair is committed and why
   `src/content/heldFixture.ts` names its slugs and nonces in one place.

### Rejected options that are still live

- **A `date`-in-the-future runtime filter over `blog/`** (the ratified spec of 2026-08-24). It buys
  isolation and no privacy while appearing to buy both: a planted nonce pair was still in
  `dist/assets/index-*.js` with the strongest form of the filter applied, and absent only when the pair
  left `src/content/blog/`. And fatally, a wall-clock comparison makes the same commit build differently
  tomorrow, which breaks "rebuild the tag to reproduce production": a tag stops meaning anything. Scheduled publication becomes a scheduled **commit**.
- **A `drafts/`-only directory now.** A directory outside every reader renders nowhere, and rendering at
  the final URL is the whole requirement. It returns as the upgrade path below.
- **A per-article secret token validated at the edge.** Unbuildable: a CloudFront Function's source is
  public and a Terraform variable leaks through the plan on the PR; and the gate would need per-article
  state at the edge for a route that is not prerendered.
- **For revisions:** the hold itself (it unpublishes); a sibling file inside `blog/` (every flat reader
  would have to learn to skip it); a pointer field in the published file (it edits the live file); a lazy
  glob for `revisions/` (kept as the extension point if a window ever runs long); and revisions that may
  change the title or other frontmatter (the card, the social kit and JSON-LD are not preview-aware).
- **For the content Issue:** requiring it on every article (it fails on articles nobody is reviewing,
  fixed by inventing numbers); a warning instead of a failure; a second assertion in `routes.mjs` or the
  prerender (one rule in two wordings).

### The upgrade path, and the counter-argument that survives

**The counter-argument is the owner's own word.** He said *privacidade*, and this design does not deliver
privacy. **If that word was load-bearing, this decision is wrong**, and reversing it costs the delta
below, not the work already done. He was told the bundle exposure and the upgrade path, and answered
sequencing (*"eu acho que os artigos tem que vir depois que tivermos concluido o modo preview"*); he was
told, and is not recorded as agreeing.

**The upgrade path is an extension, not a rework.** Held pairs move to `src/content/drafts/`, outside
`content.ts`'s glob, so the body is not in the bundle by construction; a build step emits them plus a
manifest to `dist/drafts/`; the article page fetches its markdown with the token already in
`location.search`; and the CloudFront Function gains one static rule on `/drafts/*`, validating the token
against a CloudFront KeyValueStore written by the deploy job. **KeyValueStore pricing is not measured**,
and must be against the USD 50/month ceiling before this is committed to, and every draft merge would
then touch `iac/`.

### What this scopes in other records

- **ADR-0002's section *Content and OG resolved at build time*** is narrowed on one of its two halves: a
  held article or a pending revision is still **compiled in**, which is the whole exposure above; only the
  prerender admits an exception, bounded to `draft: true` and to `revisions/`.
- **The policy at the top of this document does not reach a held URL**, because a held URL is not a
  public URL: it leaves `localizedRoutes()`, so it is outside the set the policy quantifies over. The
  moment `draft: false` lands, the policy applies with nothing relaxed.
- ***Per-article OG cards* above** keeps its bidirectional guard, run against a required-card set smaller
  than the article set; a card generated for a held article is `orphaned` and reddens the build, which
  matters because a card is a public URL that leaks the title. The E2E control, a published article's
  card **is** served, is what keeps a hold from reproducing the empty-set false green.

### Consequences still being paid

- **The bundle exposure above**, the whole cost of this option. A pending revision also adds about one
  more copy of the article to every visitor's bundle while it is pending (+5,450 bytes measured on #742's
  branch for a one-sentence revision of `my-commitment`).
- **`scripts/video-thumbs.mjs` has no draft awareness**, so a held article that embeds a video demands a
  committed poster like any published one; `diffThumbs` reports `missing` as a red build before merge.
- **The hold is a rule, not an enforcement, on the authoring side**, and one more place the editions must
  agree: `draft` is in `FACT_KEYS`, so publishing one locale first is impossible by construction.
- **`scripts/routes.mjs` re-derives the flag independently** of `content.ts` (it runs in Node and cannot
  import the Vite glob); both take the conservative reading, *any edition held holds the key*, so a
  disagreement fails toward not publishing.
- **What nothing checks:** that the body moved onto `blog/` at release, or flipped at promotion, is the
  body the owner read. The release diff is the ruler a reviewer holds against his comment.
- **For revisions:** a hard load with the parameter paints the published snapshot first; the flat readers
  are pinned by source text (`scripts/revision-isolation.test.mjs`), not by behaviour; the end-to-end
  spec reports *skipped* while no revision exists and fails when a revision has no readable witness line;
  and the post-deploy check asserts absence only, against each address's own canonical.
- **A valid `contentIssue` naming a deleted Issue still 404s**; it is not checked against GitHub.
- **Adding `contentIssue` to a published article in order to open a revision renders nothing to a
  reader**; only the build sees it.
- **Nothing gates that `apps/fed/CLAUDE.md`, the comment on `draft` in `content.ts`, the review-bar gate
  comments in `DraftReviewBar.tsx` and `ArticlePage.tsx`, and this section agree with the generators.**
  They were corrected together by reading them, and they can drift again.

## Distribution to LinkedIn and X

**Absorbed 2026-11-08 (#456) from the record that held it, 0038, decided 2026-07-26.** The decision is
unchanged and still binds, and so are its amendments (2026-07-27, the draft generator; 2026-08-08, the
cadence; 2026-08-16, twice, the per-medium conventions; 2026-09-04, the digest; 2026-09-20, the
locale-neutral link; 2026-09-21, the bilingual order), written below as the decision as it binds. The
full record is in git history: `git log --diff-filter=D -- 'docs/adr/0038-*'`.

### Context

Publishing an article and distributing it are two different acts, and until this decision only the
first was decided: the launch article was announced on LinkedIn, and X was reached by hand, after the
fact. A presence that is consistent on one network and sporadic on another reads as sporadic, and
consistency that depends on remembering is not a mechanism. The two networks are different media, not
mirrors.

### The decision, as it binds

- **A publication is not done until it exists on both LinkedIn and X.** Both carry the same positioning
  and the same canonical link; the copy is adapted to the medium, not re-argued. If one surface cannot be
  published, the publication is **incomplete and tracked**, not silently half-done.
- **The obligation is recorded here; the mechanics are private.** The copy and the per-surface checklists
  are private working material outside this repository, as ADR-0024 established for the CV sync.
- **The draft generator is repository tooling; only its output is private (2026-07-27).**
  `apps/fed/scripts/gen-distribution.mjs` scaffolds the LinkedIn and X sections for each article from the
  frontmatter and writes them to the gitignored `.brand/distribution/<key>.md`. It posts nothing, holds no
  credential, adds no CI gate, and is not wired into `build`. It lives in the repository because it
  resolves the share URL by lookup in `scripts/routes.mjs`'s `localizedRoutes()`, the module the
  prerender and the sitemap consume, and **it refuses to emit any URL that is not a member of the
  prerendered route list**. That amendment named the hazard it guards: `alternatesFor()` then advertised a
  bare x-default article URL the prerender did not snapshot, so a scraper sent there got 200 carrying the
  home page's card, pinned permanently; the source was fixed the same day by
  [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)'s amendment (#200). Tooling that must not drift
  from the code lives with the code.
- **The cadence is one article per week, and the pair is that article's fan-out (2026-08-08).** A week
  with an article published is a week met; every article fans out to LinkedIn and X in the same batch;
  the direction is one-way, article ⇒ pair (*"todo novo artigo semanal gera um post"*), and nothing
  forbids a standalone post; a missed week is named, not carried (the writer's reading, not the owner's
  words). The pair is not separately decided or scheduled, and it is still separately written.
- **"Published" means the file is in `blog/` at a pinned `origin/main` commit.** Anyone measuring cadence
  names the ref, and pins the commit, because `origin/main` moves. The frontmatter `date` of the files
  `git ls-tree origin/main` lists is the instrument for *when*; `git log --diff-filter=A` dates a merge for
  a path added after the history horizon (2026-07-31) but is not a presence test, and a working tree
  counts unmerged branches.
- **X is always English; LinkedIn is bilingual, the same teaser in both languages in one post
  (2026-08-16).** ~~LinkedIn ships in pt-BR.~~ The owner's *"no linkedin pode ser em pt e br"* meant both
  languages. When an owner instruction can be parsed as a token this codebase already carries, read it
  back to him in the form the record will state it.
- **The canonical link goes in the LinkedIn post body**, not a first comment, decided against the stated
  cost that LinkedIn has historically down-ranked posts with an outbound link in the body. A later reader
  must not "fix" it.
- **Hashtags on LinkedIn, none on X.** On X a tag buys no indexing a word does not and spends the
  character budget; that half was the drafting context's judgement, which the owner did not overrule.
  **The selection rule: the tags name the practice and the runtime it runs on, never the page's
  contents** — a tool tag is only ever for the tool the practice runs on. The shipped set is private. The
  bare `#HarnessEngineering` tag was the owner's own exception to the vocabulary rule in
  `apps/fed/src/data/vocabulary.test.ts` (whose pattern cannot see a hashtag), superseded on 2026-09-03 by
  his two-tag instruction (`#ContextEngineering` + `#HarnessEngineering`, separate).
- **The post is a DIGEST, not a teaser (2026-09-04).** It carries pieces of the material the reader would
  meet, facts, findings and observations, enough to answer without clicking. **What stays withheld is the
  TURN, not the CONTENT.** Engagement buys distribution on the network and the click brings the reader to
  the site; the two are complementary (*«sao complementares»*). Four conditions are checkable, and only
  these: (1) the claim is traceable, by quotation, in the article; (2) it is in the reader's vocabulary;
  (3) the rules apply to the first line of **each** language block; (4) the first line finishes inside the
  fold (about 140 characters, unverified). How much or which content stays advisory. The operative
  wording is `published-voice`'s teaser section in the method; this section holds the decision.
- **The URL in a social post is the locale-neutral one, on every surface (2026-09-20)**: *«todo post de
  rede social tem que ser feito com a url nao regionalizada»*. ~~The shared link is always the `/en/`
  URL, on both surfaces~~ — reversed; the owner called that behaviour *«erro»*. **The precondition binds
  with it: the neutral URL is the share target only once it resolves to the ARTICLE.** Neutral routes are
  prerendered per article by [ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md); a
  non-article page has none, so a share of `/architecture` keeps its locale-pinned URL, because the
  neutral form answers `200` with the SPA fallback. The route's own decisions are ADR-0052's.
- **The bilingual post's order and signpost (2026-09-20 and 2026-09-21).** (1) Line one is exactly
  `🇧🇷 Versão em português abaixo.` — the soft pointer, never a mechanical position (*«o padrao deveria
  ser algo mais soft e elegante do que metade»*), and «Versão» was put to him and kept; (2) the English
  block; (3) the separator `— — —`, then the Portuguese block; (4) the link, then the hashtags, at the
  FOOT of the whole post, one link serving both blocks. The signpost is the load-bearing half: leading in
  English without it drops the Portuguese reader silently, so the two are one rule. English leads because
  *«queremos manter uma audiência global por isso inglês primeiro antes da versão em português»*.
  `gen-distribution.mjs` emits this shape, with the signpost and separator as exact strings, and refuses
  rather than guesses when the English block's inputs are absent. It is a default, not a gate.
- **X allows editing a published post.** Fixing the text of a live post is cheap on both networks; what
  is irreversible is the OG card, never the words.
- **The `/architecture` launch pair went out on both surfaces on 2026-08-16 in exactly this shape; this is
  a record of a practice, not a plan.**

### Rejected options that are still live

- **LinkedIn only, X for ad-hoc signal.** The status quo that produced the gap; it concedes the audience
  where agentic-development discussion happens. It never forbade ad-hoc signal.
- **Identical copy syndicated to both.** A long LinkedIn post truncated into X reads as automation, and
  automation-shaped presence undercuts the "written by a peer" claim the content makes.
- **Automating the fan-out (scheduler or API).** An integration, credentials to hold, and a class of
  unattended public writes, against the lean posture and the ask-first rule for external surfaces. Its
  *"revisit if cadence ever justifies it"* is touched by the weekly cadence and **not met**: the other two
  reasons are independent of frequency.
- **One post per week with articles at a slower beat** (`product-lead`'s recommendation, 2026-08-08),
  heard and overruled by the owner. Its finding that the take for most queued items exists in no file
  stands unrebutted.
- **The link in a first comment**, and **the link and hashtags at the end of the English block** (the
  fold argument). The second lost to the owner's own live posts, which put them at the foot: a written
  rule that no published post obeys is one the practice has already rejected.
- **The pure teaser that asserts nothing**, which was the shipped state and earned no response, and **a
  standalone opinion that never needs the site**.

### Consequences still being paid

- **Two drafts per publication**, in a weekends-only cadence. The generator lowers the cost; it does not
  remove it.
- **Still manual, therefore still skippable.** Nothing reads the fan-out, the cadence, the language split,
  the link placement, the hashtags, the digest rule or the share target: no layer observes a draft, a post
  or a published URL. A partial publication is a real state to be closed, not tolerated.
- **Public writes remain ask-first**, so distribution cannot run unattended even when the copy is ready.
- **The digest is not measurable from this site**: the reaction happens before the click, where GA4 has
  no visibility. The networks' own counts are the evaluation surface.
- **The `utm_content=en` / `utm_content=pt` split is approved and not emitted**, and the foot ruling
  removed the second link position it assumed; whether the Portuguese block gets its own link back is the
  owner's.
- **The decision lives here and the wording a drafter is judged against lives in `published-voice` (rules
  19 and 21) in another repository**, with independent pipelines; nothing holds the two in step.
- **The two posts published with `/en/` links before 2026-09-20 stay as published.** Changing a URL
  inside a published post is the owner's act, per post.

## Which video-derived articles are published

**Absorbed 2026-11-08 (#456) from the record that held it, 0046, decided 2026-08-08.** The decision is
unchanged and still binds. #456 bucketed it as possibly not an ADR, to move beside the in-repo artifact
that governs it; no in-repo artifact governs it (`git grep -liE 'video-derived|receipts test|standalone
test' -- ':!docs/adr'` names only the generated index), so it folds here. The full record is in git
history: `git log --diff-filter=D -- 'docs/adr/0046-*'`.

### Context

The content backlog had accumulated eight items of commentary on somebody else's video against one
published article, and three intakes (#259, #378, #405) deferred the same decision, each time framed as
**scheduling**, which has no forcing function. **It is a voice decision:** one reaction reads as
engagement; a run of them reads as a channel that needs other people's names to have something to say.

### The decision, as it binds

**Three questions and a cap, applied by the owner himself, per item, in about a minute, with no intake.**
The first two are gates; the third only orders.

1. **The receipts test.** Name the artifact in these repositories that proves the video's claim right or
   wrong — a file, a count, a gate, a measured failure. **If naming it takes more than one sentence, there
   is no article; there is a summary.**
2. **The standalone test.** Delete the video. Is it still an article? If not, it is a LinkedIn post with a
   link, and it ships there, which is the correct surface and costs nothing extra in the batch (*Distribution
   to LinkedIn and X* above).
3. **Ordering, among survivors:** by how much of the piece already exists as a published artifact, least
   writing left first.

**The cap: at most one video-derived article between two originals.** The reason is voice, not volume,
and it must not be re-derived as a rate limit: an eighth tempting item is more costly than the first.
**The rule decides membership and order, never the angle**; a surviving item still needs the owner's own
thesis. Applied backwards to the queue it reproduced the ratified set (#207 dropped, #210 and #378 kept
with the video dropped, #379, #339 and #259 passing both), and #405 was deferred on a ground the rule
does not capture, the authority-borrowing cost, with re-entry after two of the five have shipped.

### Rejected options that are still live

- **Ordering the queue and working it down.** It answers scheduling and leaves voice untouched.
- **Dropping video-derived commentary entirely.** It over-corrects: a reaction to a piece the field is
  discussing is the peer posture, and it would discard the items that improve by losing their video.
- **A per-item editorial judgement at intake.** The status quo; it produces no precedent.
- **A volume cap ("no more than N per month").** A reader experiences a streak, not a rate, and a volume
  cap is argued down by "it is only one more".

### Consequences still being paid

- **It drops genuinely interesting items**, deliberately.
- **Two commentaries became articles that no longer cite their source**, the price of the standalone test.
- **Nothing enforces any of it**: no label, gate or script reads this section, and no instrument observes
  the sequence of publications, which is what the cap is a claim about.
- **The cap is the clause most likely to be argued down**, because its cost is visible per item and its
  benefit only in aggregate.
- **The one-sentence bound is a judgement, not a measurement**, bought for applicability in a minute.

## Campaign tagging of shared links

**Absorbed 2026-11-08 (#456) from the record that held it, 0039, decided 2026-07-30.** The decision is
unchanged and still binds, and so are its three amendments, written below as the decision as it binds.
Status as the record stood when it was absorbed: accepted · **amended 2026-08-01** (`share-sheet` loses
its only emitter when #314 unifies the two share affordances; the value stays defined, and the 90-day
success-criterion window is affected two days in) · **amended 2026-08-16** (`author-post` is exercised —
the `/architecture` launch is tagged on LinkedIn and X; no parameter changes, and the tagging is a manual
step with no gate) · **amended 2026-10-16** (a third `utm_campaign` value, `author-profile`, for the
links on the author's own LinkedIn and X profiles, measured apart from his posts; hand-placed, no code
change). The full record is in git history: `git log --diff-filter=D -- 'docs/adr/0039-*'`.

### Context

Before this decision every session arriving from a reader's share landed in GA4 as `linkedin.com /
referral`, `t.co / referral` or `(direct)`, exactly as the owner's own distribution posts do, so the two
populations were indistinguishable. And the values are **effectively immutable**: a tagged URL lives on
in someone else's chat history, and a later rename migrates nothing — it silently splits one series into
two.

### The decision, as it binds

- **Three parameters, `utm_source` / `utm_medium` / `utm_campaign`, defined in one module**:
  `apps/fed/src/lib/utm.ts` (`SHARE_MEDIUM`, `SHARE_CAMPAIGN`, `AUTHOR_CAMPAIGN`, `ShareSource`,
  `withShareUtm`). **`utm_content` is not emitted.**
- **`utm_source` ∈ `whatsapp` | `x` | `linkedin` | `share-sheet` | `copy-link`.** The OS share sheet was its
  own value because the sheet does not tell the page where the link went, so naming a platform would be a
  fabricated dimension; `copy-link` exists because the first draft stamped `share-sheet` on a desktop
  clipboard copy. **`share-sheet` has had no emitter since 2026-08-01** (#314 unified the share
  affordances behind one modal) **and stays defined**: links already shared still carry it and still
  arrive.
- **`utm_medium` = `social`**, never `social-share` or `share`: GA4's default channel grouping places a
  session in *Organic Social* by matching the medium, and the other two fall to *Unassigned*. On X, which
  GA4's built-in source list does not know, the medium is the only thing keeping it in the social bucket.
  This string is load-bearing.
- **`utm_campaign` names a mechanism, never a moment or an article**, and has three values:
  `reader-share` (a reader sent the link); `author-post` (the author posted the link, first exercised on
  the `/architecture` launch on 2026-08-16); and `author-profile` (the link sits on the author's own
  LinkedIn or X profile, 2026-10-16, #749). `author-`, not `owner-`: `reader` is a role toward the content
  and its counterpart is the person who wrote it. **A value joins the immutable set the day it is first
  used.**
- **`author-post` and `author-profile` are applied by hand, and there is no gate.** `AUTHOR_CAMPAIGN` is
  exported and asserted and has no production caller; `gen-distribution.mjs` holds no UTM logic.
  `author-profile` is never emitted by the site, so its spelling is fixed here and in no module; check the
  two profile fields against it after posting them.
- **The arrival URL is captured at module load.** GA4 reads `utm_*` from `page_location` on the first hit
  of a session, and here that hit is `gtag('config', …)`, which fires only after consent (*Consent-gated
  GA4 analytics* below). A new reader who arrives from a shared link, navigates within the SPA and only
  then accepts would otherwise be attributed `(direct)`. So `loadAnalytics` passes the captured URL as
  `page_location`. **Nothing is stored and nothing is transmitted before consent**: the value sits in a
  module variable and is discarded if consent never arrives.
- **Success criterion:** in the 90 days after deploy (from about 2026-07-30), at least **10 sessions**
  carrying `utm_campaign=reader-share`, across at least **2 distinct `utm_source` values**. Below that, the
  affordance is decoration. The window was not restarted by #314, and neither `author-post` nor
  `author-profile` sessions count toward it.
- **Canonical, `og:url` and hreflang stay query-free**, built from the route constant (asserted by an E2E
  that requests a tagged URL), and **`iac/` is untouched**: CloudFront's `CachingOptimized` policy ignores
  query strings, so a tagged URL is the same cache object as the clean one
  ([ADR-0013](./0013-s3-cloudfront-hosting.md)).

### Rejected options that are still live

- **A fourth parameter, `utm_content`, for the article or locale.** The landing-page dimension already
  carries both, the locale better typed as a path prefix; per-locale slugs would have made summing one
  article a manual mapping; and every parameter is a permanent obligation in every link. It still informs
  no decision for a static route.
- **No UTM at all — a GA4 `share_click` event on a clean URL**, as a substitute. It measures the intent to
  share, never the arrival (the owner's call). An event *alongside* the tagging is a different question,
  answered in *The GA4 event schema is immutable once it collects* below.
- **A per-article or per-launch campaign**, which reads better in one report and destroys the series in
  every later one.
- **Leaving the share sheet untagged**, which biased the count against WhatsApp on phones.
- **For profile links:** reusing `author-post` (it merges the populations and changes the value's meaning
  after two months of use); leaving them untagged; per-network values such as `linkedin-profile` (the
  network is already `utm_source`).

### Consequences still being paid

- **The shared link is longer and uglier**, permanently, in someone else's feed, accepted in choosing full
  UTM over a clean URL.
- **A late-consenting reader's landing page is over-counted**: the reader who lands on A, navigates to B
  and only then accepts has A recorded and B never counted.
- **A drop in attempted shares caused by that ugliness is unmeasurable from the tagging alone.** Nobody
  should read a low number as "readers don't share".
- **Per-channel ranking is not measurable at these volumes**, and `t.co` and `lnkd.in` preserve query
  strings at different fidelities. The criterion is existence-class, not ranking-class.
- **Every number is a floor**, read against the consent gate, and **"unconfigured" and "nobody came" look
  identical**: confirm the measurement id is in the served bundle before interpreting any zero.
- **An untagged author post or profile link, or a mistyped value such as `author_profile`, is a real
  state nothing detects.** Whether each network's profile field preserves the query string is a premise
  until the first reading.

## Consent-gated GA4 analytics

**Absorbed 2026-11-08 (#456) from the record that held it, 0033, decided 2026-07-24.** The decision is
unchanged and still binds, and so is its 2026-09-04 amendment (the gate made real at the emission, #597),
written below as the decision as it binds. The full record is in git history:
`git log --diff-filter=D -- 'docs/adr/0033-*'`.

### Context

[ADR-0003, *Observability scoped to a static site*](./0003-trunk-based-single-environment.md#observability-scoped-to-a-static-site)
named Google Analytics in the abstract. Which tracker, how it is loaded and how the reader consents are
the load-bearing choices, and they carry weight beyond telemetry: a Google, cookie-setting tracker on a
site whose argument is restraint is in visible tension with the pitch.

### The decision, as it binds

- **GA4 (`G-5W9EQN303X`), loaded behind a hard opt-in consent gate.** `gtag.js` is injected **only after an
  explicit Accept**. Before a choice, on Decline, and when unconfigured, the script is never added, no
  cookie is set, and **no request reaches Google** — the "nothing third-party until the reader asks"
  property of ADR-0002's VideoEmbed facade, applied to analytics. **Consent Mode v2 is not used.**
- **The banner is shown to everyone, with no geo-detection**, Accept and Decline of equal weight (no
  pre-tick, no buried Decline), and withdrawal is a footer control as reachable as granting
  (`lib/consent` `reopen` clears the stored choice and re-shows the banner).
- **Analytics is inert when `VITE_GA_MEASUREMENT_ID` is unset**, so `vite preview`, the build-time
  prerender and the E2E never emit a hit; production sets the id in the deploy workflow.
- **The gate is real at the emission (2026-09-04, #597).** Every emission passes one gate that is two
  conditions: the script is loaded **and** `readConsent() === 'granted'`, read per call rather than cached,
  because the withdrawal happens in another component with no event the analytics module subscribes to.
  The guard had been `injected` alone, a question about the script, so a reader who withdrew kept being
  reported for the rest of the session. ~~A returning reader who withdraws consent keeps `gtag` loaded for
  the remainder of that session; their new choice governs the next full load.~~ `gtag` still cannot be
  un-injected, and a reader who withdraws now goes **silent immediately**: the property moved from
  *cannot be un-injected* to *loaded but silent*, which is what the hard gate implies and did not deliver
  until then. Removing the consent condition from `mayEmit` reddens six assertions across four files.
- Implementation: `apps/fed/src/lib/analytics.ts` (the inert-until-Accept loader, the consent gate every
  emission passes and the event schema), `apps/fed/src/lib/consent.tsx` (the grant/withdraw provider) and
  `apps/fed/src/components/ConsentBanner.tsx` (the equal-weight, geo-neutral banner).

### Rejected options that are still live

- **A cookieless tracker (Plausible, Umami, GoatCounter).** It fits the positioning better and needs no
  banner, but yields materially thinner data (no cross-session identity, funnels, retention or
  audiences). **The owner weighed this squarely and chose the data over the tighter positioning fit.**
- **Google Consent Mode v2.** It loads `gtag.js` immediately and pings Google with a denied signal before
  the reader has chosen, contradicting the restraint argument at the wire level.
- **No gate.** It sets a Google cookie and phones home unconditionally.
- **A geo-gated banner**, shown only where the law forces one. It makes the consent posture a legal
  minimum rather than a stated value.

### Consequences still being paid

- **Thinner data than an unconsented tracker.** GA sees only the granting subset, compounding the
  ad-blocker floor; and since 2026-09-04 a withdrawn reader disappears at the moment of withdrawal, so a
  drop in the numbers after that deploy is not a regression.
- **A standing Google client-side dependency, and a standing positioning cost**: every visitor meets a
  Google cookie banner on the proof-of-engineering site. The hard gate mitigates the tension; it does not
  remove it.
- **What the tag collects on its own**, such as automatic measurement switched on for the property,
  depends on a console setting this repository cannot observe.

## The GA4 event schema is immutable once it collects

**Absorbed 2026-11-08 (#456) from the record that held it, 0051, decided 2026-09-04.** The decision is
unchanged and still binds, and so are its two amendments of the same day (slice B shipped; two limits
stated), written below as the decision as it binds. **Decided by `tech-lead`** at intake on
[#597](https://github.com/tedeuxx/tadeumendonca-io/issues/597), jointly with `product-lead`; the owner
decided **what the two funnels are** (the content funnel's terminal is that the reader multiplied the
piece; the career funnel's is being contacted) and **none of the names**. The full record is in git
history: `git log --diff-filter=D -- 'docs/adr/0051-*'`.

### Context

*Consent-gated GA4 analytics* above chose GA4 for rich behavioural data, and the implementation stopped
at `page_view`. What needed deciding is the **schema**, and it is effectively immutable: rename an event
or a registered dimension and GA4 migrates no historical row — it opens a second series and leaves the
first looking complete. **These strings are chosen once, by whoever ships them first, on behalf of
everyone who reads a number afterwards.** And a parameter is not queryable until it is registered as a
custom dimension in the GA4 console, which **does not backfill**.

### The decision, as it binds

- **A name must state what the page can OBSERVE, never what we would like it to mean.**

  | event | parameters (beyond `locale`) | what it observes — and what it does not |
  |---|---|---|
  | `article_progress` | `slug`, `percent ∈ {25,50,75}` | a block at that share of the article's **block count** entered the viewport; a precondition |
  | `article_end_reached` | `slug` | the last block of the **prose** entered the viewport, the deepest milestone had already fired, and the dwell floor elapsed. **A proxy for a read. Not a read** |
  | `share_complete` | `target` (`ShareSource` ∪ `copy-markdown`) | a share destination was chosen and a composer opened. **Never that anything was posted** |
  | `contact_click` | `target` (`github`\|`linkedin`\|`x`\|`whatsapp`\|`email`) | a contact channel was clicked through. **Never that contact was made** |
  | `page_view` | `page_path` | unchanged; part of the spine a reader will meet |
  | `share_open` | `slug` | a share affordance was OPENED, by `ShareButton`, the modal trigger, and nothing else |
  | `contact_reach` | — | the landing's `#contato` section INTERSECTED the viewport, once per tab-visit; **never that it was read** |
  | `outbound_click` | `href` (`hostname + pathname`) | a link took the reader off the site by a route that is neither a contact channel nor a share destination |
  | `nav_click` | `from`, `to` (both `NavArea`) | a nav control was clicked, with the origin captured at the click; `from === to` is **emitted**, not suppressed |

- **What a name may never be changed to.** `article_end_reached` may never become `read`, `article_read`
  or anything asserting comprehension; `article_progress` may never become `scroll`; `share_complete` may
  never be narrowed to a name implying a posted share nor widened to one covering a merely-opened share
  sheet. **A name is not improved. If the observation changes, that is a NEW name and a new series**, and
  the old one stops being emitted.
- **The single emission point is `trackEvent` in `apps/fed/src/lib/analytics.ts`**, enforced by an ESLint
  `no-restricted-properties` rule (`eslint.config.mjs`) on `window.gtag`; `window['gtag']` and a
  destructured `const { gtag } = window` walk past it, and the config says so.
- **The parameter spine: `locale` on every event, mandatory at the type level; `path` is deliberately NOT
  emitted and must not be added.** GA4 derives `page_path` from `page_location` for free, so a custom
  `path` duplicates a dimension and spends a registration slot on it — the trade *Campaign tagging of
  shared links* above refused when it dropped `utm_content`. `locale` stays although it is derivable,
  because a registered dimension is a segment you click rather than a regex written by hand.
- **No free-form URL and no identifier.** `contact_click` takes a closed union, resolved by **exact-href
  lookup** against the single channel list through one delegated listener, because three of the five
  contact channels share a hostname with a share destination; the type forecloses the query string rather
  than a convention discouraging it. `outbound_click`, which cannot use a closed
  union, carries `href` bounded to `hostname + pathname`, built by reconstruction rather than by
  stripping. `from` and `to` are a closed union of ten `NavArea` members (`home · articles · contact ·
  portfolio · ramp-up · architecture · library · me · article · other`), so a query string has no member
  of the type to arrive as.
- **The vocabularies:** `ShareCompleteTarget` extends `ShareSource` from `utm.ts` (imported, not restated),
  and `ContactTarget` is defined in the schema module and imported by the channel list.
- **`outbound_click` refuses the contact channels and the share deeplinks**, by lookup on sets derived from
  `CONTACT_CHANNELS` and `SHARE_TARGETS`, never by listener order. The contact exclusion is by bounded
  form, wider than `contact_click`'s exact href, so a differently-spelled contact link is silent in both
  series rather than misreported in one.
- **The observer is created at the GRANT, not at mount.** The milestones are one-shot, so observing from
  mount consumed every milestone already on screen while the banner was up, and the article emitted
  nothing for the whole visit.
- **The terminal's precondition is the deepest milestone (75%), and on this site the DWELL FLOOR does most
  of the work.** With `scroll-behavior: smooth` an End press animates through every block; only under
  `prefers-reduced-motion: reduce` does the milestone condition catch a leap. The floor is the article's
  own length at **1,000 words per minute**, the boundary of the physically implausible, with a 5 s
  minimum.
- **A one-shot event is one per TAB-VISIT, guarded by `lib/sessionOnce` in `sessionStorage`** (the owner,
  2026-09-04: *«Uma vez por sessão»*). The first implementation scoped the shot to the observer, and a
  locale toggle or a consent re-grant re-armed it: the published claim was *once per visit*; the behaviour
  was *once per observer*. The guard fails OPEN when storage throws, and the marker is written only when
  the hit actually shipped. `article_progress` and `article_end_reached` carry it too, keyed on the
  article's locale-independent KEY, never its slug, and the milestone set is seeded from the markers.
- **`sessionStorage` is scoped to an (origin, tab) pair, never to a GA4 session**, so these events count
  **tab-visits in which the condition was met at least once, among consenting readers**: an over-count
  for one reader in two tabs, an under-count for one tab left open across a session timeout. ~~`contact_reach`
  answers *how many sessions reached contact*~~ — it does not. For `contact_reach`, `eventCount − sessions`
  in GA4 bounds the multi-tab excess; nobody has run it, and it does not transfer to the article events.
  `useRef`, `localStorage` and reading GA4's own session boundary client-side were all worse.
- **The seam of 2026-09-04.** `article_progress` and `article_end_reached` ran under the per-observer
  behaviour from slice A's merge (2026-09-04T17:52:07-03:00, PR #601) to slice B's
  (2026-09-04T19:35:11-03:00, PR #602). **Any reading of `article_progress` or `article_end_reached` that
  spans 2026-09-04 is not comparable**: compare whole days before against whole days after, discard the
  seam day, and say so in the chart's caption. `contact_reach` has no seam.
- **The registration obligation, non-retroactive, owed at merge.** Mark `share_complete` and
  `contact_click` as key events; register event-scoped custom dimensions `locale`, `slug`, `percent`,
  `target`, `href`, `from` and `to` before they collect. `source_section` is emitted by nothing and
  blocks nothing. **Nothing in this repository can observe whether the console actions were taken.**
- **No consent copy changed**: every event lands under the three verbs the notice already names, *read /
  shared / clicked*, and the notice has no layout headroom at 1280px.

### The campaign-tagging reconciliation

*Campaign tagging of shared links* above rejected a share-click event **as a substitute for UTM**,
because it measures the intent, never the arrival. `share_complete` is added **alongside** the tagging,
answering whether anyone on this page chose to share at all, and to where, which closes that section's
own recorded blind spot without touching its decision. **The two measure two populations at two moments,
and neither number may be divided by the other.** The `reader-share` success criterion is untouched.

### Rejected options that are still live

- **`read`** for the terminal: nothing a client can see proves a read, and the fix would be a rename.
- **GA4's document-scroll depth** as the end of an article: document-100% is not the end of an article on
  this site, and is not comparable across page types.
- **`scroll`** for the milestone: it collides with GA4's own enhanced-measurement event, whose setting no
  one in this loop holds a credential to check.
- **A self-caveating name such as `share_composer_opened`**: honest, and read as noise; the caveat belongs
  here.
- **Classification by hostname** for contact clicks, which reports every share to LinkedIn as a profile
  click — a wrong answer that reads as a right one, the class of defect this section exists to prevent; **carrying the raw `href`** on `contact_click`; **per-anchor `onClick` handlers**.
- **Restating the share destinations**, or **defining `ContactTarget` in the component**.
- **A per-page-view guard (`useRef`)**, **`localStorage`**, and **reading GA4's session cookie**, for the
  one-shot guard.

### Consequences still being paid

- **The registration obligation is outside every gate and non-retroactive**: if the console actions are
  not taken at merge, the events collect into invisibility for that period permanently, with everything
  green.
- **`article_end_reached` is a proxy and will be read as a fact.** A reader who scrolls at a plausible pace
  with the tab in the background is **over-counted**; one who closes the tab a paragraph early is
  **lost**. The name is the only part that is load-bearing at read time.
- **`share_complete` counts composers opened**, and at this site's volume it is a counter with provenance,
  never a rate. It carries no parameter naming its entry point, so the `share_complete` / `share_open`
  ratio can exceed 1, and that is not a defect.
- **Every number is a floor, twice over**: consent-gated and ad-blocked.
- **`percent` is a milestone index over block count, not reading length**, and should not be averaged.
- **The exact-href classifier is exact by choice**: a relative or unusually-encoded contact href emits
  nothing, the safe failure direction and still a real one; no test discriminates `getAttribute('href')`
  from `.href`.
- **`href` has unbounded cardinality**; GA4 buckets the tail into `(other)`. It degrades and does not
  corrupt.
- **A public route added without a row in `navArea.ts` reports as `other`**, under-attributed and never
  mis-attributed; `navArea.test.ts` cross-checks every route-typed nav entry.
- **`slug` carries non-article values** from `share_open` (`architecture`, `ramp-up`, `analytics`),
  separable by event.
- **A one-shot event does not re-count a reader who returns to it in the same tab-visit**; the guard is
  not for an event meant to count occurrences.

## The analytics schema page

**Absorbed 2026-11-08 (#456) from the record that held it, 0054, decided 2026-11-01.** The decision is
unchanged and still binds. Each of its three shapes is the owner's ruling on
[#640](https://github.com/tedeuxx/tadeumendonca-io/issues/640) (*«Página de esquema»*, *«Rota»* and *«Rota
fora do menu»*). The full record is in git history: `git log --diff-filter=D -- 'docs/adr/0054-*'`.

### Context

The site measured itself and published none of it. The owner asked for an analytics section that shows
his competence and his critical way of reading platform metrics. The question is what the site says in
public about its own measurement, and in what form. It is a public contract (a new permanent URL pair
whose title and card are pinned on first fetch) and a cross-cutting pattern (the first public route that
is **not** in the menu).

### The decision, as it binds

- **A schema page, derived from the emitting code and checked against it, served as an off-menu route.**
  It describes each event the browser emits, its parameters, what it can establish and what it cannot.
  **It shows no figure.**
- **The route** is `/analytics`, in `STATIC_ROUTES` in `apps/fed/scripts/routes.mjs`, so it is prerendered
  in both locales, in the sitemap and given hreflang alternates. Off the menu is a property of the
  navigation, not of the route table.
- **The body** is long-form markdown, one file per locale (`apps/fed/src/content/analytics.en.md` and
  `apps/fed/src/content/analytics.pt.md`), rendered through `MarkdownPage`; the chrome is the `analytics`
  group in `apps/fed/src/i18n/messages.ts`.
- **The fidelity check** is `apps/fed/src/content/analytics-schema.test.ts`. It reads the emitted schema
  from `analytics.ts`'s **source text**, reads the presented schema from **each** edition, and requires
  them equal in both directions, per event name and per parameter name. The parse is bounded: an emitter
  in a shape it does not recognise throws, and no other module may call the tracking functions with a
  name of its own.
- **The only door** is a link in the body of `/architecture`, in both editions, asserted per edition on the
  rendered, locale-prefixed `href` (`apps/fed/src/pages/ArchitecturePage.test.tsx`).
- **`NAV` and `NavArea` are unchanged.** A `nav_click` made from this page reports `from: 'other'`, and the
  page says so.
- **No claim about what is queryable.** The page states that registration in the GA4 console is outside
  every check and points to *The GA4 event schema is immutable once it collects* above for the obligation.
- **Re-decision limb, per rejected option:** hand-typed prose with no binding to the code is refused by
  `analytics-schema.test.ts` (calibrated by renaming `### outbound_click` to `### outbound_clicks` in the
  English edition: `2 failed | 7 passed`, restored green). The other three rejected options are refused
  by nothing, so their reasoning stays here.

### Rejected options that are still live

- **A numbers page, GA4 figures rendered on the site** (the owner's decision 1): every figure is
  unfalsifiable by a reader, stale between builds, and needs a GA4 credential in the build or the
  browser. If wanted later it is a separate item.
- **The page as a menu item now, an eleventh `NavArea` member** (decision 3): the vocabulary is immutable
  once it collects, so adding a member is a permanent spend on day one. Promotion stays a later decision.
- **An article as the first shape** (decision 2): an article is dated and in the owner's voice; a
  description of a schema has to track the code.
- **Hand-typed prose with no binding to the code**, refused by the test above.

### Consequences still being paid

- **The check covers names only.** What each event can and cannot establish is prose held by review; an
  amendment to the schema section above can leave the page wrong with every check green.
- **The emitted set is parsed from TypeScript source with regular expressions**, so a refactor of
  `analytics.ts` into an unrecognised shape turns the test red for a reason unrelated to the page.
- **A new permanent public URL pair**, its title and card pinned on first fetch.
- **Menu clicks from this page are unclassified** (`other`).
- **One door**: if the `/architecture` section that links it is cut, the page is orphaned from navigation.
- **Promotion later spends a `NavArea` member with no history from that day.**

## Links
- Driven by ADR-0053 (lean by design: presence) · implemented by ADR-0002 (build-time prerender) · guarded by the prerender-smoke check · discovery half (`sitemap.xml` + `robots.txt`) delivered by Issue #51.
- **Absorbed 2026-11-08 (#456, the ninth slice):** records 0033, 0038, 0039, 0041, 0046, 0049, 0051 and
  0054, as the eight sections above this list. Each names the `git log --diff-filter=D` command that finds
  its full record. The decision index lists each number under *Records that left the library*.
- Per-article OG cards: Issue #269 (scope narrowed by #270), #167 (the dimension tags), #710 (the
  cover-derived card). Held articles: #510, PR #511, #506, #741 and PR #742, #575 and PR #794, #635. The
  author-facing wording for both is `apps/fed/CLAUDE.md`. Distribution: issue #186, the draft kit #178,
  the share target #665 and #660, the bilingual order #562. Video-derived articles: #207's closing comment
  and #405's defer comment. Campaign tagging: #272, #314, #749. Consent and the event schema: #597, PRs
  #601 and #602. The schema page: #640, PR #797.
- Related records: [ADR-0002](./0002-fully-static-spa-no-backend.md#content-and-og-resolved-at-build-time)
  (build-time content, scoped by the held article) · [ADR-0003, *Observability scoped to a static
  site*](./0003-trunk-based-single-environment.md#observability-scoped-to-a-static-site) (refined by the
  analytics sections) · [ADR-0008](./0008-brutalist-mono-identity.md) (the card's identity) ·
  [ADR-0013](./0013-s3-cloudfront-hosting.md) (the cache behaviour tagged URLs and cards share) ·
  [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) (cross-surface coherence; private working
  material) · [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) (OG and locale per URL) ·
  [ADR-0037](./0037-localized-article-slugs.md) (per-locale, editable slugs) ·
  [ADR-0040](./0040-build-time-mermaid-diagrams.md) (the committed-artifact shape the cards follow) ·
  [ADR-0052](./0052-neutral-self-canonical-share-url-per-article.md) (the neutral share route).
