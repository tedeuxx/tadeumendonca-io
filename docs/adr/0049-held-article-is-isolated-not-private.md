# 0049. A held article is isolated, not private — its text ships in the public bundle

- **Status:** accepted
- **Date:** 2026-08-25
- **Deciders:** **the orchestrator**, 2026-08-25 —
  [#510 comment](https://github.com/tedeuxx/tadeumendonca-io/issues/510#issuecomment-5410347789).
  **Not the owner.** He was asked the fork twice and answered sequencing both times; the call was taken
  under his own standing rule that a reversible decision with the evidence already on the table is made
  rather than handed back. Written by `tech-lead`, in the MR that implements it.
- **Supersedes / superseded by:** —
- **Driven by:** [#510](https://github.com/tedeuxx/tadeumendonca-io/issues/510) ·
  [PR #511](https://github.com/tedeuxx/tadeumendonca-io/pull/511) · **scopes**
  [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) (the first content deliberately neither
  compiled-and-listed nor prerendered) · **does not reach**
  [ADR-0005](./0005-og-coverage-every-public-url.md) (a held URL is not a public URL) · **applies**
  [ADR-0041](./0041-per-article-og-cards.md)'s bidirectional guard to a set that is now smaller than the
  article set · reads through [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem

The owner had no way to read a finished article at its real URL, in the real chrome, before it was
public. PR #507 sat blocked on exactly that. His own framing of the problem, quoted rather than
paraphrased because the two sentences ask for different mechanisms:

> *"a url/slug existir nao é um problema se nao estiver ainda linkada na navegacao do site e publicada em
> redes sociais. **o problema é isolar trafego organico**."*

and, in the same conversation:

> *"isso deveria me ajudar com o requisito de **privacidade** durante os ajustes do conteudo"*

**Isolation and privacy are not the same guarantee, and this architecture can deliver one of them
cheaply and the other not at all.** *Isolation* means nobody arrives by following a link, a search
result, a sitemap entry or an unfurled card. *Privacy* means the text is not fetchable by someone who
knows where to look. The decision this record fixes is **where an unpublished article's text lives, and
what is guaranteed about who can read it** — one decision, and the guarantee is half of it.

**The measurement that forces the question.** Under
[ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) *"the markdown is compiled into the bundle and
each route is prerendered to static HTML"*. Compilation and prerendering are **separable**, and only the
second is a per-route decision. A runtime filter can remove an article from every list the site renders
and cannot remove its body from the bytes the site ships, because the Vite glob has already resolved it
at build time.

## Decision drivers

- **Rebuild the tag to reproduce production.** Any mechanism whose output depends on wall-clock time
  breaks this, and it breaks it silently — the failure is a build that differs from a build, not an error.
- **The owner's stated problem is organic traffic**, which isolation answers exactly.
- **Cost and blast radius.** Isolation is ~3 days, no Terraform, no new AWS resource, no IAM grant, and a
  draft merge stays out of the `iac/`-touching boundary class. Privacy is ~1 week more and puts every
  draft merge into it.
- **Nothing built for isolation is discarded if privacy is wanted later** — the privacy package is a
  strict extension of this one, not a rework, so the cost of being wrong here is a delay rather than a
  rewrite.
- **A criterion that must be relaxed is a gate becoming theatre.** Whatever is chosen has to be
  assertable as stated, or not written.

## Considered options

### 1 · A `date`-in-the-future runtime filter over `blog/` — **rejected, on two measured grounds**

The ratified spec (2026-08-24). An article stays in `src/content/blog/` and is filtered out of the
public arrays while its `date` is in the future.

*Why not, first ground — it does not deliver what it appears to.* A pair carrying nonce strings was
planted, the **strongest possible** form of the filter applied (the post never enters any exported array
at all), and the site built:

| build | nonce in `dist/assets/index-*.js` | sitemap URLs |
|---|---|---|
| control, no filter | **present** (EN and PT) | 21 |
| runtime date filter applied | **present** — EN and PT, one occurrence each | 21 |
| mutation: the pair moved out of `src/content/blog/` | **absent** — zero anywhere in `dist/` | 19 |

The third row is what makes the first two a measurement rather than a failed search: the grep can go
red. So the filter buys **isolation** and no privacy — while claiming, by its framing, to buy both.

*Why not, second ground, and this one is fatal on its own.* A wall-clock comparison makes **the same
commit build differently tomorrow.** Rebuild a tag the day after its release and the artifact differs
from the one that shipped, with nothing in the diff to explain it. That is not a trade-off against
convenience; it is the loss of the property that makes a tag mean anything.

*What it would have bought:* publication with no commit — the article appears at its hour by itself. Real
convenience, and the reason it was ratified. Under this decision, scheduled publication becomes a
scheduled **commit**, which is strictly more auditable and is the honest replacement.

### 2 · A `drafts/`-only directory, outside every reader (#479's proposal) — **rejected for this slice**

Held pairs live in `src/content/drafts/`, outside `content.ts`'s glob. The bundle exposure then holds
**by construction** rather than by a filter — this is the strongest option on the privacy axis and it is
why it returns below as the upgrade path.

*Why not now:* a directory outside all the readers renders **nowhere**, and rendering at the final URL in
the real components is the entire requirement. Delivering it from `drafts/` needs the rest of the privacy
package with it — a build step emitting `dist/drafts/` plus a manifest, a runtime fetch of the markdown,
and an edge rule validating a token against per-article state. That is a different, larger slice; taking
it here would mean shipping nothing readable until all of it lands.

### 3 · A per-article secret token validated at the edge — **rejected as unbuildable, not as unwanted**

*Why not,* and both halves are structural rather than a matter of effort. **A CloudFront Function's source
is committed to a public repository**, so any secret in it is published, and a Terraform variable leaks
through the plan posted on the PR. **And an edge gate on the article's own URL needs per-article state at
the edge**, which a static function does not have — a held route is not prerendered, so it never reaches
the function as a distinguishable path in the first place.

### 4 · `draft: true` frontmatter, out of the public enumerations, rendered behind `?preview` — **chosen**

## Decision outcome

**Chosen: option 4 — the isolation package.** An article is **HELD**: built, compiled and reachable at its
final URL, absent from every public enumeration, and rendered only to a visitor who arrives with the
`?preview` parameter.

**The hold is an explicit `draft: true` frontmatter field**, and it is a **fact** (`FACT_KEYS` in
`apps/fed/src/lib/content.ts`), so the two editions cannot disagree — a held PT edition beside a
published EN one would publish half an article. It is read as `fm.draft === true` rather than for
truthiness, so a YAML string `"false"` cannot silently hold a finished article and a missing flag reads
as published.

**Five build-time and runtime readers see the flag; four of them act on it, and the fifth is named in
the consequences below.**

| reader | what a held article loses |
|---|---|
| `src/lib/content.ts` | dropped from `byLocale` — the index, the feed, the track filters, the navigation |
| `scripts/routes.mjs` | dropped from `localizedRoutes()` — **both** the sitemap and the prerender, together |
| `scripts/og-cards.mjs` | no card is required, so none is generated and a stray one reddens the build |
| `scripts/gen-distribution.mjs` | no LinkedIn/X draft kit |

**The load-bearing line of the design is a divergence, not an exclusion.** `byLocale` is the public
enumeration and loses the article; `editionsBySlug` is the **resolution** index and keeps it, so
`getPostBySlug`/`getEditions` still answer. Excluding it from both would make the held state pointless —
the URL would resolve to nothing and the article could never be read before publication. Excluding it
from neither would publish it.

**The gate therefore sits in the caller**, in `ArticleRoute` (`App.tsx`), beside the retired-slug
redirect, because that is where every conditional redirect on this site already is and a gate hidden
inside the page would be a redirect nobody reading the route table could see. Order is load-bearing: the
retired-slug redirect runs **first**, so a held article whose slug has been corrected is judged at the
URL it currently answers to.

**`scripts/routes.mjs` drops held keys at the END of the build rather than skipping them inline**, so the
slug-shape contract is still enforced on a held article. A slug is validated when it is authored, not
when it is published — deferring it would move the error into the promotion commit, the one commit
nobody wants to discover a build break in. The module's own never-drift invariant is **preserved rather
than broken**: both sets shrink together, which is exactly the property that makes one enumeration the
source of truth for both.

**`?preview` is presence, not a value** — `?preview`, `?preview=` and `?preview=1` all work. A value
would read as a credential, and a credential this mechanism cannot keep is worse than none: it would
invite the owner to share the URL believing the token protects it.

**A held article declares `robots: noindex, nofollow`, and this is the weaker half rather than the
mechanism.** It is emitted from the client head, so a JS-less crawler never sees it; the hold's real
protection is that nothing links the route and nothing prerenders it. The tag is written **or removed**
on every route, never merely left unwritten — a `noindex` lingering from a previously-viewed held article
would de-index the next article the reader navigates to, a client-side-navigation-only defect invisible
on every hard load.

**Promotion is one edit** — `draft: false` plus the real date — and rebuilds nothing else.

## The consequence, stated plainly

**While a held draft is deployed, its full text ships in the public bundle, in both locales, and is
fetchable by anyone with no parameter at all.** Nobody stumbles into it; anybody who knows to look will
find it.

Measured at this branch's head, on the committed fixture pair:

```
npm --prefix apps/fed run build:static              # dist/ is not committed
grep -c HELDNONCE apps/fed/dist/assets/index-*.js   # -> 2, one per locale
grep -rl HELDNONCE apps/fed/dist                    # -> only that file
```

The build line is not decoration: `dist/` is gitignored, so on a fresh clone the two greps **error**
rather than returning `2` and a path — and a falsifier that cannot run reads to whoever runs it as
*nothing here*, which is worse than publishing no command at all. The two occurrences are the EN and PT
nonces of `src/content/heldFixture.ts`, one per edition.

**And the edge gate cannot cover it. This is the fact that decided the whole shape.** `iac/frontend.tf`'s
`ordered_cache_behavior` for `/assets/*` carries **no `function_association`** — the only
`function_association` in `iac/` is the `viewer-request` on the **default** cache behavior, where
`spa_rewrite` lives. A viewer-request gate protects the rendered page and leaves the text on a different
cache behaviour. There is no version of `?preview` — parameter, token, header — that changes this,
because the request that carries the text never reaches the function.

**So `?preview` is concealment, not enforcement**, on three independent counts: the body is in the bundle
regardless; the check runs in the browser on code the visitor already holds; and a per-article secret
cannot exist in a public repo (option 3 above). It buys **isolation**, which is the problem the owner
actually named.

## Consequences

### Good

- The owner reads a finished article at its real URL, in the real components, CSS and chrome, before it
  is public — the affordance PR #507 was blocked on.
- **Reproducibility is kept**: nothing in the build reads a clock, so a tag rebuilt tomorrow is the tag
  that shipped.
- **The never-drift invariant survives**: the sitemap and the prerender still derive from one enumeration
  and shrink together, so a held article cannot leave one and stay in the other.
- **`ADR-0041`'s guard is unchanged and still bidirectional** — a card generated for a held article is
  `orphaned` and reddens the build, which matters because an OG card is a public URL that leaks the
  article's title in both languages to anyone guessing an entirely predictable filename.
- **Nothing here is discarded if privacy is chosen later** — the upgrade below is a strict extension.

### Bad, and each of these is accepted rather than mitigated

- **The bundle exposure above.** It is the whole cost of this option and it is the reason a record exists.
- **`scripts/video-thumbs.mjs` is a fifth build-time reader and is deliberately unchanged.** It walks
  every `.md` under the content tree with no draft awareness, so a held article that embeds a video
  **demands a committed poster asset like any published one**. No held content leaks through it — the
  thumbnail is this site's own self-authored art, keyed by the YouTube id, and `diffThumbs` reports
  `missing` as a **red build before merge**, not as a silent gap. **Recorded here rather than filed as
  follow-up work**, on that distinction: the failure is loud, pre-merge, and its correct resolution
  (commit the poster) is the same act a published article requires. The rule a future implementer needs
  is the sentence in bold, not a ticket.
- **The hold is a rule, not an enforcement, on the authoring side.** Nothing stops a held article from
  being merged with a video and no poster except the build turning red, and nothing at all stops the
  fixture pair from being published by an edit to one word — which is precisely why the fixture is
  committed and every gate asserts against it.
- **`robots` is the weaker half and is stated as such**, above.
- **One more place where the two editions must agree.** `draft` joins `FACT_KEYS`, so a per-edition hold
  is impossible by construction — which is the intent, and is also a constraint on any future workflow
  that wanted to publish one locale first.
- **`scripts/routes.mjs` re-derives the flag independently** of `content.ts`, because it runs in Node and
  cannot import the Vite-glob module. Two derivations of one rule is a drift surface; it is bounded by
  both parsing the frontmatter with the same parser and by both taking the conservative reading — **any
  edition held holds the key** — so a disagreement fails toward not publishing.

### An assertion that could not have failed, caught by measurement rather than by reading

Criterion 2 — *no prerendered route for either held slug* — was first written as an HTTP assertion
against the local preview. Measured, `vite preview` answers the **SPA fallback for every nested path**,
including `/en/me` and a published article, each returning the template with
`canonical → https://tadeumendonca.io/en`. On that target a snapshotted route and an unsnapshotted one
are indistinguishable over HTTP, so the assertion would have passed on a held article and on a published
one alike.

It now **skips on the loopback addresses**, copying `edge-rewrite.spec.ts` rather than inventing a
second pattern — and skipping on the *hostname* rather than on an env name, so pointing the harness at
`127.0.0.1` cannot report the local fallback as a production outage. The pre-merge half of the criterion
is carried by `scripts/routes.test.mjs`, which asserts absence from `localizedRoutes()` — the enumeration
`prerender.mjs` **imports** rather than re-derives, so absence there is absence from the snapshot set.

**This is recorded because it changes what a future implementer should do, not as a confession.** Two
rules follow from it and both are general:

1. **An HTTP assertion about prerendering cannot be written against `vite preview`**, ever, for this
   site's architecture. Assert on the enumeration pre-merge; assert on bytes only against a deployed
   target.
2. Every held-state assertion in this slice carries the **same mutation** — flip the fixture's flag to
   `false` and confirm the assertion reddens. A held-state assertion that stays green on a published
   article asserts nothing about the hold. That mutation is the reason the fixture pair is committed
   rather than synthesized, and it is why `src/content/heldFixture.ts` names the slugs and nonces in one
   place: a string spelled independently in six test files can be corrected in five of them, leaving one
   suite permanently green about an article that does not exist.

## Whose decision this was, and the counter-argument that survives

**The fork was decided by the orchestrator**, on 2026-08-25, and it is recorded that way because a record
reading as though the owner chose it would be false. He was asked twice — the second time stripped of
jargon, as *invisible or secret* — and answered sequencing both times:

> *"eu acho que os artigos tem que vir depois que tivermos concluido o modo preview"*

That closed the order and left the fork open. **The bundle exposure was put to him in those words, and
the upgrade path with it** — that it is one sentence from him at any time, including for a single
sensitive piece. What came back, twice, is the sentence above: sequencing. **He was told; he was not
recorded as agreeing.** *Did not object* is an inference, and this record does not make it — the fork
was left open and the orchestrator closed it, which is what the header says and what the paragraph
below refuses to soften.

**The counter-argument is his own word, and it is not settled by this record.** He said *privacidade*
when he ratified the parameter. The measurement says this design does not deliver privacy. **If that word
was load-bearing rather than loose, this decision is wrong** — and reversing it costs the delta below,
not the work already done.

## The upgrade path — this is an extension point, not a ceiling

Held pairs move to `src/content/drafts/`, outside `content.ts`'s glob, so *the body is not in the bundle*
holds **by construction** rather than by a filter. A build step emits them plus a manifest to
`dist/drafts/`; the article page fetches its markdown at the final URL using the token already in
`location.search`; the CloudFront Function gains **one static rule** on the `/drafts/*` prefix — which is
why the prefix exists at all, since a static rule needs no per-article state — validating the token
against a CloudFront **KeyValueStore** written by the deploy job and never committed.

This partially adopts [ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)'s rejected option 2, and
narrowly: no Lambda@Edge, no OG at the edge, still rebuild-and-redeploy per draft — so none of that
option's stated reasons against it apply.

**KeyValueStore pricing is NOT measured**, and must be, against the USD 50/month ceiling, before this is
committed to. That is a precondition on the decision, not a task inside it: the resource is the one new
recurring cost in the package, and adopting privacy without pricing it would put a standing charge on the
budget under a record that never weighed it. **Every draft merge also becomes an `iac/`-touching boundary
change**, which is a permanent cost on cadence, not a one-time build cost.

## What this record alters, and what it does not

**Scoped, not reversed** — all three of the following stay in force and none is superseded.

- **[ADR-0004](./0004-build-time-render-not-ssr-or-edge.md)** decides *"the markdown is compiled into the
  bundle and each route is prerendered to static HTML"*. A held article is **the first content
  deliberately neither listed nor prerendered** — and the clause is narrowed on exactly one of its two
  halves. The markdown is still **compiled in**; that is the whole of the exposure recorded above. Only
  the **prerender** half admits an exception, and it is bounded to content carrying `draft: true`.
- **[ADR-0005](./0005-og-coverage-every-public-url.md)** requires that the prerender snapshot **every**
  public route with complete meta. **A held URL is not a public URL**, so the invariant does not reach
  it — this is a boundary of the term, not a hole in the rule. The moment `draft: false` lands the
  article is a public URL and the invariant applies with nothing relaxed. That record's own instruction —
  *"`STATIC_ROUTES` / `localizedRoutes()` in `apps/fed/scripts/routes.mjs` is the source of truth — cite
  the module, do not re-list here"* — is what makes this hold mechanically rather than by agreement: the
  held article leaves that module's output, so it is outside the set the invariant quantifies over.
- **[ADR-0041](./0041-per-article-og-cards.md)**'s bidirectional set-equality guard is unchanged and now
  runs against a required-card set that is deliberately **smaller** than the article set. The guard's
  false-green concern is the one to watch: its own record notes the shape where *"lists are empty and the
  set-equality assertion passes having compared nothing"*, and a hold that removed every key would
  reproduce it. The E2E control — a published article's card **is** served — is what stands between this
  design and that shape.

## Amendment (2026-08-29) — the parameter also gates the two REVIEW affordances, and the review Issue is frontmatter

Implemented by [#506](https://github.com/tedeuxx/tadeumendonca-io/issues/506). This record decided what
`?preview` *reveals* — a held article's page. It now also decides what that page *offers*, and two calls
were made inside the ratified spec that a later reader would otherwise have to reconstruct from the diff.

**1 · The gate is the PARAMETER ALONE, not `draft && parameter`.** The owner's refinement, verbatim:
*"esse argumento de query string pode permitir esses dois botoes visualizados tbm"*. So a **published**
article reached with `?preview` renders the review bar as well. Three reasons, in the order they weighed:
it is what he asked for; it is what makes promotion **rebuild nothing** — the bar stops appearing because
nobody arrives with the parameter, not because a flag flipped, which is this record's *"the same page in
two modes"* property applied to the affordances; and a second review round on an already-published piece
is a real case that a `draft` gate would take the affordance away from. **What it costs, stated rather
than hidden, and stated LARGER than the first draft of this paragraph did:** a visitor who arrives at a
published URL **carrying** the parameter meets two controls not addressed to them — a copy button that
copies what the page already shows, and, only where the article names one, a link to a public Issue.

**Not "appends".** The copy payload's citation carries `?preview` unconditionally, and the ratified
workflow pastes that payload into a **public** `content` Issue every review round — so the parameter, with
a live link to a page that renders the bar, **is published on the tracker at each round**. Nobody has to
guess it. **This is not a problem and must not be narrowed:** a stranger following such a link finds the
owner's own review machinery on the page, which is the site's argument visible rather than asserted. Only
the earlier description was wrong. Nothing here weakens the isolation this record describes, because the bar reveals
no article that the parameter did not already reveal. The decision is pinned by an assertion (`renders for
a PUBLISHED article too, when the parameter is present`) rather than by a comment, so narrowing the gate
later means deleting a test on purpose.

**2 · The review artifact is the `content` Issue, carried in frontmatter as `contentIssue`.** The Issue
and not the PR — a PR is transient, merges, and a second round needs a second thread, while the Issue
outlives every PR the article travels through. The carrier is frontmatter and the field is a **shared
fact**, so the two editions cannot name two Issues and split one review. **The degradation is asymmetric
on purpose:** an article that omits the field renders **no link** (every article published before #506
omits it, and a link to the tracker's front page is a control that appears to work and lands the reviewer
somewhere he did not ask to be), while a field that is *present and unusable* **throws at module load and
fails the build** — an author who meant to name an Issue and mistyped it must not silently get the
no-button state, which is indistinguishable from never having tried.

**3 · Clipboard, never a prefilled URL** — recorded here because it is the constraint most likely to be
"improved" later. A prefilled `?body=` becomes a URL; browsers and servers cut around 8 KB and the
articles run 6–12 KB, so it would work on the short pieces and truncate the long ones **silently**. The
reviewer cannot see what was dropped and has no reason to suspect anything was.

**What this does not change:** the isolation-not-privacy consequence, the upgrade path, and the three
records this one scopes. **No prerendered snapshot can contain the bar** — but the reason is not the one
first written here.

~~The bar is client-rendered on a page that is already out of the sitemap and the prerender.~~ **Struck:
true of a held article, false of a published one, and it is a published article this same amendment
introduces four paragraphs above.** `apps/fed/scripts/routes.mjs` drops a key only on `fm?.draft === true`,
so every published article is in `localizedRoutes()` and therefore in both the sitemap and the prerender.
Written against the narrower gate that was considered and not built.

**The true reason is one layer down and holds for both cases:** `prerender.mjs` navigates `base + navUrl`
using the `url` `routes.mjs` emits, and that url is `localePath(locale, route)` — **it never carries a
query string**. No snapshot can request the preview, so no snapshot can render the bar, held or published.
**Pinned rather than argued**, which is what makes it worth more than the correction itself:
`scripts/routes.test.mjs`, *"no prerendered route can carry the preview parameter (#506)"*.

## Links

- [#510](https://github.com/tedeuxx/tadeumendonca-io/issues/510) — the Issue, its intake and its
  acceptance criteria
- [#510 comment](https://github.com/tedeuxx/tadeumendonca-io/issues/510#issuecomment-5410347789) — the
  decision, taken by the orchestrator
- [PR #511](https://github.com/tedeuxx/tadeumendonca-io/pull/511) — the implementing MR
- [#505](https://github.com/tedeuxx/tadeumendonca-io/issues/505) — the in-place AI compose feature this
  was split out of · [#506](https://github.com/tedeuxx/tadeumendonca-io/issues/506) — the two review
  buttons, which depend on this parameter · [#479](https://github.com/tedeuxx/tadeumendonca-io/issues/479)
  — the enforced-ratification machine, independent of this slice and the origin of the `drafts/` proposal
- `apps/fed/CLAUDE.md`, the *"An article can be HELD"* paragraph — the operative wording for an author
