# 0049. The practice's name is rendered per register — (Agent) Harness Engineering where the term is argued, the strict form where it is a keyword

<!-- The heading deliberately carries NO inline markup. The parenthesised form is a rendering of a term,
     not a code identifier, so backticks would be wrong typography here anyway — and they would also make
     this the eighth title in the library carrying a code span, which `adr-title.test.tsx:55` pins at
     seven on purpose. That number moves when a heading really gains markup, not to accommodate one that
     did not need it. -->


- **Status:** accepted
- **Date:** 2026-08-15
- **Deciders:** the owner (ratified 2026-08-15 on
  [#444](https://github.com/tedeuxx/tadeumendonca-io/issues/444), choosing to propagate the
  parenthesised form into the prose over the alternative he was shown); written by `tech-lead`
- **Supersedes / superseded by:** —
- **Driven by:** [#444](https://github.com/tedeuxx/tadeumendonca-io/issues/444) (the rendering and the
  guard it reddens) · [#451](https://github.com/tedeuxx/tadeumendonca-io/issues/451) (the CV headline,
  whose intake asked for the headline to be named here explicitly) · records the reasoning of
  [#328](https://github.com/tedeuxx/tadeumendonca-io/issues/328), which had none ·
  constrained by [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) (cross-surface coherence) ·
  reads through [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)

## Context & problem

The practice this site is named after has been renamed twice and is now being **typeset** differently in
one place. Three steps, all in sixteen days:

| when | the string | how it was decided |
|---|---|---|
| until 2026-07-31 | `Loop Engineering` | — |
| 2026-07-31 | `Harness Engineering` | owner |
| 2026-08-02 | `Agent Harness Engineering` | owner, **#328**, a deliberate batch across eight surfaces |
| 2026-08-15 | `(Agent) Harness Engineering` **in `/architecture` prose only** | this record |

**None of it is in an ADR, and that is the problem this record fixes first.** #328 was an Issue, closed;
its reasoning survives only inside two test files — `apps/fed/scripts/og-copy.mjs:27-37` (why a rename
still moves every surface in one batch, and what each regeneration costs under
[ADR-0041](./0041-per-article-og-cards.md)) and `apps/fed/src/data/vocabulary.test.ts:12-33` (why the pin
needs a lookbehind and a stem). Both are excellent explanations sitting in the wrong artifact: a comment
explains the code it is attached to, and nothing in either file explains **which form belongs where**. A
decision whose only home is a source comment is a decision the next reader of a *different* file cannot
find.

**The term is genuinely used in two registers on this site, and it always was.** In `/architecture` it is
*argued* — the page introduces it, draws it, and claims it. On `profile.ts`'s headline and summary, on
`Marquee.STACK`, in the OG meta line and on LinkedIn it is a *keyword*: a token a reader scans or a
search matches, in a slot measured in characters. Until #444 both registers carried one string, so the
difference had no consequence. #444 gives it one.

**What #444 did not do, and the corrected premise.** The request was filed on the belief that
`/architecture` contradicted itself — the figure read `(Agent) Harness | Engineering` while the prose read
the strict form. It did not: the figure's brackets were glossed on the same page, on purpose. So this
record does not resolve a contradiction; it **extends a device from the figure into the prose of the page
that argues the term**, and draws the boundary the extension needs.

**The premise the gloss rested on is gone, and this record must not import it back.** The old
`architecture.{en,pt}.md:43` argued the brackets from market usage — *"harness engineering is commonly
said today for the practice alone"* — with no N and no citation, on a page whose thesis is rigor.
`writer` **removed** that clause rather than sourcing it, and rewrote the gloss to argue from the page's
own usage instead. What shipped on `:43` (verified in both editions on this branch) is: *"the brackets
are not a hedge: they say the short form and the full one name one practice, not two. They belong where
the term is being set out … Further down, where it stops being a label and becomes the claim, it is
written out in full."* **Every claim in that sentence is checkable by reading the page.** This record's
rationale is built on the same footing deliberately — see *What this record deliberately does not claim*
below.

## Decision drivers

- **The register difference is real and load-bearing.** A slot rendered ~320px wide, or a LinkedIn
  headline with a 220-character limit, is not a place to teach a term; the page that argues it is.
- **One global rendering must lose on its costs, not on taste** — otherwise it will be re-proposed every
  time someone notices the divergence.
- **The divergence must be legible as deliberate.** Nine surfaces will read `Agent Harness Engineering`
  while one page's prose reads `(Agent) Harness Engineering`. Without a record that is indistinguishable
  from the drift #167, #320 and #328 were each paid to close.
- **ADR-0024's coherence obligation is not weakened.** Coherence has to mean *one story, one term*, not
  *one byte string in every slot* — but that has to be stated, or the obligation quietly becomes
  unfalsifiable.
- **The guard must stay a pin.** `vocabulary.test.ts` exists because a fixed-string check went green
  against a rename on the day of the rename. Whatever the guard becomes, it must not become an allowlist.
- **Lean ([ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)):** no new tooling. The enforcement
  is a third element on a tuple list that already exists.

## Considered options

1. **Per-register rendering — the parenthesised form where the term is argued, the strict form where it
   is a keyword** (chosen). *Trade-off:* two renderings of one term exist on the site at the same time,
   and a reader who meets both without reading `:43` sees an inconsistency. The rule also has to be
   carried by a record and a surface-scoped test, which is more machinery than one string was.

2. **One global rendering — `(Agent) Harness Engineering` everywhere.** *Why not, and this is the half of
   the record that matters:* it is the keyword register that pays, and it pays where the term is least
   able to defend itself.
   - `og-copy.mjs:38`'s `META_LINE` renders on a card at roughly 320px wide. It already carries three
     terms and a separator run; brackets inside the middle term are visual noise at that size, and
     `og-copy.mjs:20-22` records that the card is where a pt reader meets the term **first** — a slot with
     no room to teach one is the worst place to introduce a hedge-shaped device.
   - **The CV headline** (`profile.ts:32`/`:35`) is a keyword line under a hard 220-character LinkedIn
     limit, and after #451 it is the **most-read instance of the strict form on the site** — it is
     scanned, not read. Brackets there cost characters and read as uncertainty in the one line whose job
     is to assert.
   - `profile.ts:347` is a *skill label* in a levelled list. A bracket in a label reads as an optional
     qualifier on a competence claim.
   - LinkedIn is hand-typed and hand-maintained; every additional character of typography is another
     thing that drifts silently, since no guard in this repo reaches it.
   - It would also cost a republication of all four OG cards under ADR-0041's pinning, for a change with
     no reader gain on that surface.

3. **One global rendering — the strict `Agent Harness Engineering` everywhere, dropping the brackets from
   the `/architecture` figure too.** This is **`product-lead`'s position and it is recorded as
   overruled, not as absent.** Its case is strong: it converges all ten surfaces at **zero test cost**,
   it is #328's own batch reasoning applied consistently, and — the sharpest form of it — *a term that
   moves shape a fourth time inside two weeks reads as a term that has not settled, regardless of which
   layer moved it.* *Why not:* the owner chose to propagate. The figure's brackets predate this decision
   and were already glossed; removing them removes the one place on the site that says the short form and
   the full one name one practice.

4. **Keep the status quo — brackets in the figure, strict form in the prose, glossed by `:43`.** *Why
   not:* it was defensible and it is what the site had, but the gloss it depended on rested on an
   unsourced market claim, and the owner asked for the prose to change. Keeping it also leaves the term's
   whole history recorded nowhere.

5. **Relax the guard globally to `/(?<!Agent |\(Agent\) )Harness Engineering/`.** Not a rendering option
   — the obvious fix for the red test, listed because it is the one someone will reach for. *Why not:* it
   converts a single-value pin into a permanent two-value allowlist on **every** surface, and would
   **silently permit `(Agent) Harness Engineering` in the CV headline** — the exact string #328 paid to
   pin. It stops guarding the thing it exists to guard, while staying green.

## Decision outcome

**Chosen: option 1 — the rendering is per register.**

> **Where the term is being argued, it is set `(Agent) Harness Engineering`.** Where the term is a
> keyword — scanned, matched, or rendered in a slot measured in characters — it is set
> `Agent Harness Engineering`, with no brackets.

Today that resolves to exactly one page in the first register.

### The registers, by surface

| register | surfaces | form |
|---|---|---|
| **argued** | `architecture.en.md` / `architecture.pt.md` — `:13` (the prose introducing it), `:24` (the figure's `centre:`), `:43` (the gloss) | `(Agent) Harness Engineering` |
| **keyword** | **the CV headline, `profile.ts:32` (en) / `:35` (pt)** · the summary, `profile.ts:40` / `:50` · the experience bullets, `profile.ts:71`/`:75`/`:80`/`:96` · the levelled skill label, `profile.ts:347` · `Marquee.tsx:62` (`STACK`) · `og-copy.mjs:38` (`META_LINE`, four cards) · the two published article excerpts · **LinkedIn** (hand-maintained, outside every guard) | `Agent Harness Engineering` |

**The CV headline is named first and explicitly**, at #451's intake's request: after that slice ships it
is the most-read strict-form instance on the site, and the earlier draft of this taxonomy named
`profile.ts:347` while omitting it.

### The one exception, and it is inside the argued register

**`architecture.{en,pt}.md:402` stays unqualified: `Agent Harness Engineering`.** It reads *"**Agent
Harness Engineering** is the claim I am making, and it is this picture…"*.

A parenthesis says a word is optional. Making *agent* optional inside the one sentence that declares the
term to be his is where it costs the most — the sentence would hedge the very word it is claiming. The
owner ratified this exception when he chose the option, and `:43` now forward-references it in the
reader's own path (*"where it stops being a label and becomes the claim, it is written out in full"*), so
the exception has a reason **on the page**, not only in this record.

**This is an exception, not a defect. Do not "fix" it**, and as of this MR it is pinned rather than
merely asked for — see the second guard below.

### Enforcement — what it catches, and precisely what it does not

**Two guards, both in `vocabulary.test.ts`, and they answer different questions.**

**1 · The per-surface bare-form pattern.** `SURFACES` was a `[name, src]` tuple list; it gains a **third
element, the surface's own bare-form pattern**, so the affordance is *data attached to the surface that
earned it* and a surface not listed with it keeps the strict form by construction:

- the two architecture surfaces admit the bracketed form —
  `BARE_ALLOWING_PARENTHESISED = /(?<!Agent |\(Agent\) )Harness Engineering/`;
- `profile.ts` and `Marquee.STACK` keep the strict single-value pin —
  `BARE_UNPREFIXED = /(?<!Agent )Harness Engineering/`, unchanged.

**2 · The claim-sentence pin (`CLAIM_CLAUSE`).** Guard 1 grants the affordance **per file**, so on its
own it would permit bracketing `:402` too — the exception would have been a rule with nothing behind it.
So the claim sentence is pinned apart, anchored on the **distinctive clause per edition** (`is the claim
I am making` / `é a afirmação que eu faço`) rather than on a line number, because `/architecture` is
being restructured under [#448](https://github.com/tedeuxx/tadeumendonca-io/issues/448) and a positional
anchor would silently start guarding a different sentence. The clause's own presence is asserted **first
and exactly once**, so an anchor that stops matching reddens as *a moved anchor* instead of passing as a
satisfied one; the text immediately before it must end with the strict form, with emphasis markers
stripped rather than matched — so the check survives the term losing its bold and still fails on the
bracketed rendering, since `(Agent) Harness Engineering` does not end with `Agent Harness Engineering`.

**What the two catch:** a bare `Harness Engineering` on any of the four surfaces · a bracketed form
landing on `profile.ts` or the strip · **a bracketed form landing on the claim sentence** · the retired
`Loop Engineer` stem, in every inflection, everywhere.

**And the affordance is proved to still discriminate**, which reading it never shows: both patterns are
exercised against literals in both directions, including `expect('AI-DLC & (Agent) Harness
Engineering').toMatch(BARE_UNPREFIXED)` — the assertion that fails if the widened pattern ever reaches a
CV surface. A pattern that accepted every rendering would make the surface loop a tautology and stay
green on the day the term is reverted, which is the failure this file was written to stop, arriving
through the allowlist instead of through the term.

**What it does not catch, stated because a guard believed to be stronger than it is fails in the
direction nobody notices:**

- **`CLAIM_CLAUSE` pins one sentence, not the register.** It proves the strict form immediately precedes
  that clause in both editions. Every *other* occurrence on those two surfaces is governed only by guard
  1, which admits both renderings — so which of the two forms an author picks for a **new** occurrence in
  the argued register is a judgement, and this record is what makes it one with an answer.
- **`vocabulary.test.ts`'s `toContain(CURRENT)` is green for the wrong reason on every surface.** On
  the architecture editions it is satisfied by the `accDescr` on `:23` — a description of the *drawing* —
  and on `profile.ts` it reads `?raw`, so the whole file's source including comments; `:347` alone
  satisfies it. **It would stay green if the headline dropped the term entirely.** Pre-existing, found at
  #451's intake, not worsened here, and named so nobody leans on it as a headline guard.
- **Three keyword surfaces are outside `SURFACES` entirely.** `META_LINE` has its own pin in
  `og-copy.test.mjs:60-77` (which already carries the same lookbehind); the article excerpts and
  **LinkedIn** have none. LinkedIn drifts silently by construction — it is hand-typed, and ADR-0024's
  amendment already records external surfaces as a maintained obligation rather than a mechanical one.
- **The `-skills` repository is a different repo and out of reach.** `check-harness-drift.mjs` does not
  read the term.

### What this record deliberately does not claim

**It makes no claim about how the market uses the term.** Not *"harness engineering is commonly said
today for the practice alone"*, and no quantified variant of it. That premise was in the page and was
**dropped rather than sourced** — nothing in this repo or in the private positioning source supports it,
and it is not worth importing an unsourced claim into a permanent record to prop up a typographic
decision. The argument here stands on two things instead, both checkable: **the brackets say the short
and the full form name one practice rather than two**, and **the registers on this site differ in what
the slot can carry**. If the market observation is ever wanted back on the page, it needs the owner's own
grounding and is a separate change.

### Out of scope — one decision per record

**The plugin's own skill is named `harness-engineering`, without the prefix** — the directory, the
identifier, and the `/harness-engineering` invocation. Its prose uses the full term throughout
(`SKILL.md:5`, `:19`, `:57`). Whether an *identifier* is a third register, or should move, is a
**methodology-library decision in `tadeumendonca-skills/docs/adr/`**, authored there, with its own cost
(renaming a published plugin identifier is a breaking change to the invocation surface under that repo's
own SemVer rules). It is named here so the omission is visible, and deliberately not decided here.

Also out of scope: the `.brand/positioning.md` entry this implies. That source fixes the term's role and
its string and is silent on typesetting; it is private, gitignored, and cannot ride this PR.

## Relationship to ADR-0024

**[ADR-0024](./0024-profile-canonical-cv-cross-surface.md)'s cross-surface coherence obligation stands
unchanged, and this record is not an amendment to it.** 0024 decides *where the canonical CV lives* and
that the surfaces must tell one coherent story; it does not decide typography, and it never claimed
byte-identity.

This record says **what coherent means for this one term**: one practice, one name, two renderings whose
applicability is decided by register rather than by the surface's convenience. The obligation 0024
creates — that a positioning change propagates to every surface in one pass — is what makes the register
rule necessary rather than optional: without it, the next rename has no rule for which form each surface
takes, and #328's batch discipline degrades into per-surface judgement.

It is a **new record, not a supersede.** No prior ADR in either library covers the term.

## Consequences

**Good**

- The term's history and its rendering rule live in a record a fresh context can load, instead of in
  comments inside two test files that explain something else.
- The divergence between `/architecture`'s prose and nine other surfaces is legible as **deliberate**.
  That is the whole difference between this and the drift #167 / #320 / #328 were paid to close.
- The rejected global is priced, per surface, so it does not get re-proposed as a tidy-up.
- The guard becomes **surface-scoped**, which is strictly stronger than what it replaces: `profile.ts`
  and the strip keep a single-value pin they would have lost under the obvious global relaxation.
- The exception at `:402` has a reason **on the page**, in the reader's path — not only in this record —
  **and a guard behind it.** An exception carried by prose alone is an intention; `CLAIM_CLAUSE` makes it
  a rule something would stop.

**Bad / accepted costs**

- **Two renderings of one term ship simultaneously**, and a reader who meets `(Agent) Harness
  Engineering` on `/architecture` and `Agent Harness Engineering` on `/me` without reading `:43` sees an
  inconsistency. The gloss is one paragraph on one page; most readers of the CV will never see it.
- **The register rule is a rule, not an enforcement.** Nothing decides which register a *new* surface
  belongs to; a future surface gets a judgement call, and the guard will accept whatever the author
  chose as long as it is one of the two forms on an admitting surface.
- **`CLAIM_CLAUSE`'s anchor is authored English and Portuguese prose**, so a deliberate rewording of that
  sentence reddens a test. That is the intended direction — it forces the exception to be re-decided
  rather than lost — but it is a real cost: the guard is coupled to a sentence #448 is expected to move.
- **`toContain(CURRENT)` remains green for the wrong reason** on all four surfaces. Naming it here does
  not fix it, and this record does not fix it — it is a separate change with its own argument.
- **This is the term's fourth shape in sixteen days.** `product-lead`'s objection is not disposed of by
  being overruled: shape churn is itself a signal to a reader who has been following. The mitigation is
  that this is the last *rendering* question available on the term — there is no fifth form — and that
  the string itself did not move.
- **LinkedIn and the article excerpts carry the rule with no guard at all**, and the `-skills` repo is
  out of reach entirely.

**Neutral**

- **Documentation only.** No `iac/`, no dependency, no application behaviour. The one mechanical
  consequence is the ADR index: this record adds a row, so `apps/fed/src/content/generated/adrs.json` is
  regenerated in the same MR ([ADR-0043](./0043-harness-inventory-derived-from-plugin-repo.md)'s
  committed-artifact shape — a stale artifact is a red build, by design).
- **No OG card is regenerated.** `og-copy.mjs` is untouched by #444 and by this record, so ADR-0041's
  pinning cost is not paid here.

## Links

- **Constrained by [ADR-0024](./0024-profile-canonical-cv-cross-surface.md)** — the coherence obligation
  is unchanged; this record defines what it means for this term, per register.
- **Costed against [ADR-0041](./0041-per-article-og-cards.md)** — the reason a bracketed `META_LINE` is
  not free: every regeneration republishes an artifact scrapers have pinned. Not paid here.
- **Reads through [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md)** — the instrument is a
  third element on an existing tuple list, and a record. No new tooling.
- **Records the reasoning of [#328](https://github.com/tedeuxx/tadeumendonca-io/issues/328)**, whose
  decision shipped as an Issue and survives only in `og-copy.mjs:27-37` and
  `vocabulary.test.ts:12-33`. Those comments stay where they are — they explain their own files
  correctly; what they could not carry is which form belongs where.
- **The `docs/adr/0034-…:202` occurrence of the pre-#328 bare form is history and must not be edited** —
  supersede, never rewrite. It sits outside `SURFACES` for that reason.
