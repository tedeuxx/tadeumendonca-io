# 0038. Published content is distributed to LinkedIn **and** X, in the same batch

- **Status:** accepted
- **Date:** 2026-07-26
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0024](./0024-profile-canonical-cv-cross-surface.md), [ADR-0005](./0005-og-coverage-every-public-url.md)

## Context & problem
The site is the storefront, but nobody arrives at a static site by accident — **publishing an article and
distributing it are two different acts**, and until now only the first was decided. The launch article
("My Commitment") was announced on LinkedIn, and X was reached only as an afterthought, by hand, after the
fact.

That is the failure mode ADR-0024 already names for the CV, appearing here as *reach* rather than as
*facts*: a surface announced in isolation makes the presence look intermittent on every other surface.
X was mapped as a signal/contact layer, which is why it was easy to skip — but a presence that is
consistent on one network and sporadic on another reads as sporadic. **Consistency is the mechanism**
(see the site's operating rules), and consistency that depends on remembering is not a mechanism.

## Decision drivers
- Distribution is part of "published", not a follow-up chore — an article nobody is told about did not ship.
- The two networks are **different media**, not mirrors: LinkedIn rewards the long form, X rewards a
  thread. Same argument, different shape.
- Cadence is weekends-only; a standard that costs a remembered decision each time will be skipped.
- The canonical URL must be the thing shared, because the OG card is the first impression and it is
  **pinned by the scraper on first fetch** (ADR-0005) — a shortener spends that impression on a domain
  that isn't the site.

## Considered options
1. **Both surfaces, same batch, medium-adapted copy** (chosen) — one publication event fans out to
   LinkedIn (long form) and X (thread), both ending at the canonical article URL. *Trade-off:* every
   publication now costs two drafts instead of one, and the batch is only as fast as its slowest surface.
2. **LinkedIn only, X for ad-hoc signal** — *Why not:* this is the status quo that produced the gap. It
   also concedes the audience where agentic-development discussion actually happens.
3. **Identical copy syndicated to both** — *Why not:* a 1200-character LinkedIn post truncated into X reads
   as automation, and automation-shaped presence undercuts the "written by a peer" claim the content makes.
4. **Automate the fan-out (scheduler / API)** — *Why not:* not now. It buys convenience at the cost of an
   integration, credentials to hold, and a class of unattended public writes — against the lean posture
   (ADR-0001) and against the ask-first rule for external surfaces. Revisit if cadence ever justifies it.

## Decision outcome
Chosen: **a publication is not done until it exists on both LinkedIn and X.** Both carry the same
positioning and the same canonical link; the copy is adapted to the medium, not re-argued. If one surface
cannot be published, the publication is **incomplete and tracked**, not silently half-done.

The **obligation** is recorded here. The **mechanics** — per-surface checklists, ~~tooling~~, the copy
itself — are private working material outside this repo, exactly as ADR-0024 established for the CV sync.
**Narrowed by the amendment (2026-07-27): "tooling" was too broad — derivation tooling that must share the
site's own source of truth lives in the repo; its output does not.**

## Consequences
**Good**
- Reach stops depending on remembering. The standard is the default, so skipping is now a deliberate act.
- X is promoted from signal layer to distribution surface, aligned with where the target audience is.
- Both surfaces point at the canonical URL, so the OG card and the analytics attribution stay the site's.

**Bad / accepted costs**
- **Two drafts per publication.** Medium-adapted copy is the whole point, and it is the whole cost —
  this is real per-article work in a weekends-only cadence.
- **Still manual, therefore still skippable.** This ADR makes the omission visible, not impossible;
  no gate enforces it. That is deliberate (option 4), and it is the honest limit of this decision.
- **Public writes remain ask-first**, so distribution can't run unattended even when the copy is ready.
- **Partial publication is a real state.** A LinkedIn post live while X is not is the incoherence this
  ADR exists to prevent, in miniature — it must be closed, not tolerated.

## Amendment (2026-07-27) — the draft **generator** is repo tooling; only its **output** is private
A distribution **draft kit** ships in this repo: `apps/fed/scripts/gen-distribution.mjs` (plus its unit
tests and the `gen-distribution` npm script). It scaffolds the LinkedIn long-form section and the X thread
section for each article from the English frontmatter, and writes them to the **gitignored**
`.brand/distribution/<key>.md`. It **posts nothing, holds no credential, and adds no CI gate** — it is
standalone and deliberately not wired into `build` / `build:static`.

**Why the decision above was too broad.** It lumped "tooling" in with the copy as private working
material. Gitignoring the drafts satisfies "the copy itself"; it does not make the generator private, and
the generator is tooling, in the public repo, by name. So the clause is narrowed rather than quietly
ignored:

- **Private:** the copy, and the per-surface checklists that describe how the owner actually posts.
  Pre-publication copy in a public repo would let anyone read tomorrow's post today, which is why the
  output directory is gitignored and never committed.
- **In the repo:** derivation tooling that must share the **site's own source of truth**.

**Why that distinction is load-bearing, not a convenience.** The generator's whole reason to exist is
that it resolves the share URL by **lookup in `scripts/routes.mjs`'s `localizedRoutes()`** — the same
module the prerender and the sitemap consume. A private fork of that derivation would drift from the
site's real routes, reintroducing exactly the risk ADR-0037's per-locale slugs created. Concretely: at the
time this was written `alternatesFor()` advertised a **bare x-default article URL** (`/blog/<en-slug>`)
that the prerender does **not** snapshot, so a scraper sent there got 200 carrying the HOME page's OG card
— pinned permanently (ADR-0005; CLAUDE.md names OG pinning the least reversible thing in this repo).
*(That source defect was fixed the same day by the [ADR-0036 amendment](./0036-per-locale-urls-prerender-hreflang.md)
/ issue #200; hreflang now advertises only prerendered URLs. This generator's guarantee never depended on
it — it constrains what the generator emits, whatever the alternate set contains.)* The generator therefore
**refuses to emit any URL that is not a member of the prerendered route list**, and that guarantee is only
possible because it imports the real routes module. Tooling that must not drift from the code lives with
the code.

*Trade-off (accepted):* the existence and the shape of the distribution mechanism become public — a reader
can see that drafts are generated and what skeleton they start from. That is the cost of the guarantee;
what stays private is what is actually sensitive (the unpublished words), and the alternative — a private
copy of the route derivation — trades a visible skeleton for an invisible, un-gated way to publish a URL
no scraper can read.

**What this does not change.**
- **Automated posting stays rejected.** Option 4 stands in full; nothing here schedules, authenticates, or
  writes to an external surface.
- **The obligation is unchanged** — a publication is still not done until it exists on both surfaces.
- **Still manual, therefore still skippable.** No gate enforces the fan-out. The draft kit lowers the cost
  the "Bad / accepted costs" section named (two drafts per publication); it does **not** close that hole.
- **ADR-0024's parallel clause is unaffected.** The CV sync process stays private working material; this
  narrowing is scoped to distribution drafts only.

## Amendment (2026-08-08) — the cadence is **one article per week**, and the pair is that article's fan-out

The decision above says a publication reaches both surfaces. It never said **how often a publication
happens**, while reasoning from an unquantified cadence premise in its own drivers ("Cadence is
weekends-only; a standard that costs a remembered decision each time will be skipped"). The owner has now
set that number, and named it as the standard rather than a preference. It is appended here rather than
recorded separately because the number is the **unit the existing obligation attaches to**, not a new
obligation.

### The rule, stated so a reviewer can apply it without asking

1. **One article per week is the unit of cadence.** A week with an article published is a week met.
2. **Every article fans out to LinkedIn and X in the same batch** — the obligation the decision above
   already carries, now with a period attached to it.
3. **The direction is one-way: article ⇒ pair, not pair ⇒ article.** The owner's words were *"todo novo
   artigo semanal gera um post"* — every article generates a post. Nothing here forbids a standalone
   post, and a reviewer must not block one. Option 2 above rejected X-as-ad-hoc-signal as a *distribution
   strategy*; it did not forbid ad-hoc signal.
4. **A missed week is named, not carried.** Two missed weeks do not owe two articles the following week.
   *This clause is the writer's reading, not the owner's words* — it is here because a compounding ruler
   produces the exact abandonment curve the recommendation below predicts, and because the debt has no
   ledger anywhere. Overrule it in review if the intent was otherwise.

**"Never separate work" is narrowed, deliberately.** The pair is not separately *decided* and not
separately *scheduled* — that is the real reduction, and it is genuine. It is still separately *written*:
two medium-adapted drafts, scaffolded by `gen-distribution` since the 2026-07-27 amendment. The "Bad /
accepted costs" section above still stands as written; this amendment does not get to delete a cost by
renaming it.

### Baseline, measured 2026-08-08 against `origin/main` at `6e1d66c`

These are **measurements**, each with the command **and the ref** that produced them. The ref is pinned to
a commit rather than to a day because `main` moved twice under this record while it was being written; see
the correction below.

- **One published article.** `git ls-tree --name-only origin/main apps/fed/src/content/blog/` →
  `my-commitment.en.md` and `my-commitment.pt.md`, one article in two locales. Its frontmatter `date` is
  `2026-07-26T22:00:00.000Z` — launch day.
- **Zero published since. Thirteen days** — but not zero *written*, and the difference is the next bullet.
- **A second article was published and unpublished the same day.**
  `green-checks-that-verify-nothing` merged in PR #382 at `2026-08-08T04:22:52Z` (`cca7a7c`, merge
  `e099079`) and was reverted by PR #389 at `2026-08-08T13:25:17Z` (`6e1d66c`), on the owner's decision
  that it was the wrong piece for the week's slot — a priority correction, not an abandonment. The article
  is **held**, and the count returned to one. Recorded because a reader finding a thirteen-day gap in
  `main`'s history six months from now would otherwise have no account of the work inside it.
- **"Published" means the file is in `blog/` on `origin/main`** — not in a working tree, not on a feature
  branch, and **not merely once merged**, as the round trip above shows. Searching `apps/fed/src` and
  `apps/fed/scripts` for `new Date()` finds no publish-date filter, so a file that is on `main` is live on
  the next deploy; nothing else is live at all.
- **Two distribution drafts, one published article.** `ls .brand/distribution/` → `my-commitment.md` and
  `green-checks-that-verify-nothing.md`. The instrument now reads **over**-complete: it holds a pair for an
  article that is not published. That is the sharpest available statement of its weakness — it tracks
  neither publication nor reach. See the pricing below.
- **No rate is stated, on purpose.** One publication has no interval. There is nothing to divide, and
  "0/week" describes a thirteen-day silence; it does not estimate a rate.

**Correction, and the near-miss that produced it.** Three baselines were carried during drafting. First
"0.5 articles/week" — wrong. Then "0/week: one article, nothing since, thirteen days" — right. Then this
writer "corrected" that to **two published articles**, by counting `blog/*.en.md` in a working tree that
was sitting on the unmerged feature branch, and reading a branch as the published state. The owner caught
it against `origin/main` before the record left the branch.

It is recorded rather than tidied because the failure lands inside this amendment's own argument: the
section arguing that a baseline must carry its command was itself produced by a command with no ref, and
a command with no ref measures whatever the checkout happens to be. **The rule that falls out of it, for
anyone measuring cadence later: name the ref, and the ref is `origin/main`.** Working-tree counts and
`git log` on a path both answer a different question than "what is published" — the second for the reason
given under the reader pricing below.

**Naming the ref was not sufficient, which is why the heading above pins a commit.** The correction was
written against `origin/main` and was still wrong within the hour: PR #382 merged at `04:22:52Z` and the
commit carrying the corrected baseline was authored at `04:27:32Z`, five minutes later, without re-running
anything. `origin/main` is a moving ref, so a claim about it is only true at an instant — and on this day
it moved twice, publishing and then unpublishing the same article. Hence `origin/main at 6e1d66c`: a
reader can check the baseline at the commit it was taken at, whatever `main` holds when they arrive.

### The recommendation that was overruled

`product-lead` measured the target and **recommended against it**: one *post* per week with articles at a
slower measured beat, on the argument that the take for six of the eight queued content items exists in
no file, and that a jump from zero published in thirteen days to one article per week is a target missed in week one
and abandoned by week three.

**The owner heard that and set the article target anyway.** He is the decider, this is his cadence and his
public presence, and the recommendation is recorded here because a record whose only rejected options are
the ones nobody argued for documents nothing.

What the recommendation did **not** have, and what moves the cost honestly in the owner's favour: it
priced the post as a second authoring act. Under this amendment it is a fan-out of the first — one decision,
one schedule slot, one shipping batch, with the generator scaffolding both surfaces from the article's own
frontmatter. The weekly unit is *an article and its fan-out*, not *an article plus a post*. That does not
make the drafts free (see the narrowing above), and it does not answer the "six of eight have no take"
finding, which stands unrebutted.

### What reads this rule, and the honest answer

**Nothing reads it today.** Checked: no file under `.github/workflows/` references `content/blog` or the
distribution drafts (the `distribution` hits in `deploy.yml` are CloudFront). No gate, no workflow and no
script consumes either signal. This is the same limit the "Bad / accepted costs" section already admits
for the fan-out — *still manual, therefore still skippable* — now extended to the cadence. Two candidate
instruments exist as **commands a human chooses to run**, and they are not equal:

- **Articles per week — sound, public, CI-capable, and it must name its ref.** Read the frontmatter
  `date` of the files **`git ls-tree origin/main` lists**, never of the files a checkout happens to hold.
  It needs no private material and runs on a clean clone. Three failure modes, all measured here.

  **One: a working tree counts unmerged branches as published** — this record nearly shipped that number.
  **Two: `origin/main` is a moving ref**, so pin the commit — this record shipped a baseline that a merge
  five minutes earlier had already falsified.
  **Three: for any path present at the repository's history horizon, commit dates carry no information
  about publication.** `git log --diff-filter=A -- apps/fed/src/content/blog/` puts `my-commitment` at
  2026-07-31, five days after it was published, and the cause is not a path that moved: `origin/main`'s
  history **begins** that day, at two parentless root commits (`git rev-list --max-parents=0 origin/main`
  → `528b685`, `b2b59bc`; the latter is a `bump:` commit by `github-actions[bot]` importing 250 files).
  Every path present at the import dates to the import, not just content that was ever restructured —
  `git log --diff-filter=A --format="%h %ad" --date=short origin/main -- iac/versions.tf
  docs/adr/0001-*.md LICENSE` returns the same commit and the same day. **`--follow` does not recover an
  earlier date**; it was run, and it returns only the two roots. `my-commitment` was published *before the
  repository's earliest commit*, so for it, `git log` measures the history horizon and nothing else.

  **The counterpart, which is the useful half from here on:** for a path added *after* the horizon,
  `--diff-filter=A` on `origin/main` dates the merge and is a sound date proxy — the same command returns
  `cca7a7c 2026-08-08`, matching that article's frontmatter exactly. **But it is not a presence test**, and
  the round trip above proves it: `cca7a7c` is still reported as an add although the article was reverted
  and is not published. Dating an article and deciding whether an article is published are different
  questions, and only `ls-tree` answers the second. The frontmatter is the instrument for *when*; the
  ref decides *which files exist at all*.
- **Pair completeness via `.brand/distribution/` — weak in three ways, and it currently reads *over*-green.**
  `.brand/` is gitignored (`.gitignore:31`), so the check exists only on the owner's machine: no CI, no
  fresh clone, no reviewer and no agent can run it. It measures **draft generation, not publication** — it
  can read green while neither surface has the post. And today it reads two drafts against one published
  article, which is the third weakness demonstrated rather than argued: it counts a pair for a piece that
  was reverted out of production. It is a leading indicator of intent, never evidence of reach.

No instrument is proposed here as work; only the owner opens work. What this amendment records is that the
cadence is a standard **held by the owner's attention**, exactly like the fan-out obligation above it, and
that the first candidate is the cheap one if that is ever to change.

### What this does not change, including the one trigger this rule touches

- **Automated posting stays rejected.** Option 4's "why not" ends *"Revisit if cadence ever justifies it"*
  — and this amendment is the first time "cadence" has a number, so a later reader could reasonably read
  the trigger as fired. **It is not.** One article per week is two manual publishing acts per week, and the
  other two reasons option 4 was rejected — the lean posture (ADR-0001) and ask-first on external surfaces
  — are independent of frequency and unchanged by it. The clause is touched, not met.
- **The obligation is unchanged.** A publication is still not done until it exists on both surfaces, and a
  half-shipped pair is still *incomplete and tracked*, not tolerated.
- **This is not an editorial production quota.** The cadence is recorded here as the unit the distribution
  obligation attaches to. If article frequency is ever to be justified on its own merits — audience,
  reach, the repositioning — that is a different decision and gets its own record; nothing here pre-empts
  it.

## Links
- Cross-surface coherence obligation for the CV: [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) ·
  OG card pinned on first fetch: [ADR-0005](./0005-og-coverage-every-public-url.md) ·
  per-locale canonical article URLs: [ADR-0037](./0037-localized-article-slugs.md) ·
  tracked in issue #186 · the draft-kit amendment delivered by issue #178 · the distribution **copy** and
  per-surface checklists remain private (kept outside this repo).
- **Since 2026-08-16 the posts this record requires are campaign-tagged** —
  [ADR-0039](./0039-share-campaign-tagging.md)'s reserved `utm_campaign=author-post` was exercised on the
  `/architecture` launch pair. A pointer, not an amendment: nothing decided here changes — the canonical
  URL is still what is shared, and a query string on it is neither a shortener nor a different
  destination. That record carries the values, the reasoning and the honest limit (the tag is applied by
  hand, and `gen-distribution.mjs` neither emits it nor can draft a static route at all — so *"still
  manual, therefore still skippable"* above is now true of the tag as well as of the post).
