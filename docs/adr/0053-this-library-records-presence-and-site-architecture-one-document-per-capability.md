# 0053. This library records presence and site-architecture decisions, one document per capability, behind a two-limb entry rule

- **Status:** accepted — ratified by the owner on 2026-11-01, *«Ratificar»*, recorded on
  [#456](https://github.com/tedeuxx/tadeumendonca-io/issues/456#issuecomment-6564257323). ~~proposed (the shape is the owner's, ruled on Issue
  [#456](https://github.com/tedeuxx/tadeumendonca-io/issues/456) on 2026-08-25, 2026-09-11 and
  2026-10-31; this record writes it down and becomes `accepted` only on his ratification)~~ — struck
  2026-11-01 by that ratification; the record was `proposed` from the first slice of #456 until then
- **Capability:** `decision-library`
- **Date:** 2026-11-01
- **Deciders:** the owner · written by `tech-lead` in the first slice of #456
- **Supersedes / superseded by:** —
- **Absorbs:** the lean-by-design keystone, formerly record 0001 (accepted 2026-07-22, amended
  2026-10-16), as the section *Lean by design — the keystone every record is read through*. That
  decision is `accepted` and binds exactly as it did (#456, third slice)
- **Driven by:** Issue [#456](https://github.com/tedeuxx/tadeumendonca-io/issues/456); the method's
  `documentation-standard` skill, Part II (what an ADR is, the four dispositions of a record that
  leaves a library, absorption); `tadeumendonca-skills#283`, which applied the same definition to the
  methodology library first

## Context & problem

The owner, 2026-08-15, after a record of how one term is typeset reached a merge request:

> *"acho que estamos criando adrs de mais / precisamos ancorar o que sao adrs"*

The library had no stated scope and no entry rule beyond the method's significance test, which is
elastic: almost any convention can be described as *"a cross-cutting pattern"*. Measured at `a215edd`,
the head this record was written on, by the month each record present there first arrived — per path,
because a `--full-history` walk over the glob counts re-additions on merged branches and inflates the
first month roughly twofold:

```
for f in $(git ls-tree --name-only origin/main docs/adr/ | grep -E '/[0-9]{4}-'); do
  git log origin/main --diff-filter=A --follow --date=format:%Y-%m --format=%ad -- "$f" | tail -1
done | sort | uniq -c
# -> 41 2026-07 · 9 2026-08 · 2 2026-09
```

The library's stock and its inflow have different causes. The 41 records of 2026-07 came from one
reverse-engineering pass that documented an existing site; no entry rule was applied to them because
none existed. The inflow since is smaller and, on the 2026-08-25 intake's reading recorded on #456,
mostly **conventions** — rules about how a string is
spelled or typeset, several of them already refused by a test. The first cause produced a large
library of one-decision files; the second keeps growing it with records that no isolated context needed
in order not to diverge.

The practice the library follows also changed underneath it. *Supersede, never delete* was replaced in
the method by *a record earns its place by explaining the current codebase*, with four dispositions for
a record that leaves a library (delete with a History row, fold into the superseding record, keep, or
absorb into the document that governs it). This library's README still promised *"never deleted"*.

So three things need deciding together, because each one is meaningless without the others: what this
library records, the unit a record is, and the rule a new decision passes to get in.

## Decision drivers

- **The reader is an agent with a fresh context.** A record exists so that an isolated context does not
  re-decide something and diverge. A record that prevents no re-decision costs reading time on every
  load and buys nothing.
- **One document should answer one question a reader arrives with.** The owner's words:
  *"a leitura de um documento adr é autosuficiente para entender aquele comportamento"*.
- **Folding must not tear the largest records.** Several records here cite records from many areas at
  once; a partition that splits them into pieces defeats the self-sufficiency it exists for.
- **The entry rule has to refuse something.** A rule that only says *where* a decision goes makes the
  library smaller in file count and the same in content.
- **Size per document stays loadable.** Folding relocates reading cost; it does not remove it.

## Considered options

### What the library is scoped to

1. **The owner's two halves, with the decision library itself admitted as a consequence of the first
   (chosen).** His words: *"decisoes sobre a minha comunicacao de presenca online e decisoes sobre a
   arquitetura tecnica do site."* How this repository records decisions is **presence communication**
   here, not internal bookkeeping: `/architecture` publishes the library and argues its recording rule
   to the reader, in both editions. *Trade-off:* the admission rests on a fact about one page; if that
   page stops publishing the library and its rule, the reading lapses (see *Falsifier* below).
2. **The two halves, with an explicit exception clause for "how this repository records decisions."**
   *Rejected:* it would record that the site's own published argument is out of scope for the site.
3. **No stated scope; the significance test alone decides.** *Rejected:* that is the state that let a
   typesetting rule reach a merge request as a record.

### The unit a record is

1. **One document per capability, partitioned by the reader-visible surface a question arrives from
   (chosen).** Each capability has one anchor record; decisions about that capability live in it as
   sections. *Trade-off:* things that share code split across documents (the build pipeline appears in
   more than one), so each document has to say what does not belong in it.
2. **Partition by code layer (hosting, build, application, content).** *Rejected:* the per-locale URL
   record cites records from every candidate layer at once; under a layer partition it tears into
   pieces on the first fold, and a torn record is not self-sufficient.
3. **Keep one file per decision.** *Rejected:* it is the shape that produced the stock above, and a
   fresh context has to open many files to understand one behaviour.
4. **Six capabilities rather than the working eight.** *Rejected on size:* the sister fold in
   `tadeumendonca-skills` grew its library's total bytes while cutting its file count, so the reading
   cost moved into fewer, larger documents. At six, this library's largest document would plausibly
   exceed the point where a fresh context can afford to load it. The working partition keeps the
   harness self-description record alone for that reason.

### The entry rule

1. **Two limbs, both applied to every new decision (chosen).**
   - **Capability limb:** is this a new capability, or behaviour of one that already has a document? If
     a document exists, the decision is a section of it, never a new file.
   - **Re-decision limb:** without a record, would an isolated context re-decide this and diverge? **If
     a mechanism (a test, a constant, a configuration) already refuses the alternative, that mechanism
     is the record**, and the reasoning goes beside it as a comment. The limb is applied **to each
     still-live rejected option, not to the rule as a whole**: a mechanism that holds the rule but
     passes a rejected option leaves that option unrefused, and the record is still owed.
   *Trade-off:* the second limb is a judgement. It is checkable — a refusal cites the file and the
   assertion — but nothing gates it.
2. **The capability limb alone.** *Rejected:* it does not refuse a typesetting rule; such a rule is
   trivially behaviour of the design-system capability and lands there as a section. The library gets
   fewer files and the same content.
3. **A gate that decides admission.** *Rejected:* whether a mechanism refuses an alternative is a
   reading of what the mechanism asserts, which no string check performs. A gate here would read as
   enforcement and decide nothing.

## Decision outcome

**An ADR in this repository records one architecturally-significant decision about the owner's online
presence or the site's technical architecture — its context, the options weighed, the choice and its
consequences — that an isolated context would otherwise re-decide and get wrong.**

**The library is organised as one document per capability**, on the reader-visible-surface axis. A
capability's anchor record keeps its number and filename; decisions that belong to it are sections
inside it. The working partition is the one ruled on #456 on 2026-10-31 (*«Ratificar e validar»*),
adjustable by the pilot fold before the capability table is published in the library's README. The
table, not this record, is where the partition lives, so a change to it is an edit to one table and one
field per record rather than an amendment here.

**A new decision passes both limbs of the entry rule above before it becomes a file.** Most will not
become one: they become a section of an existing capability document, or a comment beside the
mechanism that already refuses the alternative.

**A record that leaves the library takes one of the four dispositions**, never a silent absence: a
reversed record whose replacement is a record folds its decision into that record's
`## What this replaced`; a reversed record replaced by a pivot rather than a record is deleted with a
History row; a record still in force is absorbed into the document that governs it, with a History row
whose third column begins with the relative link to the destination; a proposed or unexercised record
stays. The README's History table is the marker, and it names every number this library has issued
that no longer has a file.

**A number is never reissued silently.** Where a number was issued, removed and then issued again, the
History table says so in one line, so git history holding two decisions under one number is visible in
the tree.

### Falsifier

The admission of *"how this repository records decisions"* rests on `/architecture` publishing the
library and arguing its recording rule. **If the page stops publishing the library and its rule, this
reading lapses and the scope must be revisited.** The page's paragraph is checkable in both editions
(`apps/fed/src/content/architecture.en.md` and `architecture.pt.md`, the section that links the decision
library).

## Consequences

**Good**
- A fresh context loads one document to understand one behaviour, instead of following citations
  across many one-decision files.
- The inflow has a rule that refuses: a convention a test already holds gets a comment beside the test,
  not a record.
- Anchors keep their numbers, so citations to anchors from outside the library survive every fold
  untouched; only citations to folded records are rewritten.
- The library's own README stops promising something its practice no longer does.

**Bad / accepted costs**
- **Folding is lossy by instruction.** Superseded narrative, struck archaeology and round-by-round
  measurement leave the library at each fold; only the decision as it binds, its still-live rejected
  options and its remaining consequences arrive. Git history keeps the rest, and a reader has to go
  there for it.
- **Documents get larger.** Each fold slice reports the byte size of the documents it touched, and a
  capability document over 150 KB is raised as a finding before merge.
- **Nothing enforces the entry rule.** Both limbs are instructions. The citation gate
  (`apps/fed/scripts/adr-citations.mjs`) can say that every citation resolves and that a fold did not
  leave a record citing itself; it cannot say whether a new file should have been a section.
- **The re-decision limb can refuse only what a mechanism actually refuses.** Measured on its first
  application, in this record's own slice: the document-title convention's tests refuse a title that
  does not lead with its navigation label, and they pass the *equality* option that record rejects, and
  nothing refuses rewriting a title that already conforms. So that record stays a record. The limb is a
  question about each rejected option, and answering it about the rule as a whole would have deleted a
  live argument.

## Lean by design — the keystone every record is read through

**Absorbed 2026-11-01 (#456, third slice) from the record that held it, 0001, decided 2026-07-22 and
amended 2026-10-16 (#688).** The decision is unchanged, `accepted`, and still binds. It moved here because it is the lens this whole
library is read through — every other record names it as a driver — so it belongs to the capability
that says what the library is, rather than standing as a capability of its own. What arrived: the
decision as it binds today, the rejected options a future reader must not relitigate, the reason it
rests on since 2026-10-16, and the consequences still being paid. What was left in git history on
purpose: the original proof-of-engineering reasoning, struck in place by the 2026-10-16 amendment. The
full record is in git history: `git log --diff-filter=D -- 'docs/adr/0001-*'` names the commit that
removed it, and its parent holds the file.

### Context

`tadeumendonca.io` is a personal presence, not a product with users or scale. Its surfaces are
content-shaped — an interactive CV, a curated portfolio of public work, a reading shelf and long-form
writing. It is not a playground (it must work), but it has no audience whose needs justify standing
infrastructure.

The platform once carried far more: a Hono/Lambda BFF, DynamoDB, Cognito auth, SES, a Lambda@Edge OG
renderer, an offline-first PWA, a regional WAF. Each of those is recurring **cost**, **operational
surface** and **attack surface**, paid continuously to serve capabilities the site does not need. The
question this decision settles: how much architecture should this site carry?

### The decision, as it binds

**Lean by design, calibrated to what the site's surfaces need today.** The architecture is
deliberately minimal: carry only what the content and portfolio presence requires, cut everything
else, and grow deliberately when a real need appears. This is the reason the **backend and much else
were cut** (the superseded records in the README's *History* table), and it is the lens every other
architectural decision in this library is read through: prefer the simplest thing that serves the
presence, defer capability until a real need warrants the cost. Evolution is gradual — the fuller
architecture is known and re-introducible, just not warranted now.

Its drivers, as they stand since the 2026-10-16 re-reading:

- **Cost.** The mission (#688) is the owner's personal, independent commitment to learn in public,
  bounded by what he can personally sustain. A commitment whose duration is set by its running cost is
  the strongest case this library has for near-zero, scale-to-zero infrastructure; standing compute
  would shorten the commitment it serves.
- **Simplicity** — the fewest moving parts that deliver the presence; every component must earn its
  place.
- **Gradual evolution** — add capability only when a real need calls for it, not speculatively.
- **The workshop stays public.** The code is not the argument for a repositioning any more; it is the
  public workshop the writing comes out of. A defensible, documented lean architecture still matters
  because the repository stays public as evidence of the work.

### Rejected options that are still live

- **Keep the full backend-ful platform "just in case"** — the BFF, database, auth, PWA and WAF. It pays
  cost, complexity and attack surface every day for capabilities no surface needs, and since #688 it
  fails harder, on the cost driver: idle infrastructure shortens a commitment bounded by what it costs
  to sustain.
- **Go even leaner — a flat HTML site or an off-the-shelf template.** Rejected because the workshop is
  part of what the writing is about and stays public as evidence of the work, and because the existing
  surfaces (bilingual prerender, typed data, per-locale cards) already run at near-zero cost, so going
  leaner would buy no saving the mission needs.

### Consequences still being paid

- **Good:** near-zero, scale-to-zero cost; minimal operational and attack surface; fast and low-risk to
  change, with little to break and nothing to keep running; the leanness is a documented engineering
  judgement, not an omission.
- **Bad / accepted:** anything server-side (auth, dynamic data, an API, server telemetry) is **not**
  available and needs infrastructure re-introduced when a surface calls for it. The lean choice is
  *current*, not permanent: the architecture must be **revisited** when the mission or the surfaces
  shift. The 2026-10-16 amendment was such a revisit — the mission changed, and the architecture came
  out of it unchanged.
- **Left as history, deliberately.** Records dated before 2026-10-16 that describe the site as a
  proof-of-engineering site ([ADR-0010](./0010-routing-landing-cv-split-redirects.md),
  [ADR-0003, *The SonarCloud quality gate*](./0003-trunk-based-single-environment.md#the-sonarcloud-quality-gate) and [ADR-0005, *Consent-gated GA4 analytics*](./0005-og-coverage-every-public-url.md#consent-gated-ga4-analytics)) keep that
  wording: it records why each decision was taken when it was. Read *proof-of-engineering* in any record
  dated before 2026-10-16 as the mission of that time. No record exists for the mission itself: a mission
  is positioning, not an architecture decision.

### Where it came from

Decided 2026-07-22 by the owner, as the reverse-engineering pass's keystone. Amended 2026-10-16 by
[#688](https://github.com/tedeuxx/tadeumendonca-io/issues/688): the stated reason changed, the decision
did not. Absorbed here by #456.

## Links

- Issue [#456](https://github.com/tedeuxx/tadeumendonca-io/issues/456) — the reconciliation, the
  owner's rulings and the working partition.
- The method's `documentation-standard` skill, Part II — the definition, the significance test this
  record narrows for this repository, and the four dispositions.
- The lean-by-design keystone — record 0001 until the third slice of #456 absorbed it here as *Lean by
  design — the keystone every record is read through*. Applied by
  [ADR-0002](./0002-fully-static-spa-no-backend.md) (fully static, no backend),
  [ADR-0003](./0003-trunk-based-single-environment.md) (trunk-based, single environment) and the
  infrastructure and delivery records, each an instance of it.
- [ADR-0024](./0024-profile-canonical-cv-cross-surface.md) — the pilot: the downloadable-CV record was
  absorbed into it in the same merge request as this record.
- [The decision library's index](./README.md) — the History table and the capability table. The table
  was added by the second slice of #456, together with the `Capability:` field every record carries and
  the test that checks the two agree (`apps/fed/scripts/adr-capabilities.test.mjs`).
