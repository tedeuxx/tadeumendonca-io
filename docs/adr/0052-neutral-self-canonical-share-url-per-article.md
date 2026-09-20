# 0052. A neutral, self-canonical share URL per article — one address, two consumers, split by JavaScript execution

- **Status:** accepted
- **Date:** 2026-09-20
- **Deciders:** **the owner** — the specification
  ([#660 comment](https://github.com/tedeuxx/tadeumendonca-io/issues/660#issuecomment-5743437953)) and the
  canonical ruling
  ([#660 comment](https://github.com/tedeuxx/tadeumendonca-io/issues/660#issuecomment-5749824051)).
  Written by `tech-lead`, in the MR that implements it. Both leads closed the description at intake; the
  merge gate reviewed the implementation at `ff3ab9e` and required this record before merge.
- **Supersedes / superseded by:** — (**amends** [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)'s
  2026-07-27 amendment for the article class only; that record's clauses are struck in place there)
- **Driven by:** [#660](https://github.com/tedeuxx/tadeumendonca-io/issues/660) ·
  [PR #667](https://github.com/tedeuxx/tadeumendonca-io/pull/667) · **makes usable**
  [ADR-0038](./0038-content-distribution-linkedin-and-x.md)'s 2026-09-20 amendment (which states the
  convention and names its own precondition) · **keyed on** the slug
  [ADR-0037](./0037-localized-article-slugs.md) governs · **applies**
  [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)'s 2026-07-28 *"the prerender is not a visitor"*
  invariant · **inherits** [ADR-0005](./0005-og-coverage-every-public-url.md)'s pinned-card cost · reads
  through [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem

**The owner published a LinkedIn post in Portuguese carrying an `/en/` link, opened it, and read the
article in English.** His words, opening it:

> *«o link que vc tem compartilhado no linkedin nao é o slug nao regionalizado idioma. entao quando abro
> ele carrega em ingles para mim ao inves de portugues.»* · *«isso é um erro»*

[ADR-0038](./0038-content-distribution-linkedin-and-x.md)'s 2026-09-20 amendment reversed the convention —
a post carries the locale-neutral URL — **and recorded that the rule was correct and inert**, because the
neutral URL was a soft-404: `200`, serving the English landing page's card, because `iac/frontend.tf` maps
404 to `/index.html` with response code 200 and the build snapshotted nothing at that address. That record
names its own precondition and places the route in this one. **This record is what makes that convention
usable.**

**The defect is the reader, not the metric.** A Portuguese reader follows a Portuguese post and lands on
an English article with no visible way back. The owner's own hypothesis that the pinned link is costing
reads is recorded on `#660` **as a hypothesis** and is not asserted here.

**The hard part is that one address must serve two consumers differently.** The owner's specification,
which is the whole feature:

| who requests the neutral URL | what it gets |
|---|---|
| a scraper — LinkedIn, X, a crawler | the **English preview**: `og:` tags and the English OG card. One stable card per article. |
| a human | the site's **automatic locale resolution**, landing them in their own language. |

His acceptance case, verbatim: *«eu entraria pelo link nao regionalizado que li o preview em ingles mas
clicaria no link e espero ler em portugues.»* **Steps 2 and 3 happening from the same href is the
feature**, and nothing in the request distinguishes the two consumers.

## Decision drivers

- **The split must not depend on inspecting the request.** User-agent sniffing at the edge is a
  maintained list of strings that is wrong the week after it is written.
- **[ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)'s invariant is not negotiable:** *a URL may
  be advertised — in `hreflang`, in the sitemap — only if the build prerenders it.* Issue #200 was this
  invariant breaking, and five of six advertised x-defaults answering 200 with the home page's card.
- **[ADR-0005](./0005-og-coverage-every-public-url.md): a scraper PINS the card on first fetch.** A wrong
  card at a shared address is the least reversible thing this repository can ship.
- **[ADR-0004](./0004-build-time-render-not-ssr-or-edge.md): build-time render, no SSR and no edge
  compute.** A solution requiring either is a different architecture, not a feature.
- **[ADR-0002](./0002-fully-static-spa-no-backend.md): there is no request-time code** to put a decision
  in, other than the CloudFront Function this repository has kept deliberately trivial.

## Considered options

### 1 · A prerendered neutral route per article, which redirects only for a client that runs JavaScript — **CHOSEN**

`/blog/<en-slug>` is a real entry in the route enumeration and a real document in `dist/`. The snapshot
browser renders the **article** there; every other visitor's browser executes the page and is redirected
into its own edition.

**The split is by JAVASCRIPT EXECUTION, not by request-time inspection, and that is the load-bearing
property.** A scraper fetches and parses; it does not execute the redirect. A human's browser does. The
same bytes serve both, and nothing has to guess which one is asking.

*Cost:* the redirect is invisible to a crawler, so the English text is reachable at two self-canonical
addresses (below). *Cost:* an article's OG card at the neutral address is always English, whatever the
reader's language — accepted, because one stable card per article is what the owner asked for.

### 2 · An edge 302 from the neutral URL to the reader's edition — **REJECTED**

A CloudFront Function reading `Accept-Language` and redirecting. This is the shape most readers reach for
first, and it is worth recording why it cannot work here rather than leaving a later reader to rediscover
it.

**It applies to the scraper too.** A 302 is obeyed by whoever follows it, and an unfurler follows
redirects — so LinkedIn would land on `/pt/blog/<pt-slug>` or `/en/blog/<en-slug>` depending on the
crawler's own headers, pin **that** card, and the one-stable-card-per-article property is gone. The
feature is *serve the two consumers differently*, and a redirect is the one mechanism that cannot tell
them apart. It also puts negotiation logic at the edge, which
[ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) already rejected and
[ADR-0004](./0004-build-time-render-not-ssr-or-edge.md) rules out as an architecture.

### 3 · Leave the convention inert and keep sharing `/en/` links — **REJECTED**

Costs nothing to build and is what shipped before this record. Rejected because it is the defect the
owner reported, and because
[ADR-0038](./0038-content-distribution-linkedin-and-x.md)'s amendment has already reversed the convention
in the record a drafter reads — so the repository would carry a rule that every post is written against
and that the site cannot honour.

### 4 · A neutral snapshot for EVERY route, not only articles — **REJECTED, and it is ADR-0036's own rejected option**

[ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)'s 2026-07-27 amendment considered and rejected
*"prerender the bare URLs instead"*, on the ground that it *"leaves the Portuguese reader in a dead end"*.
**That reason was discharged for articles by issue #204** — the unprefixed redirect became slug-aware
(`articlePathForLocale`), so the bare path resolves in both editions — and it is **not** discharged for
anything else that would make the wider option attractive. The four static routes have no share
convention pointing at them, no per-locale slug problem, and a working prefixed x-default. Widening the
change would spend the invariant's budget on routes nobody shares.

## Decision outcome

**Every published article has one locale-neutral share URL, `/blog/<en-slug>`. It is prerendered, it is
SELF-canonical, and it is that article's advertised `x-default`.**

### (a) It is keyed on the CURRENT ENGLISH SLUG, not on the article's identity key

**Refuted against live content rather than reasoned.** The article whose file key is
`the-problem-stopped-changing` carries `slug: from-cloud-to-ai-same-badge` in its English frontmatter —
the key is a **retired** slug. Measured at head:

```
grep -rn 'slug:' apps/fed/src/content/blog/*.en.md
# -> the-problem-stopped-changing.en.md:3:slug: from-cloud-to-ai-same-badge
```

A key-keyed scheme would therefore have published `/blog/the-problem-stopped-changing` — an address the
retired-slug intercept exists to retire — as the advertised, permanent share address of a live article.
**The alternative was not merely less tidy; it was wrong on the content that exists today**, which is why
the option is recorded as refuted rather than as preferred.

*Cost:* an English-slug rename moves the advertised address. That is what the intercept covers: it reaches
the neutral path and **stays neutral**, so a rename redirects the old neutral URL to the new neutral URL
rather than dropping a reader into a prefixed one.

### (b) It is SELF-canonical — the owner's ruling, with its cost

The neutral URL declares itself canonical. **Both leads declined to decide this and both were right to:**
`tech-lead` recommended it and named that the acceptance criterion *chooses* rather than merely checks;
`product-lead` reported it is invisible to a human reader either way and declined to manufacture a reader
argument. It reached the owner as an architecture decision with no reader side, which is what it is.

**The accepted cost, stated rather than discovered: the same English text is reachable at two
self-canonical addresses** — `/blog/<en-slug>` and `/en/blog/<en-slug>`. That is duplicate content by
construction.

**Why it is accepted:** the alternative — canonicalising the neutral URL at the prefixed English one —
advertises a page as `x-default` while telling a search engine the address is not the real one. A crawler
resolving that contradiction against us drops the neutral URL, which is the one every future post will
carry. A recorded duplicate is better than a contradictory signal on the address the whole convention
depends on.

**What no instrument here reaches:** how a real crawler resolves two self-canonical addresses that name
each other through `x-default`. Nothing in this loop can measure it, and the owner accepted that cost
explicitly rather than having it inferred for him.

### (c) `x-default` moves FOR ARTICLES ONLY

The `pt` and `en` alternates and their own canonicals do not move. **The four static routes — `/me`,
`/portfolio`, `/ramp-up`, `/architecture` — keep
[ADR-0036](./0036-per-locale-urls-prerender-hreflang.md)'s 2026-07-27 trade unchanged**, and their bare
paths are still redirect-only and still never advertised.

**ADR-0036's invariant is SATISFIED, not traded away.** The bare article URL may be advertised **because
the build now snapshots it**. That is the rule working, and it is the reason this record amends four
clauses of ADR-0036 in place rather than overruling the amendment that carries them.

### (d) The prerender opt-out is ADR-0036's recorded invariant's SECOND consumer, not a new exception

**Adding the neutral path to the prerender list alone does not work**, and the reason is a rule this
repository already recorded. At `/blog/<en-slug>` the app renders the locale redirect — a `<Navigate>`
that leaves before any head hook runs — so the snapshot would wait on a canonical that never appears
there and capture the `/en/…` document instead, canonical and all.

`ADR-0036`'s 2026-07-28 amendment already states the general rule: **the prerender is not a visitor**, and
anything rendering off the **visitor** rather than the **route** must opt out of the snapshot. A locale
redirect is the purest instance of it. So `NeutralArticleRoute` reads the same `window.__PRERENDER__` flag
the existing opt-outs read and renders the article in place. **This is an application of a recorded
invariant, not a new exception carved for this feature** — which matters, because a second consumer is
what turns a rule written once into a rule.

**And the build FAILS LOUDLY rather than shipping a wrong canonical.** Confirmed by mutation at the merge
gate: inverting the opt-out kills `build:static` with
`page.waitForFunction: Timeout 15000ms exceeded. at snapshot (scripts/prerender.mjs:63:14)`, thrown from
the neutral loop. The failure mode of this mechanism is a red build, not a silently wrong document at the
most-shared address — which is the property that makes the opt-out acceptable at all.

### (e) The draft generator is part of the decision, not a follow-up

`shareUrlFor()` in `apps/fed/scripts/gen-distribution.mjs` selected the route whose `locale` is `'en'` and
therefore emitted `/en/blog/<en-slug>` **by construction**. It now resolves against the neutral set.

**Shipping the route without this would have satisfied the precondition in the routing and defeated it in
the tooling that scaffolds every post, with nothing anywhere saying so** — no gate reads the convention or
the URL the generator emits. That is why it is an acceptance item of this decision rather than a
follow-up. The refusal semantics are untouched: a held article still has no share URL.

## Consequences

**Good**

- The convention [ADR-0038](./0038-content-distribution-linkedin-and-x.md) records becomes usable, and the
  defect the owner reported cannot recur from a link the generator produces.
- **ADR-0036's invariant gains a second, independent consumer** — the neutral URLs are generated from the
  same enumeration the prerender walks and the sitemap advertises, so snapshot and sitemap cannot drift.
- The retired-slug intercept reaches the neutral path and stays neutral, so the **most-shared** address
  survives a rename.
- GA's `locale` dimension on social traffic stops being **constant**, which is worse than noisy because a
  constant reads as a finding. It becomes *meaningful*, not *sufficient*.

**Bad, and stated as bad**

- **Duplicate English content at two self-canonical addresses** (b). Accepted; unmeasurable from here.
- **A third permanent public URL contract per article.** A scraper pins its card and a search engine
  indexes the address; retiring it later is not a revert.
- **A retired English slug's neutral address is not prerendered**, so an unfurler fetching
  `…/blog/<retired-en-slug>` pins the home card while a human following the same link is redirected
  correctly. This is the pre-existing shape for prefixed retired slugs, now inherited by the *advertised*
  address class.
- **The OG card at the neutral address is always English**, whatever the reader's language. Deliberate —
  one stable card per article — and it means a Portuguese reader's preview and arrival differ in
  language.
- **The prerendered route count grows by one per published article**, and each carries an OG lookup; the
  build cost [ADR-0005](./0005-og-coverage-every-public-url.md) anticipates grows with it.
- **Two live social posts still carry `/en/` links.** Changing what a URL serves is safe; changing a URL
  inside a published post is a different act and is the owner's, per post. `product-lead` verified none is
  obliged.

## What this record does NOT decide

- **The locale resolver.** This changes no line of `i18n/config.ts`. `#661` owns the resolver; this record
  owns the address. *"A pt-BR reader lands in Portuguese"* is **false for a returning reader**, correctly
  — resolution is path → persisted toggle → navigator — so no assertion here may claim it.
- **The title seam.** An English card headline against a Portuguese headline on arrival is a **ruler**
  question, not a UI one, and it is tracked as a `content` item in `tedeuxx/tadeumendonca-skills`.
- **Whether the pinned link was costing readers.** A hypothesis on `#660`, with what would test it. This
  decision does not depend on it.
- **Anything about the four static routes.** Their x-default is ADR-0036's and is untouched.

## What enforces this, per clause — and one seam nothing covers

| clause | what holds it |
|---|---|
| the neutral URL is advertised only if prerendered | **`apps/fed/scripts/routes.test.mjs`** — membership, from the same enumeration both consumers read |
| the neutral set matches the English article set | **`routes.test.mjs`**, three arms; neutering the enumeration at source turns them red |
| the generator emits the neutral URL | **`gen-distribution.test.mjs`** — every emitted URL is a member of the real `neutralArticleRoutes()` output |
| the served document is self-canonical | **`e2e/per-locale.spec.ts`** — `canonical == requested URL` on the served document, with a **nonsense-slug control**, because a nonexistent path also answers 200 and a status code yields a green that cannot go red |
| the snapshot is actually WRITTEN | **only the E2E arm.** The unit layer compares two enumerations and never reads the filesystem — measured: deleting the neutral loop from `prerender.mjs` leaves `routes.test.mjs` at 41 passed |
| the opt-out stays correct | **the build itself** — inverting it times out `build:static` rather than shipping a wrong canonical |
| the share CONVENTION is followed in an actual post | **nobody.** No layer observes a draft, a post or a published URL — the same honest limit [ADR-0038](./0038-content-distribution-linkedin-and-x.md) already records |

**One advisory the gate raised and this record carries rather than fixes:** the prerender summary line
counts the enumeration's length rather than what it wrote, so under the one mutation the unit layer is
blind to it prints *"+ N neutral share URLs"* having written none. It over-reports in exactly the scenario
where the E2E arm is the only reader — a one-line fix, deliberately not taken here, and named so the next
person reading that log knows what it is counting.

## Links

- Convention and its precondition: [ADR-0038](./0038-content-distribution-linkedin-and-x.md)'s 2026-09-20
  amendment · the wording a drafter is judged against is `published-voice`'s **rule 21** in
  `tedeuxx/tadeumendonca-skills`.
- Amended in place by this record: [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) — four clauses
  of its 2026-07-27 amendment (the *"for every route"* enumeration, the rejected *"prerender the bare
  URLs"* option, the addendum's *"must not be re-added to hreflang or the sitemap"*, and the ADR-0037
  clarification), each struck in place rather than rewritten.
- Per-locale article slugs: [ADR-0037](./0037-localized-article-slugs.md) · OG card pinned on first fetch:
  [ADR-0005](./0005-og-coverage-every-public-url.md) · campaign tagging is a query string on whatever the
  share target is and is untouched: [ADR-0039](./0039-share-campaign-tagging.md) · a held article has no
  share URL: [ADR-0049](./0049-held-article-is-isolated-not-private.md).
- Issues: [#660](https://github.com/tedeuxx/tadeumendonca-io/issues/660) (this route and this record) ·
  [#665](https://github.com/tedeuxx/tadeumendonca-io/issues/665) (the convention, closed) ·
  [#661](https://github.com/tedeuxx/tadeumendonca-io/issues/661) (the resolver) ·
  [#204](https://github.com/tedeuxx/tadeumendonca-io/issues/204) (the slug-aware redirect this decision
  depends on) · [#200](https://github.com/tedeuxx/tadeumendonca-io/issues/200) (the invariant this
  decision satisfies rather than relaxes).
