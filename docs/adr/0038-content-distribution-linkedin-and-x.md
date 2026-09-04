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

## Amendment (2026-08-16) — the two per-medium conventions: **language by surface**, and the link **in the LinkedIn body**

This record's own driver already says the two networks are **"different media, not mirrors"**, and its
decision outcome already says **"the copy is adapted to the medium, not re-argued."** Until now that
adaptation was named only as *shape* — long form against thread. The owner has set two further
per-medium conventions, and they are appended here rather than recorded separately because both are the
same clause made specific: they say **what "adapted to the medium" means**, for the two surfaces this
record already governs. Neither adds an obligation; each fills in one the decision above already carries.

### 1 · Language is per surface

- ~~**X is always English.**~~
- ~~**LinkedIn ships in pt-BR.**~~

**Struck 2026-08-16, hours after this amendment merged in [#469](https://github.com/tedeuxx/tadeumendonca-io/pull/469).**
The first bullet was right. The second was **wrong** — LinkedIn is **bilingual**, not pt-BR — and the
rule's third part, the one governing which URL is shared, was **missing entirely**. Struck rather than
quietly rewritten because this text reached `main` before it was corrected, so a reader may already hold
it. **The rule in full, and the account of how it came to be recorded wrong, are in the second amendment
below.** The heading above stays as written: language *is* per surface. It was the values that were wrong.

**What this supersedes, and why it cannot be cited by path.** The convention in force before tonight was
**English on both surfaces, with no pt-BR edition of either** — it was stated in the most recent
owner-approved post draft (2026-08-14) and it followed from the private positioning layer's rule that the
owner's public surfaces are English. **Both of those live outside this repository, in the gitignored
private working material this record's own decision outcome puts there** (*"the distribution **copy** and
per-surface checklists remain private"*). So the superseded convention is described here rather than
quoted: nothing private is reproduced into a public record, and a public reader still learns that a rule
existed, what it said, and that it no longer holds.

**That is precisely why this is urgent rather than tidy.** A convention that lives only in the previous
draft is inherited by the next draft. With nothing public saying otherwise, the next post would have been
written English-on-both and would have had one surface's language wrong before anyone looked.

**Nothing in this repository's public record said either thing.** Checked on this branch: no ADR in
`docs/adr/` states a language for a LinkedIn or X post. [ADR-0032](./0032-i18n-locale-layer-english-baseline.md)
and [ADR-0036](./0036-per-locale-urls-prerender-hreflang.md) decide the **site's** locale layer and are
untouched by this — the site serves both editions at per-locale URLs, and which language a *post* is
written in is a different question that had no record at all.

### 2 · The canonical link goes in the LinkedIn **post body**

The link is placed in the body of the LinkedIn post, not in a first comment. This **reverses** the
placement of the 2026-08-14 approved draft (link in the first comment) and **restores** the placement the
launch pair used.

**This was decided against a stated cost, and that is the part worth recording.** The owner was told
before deciding: LinkedIn has historically down-ranked posts carrying an outbound link in the body, which
is the entire reason the first-comment practice exists. He chose the body anyway. **So a later reader must
not read the body placement as an oversight and "fix" it** — the cost was on the table and was accepted.

The URL itself is unchanged: it is still the canonical article URL this record already requires (*"The
canonical URL must be the thing shared"*), carrying the campaign tag the Links section below points at.
What is decided here is only **where in the post it sits**.

### What this does not change

- **The obligation is unchanged.** A publication is still not done until it exists on both surfaces, and
  a half-shipped pair is still *incomplete and tracked*.
- **No claim about results.** Neither convention is recorded with an expected outcome, because none has
  been measured. If either is ever revisited on evidence, that evidence does not exist yet and this
  record does not pretend to anticipate it.
- **No general per-medium rule is being set.** These are the conventions for **these two surfaces**.
  Whether a future surface inherits the split is not decided here.
- **Still manual, therefore still skippable.** Nothing reads either convention. `gen-distribution.mjs`
  scaffolds both sections from the **English** frontmatter and holds no language or placement logic, so
  ~~the pt-BR LinkedIn edition~~ **the bilingual LinkedIn edition** (struck with the bullets above, same
  day, same cause) and the body placement are both the author's act — the same honest limit
  this record already admits for the fan-out and for the campaign tag. **The generator holds no hashtag
  and no `/en/`-link logic either**, so the second amendment's conventions inherit this limit unchanged.
- **Automated posting stays rejected.** Option 4 stands in full.

## Amendment (2026-08-16, second) — the language split was recorded **wrong**; the corrected rule in full, plus the hashtag convention the same pair established

The amendment above is **hours old and one of its two conventions was already false when it merged.** This
amendment does three things: it accounts for how a wrong rule reached `main`, it states the corrected rule
in full, and it records one further per-medium convention the same publishing act produced.

### A · The correction, and how the record came to be wrong

The owner's instruction was *"no linkedin pode ser em pt e br"*. The context that drafted the amendment
above read `pt e br` as the locale code **pt-BR** and recorded a language *switch* per surface. He meant
**both languages**, and said so plainly when the record was read back to him: *"eu tbm pedi pro post do
linkedin ser bilingue … ou seja, teaser em dois idiomas."*

**It is recorded rather than tidied for the same reason this record already keeps its 2026-08-08 baseline
correction** (*"the failure lands inside this amendment's own argument"*): the failure here lands inside
this one's too. The section above argues that a convention living only in a private draft is inherited by
the next draft and must be made public — and the public record it produced was itself wrong, in the exact
clause it was written to fix. **A misread instruction published as a rule is worse than no rule**, because
the next drafter now has a citation for it.

**The generalisable lesson, and it is not "read more carefully":** the instruction was in Portuguese and
its surface form (`pt e br`) collided with a locale code this repository uses constantly (ADR-0032,
ADR-0036, and every per-locale route in ADR-0036's prerender set). When an owner instruction can be parsed
as a token this codebase already carries, **read it back to him in the form the record will state it**
before it merges. That is what caught this one, one merge too late.

### B · The rule in full — three parts, all three shipped

**All three describe what already happened.** The `/architecture` launch pair went out on both surfaces on
2026-08-16 in exactly this shape; this is a record of a practice, not a plan.

1. **X — always English.** Unchanged from the amendment above; this part was recorded correctly.
2. **LinkedIn — bilingual: the same teaser in both languages, in one post.** Not two posts, and not a
   Portuguese post with an English variant filed elsewhere. One post carries both.
3. **The shared link is always the `/en/` URL, on both surfaces** — *"o link deveria ser em inglês ao
   compartilhar nessas redes"* — **even under a Portuguese body.** This part appeared nowhere in the
   amendment above and it is the one a future drafter is most likely to get wrong, because on LinkedIn the
   teaser's Portuguese half now sits directly above an English link and looks like a mistake. It is not.

**Why part 3 does not contradict anything this record already decides.** The decision outcome above
requires *"the canonical URL must be the thing shared"*, and ADR-0037 made article URLs per-locale, so
"canonical" alone no longer picks one URL — it picks one *per edition*. Part 3 resolves that ambiguity in
the direction of the English edition for **shared** links only. It changes nothing about the site: ADR-0036
still advertises both editions with hreflang, and a reader who wants the Portuguese edition is one locale
switch away from it.

**Its accepted cost, stated rather than assumed.** A Portuguese-language teaser sends its reader to an
English page. That is a real friction for exactly the audience the Portuguese half was written for, and it
is accepted on the owner's call. Nothing here measures it — see *no claim about results* below.

### C · Hashtags on LinkedIn, none on X

The owner asked for hashtags *"sempre que possível para melhor indexação"*. That is a general instruction;
what it means per surface is the judgement recorded here, and it splits:

- **LinkedIn — yes.** Its search and feed distribution genuinely index tags as tags.
- **X — none.** X indexes plain words in the post body, so a tag buys no indexing there that the sentence
  did not already buy, and it spends characters out of a 280-character budget the teaser needs. **This was
  the drafting context's judgement, not the owner's instruction — he was told and did not overrule it**,
  which is a weaker warrant than a decision and is labelled as one here so a later reader can reopen it
  cheaply.

**The selection rule, which is the durable half.** Five tags shipped on the LinkedIn post, drawn from the
site's own vocabulary hierarchy, and the line they were drawn on is the part worth recording: **they name
the practice and the runtime it runs on — never the page's contents.** Concretely, **a tool tag is only
ever for the tool the practice runs on, never for the stack the page describes.** An article about this
repository's Terraform does not earn a Terraform tag; the tag set describes what the author does, not what
the page is about. Without that line the set drifts into keyword-stuffing the page's nouns, which indexes
the author against topics he is not positioning for — the precise failure ADR-0024's cross-surface
coherence obligation exists to prevent, appearing here as *indexing* rather than as *facts*.

**The tags themselves are not reproduced here**, for the same reason the copy is not: the shipped set lives
in the private working material this record's own decision outcome puts outside the repo (*"the
distribution **copy** and per-surface checklists remain private"*). The rule that generates the set is
public; the set is not.

**Why this is in this amendment and not its own record.** It clears the significance gate on one criterion
— it establishes a cross-cutting pattern a future drafter follows — and it is the *same clause* being made
specific as the two above: what *"the copy is adapted to the medium, not re-argued"* means for these two
surfaces. A separate record would be unreadable without this one open beside it. **The whole amendment is
one decision** — what medium-adaptation means for LinkedIn and X — enumerated per surface, not three
decisions bundled.

### D · What this amendment deliberately does **not** decide — the hashtag's *wording*

The shipped set includes **`#HarnessEngineering`, bare** rather than the strict `#AgentHarnessEngineering`.
That was the owner's explicit call, it is recorded here as a **fact of what shipped**, and **this record
does not license it.**

The reason is that it is not a distribution question at all. `apps/fed/src/data/vocabulary.test.ts` pins
the practice's name across every surface that carries it, on a stated rule — *the parenthesised form where
the term is **argued**, the strict form where it is a **keyword** — scanned, matched, or rendered in a slot
measured in characters.* **A hashtag is the purest keyword surface there is**, so that rule points at the
strict form and the bare tag is an **exception the owner chose**, not an application of anything written
down.

**Two things measured rather than assumed.** The guard **cannot see hashtags at all** — its pattern
requires a space between the two words, and `#HarnessEngineering` has none — so **nothing reddens either
way**, and a reader must not take the green suite as agreement. And **this library has no vocabulary
record**: no ADR in `docs/adr/` decides the practice's rendering; the rule lives only in that test file's
own comments, which is why an exception to it has nowhere obvious to land.

> **Both quoted claims went stale on 2026-09-04 (#593), and the substance of neither did.** The pattern
> was quoted here as `/(?<!Agent )Harness Engineering/`; at head it reads `/(?<!Context & )Harness
> Engineering/`, because the practice was renamed to **Context & Harness Engineering**. It still requires
> a space, so the hashtag is still invisible to it and the measurement above still holds. ~~*the
> parenthesised form where the term is **argued**, the strict form where it is a **keyword***~~ — **the
> parenthesised affordance was retired in the same slice**, since the word it bracketed left the name;
> there is ONE rendering now, on every surface, so the rule this paragraph reasons from points at the
> strict form for a simpler reason than it did. **The literal is struck rather than silently corrected
> because a record that quotes a code literal is making a checkable claim, and this one was checked.**
> The `#HarnessEngineering` exception §D records was itself superseded on 2026-09-03 by the owner's
> two-tag instruction (`#ContextEngineering` + `#HarnessEngineering`, separate) — recorded where it was
> given, not re-decided here.

**That gap is named, not filled here.** Whether the term's rendering deserves its own record — and if so
whether the bare hashtag form is an exception inside it or a widening of it — is a decision for the owner
and it is his to open. Recording it inside a *distribution* record would put the vocabulary's exception in
a file nobody looking for the vocabulary would open.

### What this does not change

- **The obligation is unchanged.** A publication is still not done until it exists on both surfaces.
- **The body placement is unchanged and re-affirmed.** Section 2 above stands in full, including its
  accepted cost: the owner was told LinkedIn has historically down-ranked posts with an outbound link in
  the body and chose the body anyway. **A later reader must still not "fix" it.**
- **No claim about results.** None of the three parts, and not the hashtag convention, is recorded with an
  expected outcome. Nothing here has been measured, and part 3's cost above is named rather than priced.
- **Still manual, therefore still skippable.** `gen-distribution.mjs` holds no language, placement, hashtag
  or link-locale logic — it scaffolds from the English frontmatter and emits a bare canonical URL. Every
  convention in both amendments is the author's act, unread by any gate. Same honest limit as the fan-out,
  the cadence and the campaign tag.
- **Automated posting stays rejected.** Option 4 stands in full.

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
