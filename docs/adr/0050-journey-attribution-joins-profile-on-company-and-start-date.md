# 0050. A module outside the CV attributes its data to a CV experience entry by the natural pair `{ company, start_date }`

- **Status:** accepted
- **Date:** 2026-08-25
- **Deciders:** **`tech-lead`**, 2026-08-25, in its slice-2 design comment on
  [#516](https://github.com/tedeuxx/tadeumendonca-io/issues/516) — under the owner's explicit
  delegation of exactly this question: *"whether the `engagement` field's shape changes to reference an
  entry rather than name an employer is `tech-lead`'s and `developer`'s, not the owner's."* Written by
  `developer` from that comment, in the MR that implements it, per the authorship split that puts a
  record in the same MR as the change it describes. **The owner decided the CONTENT of every key** (six
  rulings on 2026-08-25) and none of its shape.
- **Supersedes / superseded by:** —
- **Driven by:** [#516](https://github.com/tedeuxx/tadeumendonca-io/issues/516) ·
  [PR #517](https://github.com/tedeuxx/tadeumendonca-io/pull/517) (slice 1, which authored the
  attribution as a bare employer name and measured that shape failing) · **cites**
  [ADR-0034](./0034-build-time-cv-pdf-static-artifact.md) (the printed CV is built from `profile.ts`,
  which is why nothing here edits that file) · **cites**
  [ADR-0048](./0048-content-photograph-is-a-captioned-figure.md) (the photograph budget, unchanged and
  deliberately not restated here)

## Context & problem

`apps/fed/src/data/journey.ts` holds four photographs that are about to be placed **inside** the
work-experience entries `apps/fed/src/data/profile.ts` authors. Placement is therefore an
**attribution**: a frame under a dated employer heading reads as evidence *of that engagement*, and the
container is the assertion whether or not any prose says so.

**The attribution is the owner's and is not derivable — measured, not assumed.** Slice 1 established
this on one frame: `journey-home-office.jpg` is April 2020, `profile.ts` starts Globo at `2020-06`, so
*nearest date* lands on Globo; the frame shows a monitoring dashboard and the Globo entry's highlights
are an observability platform, so *what is in the frame* lands on Globo too. **The owner places it at
Accenture.** Both available heuristics were wrong at once, on the same frame.

So the attribution must be **authored data**. The question this record decides is the one slice 1 left
open: **how that authored datum points at an experience entry.**

**Slice 1's shape was measured failing.** It authored an employer NAME (`'Globo'`, `'Accenture'`,
`'AWS Professional Services'`, `'AWS ProServe — Senior Delivery Consultant'`) against these five
entries:

| company | title | start_date |
|---|---|---|
| `Amazon Web Services — Professional Services` | Senior Delivery Consultant — App Modernization | `2023-04` |
| `Amazon Web Services — Professional Services` | Cloud Application Architect | `2021-01` |
| `Globo.com` | Senior DevOps Engineer | `2020-06` |
| `Accenture` | Digital Business Integration Consultant | `2015-01` |
| `Accenture` | Systems Integration Analyst | `2008-03` |

**Three of the four strings matched no entry at all, and the fourth matched two.** That is not a
pointer; it is a label that happens to read like one.

## Decision drivers

- **The attribution must be checkable by a machine, at build time, before a reader can be told the wrong
  employer.** A wrong attribution inside a hiring surface's work-experience entry is a false claim about
  the owner's career, on the one page a recruiter reads.
- **And it must stay checkable by a HUMAN, against the owner's own sentences.** The whole slice's thesis
  is *authored, sourced, checkable*; a key whose meaning is recoverable only by dereferencing defeats the
  third of those.
- **`profile.ts` is what `/cv.pdf` is printed from** ([ADR-0034](./0034-build-time-cv-pdf-static-artifact.md)),
  and `journey.ts` exists as a separate module specifically to keep photograph concerns out of it.
- **#416 is open against `profile.ts`.** A slice editing the same file buys a conflict for nothing.
- **Drift must fail loudly.** Whatever the key is, the failure mode of a `profile.ts` edit has to be a red
  build, never a frame quietly rendered against the wrong role.

## Considered options

### 1 · An opaque id on each experience entry (`experience_id: 'acc-dbi'`) — rejected

*The ruling asked for explicitly, because it is the shape a reader expects.* **Is adding an id a content
change?** **No.** An opaque id renders nowhere, prints nowhere and translates nowhere, so the owner's
constraint — *"não é esperada alteração nas entradas de work experiences"* — does not forbid it, and the
printed-CV falsifier would still hold. **It loses on three other counts:**

1. **It leaks placement into the CV data.** `journey.ts`'s own module comment states the module is
   separate because *"`profile.ts` is the CV, and the CV is the thing `/cv.pdf` is PRINTED from."* Putting
   a photograph's placement key into the CV is the leak that comment exists to prevent, arriving from the
   other direction.
2. **It collides with #416**, open against the same file.
3. **It is unverifiable on sight.** A reviewer holding the owner's sentence *"na accenture coloca no
   2015-2020"* can check `{ 'Accenture', '2015-01' }` immediately and cannot check
   `experience_id: 'acc-dbi'` at all.

### 2 · The array index (`experienceIndex: 3`) — rejected

Brittle by construction: reordering the CV — which is ordinary editorial work on a CV — silently
re-attributes every photograph, with no failing assertion anywhere, because every index still resolves.
**A key that survives the edit that invalidates it is the worst available shape.**

### 3 · The employer name alone — rejected, by measurement

The shape slice 1 shipped. Three of four authored strings matched nothing; `Accenture` matched two
entries. Its failure is not fixable by re-authoring the strings, because `company` is genuinely not
unique in this CV and will be less unique over time.

### 4 · The natural pair `{ company, start_date }` — **chosen**

## Decision outcome

**Chosen: option 4.** `journey.ts` authors `engagement: { company, start_date }` — the two fields spelled
**exactly** as `profile.ts` spells them — and resolves it against `profileSource.experience` at module
load.

**Why the pair rather than `start_date` alone**, which is unique across all five entries today:
uniqueness of a date is an accident of this CV, not a rule — two roles beginning in the same month is an
ordinary thing for a career to contain — and a bare `'2015-01'` carries no meaning a reviewer can check
against the owner's sentence. The pair is both the sufficient key and the legible one.

**Resolution is exact string equality**, never trimmed, normalised or case-folded. Every softening turns
a red build into a plausible-looking wrong answer, and a plausible-looking wrong answer here is a false
attribution.

**`profileSource.experience`, not `profile.experience`:** the join is on facts an employer name and a
date, which the source authors once and shares across both editions. Resolving against a locale-resolved
edition would key an attribution on a locale for no reason at all.

**`assertJourneyShape` takes the experience array as a second ARGUMENT** rather than importing and
reading it, preserving what slice 1 bought: the guard reads its arguments and never the shipped data, so
a test can feed it a drifted CV and watch each refusal fire. It refuses, at module load, before any
render:

| refusal | the failure it replaces |
|---|---|
| a key matching **zero** entries | a frame silently orphaned by a `profile.ts` edit — `Globo.com` renamed, a date corrected, the em dash retyped |
| a key matching **more than one** | the case a bare employer name produced today; two candidate entries is not a placement |
| **two frames on one entry** | silent stacking of a second figure inside one experience block, which no layout defines |

**`profile.ts` is not edited at all by this decision** — not one character. That is the property that
makes the printed-CV falsifier (`dist/cv.pdf` byte-identical to its merge-base) available for free.

**The dependency edge is one-way and must stay so:** `journey.ts` imports `profile.ts`; `profile.ts` must
never import `journey.ts`. The reverse edge collapses the argument that separates the two modules.

**The owner's own sentences stay in `journey.ts`'s module comment, verbatim.** The pair is a
*normalisation* of what he said, and normalisation launders provenance: without the quotes the file would
be checkable and no longer sourced. The comment is now the only place in the repository those three
sentences exist.

## Consequences

### Good

- **A false attribution is unpublishable rather than discouraged.** Three refusals fire at module load,
  which means at build time and in every test that imports the module.
- **The key is verifiable by a human against the owner's words**, with no dereference.
- **`profile.ts` is untouched**, so `/cv.pdf` is byte-identical and #416 gets no conflict.
- **The guard is exercised on data the test owns**, so each `throw` is a line that has been watched to
  fire rather than one that merely exists.
- **It sets a pattern the next module can copy.** This is the first foreign key into `profile.ts`; the
  answer is *join on the natural pair, resolve at load, refuse ambiguity*, not *add an id*.

### Bad, and stated as bad rather than mitigated

- **Two files now carry the same employer strings.** That is duplication, and it is the price of not
  editing the CV. A correction in `profile.ts` — an employer renamed, a start date fixed — **reddens the
  build until `journey.ts` follows**. That is the intended failure direction and it is still a cost:
  someone editing the CV will be stopped by a module about photographs.
- **The AWS string carries a U+2014 em dash**, which is easy to retype as a hyphen. It is spelled once in
  `journey.ts` (a named constant) to bound the exposure, and a hyphen produces a zero-match refusal —
  loud, but only at build time, not in the editor.
- **The pair is not a database key and nothing enforces its uniqueness in `profile.ts`.** Two entries
  sharing a company and a start_date would be legal CV data and would make one frame unplaceable. The
  guard refuses it rather than guessing, so the CV edit would be blocked by the photograph module — again
  the right direction and again a real constraint on the CV.
- **The test map spells the four keys a second time**, deliberately, so it asserts something about the
  source instead of agreeing with it by construction. Correcting an attribution is therefore two edits.

## Links

- [#516](https://github.com/tedeuxx/tadeumendonca-io/issues/516) — the Issue, the six owner rulings, and
  `tech-lead`'s slice-2 design comment that decided this
- [PR #517](https://github.com/tedeuxx/tadeumendonca-io/pull/517) — slice 1, which authored the
  attribution and measured the employer-name shape failing
- `apps/fed/src/data/journey.ts` — the ATTRIBUTION, JOIN and TWO HAZARDS paragraphs, and the owner's
  sentences verbatim
- `apps/fed/src/data/journey.test.ts` — the three refusals, each watched to fire
