# tadeumendonca-io

**The owner's proof-of-engineering site — a fully static SPA served on S3 + CloudFront. No backend.**
This repo is the public presence for **tadeumendonca.io**: an interactive CV, a portfolio that links to a
curated **catalog** of automations / agentic tools, and a blog. It was formerly a backend-ful monorepo (a
Hono/Lambda BFF, Cognito, API Gateway, DynamoDB, SES); that backend was **retired** and the site is now static —
content ships **in the repo** — markdown for long-form, typed TypeScript for structured data — prerendered
at build time, in both locales, for OG/SEO.

> Convention: everything **published on GitHub** (this file, READMEs, descriptions, commit/PR text, issues) is
> written in **English**. The site's copy is **bilingual (pt-BR + en, ADR-0032)** — chrome, CV and
> long-form alike — and **both locales are prerendered**, each route snapshotted with its own head
> (ADR-0036 retired 0032's English-pinned prerender clause; only the bare `/` snapshot is still English,
> as the x-default entry). That's content, not GitHub publication. **No exceptions** — `src/data/catalog.ts`
> was the last one (it served Portuguese on `/en/portfolio` until #235) and now carries the same
> leaf-bilingual type as everything else, so a missing translation is a compile error.

## `AGENTS.md` is a SECOND root brief, it is AUTHORED, and it is not this file (`-skills` #411)
**`AGENTS.md` at this repo's root is the whole brief for any harness that reads that filename — and one
of them reads THIS file never.** Measured against Kiro `1.0.437`'s shipped bundle:
`grep -c 'CLAUDE\.md'` over its agent extension returns **0** while `grep -c 'AGENTS\.md'` returns 28,
and `AGENTS.md` is resolved at the workspace root with `inclusion:"always"`. It is not a compatibility
copy of this file; for that reader it is the only brief there is.

**It is authored beside this file, never generated from it.** The previous `AGENTS.md` here *was* a
substitution of this one, and a substitution renames the token while leaving the mechanism — which is
how it came to point at `apps/fed/AGENTS.md`, a file that does not exist, at a path that harness
actually scans, while the real per-directory guide sits in a filename it cannot read at any depth.
**That pointer is removed rather than satisfied** (`-skills` #411): a nested brief would be a second
artifact to keep honest, and the duplicated pair in this workspace was measured drifting 118 lines in
three weeks. The `apps/fed/` paragraph now lives in the root brief itself.

**Three rules.** The brief states the floor as **obligations addressed to the agent, never as
descriptions of the enforcement** (*would this sentence still be true on a harness with no hooks?*); it
names **no Claude-Code-shaped token**; and it is **tracked**, which is the precondition for the other
two being reviewable at all — it was untracked and referenced by nothing until now, so no PR ever
contained it. Keep it under **50,000 characters**, which is **one consumer's measured floor, not a
standard** — every other harness's budget is unmeasured.

`scripts/agents-md.test.sh` gates four mechanical properties and is wired into
`.github/workflows/brief.yml`. **It cannot assert that the brief is true, or that it is neutral rather
than merely token-free.** That half is held by review.

**What it shares with `-skills`'s `hooks/scripts/agents-md.test.sh` is the executable BODY, not the
file.** The invariant a sync maintains is that everything below the first column-zero `set -uo` line
is byte-for-byte identical — an obligation, not a claim about either copy's current state, which
nothing here can check. The headers deliberately differ, because the duplication cost is a fact about
each copy and has no subject in the other. So a sync copies the body, never the file — copying the
whole file destroys the sibling's header, which is the artifact that records that cost and carries its
own falsifier. From a workspace holding both checkouts:

```
diff <(sed -n '/^set -uo/,$p' scripts/agents-md.test.sh) \
     <(sed -n '/^set -uo/,$p' ../tadeumendonca-skills/hooks/scripts/agents-md.test.sh)
```

Nothing makes the two copies move together — a pipeline is independent per repository — so a change to
the token list, the fixtures or the budget is a two-repository batch, and a body diff between them is
a defect in whichever side merged second.

<!-- hitl-escalation-format -->
## The HITL escalation format — five rules, and they bind THIS context (tedeuxx/tadeumendonca-skills#409)

**These rules address the ORCHESTRATOR — the main session — and this file is their carrier.** The
orchestrator is not a persona, is dispatched by nobody and preloads nothing, so it is the one actor in
this loop that no brief reaches. Measured with one nonce per candidate surface, read back by a headless
main session on build `2.1.263`: a repo-root `CLAUDE.md` reaches this context, a **skill body does not**
(only its name and its `description` do), and neither does `AGENTS.md`. So the rules are written here,
in the imperative, rather than in the skill library — **a rule preloaded by every profile and binding on
none of them is the shape this repository already fails at.**

**Scope: an escalation rising out of a running loop.** Not every question anyone has for the owner — a
design conversation, an interview, an ad-hoc request typed at the terminal is none of them an
escalation, whatever its subject. What makes something qualify is the escalation standard's five
clauses; what follows is the FORM, once it does.

### The five rules

1. **One decision per activation.** Two, however short, is a decision list — he has to rebuild context
   twice. Ask the first; carry the second to its own activation.
2. **The activation is a tweet. The context lives in the OPTIONS.** Terse is not context-free: each
   option states its own consequence, and that is the whole preamble. The reasoning belongs in an
   artifact he can open, never in the interruption.
3. **A picker, never prose numbering. At most four options** — a ceiling, not a target. **Bounded:**
   `AskUserQuestion` is absent from a headless session (`claude -p`), where the model degrades silently
   to exactly the prose numbering this rule forbids. Every escalation path today is interactive, so the
   rule is obeyable today; a headless path added later would break it and nothing would say so.
4. **A merge is an order plus a link, not a question.** The test: *is there a second option you would
   actually defend?* If not it is an instruction — one line, the act and the object, no options and no
   recommendation. The tell in a bad one is that every option is the same act at a different time.
5. **An interview question takes NO options; an escalation always does.** Opposite rules, different
   acts: an interview elicits what he thinks, and a menu puts words in his mouth; an activation asks him
   to take a decision the loop has already reduced, and the options are what make it fast.

### Rule 4 was BUILT as a hook and DELETED — do not build it again

It shipped as `hooks/scripts/action-pendency-guard.sh` in `tedeuxx/tadeumendonca-skills` and was deleted
at `bce25676` on the owner's ruling. Three successive narrowings were each found refusing a genuine
decision, ending with all four of this loop's own merge-gate holds and with `Merge it / Request changes`
— the class its verb set excluded `approve` in order to protect. It classified by **label spelling**
rather than by **choice shape**, so the narrowings were a search over spellings and not a convergence.

**The transferable half: a preventive control whose false positives are unobservable by the person it
protects is worse than no control, however good its true positives.** A `PreToolUse` denial lands before
he sees anything, so a suppressed decision reaches him as prose that reads like a decision already taken
— the defect the control existed to prevent, produced by the control, where nobody can see it. **Rule 4
is held by review, and landing it as text is precisely what survived that deletion.**

### Rule 4 does not contradict the two PR-link hooks — it governs a case they do not reach

`hooks/scripts/premature-pr-link-detect.sh` and `hooks/scripts/owed-pr-link-detect.sh`, both in
`tedeuxx/tadeumendonca-skills`, answer **may** a link go at all: the PR is open, every check concluded
successfully, and the gate's verdict at that head is one of the two terminal literals. Rule 4 answers
**in what form**, once it may. A link failing their predicate never reaches rule 4; a link passing it is
still free to arrive as a four-option picker, which rule 4 forbids and neither hook observes.
`premature-pr-link-detect.sh`'s own header already names rule 4's test as a limb it cannot implement —
*"'Is this ask a decision he holds' is not knowable at any layer, and making it guessable would be
theatre."* **So rule 4 supplies vocabulary for a hole that hook already admits, rather than a second
opinion about a question it already answers.**

### This block is rule 5's CANONICAL statement

Rule 5 already existed, operatively, in two files of `tedeuxx/tadeumendonca-skills` —
`commands/new-issue.md`'s interview constraint and `commands/sprint-planning.md`'s
interview-versus-activation split, the second the fuller of the two. **Both now cite this block rather
than state the rule independently**, because a third independent statement with no canonical home is the
drift this repository has already paid for once. **There is deliberately no string-identity gate arm:**
with one copy of the sentence there is nothing for two copies to disagree about. The cost is the mirror
of that — nothing mechanical stops a fourth restatement appearing, and only review will catch it.

### What enforces this — PER RULE, and the answers differ

**Do not flatten these into *nothing enforces this*.** That sentence is false, and false in the
permissive direction: it reads as *do not try*, and one of the five is cheaply detectable.

- **Rule 1 is a COUNT, and detection is possible.** An activation is an `AskUserQuestion` tool-use block
  written to the transcript in full, so `questions | length != 1` is a predicate rather than a judgement
  about what an option *means* — precisely the property the deleted guard lacked. **The detector is NOT
  built and is a separate slice**, with its own predicate, test file and calibration. That is a forward
  reference and not a promise with a date: it is possible, and today it does not exist.
- **Rule 3's option ceiling has never been violated, and rule 2's mechanical half is clean too** — no
  question has ever carried more than four options, and no option has ever carried an empty description.
  A gate on either would be a green that has never been red.
- **Rule 2's live half — the preamble — is HYPOTHESIS-GRADE and no threshold may be built on it.** The
  characters preceding an activation can be counted, but no layer separates an escalation's preamble
  from ordinary work narration, so the number is not a predicate.
- **Rules 2, 4 and 5 are held by REVIEW.** That is their ceiling, and saying so is the point.

**The three figures above, with the command that produced them** — measured 2026-09-07 over this
machine's own transcripts, a corpus that grows, so read them as a snapshot rather than as a constant:

```
jq -rs '[.[]|select(.type=="assistant")|.message.content[]?
        |select(.type=="tool_use" and .name=="AskUserQuestion")|.input.questions]
        |"activations=\(length) multi_question=\(map(select(length!=1))|length)"' \
   ~/.claude/projects/<project-dirs>/*.jsonl
# activations=199 multi_question=16      -> rule 1: an 8% live base rate
# swap the trailing filter for `.[]?|.options` and count `select(length>4)` -> 0 of 225 questions
#                                        and count options with an empty `.description`   -> 0 of 633
```

**Both zeroes were calibrated rather than trusted:** loosening the ceiling from `length>4` to `length>3`
returns **25**, and counting options whose description is *non*-empty returns **633 of 633** — so each
selector can produce a non-zero answer and the zero is a real zero rather than a dead pattern.

### The two copies of this block must stay identical

**It is shared, byte for byte, between `CLAUDE.md` at the root of `tedeuxx/tadeumendonca-skills` and
`CLAUDE.md` at the root of `tedeuxx/tadeumendonca-io`** — the escalation precondition is a running loop,
a loop is two milestone objects in two repositories, and a session rooted in one repository does not
load the other's `CLAUDE.md`. A rule landed in one is half a rule. From a workspace holding both
checkouts:

```
diff <(sed -n '/^<!-- hitl-escalation-format -->$/,/^<!-- \/hitl-escalation-format -->$/p' tadeumendonca-skills/CLAUDE.md) \
     <(sed -n '/^<!-- hitl-escalation-format -->$/,/^<!-- \/hitl-escalation-format -->$/p' tadeumendonca-io/CLAUDE.md)
```

**That is an OBLIGATION and not a claim about either copy's current state — nothing checks it, and
nothing makes the two move together.** Pipelines are independent per repository, so a change to these
rules is a two-repository batch, and the command above is expected to print a difference in the window
between the two merges.
<!-- /hitl-escalation-format -->

---

<!-- review-chain-routing -->
## The review chain is routed by TYPE — one table, and it binds THIS context (tedeuxx/tadeumendonca-skills#393)

**Like the block above, these rules address the ORCHESTRATOR — the main session — and this file is
their carrier.** The orchestrator is not a persona, is dispatched by nobody and preloads nothing, so a
brief cannot reach it and neither can a skill body. **Every persona that loads the states table is a
dispatchee, and a dispatchee cannot select its own dispatch.** That is why the operative wording is
here and the `agents-configuration` states table carries a pointer instead.

**Re-measured 2026-09-08 on build `2.1.263` rather than inherited from #409** — three headless probes,
every tool disallowed, each asking only whether a heading unique to one repository's root brief was in
the loaded context:

```
cat <prompt-file> | claude -p --disallowed-tools Read Grep Glob Bash Task Edit Write
# rooted in -skills                            -> SKILLS=YES  IO=NO
# rooted in -skills, --add-dir <the -io path>  -> SKILLS=YES  IO=NO
# rooted in -io                                -> SKILLS=NO   IO=YES
```

**The middle row is the one that is not obvious, and it is why this block lives in two repositories
rather than one:** an additional working directory does **not** bring its `CLAUDE.md` with it. A
session can read, edit and commit in a sibling checkout while loading none of that repository's root
brief. A rule landed in one repository is half a rule.

### The table

| type | which lenses run on the review |
|---|---|
| **`loop`** | **one lens pass — `agents-lead` — plus `quality-assurance`.** No copy lens, no `tech-lead` |
| **`product`** | **the full chain** — the leads' lenses as the slice warrants, plus `quality-assurance` |
| **`content`** | **the content pair** — `content-writer` drafts, `content-reviewer` repairs in place, at most two rounds — plus `quality-assurance` |

**`quality-assurance` appears in every row and is not a variable.** It runs on every merge request
under both its lenses, whatever the type. **Nothing in this table narrows a gate, removes a hold or
changes a verdict literal.** In particular the `loop` row does not relax hold 2 — a harness diff still
needs an `agents-lead` verdict marker **on the PR** before the gate may merge it — it says that the
marker plus the gate is the *whole* chain rather than the first half of a longer one.

**It is a routing default, not a lock.** `CLAUDE.md` already leaves the orchestrator the judgment of
whether a given review specialist needs dispatching **at all** on a particular diff; this table
answers *which lenses are eligible for this type*, and that judgment still runs inside the row.
**Adding a lens that the row does not name is the deviation this table exists to make visible** —
so if a `loop` diff genuinely needs a second opinion, say why in the dispatch rather than letting the
default drift back to the full ceremony.

### It is NOT an alternative to the terminal instruction — the two answer different questions

`agents/agents-lead.md` and `agents/product-lead.md` carry a terminal condition: **a lens now knows how
to stop.** This table decides **which lenses run at all.** They compose — one bounds the length of a
pass, the other bounds how many passes there are — and a reader who meets the table without this
sentence will read the two as competing remedies for the same nineteen rounds and pick one.

### What this buys is DURABILITY, not behaviour — and the measurement says so plainly

**Across the nine merge requests measured on 2026-09-07, ZERO copy-lens verdicts ran.** The chain that
actually executed was `agents-lead` marker → gate, which is exactly what the `loop` row above
prescribes — **with nothing anywhere routing it.**

**So this table changes nothing about today.** It makes the current practice survive the orchestrator
forgetting it, and that is the whole of the claim. **Do not read it as fixing a live misrouting; there
is none to fix.** What it removes is the dependency on a fresh context happening to know the rule,
which is the dependency that failed five times.

### And it is text — the Issue's own admission, carried rather than buried

**A correct rule saying the same thing already existed and was overridden five times running.** It
lived in the orchestrator's memory and in a retrospective; no artifact the loop reads carried it.
**`CLAUDE.md` is the carrier because it is the surface the measurement above shows actually reaches
this context — not because text became enforcement.** By this loop's own test — *would something stop
me, or only my memory?* — **this is an instruction**, and it is the right kind, because the failure it
prevents is delay rather than escape.

### The `content` row does NOT touch criterion 10, and must never be read as narrowing it

Criterion 10 fires on a reader-facing diff regardless of type, and it is deliberately phrased to fail
closed. **It did not fire on the `loop` diffs measured because the gate reasoned about it explicitly
and ruled correctly, not because the trigger is loose** — `-io#616`'s verdict states the reasoning on
the record. **A routing label that could override a fail-closed copy trigger would be a loosening
disguised as a routing change.** This table names which lenses are dispatched; it says nothing about
which criteria the gate applies, and the gate's criteria are untouched by it.

### No round counter, and no gate arm — both refusals are deliberate

**No rule here is keyed on a round number.** *After N rounds, lower the bar* decays with the count and
hands a gate a reason to wave through the thing it exists to catch.

**And nothing gates this table.** A string-drift arm asserting the block exists and carries its three
rows is buildable and is deliberately not built here — but note what even that would and would not
buy: **nothing can observe which chain a dispatch actually ran.** No artifact records a dispatch, and
the one lens whose participation would be visible posts nothing at all — `permission-guard.sh` rule 5e
denies `product-lead` the comment subcommands, so its findings reach a PR only quoted inside the
gate's own marker. **A green here could only ever mean the rule is written down.** That is the same
limit the `filed → description closed` rows already carry in their own words.

### The two copies of this block must stay identical

**It is shared, byte for byte, between `CLAUDE.md` at the root of `tedeuxx/tadeumendonca-skills` and
`CLAUDE.md` at the root of `tedeuxx/tadeumendonca-io`**, for the reason the probe above measured: a
session rooted in one repository loads neither the other's root brief nor the sibling's, even with the
sibling added as a working directory. And **the routing types are not repository-scoped** — `-io`
carries `loop` Issues too (`gh issue list --repo tedeuxx/tadeumendonca-io --state all --label loop
--limit 200 --json number --jq 'length'` → **3** on 2026-09-08), so no row here is dead in either
tree. From a workspace holding both checkouts:

```
diff <(sed -n '/^<!-- review-chain-routing -->$/,/^<!-- \/review-chain-routing -->$/p' tadeumendonca-skills/CLAUDE.md) \
     <(sed -n '/^<!-- review-chain-routing -->$/,/^<!-- \/review-chain-routing -->$/p' tadeumendonca-io/CLAUDE.md)
```

**That is an OBLIGATION and not a claim about either copy's current state — nothing checks it, and
nothing makes the two move together.** Pipelines are independent per repository, so a change to these
rules is a two-repository batch, and the command above is expected to print a difference in the window
between the two merges.
<!-- /review-chain-routing -->

---

<!-- loop-mode-contract -->
## The loop MODE is a NAMED agile method — and this is the contract's UNTOUCHABLE list (tedeuxx/tadeumendonca-skills#406)

**Third block in a row addressing the ORCHESTRATOR, and it is here for the same reason as the other
two.** A mode is not something a persona applies — it selects a pool predicate and a ceremony set
**before** any dispatch happens, so the only context that can run one is the main session, which is
dispatched by nobody and preloads nothing. **A skill body cannot carry a mode rule**: the block above
measured, on build `2.1.263`, that a repo-root `CLAUDE.md` reaches this context and that adding a
sibling checkout as a working directory does not bring its brief; #409 measured, with one nonce per
candidate surface, that a skill body does not reach it at all — only the skill's name and its
`description` do. **Neither measurement was re-run for this block**, and both are cited rather than
re-derived; the falsifier is in each block's own text.

### What a mode IS, and what it may contain

**A mode names a widely-known agile method and fixes exactly two things: what the CONTAINER MEANS, and
the CEREMONY SET that runs at its edges.** The owner's decision is that the configuration surface is an
enum of industry names rather than an invented vocabulary — *«faria mto sentido a configuracao de loop
remeter a modos de trabalho agil conhecidos amplamente»* — so a third mode later is a new member of a
documented set, not a new design.

**The container is NOT replaced by the lighter mode. It is DEMOTED** — owner ruling, 2026-09-09,
unprompted: *«nao tem problema numero da iteracao ser utilizado nos dois modos»*. The milestone does
two jobs and the ruling keeps one and drops the other:

- **as an IDENTIFIER it is kept in BOTH modes** — it names a period, groups the work, and gives the two
  repositories one string to pair on. Dropping it would have cost the loop its only cross-repo grouping
  for no gain;
- **as a BATCH BOUNDARY it is what `kanban` drops** — in `scrum` it is a scope commitment whose
  exhaustion is the terminal condition; in `kanban` it is a period label and **nothing depends on its
  emptiness**.

**So the `iteration` axis is *commitment versus label*, never *present versus absent*.** That is
sharper than #406's body proposed and it makes the enum smaller.

| mode | the container | ceremony set | ordering |
|---|---|---|---|
| **`scrum`** | a **commitment** — the milestone bounds a batch, and its exhaustion is the terminal condition | planning · review · retrospective | ranked at planning |
| **`kanban`** | a **label** — the same milestone names a period and bounds nothing | **none run at a boundary** — see the clock rule below | **FIFO within a partition**: `loop` in arrival order, then `product` in arrival order |

**Two mechanical consequences, and the second is where this leaks if nobody writes it down.**

1. ~~**The pool predicate needs no per-mode branch for the milestone.** Both modes carry it, so
   *enumerate-then-select* and the rule that no milestone name is ever typed into a query stand
   unmodified in both.~~ **STRUCK 2026-09-09 (#406 slice B) — it contradicts the table three rows
   above, and the table is the half that is right.** That row says `kanban`'s container **"bounds
   nothing"**; a limb of the pool predicate bounds the pool, which is the only thing a container could
   bound here. The owner's words settle it and were available the whole time: *«nao ter os ritos do
   agil e **enforcement de iteracao no github issues** quando trabalhando em modo kanban»* — **a
   predicate limb IS that enforcement.** Ruling 3 makes the iteration NUMBER usable in both modes; it
   does not make the milestone a filter in both. Struck rather than edited because it merged, was
   published to the marketplace, and is the sentence slice B would have built the wrong predicate
   from. **The defect originates in the ruling-3 intake comment on #406, not in slice A's authoring** —
   slice A carried it forward accurately.

   **The correct rule, and both predicates are published in full in `docs/loop-mode.md` rather than as
   an edit to one another:** in **`scrum`** the milestone is a limb and the active-iteration derivation
   selects it, so *enumerate-then-select* and the never-type-a-milestone-name rule stand unmodified
   **there**; in **`kanban`** the milestone is not consulted, so those two rules have **no subject**
   rather than standing unmodified. **The `ready` limb does not vary in either direction** (ruling 2).

   **This is what makes the mode operative rather than declarative, and it is measurable at head:** one
   tracker state, read under the two predicates, returns an empty pool under `scrum` and a four-item
   pool under `kanban` — because zero open items in either repository carry a milestone. **A mode
   nobody had recorded was already selecting which of those two answers the loop got.**
2. **Whatever later builds the cadence trigger must key on THE CLOCK and never on the pool being
   empty.** In `scrum` an empty active milestone is the terminal condition; in `kanban` it means
   nothing at all, and a rite firing on it would be firing on noise. **A trigger keyed on emptiness
   makes `kanban` silently inherit `scrum`'s trigger under a different name** — the exact failure this
   contract exists to make visible.

**Unchanged by the ruling:** nothing enters a running iteration automatically, and composing one is
the owner's act, in both modes. A period label is still placed by him.

~~**`kanban` is SPECIFIED here and is not operative.** The pool predicate, the drain and the two gate
arms that pin the Scrum wording are slice B of #406 and have not landed. **Do not read this table as a
switch that has been thrown**; read it as the contract a switch would have to honour.~~ **Struck
2026-09-09 — slice B landed and `kanban` IS operative**, which is what that paragraph promised would
change. Struck rather than deleted because it stood in a marketplace-published version and a reader who
took *"not operative"* from it would not look for a record that now exists.

**The mode of record is `docs/loop-mode.md`** — a tracked file carrying the value, the enum, the
back-dated start and both per-mode pool predicates in full. **It is READ before any pool query and never
inferred from one**, and the only thing that reads it is `commands/autonomy.md`, which is a rule a
session executes rather than a mechanism. **Nothing mechanical reads it, deliberately** — see the
untouchable-list measurement below, which the moment a hook is taught the mode stops being true.

**What slice B did NOT do**, so the table is not read as more than it is: it built ~~**no cadence
trigger** (slice C, authorised and not yet built)~~ **no cadence trigger — slice C built it on
2026-09-09 (`hooks/scripts/cadence-notice.sh`, `docs/loop-cadence.md`), and the strike is here rather
than a deletion because this sentence is what told a reader the carrier did not exist**, **no gate arm**
asserting the record exists or parses, and it decided **no `wip` value** (`#385`). And the two gate arms
that pin the Scrum wording did not move, because the Scrum wording did not move — the additions are
additive and the drift check is blind to all of it.

**What slice C did NOT do either, said in the same breath so the carrier is not over-read.** It decided
**no interval** — that was never asked and is not inferred, so its record ships with the value
undeclared and the carrier refuses to conclude rather than defaulting. It **added no gate arm** and is
**not a gate**: it reports elapsed time and every exit path is success. And it **does not read this
contract, the mode record, a container, a label or the queue** — which is what keeps the untouchable
list's measurement below a measurement.

**And the honest starting state, because it is the argument for writing the contract down rather than
a hypothetical about the future: the loop is already running with no container and no ceremony, and
nothing anywhere records that.** Measured 2026-09-09, both repositories:

```
gh issue list --repo <owner>/<repo> --state open --limit 300 --json number,labels,milestone \
  --jq '[.[]|{l:[.labels[].name],m:.milestone}] | {open:length,
        ready:[.[]|select(.l|index("ready"))]|length,
        milestoned:[.[]|select(.m!=null)]|length,
        sp:[.[]|select(.l|map(startswith("sp:"))|any)]|length}'
# -skills -> {"open":8,"ready":1,"milestoned":0,"sp":0}
# -io     -> {"open":45,"ready":16,"milestoned":0,"sp":0}
```

**Both zeroes are calibrated rather than trusted** — the same two selectors over `--state all` in
`-skills` return **17** milestoned and **12** carrying `sp:N`, so neither is a dead pattern. **A mode
record must therefore be dated and back-dated honestly when one is introduced**, never written as
though the day it lands is the first day of the mode it names.

**`ready` in `-skills` read `0` earlier in this same slice and reads `1` now**, because the owner
closed #406's description while it was being built. **That is the figure demonstrating its own rule:
re-derive a number when the text around it changes, rather than restating the one you already had.**
And the `1` carries no `sp:` label, which by the bar below is an unmet readiness item — a fact about
the queue, not about this block, and not repaired here.

### The UNTOUCHABLE list — and it is a MEASUREMENT, not an intention

| a mode MAY vary | a mode may NEVER touch |
|---|---|
| what the container MEANS — a batch commitment, or a period label | **the permission floor** — every rule of `hooks/scripts/permission-guard.sh`, under both loop models |
| whether the three rites run, and what fires them | **the merge gate** and both of its lenses, on every diff |
| the ordering act — ranked at planning, or FIFO within the `loop`/`product` partition | **head-scoped verdicts** — a verdict names the commit it read, in every mode |
| `wip` (the slot only — see below) | **only-the-owner-opens-work** (`permission-guard.sh` rules 5c/5d) |
| — | **the READINESS BAR** — `sp:N` stays in both modes (2026-09-09) |
| — | the `product`/`content`/`loop` routing labels · **`content` has no second mode** · **the container's EXISTENCE**, as against its meaning |

**Two rows moved right on 2026-09-09, and a mode config that loses axes is the design working rather
than shrinking.**

- **The readiness bar does NOT vary by mode.** Owner ruling: *«Mantém o `sp:N` nos dois modos»*. The
  estimate is kept as a **size signal**, not as a velocity input — which is what it already was here,
  since `/planning-poker` sits in the library as a reference pattern and no velocity is collected in
  either mode. **So `/definition-of-ready` needs no per-mode branch**, `ready` asserts the same thing
  in both, and there is one fewer place for the two modes to drift apart. **The cost, recorded rather
  than absorbed:** the lighter mode carries a ceremony its own method does not ask for, and the loop
  pays two estimator dispatches per item in a mode that collects no velocity. He was told that and
  took it.
- **The container's EXISTENCE is untouchable; only its MEANING varies.** Ruling 3 above. A mode that
  could delete the milestone would take the only string the two repositories pair on with it.

**The one sentence to keep verbatim, because it is the failure this whole surface can produce:** *a
mode selects a predicate and a ceremony set; it never selects a permission rule.* **A configuration
surface that can reach the irreversible floor is a hole with a nice name.**

**Today that separation is structural rather than merely intended, and this is the command that says
so.** Across all **fourteen** hook registrations, every occurrence of the mode vocabulary is a comment
or a deny-message string, and **no registered hook selects a `milestone` or a `labels` field or passes
a `--milestone`/`--label` flag**:

```
jq -r '.hooks|to_entries[]|.value[]|.hooks[]|.command' hooks/hooks.json \
  | sed 's|.*/hooks/scripts/|hooks/scripts/|; s|"$||' | sort -u \
  | xargs grep -nE -- '--milestone|--label|--json [^|"]*(milestone|labels)' \
  | grep -vE ':[0-9]+:[[:space:]]*#'
# -> no output

jq -r '.hooks|to_entries[]|.value[]|.hooks[]|.command' hooks/hooks.json \
  | sed 's|.*/hooks/scripts/|hooks/scripts/|; s|"$||' | sort -u \
  | xargs grep -nE 'milestone|iteration|sprint' \
  | grep -vE ':[0-9]+:[[:space:]]*#' | grep -vE 'deny "'
# -> no output

# the denominator, so "no output" is read against a non-empty set rather than against nothing:
jq -r '.hooks|to_entries[]|.value[]|.hooks[]|.command' hooks/hooks.json \
  | sed 's|.*/hooks/scripts/|hooks/scripts/|; s|"$||' | sort -u \
  | xargs grep -hcE 'milestone|iteration|sprint' | paste -sd+ - | bc
# -> 25        (23 comments + the 2 deny strings the filter above excluded)
```

~~`# -> 22        (20 comments + the 2 deny strings the filter above excluded)`~~ — **struck 2026-09-09
(#406 slice C), and the STRIKE is worth more than the new figure.** The denominator moved because the
cadence carrier's header names the rite artifact roots in three comment lines. **Nothing about the
property changed** — both zeroes above are unchanged, re-derived at that slice's head — but a reader who
saw only the number move would have to work out which. **So the standing warning is this: the second
command is a VOCABULARY grep, and vocabulary is a PROXY for the property rather than the property.** A
hook that names a rite in a *code* line would turn it red without reading any object a mode varies, and
a hook that read the queue through an interpolated path would leave it green. **The first command —
selecting `--milestone`/`--label`/`--json …` field names — targets the property directly and is the one
to trust when the two disagree.**

**Both zeroes are calibrated, in the direction that matters — a selector that cannot go non-zero is
not a check.** The two calibrations are written out in full below rather than described as edits to
the commands above, because *"swap X for Y"* is ambiguous and this parenthetical published a wrong
number twice while saying so:

```
# calibration A — the same selector against field names that ARE live code:
jq -r '.hooks|to_entries[]|.value[]|.hooks[]|.command' hooks/hooks.json \
  | sed 's|.*/hooks/scripts/|hooks/scripts/|; s|"$||' | sort -u \
  | xargs grep -nE -- '--milestone|--label|--json [^|"]*(headRefOid|comments)' \
  | grep -vE ':[0-9]+:[[:space:]]*#'
# -> 10 lines, across 6 files

# calibration B — the second command with its `deny "` filter removed:
jq -r '.hooks|to_entries[]|.value[]|.hooks[]|.command' hooks/hooks.json \
  | sed 's|.*/hooks/scripts/|hooks/scripts/|; s|"$||' | sort -u \
  | xargs grep -nE 'milestone|iteration|sprint' | grep -vE ':[0-9]+:[[:space:]]*#'
# -> 2 lines, the deny strings the filter was excluding
```

**Why they are spelled out, and it is a finding rather than tidiness.** *"Swap `milestone|labels` for
`headRefOid|comments`"* has two readings — replace only the parenthesised group, or replace the whole
pattern — and they return **different numbers** with the comment filter removed. Both readings return
**10** with the filter in place, which is why the figure above was right while the sentence describing
how to reach it was not. **A described mutation of a published command is not a published command.**

**What these commands do NOT say, stated here so the list does not inherit an overclaim that is
already in circulation.** They do **not** say that no hook reads an Issue. Two registered hooks make
live `gh issue` **reads** — `hooks/scripts/closure-artifact-guard.sh` resolves an Issue body
(`gh issue view --json body,title`) and lists recently-closed Issues by a rolling date window
(`gh issue list --state closed --search "closed:>=…"`). **Neither selects a label or a milestone**, and
a date window is not a queue predicate, so the mode-blindness above survives them intact. **The
sentence that does not survive is the falsifier published beside it elsewhere:** *"every `gh issue`
call in `hooks/scripts/` is a write path"* is **false at head** — the two reads above are the
counter-example — **and its scope is TREE-WIDE rather than one file.** ~~it is repeated in
`skills/agents-configuration/SKILL.md` at four sites~~ ~~at three sites~~ — **struck 2026-09-09 (#406
slice C), twice, and the second strike is the one worth reading.** The first figure was carried; the
second was *derived from a superset* — a line-oriented `grep` for `reads the queue|write path`, which
matches two neighbouring sentences that are TRUE and need no sweep, and which counts **lines** rather
than occurrences, so a site that wraps is counted twice or split in half. **The conclusion the clause
supports still stands and its stated reason does not** — ~~correcting it is still its own slice~~,
**that slice ran on 2026-09-09 (#406 slice D) and is recorded immediately below**; the list above was
written so that it does not depend on it, and still does not.

**THE SWEEP IS DONE (#406 slice D, 2026-09-09), and what it found first was that the instrument
published here was wrong in three ways — each in the permissive direction.** The paragraphs below are
rewritten rather than annotated: a deferral left standing beside a discharged obligation is a reader
stopping at it and waiting.

~~**The instrument, not the digits — the selector below picks the clause itself, and it is
WRAP-INSENSITIVE.**~~ **Struck: wrap-insensitive was one of three properties it needed and the only
one it had.** It collapsed whitespace before matching, because this repository had already paid for a
line-oriented sweep that returned two hits and missed the broken file (#410) — correct, and
insufficient. Re-derived against a hardened selector on the same tree, it **under-counted by four**:

| what it missed | why | cost |
|---|---|---|
| a sentence-initial `Every …` in `docs/adr/0002` | it was **case-sensitive** | 14 found, 15 present |
| three occurrences inside `hooks/scripts/inventory-counts.test.sh` | it was scoped to `'*.md'`, and one of the three wraps across two `#`-prefixed comment lines, so the collapsed body reads `every # ` + backtick + `gh issue` and `\W?` matches **one** character | 15 found, 18 present |

**Two of those three misses are the same lesson at different grains, and the third is the sharper
one.** A sweep's instrument scoped to one file extension is an enumeration claiming to be a rule; and
**the extension it excluded was `.sh`, which is where this repository's own GATE lives** — so three
false claims sat in the comments of the file whose job is catching drift, invisible to the command
published to find them.

**The corrected instrument is published in full rather than as a mutation of the one above**, per the
rule this file already carries: *a described mutation of a published command is not a published
command.* It strips a leading comment marker per line **before** collapsing whitespace, matches
case-insensitively, and reads every tracked file:

```
git ls-files -z | xargs -0 python3 -c '
import re, sys
claim = re.compile(r"every \W{0,3}gh issue\W{0,3} call [^.]*? is a write path", re.I)
for p in sys.argv[1:]:
    try: raw = open(p, encoding="utf-8").read()
    except Exception: continue
    body = re.sub(r"\s+", " ", " ".join(re.sub(r"^\s*#\s?", "", l) for l in raw.split("\n")))
    n = len(claim.findall(body))
    if n: print(str(n) + "\t" + p)
'
```

**`\W{0,3}` stands in for a backtick — optionally preceded by a stripped comment marker's residue —
because a backtick in a command string is refused by this harness's own guard.**

**The scope it returned, and it is bigger than the deferral claimed: 16 assertions across 10 authored
files** (18 occurrences, minus `CLAUDE.md`'s own quotation and the generated `powers/` mirror). The
four the old selector could not see were the `docs/adr/0002` sentence-initial one and the three in
`hooks/scripts/inventory-counts.test.sh`.

**What no selector of this shape CAN distinguish, unchanged and now load-bearing** — the same
citation-versus-discussion blindness `documentation-standard` records about the record-citation gate.
**Every corrected site now QUOTES the clause in order to strike it**, per this repository's
struck-not-deleted convention, so the occurrence count did **not** go to zero and must not be expected
to: it went from 18 asserted to 15 quoted-and-repudiated. **A bare absence check would therefore demand
deleting the very sentences that record the correction**, which is why the gate arm added in this slice
requires a repudiation marker within 120 characters of each occurrence rather than requiring absence.

**What the repair WAS, per site rather than uniform.** Each site used the clause as a falsifier for a
different conclusion, and a single replacement string pasted sixteen times would have turned sixteen
true sentences into sixteen plausible ones. The conclusions all survive; the reason they now give is
the property rather than the proxy — **no registered hook selects a `--label` or a `--milestone`**,
which is the first command in this section and is directly falsifiable, where *"every call is a write
path"* was a proxy for it and was false.

**One conclusion did NOT survive, and it is a finding rather than a failure.**
`commands/sprint-review.md` read *"No hook can be built for it"* — an absolute the cadence carrier
falsified in the same way it falsified the preload's *"no hook can be built for either rite"*. It is
corrected on the same split — **and for THIS rite both halves are negative, which is sharper than the
preload's case and was got wrong once before the gate caught it.** `docs/loop-cadence.md` declares
`/sprint-review`'s artifact root `sibling`, so `hooks/scripts/cadence-notice.sh` names the rite and
reports it *"in the CONSUMING repository. Not observable from this tree"*, returning before it reads any
date: **NOTICING is built for the two rites declared `here` and is declared INERT for this one; FIRING
is not built for any of the three and did not move.** What the strike buys is that a row for this rite
**exists and is handled**, not that it is noticed. The identical absolute one line away in
`docs/adr/0002-roster-and-dev-loop.md` was corrected with it, for the reason slice C already gave about
this exact class: dropping a known-false absolute out of a section being rewritten anyway is cheaper
than leaving it and cheaper than a round about it.

**And the arm is calibrated by planting, not by reading.** `hooks/scripts/inventory-counts.test.sh`
carries a tree-wide arm asserting the clause never appears unrepudiated. It was confirmed red twice by
mutating the **source**: a plain occurrence appended to `README.md`, and a capital-`E` occurrence
wrapped across two shell-comment lines appended to `hooks/scripts/preflight.sh` — the second exercising
all three properties the old selector lacked at once. Both restored, both re-greened. It also carries a
**vacuity guard**, and that guard earned its place immediately: the arm's first form piped `git
ls-files` through `xargs` into `python3 -` with the script as a heredoc, **and `xargs` won the contest
for stdin**, so the script never arrived and the arm matched nothing. A bare-count-of-zero would have
read as *clean*.

**So the property to preserve is deliberate, not inherited.** Slice B adds a mode-dependent predicate;
the moment any hook is made to read it, the floor stops being mode-blind and this table stops being a
measurement. **If a later slice needs a hook to know the mode, that is the review that has to happen
before it is written, not after.**

### `wip` is a SLOT here — the VALUE and the topology are `#385`

**`WIP=1` is transitional scaffolding with a stated exit condition, not a pull-system choice.** The
owner's correction, before #406 was filed: *«hoje o nosso scrum trabalha em wip=1 devido a necessidade
de apurar o modelo antes de paralelizar a camada de developers»* · *«mas nao tem intuito de seguir
assim»*. So **WIP is a parameter of the mode, not a constant of the loop** — and a mode contract that
hard-coded it would bake the scaffolding into the configuration.

**The boundary with `#385`, open since 2026-08-31, and it is stated in both bodies rather than one:**

- **`#406` owns the SLOT** — that `wip` is a declared parameter of a mode. It decides **no value**, no
  topology and nothing about what may run together.
- **`#385` owns the VALUE and the topology** — worktrees, file collision, gate throughput, and what
  parallel work actually costs.

**Reading them against each other is the only instrument that finds this**, and it is
`/definition-of-ready`'s named flagship failure occurring live between two individually well-formed
Issues.

**THE VALUE IS `wip: 2`, decided 2026-09-11 (#385) and recorded in `docs/loop-mode.md`, not here.** The
contract owns the slot; the record owns the value, exactly as it owns `loop-mode:` — a value published
in two places is two sources of truth for one fact. **The basis:** the only instrument that can size
this is `hooks/scripts/dispatch-metrics-stop.sh`, and over the 40 most recent Issues — 23 of which carry
records, 286 records, 198.16 h — the **builder is 2.5% of dispatch time** (`developer` 4.88 h;
`agents-lead` 129.78 h, `quality-assurance` 59.67 h). Ruling 1 keeps the gate serial and the lens is
serial too, so parallelism is applied to that 2.5% while the rest stays serial — **Amdahl's law with a
measured fraction, and `wip: 2` is where it stops paying.** The command is in `docs/loop-mode.md`
beside the figure, with the window-by-window table showing the conclusion does not depend on the
corpus chosen.

~~aggregated over the 33 records on `#406` the **builder is 11% of dispatch time**~~ — **struck
2026-09-11: TRUE of that one Issue and published as though it were the basis.** `#406`'s own figure
reproduces exactly and is kept, scoped to `#406`, in the record. The corpus-wide number is **lower**,
so the correction moves the argument in its own favour — which is the only reason it is safe to make
in the same slice that relies on it.

~~**Bound that figure hard: it is TWO Issues, not a sample.** Re-derived across fourteen recent Issues,
**two** carry dispatch records at all (`#406` with 33, `#437` with 3) and twelve carry none — and
`#437`'s split has **zero** builder dispatches, so it lowers the builder's share rather than raising
it. **Nothing can size `wip` from data until the instrument is written on most work**, and fixing that
is not this slice.~~

**STRUCK 2026-09-11 — FALSE, it shipped without the command that produced it, and its error ran in the
direction that excused this slice's own scope.** The gate falsified it: over the fourteen most recent
**closed** Issues, **nine** carry dispatch records, not two. Re-derived here rather than accepted —
that window reproduces exactly (`#438` 8 · `#437` 3 · `#434` 3 · `#426` 1 · `#423` 1 · `#421` 5 ·
`#419` 3 · `#416` 6 · `#413` 12 = **42 records**). **The instrument is written on most work, and the
sentence claiming otherwise was propping up a convenient conclusion.**

**The corrected basis, with the command that produced it, over the widest corpus that can be
enumerated in one pass:**

```
python3 -c '
import subprocess, json, re, collections
R = "tedeuxx/tadeumendonca-skills"
g = lambda *a: subprocess.check_output(["gh"] + list(a), text=True)
nums = json.loads(g("issue","list","--repo",R,"--state","all","--limit","40",
                    "--json","number","--jq","[.[].number]"))
agg, cnt, carry = collections.Counter(), collections.Counter(), 0
for n in nums:
    bodies = json.loads(g("issue","view",str(n),"--repo",R,"--json","comments","--jq",
        "[.comments[]|select(.body|contains(\"dispatch-metrics:\"))|.body]"))
    if bodies: carry += 1
    for b in bodies:
        for a, d in zip(re.findall(r"agent_type:\s*([^\n]+)", b),
                        re.findall(r"duration_seconds:\s*([0-9.]+)", b)):
            k = a.strip().strip("`"); agg[k] += float(d); cnt[k] += 1
t = sum(agg.values())
print("issues=%d carrying=%d records=%d total=%.2fh" % (len(nums), carry, sum(cnt.values()), t/3600))
for k in sorted(agg, key=lambda x: -agg[x]):
    print("  %-40s n=%-4d %7.2fh %5.1f%%" % (k, cnt[k], agg[k]/3600, 100*agg[k]/t))
'
# issues=40 carrying=23 records=286 total=198.16h
#   agents-lead        n=154  129.78h  65.5%
#   quality-assurance  n=84    59.67h  30.1%
#   developer          n=18     4.88h   2.5%   <- the only share parallel DEVELOPMENT touches
#   product-lead       n=20     2.95h   1.5%
#   tech-lead          n=6      0.82h   0.4%
```

**The builder is 2.5% of dispatch time over that corpus** — not 11.07%, and **lower**, which is why
the conclusion survives its own correction: parallelising the builder pays *less* than the first
delivery claimed, so **`wip: 2` is conservative rather than aggressive.**

**The conclusion does not depend on the window, and that is worth more than any single figure.** Every
corpus that can be constructed here puts the builder at or below the original 11.07%:

| corpus | issues carrying records | records | builder share |
|---|---|---|---|
| `#406` alone | 1 | 33 | **11.07%** |
| 14 most recent **all-state** | 7 | 24 | **0.0%** |
| 14 most recent **closed** (the gate's window) | 9 | 42 | **4.4%** |
| 40 most recent **all-state** | 23 | 286 | **2.5%** |

**One disagreement recorded rather than absorbed.** The gate's finding is correct on the half that
blocks — *"nine of fourteen, not two"* — and I reproduce that exactly. Its **replacement aggregate does
not reproduce**: it published *"across all nine … 89 records, 30.48 h … 9.6%"*, while the nine Issues
it itself lists sum to **42** records and **12.61 h**, giving **4.4%**. I could not construct any
window that returns 89. **The direction is identical and every window agrees with it**, so nothing
downstream changes; the figures above are mine, with the command, and the gate's are cited as its own.

**What is still true, and it is the part the struck sentence buried:** `#406`'s own 11.07% is sound and
is kept **scoped to one Issue**, where it was measured. `loop`-typed Issues run heavy lens work, so the
builder's share is smaller there than on `product` or `content` — which is the one direction that would
argue `wip` **up**, and it is bounded by the 2.5% corpus above, which already mixes the lanes.

**What breaks FIRST at WIP > 1, priced here because it is a contract input — and it is not the gate.**
`permission-guard.sh` rule 7c head-scopes the **gatekeeper's** verdict per PR: it fetches `headRefOid`
and the comment list in one call, and an unreadable head denies. **It is the `agents-lead` verdict
marker**, which every reader treats as presence-only. Measured at head — every occurrence of the
literal outside a test file is a **counter** (`hooks/scripts/dispatch-metrics-stop.sh`), a **comment**
(`hooks/scripts/zombie-loop-detect.sh`, `hooks/scripts/permission-guard.sh`) or the prose of hold 2 in
`agents/quality-assurance.md`:

```
grep -rn 'harness-lead-verdict' hooks/scripts/ agents/ | grep -v '\.test\.'
```

**No rule reads it, and that is still true at head.**

~~**At WIP > 1 two concurrent harness diffs would each satisfy hold 2 with the other's marker.** That
is the check to run **before** relaxing WIP, in either mode; it is a named residual today and
parallelism is what makes it live.~~

**STRUCK 2026-09-11 (#385) — IT IS MECHANICALLY IMPOSSIBLE, and the strike is kept because this
sentence is the one a reader would have taken the whole hazard from.** A marker is a **comment on one
pull request**, and two pull requests share no comment thread, so no marker of PR A is ever visible to
a read scoped to PR B. Re-derived at head:

```
for n in 454 439 436; do gh pr view $n --repo tedeuxx/tadeumendonca-skills --json comments \
  --jq '[.comments[]|select(.body|test("harness-lead-verdict"))]|length'; done
# -> 3, 1, 1      each PR carries its own
# calibration — total comments per PR: 6, 2, 2, so a zero would have been readable
```

**What is real, and the struck sentence was pointing near it, is STALENESS WITHIN ONE PR.** Hold 2 was
satisfied by **presence**, so a marker posted at an early commit cleared it for everything that landed
after. **Measured on the same PR, and it is live rather than hypothetical:**

```
gh pr view 454 --repo tedeuxx/tadeumendonca-skills --json headRefOid,comments --jq '
  .headRefOid as $h
  | {markers_total:   [.comments[]|select(.body|test("harness-lead-verdict"))]|length,
     markers_at_head: [.comments[]|select(.body|test("harness-lead-verdict"))
                                 |select(.body|contains($h))]|length}'
# -> {"markers_total":3,"markers_at_head":1}
# calibration — the GATE's marker on the same PR under the same predicate is also 3 and 1. The
# shape is identical; the difference is that rule 7c head-scopes the gate's and nothing head-scoped
# this one.
```

**THIS IS NOT A PARALLELISM DEFECT AND MUST NOT BE SOLD AS ONE.** It bites identically at `wip: 1`.
What `wip` > 1 changes is the **rate**: a serial gate queues merge requests, so a PR sits open longer
between its lens pass and its merge, and heads move more in that window.

**The repair, landed in this slice:** hold 2 now requires a marker **naming the head being merged**
(`agents/quality-assurance.md`), and `hooks/scripts/zombie-loop-detect.sh` — registered on **`Stop`**
in `hooks/hooks.json` — reports a PR whose markers are **all** stale at the end of a turn. **Neither is
a bound.** The rule is the gate persona's discipline; the notice is detection one turn late and cannot
reach a turn that already merged. **A `PreToolUse` deny was rejected on a measurement, not deferred on
cost:** hold 2's trigger is a path predicate over the diff, `gh pr view --json files` pages at 100, and
a large harness diff would therefore classify as non-harness and fail open — inert exactly where it is
most needed.

### The REVIEW GATE IS SERIAL, and that is what makes parallel development safe (#385, owner ruling 1)

**Development parallelises. The gate does not.** The owner's words, 2026-09-10: *«o gate de revisao ser
serial acho que simplifica. o que me incomoda mais é paralelismo de desenvolvimento»* — so **at most one
merge request is in review at a time, whatever `wip` says**, and the next one is not dispatched to
`quality-assurance` until the previous one has merged or been sent back.

**This rule is HERE rather than in a brief, and the reason is mechanical.** Selecting a review chain is
the **orchestrator's** act; the orchestrator preloads nothing and is dispatched by nobody, so a skill
body and an agent brief both fail to reach it — measured in the two blocks above, which this block
cites rather than re-deriving. **Every persona that could read a brief is a dispatchee, and a
dispatchee cannot select its own dispatch.**

**What seriality BUYS is the composition hazard, and it buys it by construction rather than by care.**
The hazard at `wip` > 1 is not two markers on one PR — it is that each verdict attests a head that does
**not** contain the other branch's diff, so merging both yields a configuration no reviewer ever read.
Under a serial gate the second merge request is always read against a trunk already containing the
first. **Measured on two real consecutive merges:**

```
gh pr view 451 --repo tedeuxx/tadeumendonca-skills --json headRefOid,mergeCommit,mergedAt
gh pr view 454 --repo tedeuxx/tadeumendonca-skills --json headRefOid,mergeCommit,mergedAt
git merge-base --is-ancestor 6dd54992 c0ed67d9 && echo CONTAINED
# -> CONTAINED        #454's REVIEWED head already carried #451's merge commit
git merge-base --is-ancestor e44c8de3 ed1c751e || echo "NOT CONTAINED (expected)"
# -> NOT CONTAINED (expected)   the inverse, so the predicate can answer both ways
```

**Composition does NOT cover this, and must never be cited as covering it.** Planning for disjoint
files prevents **merge conflicts** — textual disjointness is precisely the condition under which git
stays silent — while the composition hazard is **semantic** and invisible to git. **Ruling 1 covers it
alone.**

**Conflicts are resolved at MR time by the slice's author** (owner ruling 2 — *«os conflitos deveriam
ser resolvidos em tempo de MR»*), and seriality changes when that happens: the second author rebases
onto a trunk that **already moved**, so *"at MR time"* means after the first merge lands, not at
PR-open.

**The sequence inside an iteration is the machine's** (owner ruling 5 — *«nao preciso participar dessa
decisao quanto a sequencia de trabalho dentro do sprint»*). `scrum-master` proposes the set, the
orchestrator opens the worktrees and dispatches, and **there is no per-item approval**. **That removes
the one human checkpoint that would have caught a bad set, and he took it knowingly** — recorded here
so nobody re-derives it later as an oversight. The deliberate contrast with the `content` lane, which
is selected one piece at a time and never drained, is design rather than inconsistency.

**Isolation is `git worktree`** (owner ruling 4), reversing the 2026-08-13 rule that permitted only one.
**The hook layer is already worktree-ready and that was measured rather than assumed:**

```
jq -r '.hooks|to_entries[]|.value[]|.hooks[]|.command' hooks/hooks.json   | sed 's|.*/hooks/scripts/|hooks/scripts/|' | sort -u | xargs grep -l 'rev-parse --git-dir'
# -> 6 of the 14 registered hooks key their state on the worktree's OWN git dir, so two worktrees
#    never share a debounce namespace:
#    cadence-notice - closure-artifact-guard - orchestrator-tool-census
#    owed-pr-link-detect - premature-pr-link-detect - zombie-loop-detect

# and NOT ONE registered hook walks for a `.git` DIRECTORY, which is the class #439 repaired
# (in a linked worktree `.git` is a FILE, so such a walk runs off the top of the tree):
... | xargs grep -nE '\-d "[^"]*\.git"'
# -> no output
# calibration - the denominator is non-empty: the same pipeline without a grep lists 14 scripts.
```

**`#385`'s own body said *seven of thirteen*; at `eda00c41` the criterion above returns SIX of
FOURTEEN.** Both the numerator and the denominator moved, so the figure is re-derived here with the
selector that produced it rather than carried. **The conclusion is unchanged and does not rest on the
count**: the hooks that keep per-checkout state already scope it per worktree, and none of the other
eight keeps any.

**What holds ANY of the five rulings: nothing.** No layer observes which chain a dispatch ran, no
artifact records a dispatch, and `gh pr create` is allowlisted in **both** settings layers, so a second
concurrent merge request executes silently. By this loop's own test — *would something stop me, or only
my memory?* — **every one of the five is an instruction**, and that is why each is written where the
actor who must obey it actually reads.

### Rule 7c's ref residual, RE-PRICED at `wip` > 1 — the old hole is closed and a new one is named (#385)

**This is the one part of `#385` that touches the irreversible floor, and the re-pricing is owed
because the residual's published cost was stated AS A FUNCTION OF WIP=1.** The guard's own comment
priced it *"almost always the PR being merged"* — a property of how the loop happened to be run, not of
the rule.

**The flag-before-ref hole is CLOSED, and the check was re-run at head rather than inherited.** `#441`
(`dc480e16`, 2026-09-10) repaired it, and `#385`'s own body measured the pre-repair behaviour. Fed to
the guard with a namespaced `agent_type` so rule 7b does not short-circuit:

| payload | verdict at `eda00c41` |
|---|---|
| `gh pr merge 999999 --merge` | **deny** — names no pull request (the control) |
| `gh pr merge -t subjecttext 999999 --merge` | **deny** — *"puts a flag before the pull-request reference … cannot prove WHICH pull request"* |
| `gh pr merge --merge` | reaches the verdict read, and denies on it (the no-ref form is untouched) |

**`#385`'s body measured the middle row as ALLOW. It is DENY now.** The three verdicts differ by
message, not only by outcome, so the rows are distinguishable rather than collapsed into one — which is
what makes this a check rather than a coincidence. **The three priced options in the body — extend the
flag strip, write an argv parser, or accept it — are all moot: `#441` chose a fourth, "deny what cannot
be parsed", and it closes the class rather than enumerating it.**

**What `wip` > 1 DOES make live, and it is a different residual that nobody had named.** `gh pr merge`
with **no reference** merges *the current branch's PR*, and rule 7c reads that same PR's verdict — so
guard and act agree, which is why the no-ref form is correctly left alone. **But "the current branch"
is a property of the CWD**, and under one worktree per slice the cwd is no longer unique. Measured from
this slice's own linked worktree:

```
git -C <worktree> branch --show-current   # -> loop/wip-parallel-385
git -C <primary>  branch --show-current   # -> main
# `gh pr merge --merge` evaluated with cwd = the worktree resolves against the WORKTREE's branch:
# -> "this command carries NO --repo, so 'gh' resolve[d]" against that branch's PR, and denied
#    because that branch has none.
```

**So at `wip` > 1 a no-ref merge issued from the wrong checkout merges a DIFFERENT slice's pull
request, and rule 7c validates it consistently** — it reads the verdict of the PR `gh` will actually
merge, so the floor is not bypassed and nothing fails open. **The failure is a correct merge of the
wrong thing**, which no layer can detect because both halves agree.

**The mitigation is an instruction and it is cheap: a gate dispatch names the PR number positionally,
first.** `gh pr merge <number> --merge`. **What holds it: nothing** — the no-ref form is a legal,
allowlisted invocation that this floor deliberately permits, and making it deny would break the
single-checkout case the loop still uses. **Accepted with its cost stated**, which is the honest form
when there is no cheap mitigation.

### What nothing enforces — per decision, because "nothing enforces this" flattened is false

| decision | what actually holds it |
|---|---|
| the mode is recorded at all | ~~**nothing reads the record**~~ — **corrected 2026-09-09 (slice B): `commands/autonomy.md` reads it, which is a rule a session executes and not a mechanism.** Nothing MECHANICAL reads it, and no gate asserts the record exists or parses. `git log` over one path still gives the proportion to a human |
| the mode is read BEFORE any pool query | **an instruction.** No layer sees a query's intent |
| the two repositories agree on the mode | ~~**nothing.**~~ **Narrowed 2026-09-09 (slice B): an instruction, in one context only.** The drain already reads both trees, so it compares the two records at entry and stops on a disagreement. **Every other context — a rite, an ad-hoc session, a dispatched persona — still has nothing**, and a hook cannot close it: it receives one `cwd`, so it would have to guess where the sibling tree is in order to compare a string, which is assuming what it checks |
| loop-first survives in either mode | **the ordered artifact, and awkwardness.** #339 already measured this ungateable at every layer |
| the rites run at all | **nothing today, in either mode** |
| `wip` is honoured | **nothing.** `wip-guard.sh` was deleted at #383 and nothing bounds work in progress. **Unchanged by #385 giving `wip` a value** — `gh pr create` is allowlisted in both settings layers, so an (N+1)th concurrent merge request executes silently, with no prompt and no record |
| the review gate stays serial | **an instruction, in this block** (#385, owner ruling 1). Nothing observes how many reviews are in flight: a dispatch leaves no artifact, and the one lens whose participation would be visible on a PR posts nothing at all — rule 5e denies `product-lead` the comment subcommands |
| the composed set does not collide | **nothing.** `scrum-master` holds `tools: []`, `SELECTION-RECORD` has no consumer, and nothing verifies the pool it was shown. Ruling 5 removed the per-item human checkpoint deliberately, so a bad set runs |
| the `agents-lead` marker names the head being merged | **the gate persona, plus one detector.** `agents/quality-assurance.md`'s hold 2 requires it and nothing denies on it; `hooks/scripts/zombie-loop-detect.sh`, registered on **`Stop`**, REPORTS a PR whose markers are all stale — one turn late, and never a bound on the merge |
| worktrees are cleaned up after merge | **nothing mechanical.** `#437` closed the lifecycle question and `hooks/scripts/worktree-notice.sh` REPORTS; it removes nothing. Re-derived 2026-09-11: `-io` carried 28 linked worktrees and `-skills` 5, before this slice added one to each |
| a cadence trigger keys on the CLOCK and not on the pool being empty | ~~**nothing — and the carrier is not built yet, so this is a rule written before its object**~~ — **the object exists since 2026-09-09 (#406 slice C), and the row splits.** *For the carrier that exists:* it is held by **construction plus a test** — `hooks/scripts/cadence-notice.sh` makes no tracker call at all, and its suite asserts that with a recorder on `PATH` in place of `gh` rather than by removing `gh`, so the zero is a real zero. *For any FUTURE trigger:* still **nothing**. No layer reads a hook's intent, and a second carrier keyed on emptiness would be caught by review or by nobody |

~~**Six of seven are instructions and one is a report.**~~ **Struck 2026-09-09 (slice B): the tally is
stale and a tally beside a table is a second source of truth for one fact, which is the arrangement
this repository's own gate exists because it rots.** The criterion is what survives: **not one row is
held by a layer that could stop the act — every entry is an instruction, an artifact a human reads, or
nothing at all.** Read the column and count if a number is wanted.

By this loop's own test — *would something stop me, or only my memory?* — **the mode contract is not
engineered, and it is not presented as if it were.** A configuration surface invites the reading that
something reads it. ~~nothing does~~ — **corrected: `commands/autonomy.md` does, and no mechanism
does.** That distinction is the whole of what slice B changed here, and collapsing it in either
direction is wrong: claiming nothing reads the record understates it, and calling a rule a session
executes a mechanism overstates it.

**One rule in that table is worth stating twice, because it is the only place in this design where a
wrong guess is SILENT: the mode is read from its record before any pool query, and nothing may infer
the mode from what a pool query returns.** Measured — the active-iteration derivation prints nothing
and exits 0 when the eligible set is empty; `echo '[]' | jq 'min'` returns `null`, exit 0.

**Ruling 3 did not remove that ambiguity — it MOVED it, and the new form is harder to see.** Before,
the reading was *"no milestone at all"* versus *"Scrum with its milestones dropped"*. Now **both modes
carry a milestone**, so the confusable pair is *an empty active milestone in `kanban`*, where it means
nothing whatever, against *an empty active milestone in `scrum`*, where it is the terminal condition
that hands off to the closing rites. **The two produce a byte-identical query result and opposite
correct behaviours.** A drain that infers its mode from the result either reports a healthy queue over
a dark one or fires a ceremony on noise, with every check green either way.

### The three rulings this block is written against — all 2026-09-09, none of them decided here

**This section named two decisions as OPEN until the owner answered them mid-build, and it is rewritten
rather than annotated because a contract carrying a stale *"open"* is worse than one carrying a stale
answer: a reader stops at it and waits.**

1. **The cadence carrier is BUILT** — *«Constrói o gatilho por relógio»*. A `SessionStart` notice when
   the interval has elapsed, **never a control**, on the honest comparison of **clock versus nothing**:
   the boundary trigger it replaces has never fired either. **It is NOT built in this slice and must
   not be** — a contract says what a mode may vary; a trigger is a mechanism, and keeping the two apart
   is the whole point of writing the contract first. **What the ruling did not decide: the interval**,
   which was not asked and is not inferred here. **BUILT 2026-09-09 in its own slice, as the sentence
   above required** — `hooks/scripts/cadence-notice.sh` plus `docs/loop-cadence.md`. The *"not in this
   slice"* clause is left standing rather than struck: it was, and remains, true of the slice it was
   written in, and it is the reason the carrier is a separate merge request rather than a paragraph of
   this one. **The interval is still not decided** — the carrier ships with it undeclared and reports
   that fact once a day instead of choosing a number.
2. **`sp:N` stays in BOTH modes** — *«Mantém o `sp:N` nos dois modos»*. Recorded in the untouchable
   list above with its cost, and it removes an axis rather than adding one.
3. **The iteration NUMBER is used in both modes** — *«nao tem problema numero da iteracao ser utilizado
   nos dois modos»*, unprompted. Recorded in the enum above as *commitment versus label*.

**Rulings 2 and 3 each REMOVED an axis a mode may vary.** That is the useful shape to notice: a mode
config gets better by shrinking, because every axis is a place the two modes can drift apart with
nothing watching.

### The two copies of this block must stay identical

**A mode is a WORKSPACE property, and a session rooted in one repository loads neither the other's root
brief nor a sibling's** — measured in the block above. So this block is shared, byte for byte, between
`CLAUDE.md` at the root of `tedeuxx/tadeumendonca-skills` and `CLAUDE.md` at the root of
`tedeuxx/tadeumendonca-io`. From a workspace holding both checkouts:

```
diff <(sed -n '/^<!-- loop-mode-contract -->$/,/^<!-- \/loop-mode-contract -->$/p' tadeumendonca-skills/CLAUDE.md) \
     <(sed -n '/^<!-- loop-mode-contract -->$/,/^<!-- \/loop-mode-contract -->$/p' tadeumendonca-io/CLAUDE.md)
```

**That is an OBLIGATION and not a claim about either copy's current state — nothing checks it, and
nothing makes the two move together.** The sibling's merge request had not landed when this was
written, so the command above is expected to print the whole block. **This is now the THIRD
hand-maintained two-repository block in this file**, and that is a cost stated rather than discovered:
each one is a place where two files can disagree in silence, and the only instrument is a `diff`
somebody has to remember to run.

**`AGENTS.md` deliberately does NOT carry this block**, and the reason is its own rule rather than
budget: that brief states obligations addressed to an agent, never descriptions of enforcement, and the
untouchable list above is a measurement of this harness's own hook layer. **The portable statement of
the same contract is `docs/prompts/loop-mode-contract.md`**, which is what another harness adopts.
**The residual: if a mode ever gains an operative rule a session on other machinery must obey, that
rule is owed to `AGENTS.md` as an obligation, and nothing will say so.**
<!-- /loop-mode-contract -->

---

<!-- dive-deep-orchestrator -->
## A premise you assert in a dispatch brief BECOMES the design (tedeuxx/tadeumendonca-skills#426)

**Fourth block in this file addressing the ORCHESTRATOR — the main session — and it is here for the
reason the three above are.** `#410` landed *dive deep* as the twelfth principle in the
`engineering-standards` skill, which all eight profiles preload. **The orchestrator preloads nothing**:
`#409` measured, one nonce per candidate surface, that a skill body does not reach this context while a
repo-root `CLAUDE.md` does. So the principle whose motivating failure was the orchestrator's own was
readable by every context except that one.

### The rule

> **Do not assert in a dispatch brief a premise you have not measured. Measure it and carry the
> command, or write it into the brief as a premise the dispatch must VERIFY — never as a fact it may
> inherit.**

**This is narrower than the skill's principle and must not be flattened back into it.** That one
addresses a builder deciding how deep to investigate a symptom in code. This one addresses a single
act: **composing a brief.** A dispatch brief is not a claim someone will later check — it is the
specification the dispatch builds against, so a false premise in it is not a wrong answer, it is a
wrong design, and the dispatch executes it faithfully.

**The tell is the twelfth principle's own: an answer that is TRUE and closes the inquiry.** *"The
failure was mine, no configuration causes it"* is the shape it takes in this context — always
available, never falsifiable, and it ends the investigation exactly where the mechanism begins.

### This carrier is WEAKER than the three above it, and the block says so rather than implying otherwise

`#409` measured this file reaching the orchestrator's **context**. It did not measure it reaching the
**turn**, and those are different claims: a brief is composed hundreds of turns after the file loaded.
**The three blocks above at least attach to an act some layer can see** — a command string, a picker
payload, a pool query. **This one attaches to text being composed, and no layer observes that.**
`SubagentStart` carries `session_id`, `transcript_path`, `cwd`, `prompt_id`, `agent_id`, `agent_type`
and `hook_event_name`, and **no prompt text** (`#209`, quoted in the metrics hook's own header).

**Do not read that as *ungateable* — that is the same over-claim pointing the other way.** A dispatch
is a tool call, so a `PreToolUse` matcher on it would see the brief's text; that is **available and
unmeasured**, named here rather than claimed. What no layer reaches either way is the half that
matters — **whether a premise inside the brief is TRUE** — which is not a string property, and a
detector for it would fail open.

**So this is an instruction, and it is the weakest of the four.** By this loop's own test — *would
something stop me, or only my memory?* — nothing stops it. It lands anyway on `#393`'s argument: it
removes the dependency on a fresh context happening to know the rule, and that dependency has now
failed six times, every one caught by a dispatch or a gate and none by the orchestrator.

### The two copies of this block must stay identical — and the falsifier ships with a CONTROL

**Shared byte for byte between `CLAUDE.md` at the root of `tedeuxx/tadeumendonca-skills` and
`CLAUDE.md` at the root of `tedeuxx/tadeumendonca-io`**, for the reason `#393`'s probe measured: a
session rooted in one repository loads neither the other's root brief nor a sibling's, even with the
sibling added as a working directory.

**Run the CONTROL first. A `sed` range whose pattern matches nothing emits nothing, so an absent block
and an identical one produce the same silent exit 0** — confirmed 2026-09-10 by running the diff below
against a delimiter name present in neither file: no output, exit 0, indistinguishable from a pass.
From a workspace holding both checkouts:

```
# CONTROL — both sides must report 2 (one opening and one closing delimiter).
# A 0 or 1 on either side means the diff below CANNOT fail, whatever it prints.
grep -c -E '^<!-- /?dive-deep-orchestrator -->$' \
  tadeumendonca-skills/CLAUDE.md tadeumendonca-io/CLAUDE.md

diff <(sed -n '/^<!-- dive-deep-orchestrator -->$/,/^<!-- \/dive-deep-orchestrator -->$/p' tadeumendonca-skills/CLAUDE.md) \
     <(sed -n '/^<!-- dive-deep-orchestrator -->$/,/^<!-- \/dive-deep-orchestrator -->$/p' tadeumendonca-io/CLAUDE.md)
```

**The three blocks above publish their diff WITHOUT that control, so all three read green vacuously if
a delimiter is ever renamed or dropped.** Verified 2026-09-10 that all three are genuinely identical at
head — six delimiter lines in each file, every diff clean — so that is a defect in the published
instrument, not a live drift. **Repairing those three is its own slice:** it edits three byte-identical
spans in two files each, and a one-byte slip there breaks the falsifiers it exists to fix.

**That is an OBLIGATION and not a claim about either copy's current state — nothing checks it, and
nothing makes the two move together.** Pipelines are independent per repository, so a change to this
block is a two-repository batch, and the command above is expected to print a difference in the window
between the two merges.

**`AGENTS.md` deliberately does NOT carry this block.** That brief states obligations addressed to an
agent on machinery nobody here has measured; this one names `SubagentStart`, a payload field set and a
tool matcher, which are descriptions of this harness's own enforcement layer. The obligation is
portable; the enforcement analysis around it is not.
<!-- /dive-deep-orchestrator -->

---

## Engineering principles (always-on floor — non-negotiable)
This repo consumes the **`tadeumendonca-skills`** plugin's principles layer (enabled in `.claude/settings.json`;
its `PreToolUse` permission-guard hook activates automatically). The spine is **agent-led verification,
human-residual**: the agent proves "done" with mechanical gates and real evidence; the human keeps the
irreversible/architectural judgment and the production go/no-go. The floor never bends to risk:
- **Plan-first** — design and align before coding; no solo architectural call.
- **Ask on the boundaries — and only there.** Architecture, content/positioning, anything irreversible
  or public-facing goes to the owner; **everything in-pattern is decided and merged autonomously**,
  through the `quality-assurance`. Asking on in-pattern work is not caution, it is the loop failing to
  flow — the boundary is what the human's attention is *for*, and spending it elsewhere devalues it.
- **Thin vertical slices, WIP = 1** — each increment end-to-end and reviewable; **finish it through
  merge** before opening the next. A green PR left sitting is the queue forming. (~~Mechanical since
  skills#61: the plugin's `wip-guard` denies opening a second PR in a repo that already has one of
  yours~~ — **struck 2026-09-07: the hook is DELETED and WIP = 1 is held by this sentence and nothing
  else.** `hooks/scripts/wip-guard.sh` was removed at `-skills` #383 and is registered on no event —
  `hooks/hooks.json` at head carries `permission-guard` and `mcp-guard` on `PreToolUse` and no third
  entry. **A second PR does not fall through to a prompt: `gh pr create` is allowlisted in both settings
  layers, so it opens SILENTLY.** Struck rather than deleted because the clause stood since skills#61
  and a reader took a mechanism from it. `session-wip` lists the open queue at session start — **that
  half is TRUE and unchanged**, registered on `SessionStart` in the plugin's `hooks/hooks.json` at head,
  and it reports rather than refuses.)
- **Quality is a gate** — lint/typecheck + tests (coverage ≥ 85%) + a green build + SonarCloud + the
  `quality-assurance`, and **functional E2E** (Playwright) as the proof nothing already working broke.
  The reviewer is a **distinct** gate from CI, not a summary of it.
- **Observability is part of done** — the site is static, so this is Google Analytics + the client error
  surface + a build/prerender smoke (routes render, OG tags present in the served HTML) — not backend telemetry.
- **Security & resilience by-design** — least-privilege CI (per-job OIDC roles), no secrets in the repo, a
  minimal static attack surface (no server, no auth).
- **Rigor calibrated to blast-radius** — heavy where irreversible/public, product-speed where cheap to revert.

Depth lives in the plugin's skill library (`agents-configuration`, `engineering-standards`, `quality-gates`);
for deliberate validation of a non-trivial decision, invoke the subagent that **owns** it. **The eight
below are the whole live roster** — this list is checked against the plugin's `agents/` by the
`harness-drift` job in the `app` workflow, so a persona retired over there turns this paragraph red here
rather than leaving a dispatch that fails when followed. The check reads only between the two markers,
so the history further down this file is not in its scope.

<!-- roster:dispatch -->
- **`tech-lead`** — a decision against the principles and the ADR library; it also writes the product/system ADRs.
- **`product-lead`** — what to build next, and whether published copy is true.
- **`developer`** — builds a slice end to end against an approved spec.
- **`content-writer`** — drafts articles, site copy and social-post language in the owner's voice; contained the same as the product lead (never posts directly). Named *writer* until `-skills` #317 — a rename, nothing absorbed.
- **`content-reviewer`** — reads that draft against *published-voice*, the same skill it was written against, for at most two rounds; ~~blocks only where it can quote a clause~~ — **struck 2026-09-07: it REPAIRS the draft in place, on two grounds — it can quote a clause of that skill, or the claim is false against the source — and there is NO copy block on the content lane at all** (owner ruling 2026-09-03, the plugin's ADR-0002 thirty-second amendment; agents/content-reviewer.md heads that section *"you REPAIR, you do not block"*). Contained the same way (never posts directly).
- **`quality-assurance`** — THE merge gate, and it absorbed the permission-floor and supply-chain lens.
- **`agents-lead`** — the machinery itself: hooks, settings, briefs, the plugin. Pre-implementation, and may implement the harness changes it reviews (never merging, never gating an MR).
- **`scrum-master`** — which profile acts next, and whether the rites ran in order. It holds `tools: []` — an explicit empty grant, not an omission — so it returns a selection record and executes nothing.
<!-- /roster:dispatch -->

~~**`security`** for the permission floor and supply chain~~ — **struck 2026-08-05.** That persona was
retired in the plugin's roster merge and its two mandates were folded into **`quality-assurance`**, which
now holds technical delivery and the production lens at once. The name was still routed here for a day,
which made it the one instruction in this file that *failed when followed*.

~~**`harness-reviewer`**~~ → ~~**`harness-lead`**~~ — **renamed `agents-lead`** in the plugin's own roster
(`-skills` #291, v1.1.13), the second rename of the same persona; updated here to match both times. The
mandate did not move — only the name — so nothing was absorbed and there is nothing else to say about it.
Worth one line anyway: this file is the dispatch list an agent reads, so a stale name here is an
instruction that fails when followed, exactly as the `security` row above did for a day.
~~`writer`~~ **`content-writer`** (a sixth persona, added deliberately — it satisfies none of the roster's four
persona-existence reasons, an owner override for a capability gap rather than a reasoned fit) is added
above. **Renamed in `-skills` #317**, which also added a **seventh**, `content-reviewer` — the roster's
first true *pair*, and the first persona added on reason #1, disagreement is wanted. Nothing was
absorbed by either: the rename moved a name only, and the pair splits drafting from judging a draft.
**What did move is `product-lead`'s craft opinion**, which left the drafting rounds on the owner's
decision — its blocking veto on the truth of published copy and its `content` intake did **not**, so the
row above is unchanged on both counts.
**`scrum-master`** is an **eighth**, added in `-skills` #375 on reason #2 of the roster's four — *a fresh
context is wanted*. It absorbed nothing, and it partially reverses amendment #7, which had folded an
earlier persona of that name into `product-lead` for producing no disagreement; that finding still stands
for what it measured, because what returns is not ceremony facilitation or an ordering opinion — both
still `product-lead`'s — but a written record naming who acts next, which nothing else produced. It is
listed here because this fence is the dispatch list, and a persona missing from it is one an agent will
never reach for. **It is the only profile in the roster that holds nothing**, so dispatching it can
enlarge no capability; the cost is the mirror of that — it is an influence mechanism, not a control, and
nothing dispatches it or reads what it returns.

(`plan-reviewer` and `principles-guide` are both retired; invoking either name simply fails.)

**Trunk-based** (merge to `main` → deploy to the single environment); **IaC is pipeline-only**; local dev is
**static** (fully static SPA, no backend). The agent works the full inner loop unprompted (git-reversible /
staging-scoped) and is **denied the irreversible/public boundary** (push/merge to `main`, `terraform
apply`/`destroy`, direct cloud mutation, force-push, `rm -rf`, secret writes); **never
`--dangerously-skip-permissions`**.

## Purpose (why it exists)
tadeumendonca.io is the owner's **proof-of-engineering** public presence, backing a repositioning to
**AI Engineer** (agentic development / AI-native automations), anchored in SDLC + distributed-systems
experience. The site is the storefront; the **argument is the code it links to**.

**Public URLs carry a locale prefix** — `/pt/…` and `/en/…` (ADR-0036). The path is **authoritative**:
`/pt/me` renders the Portuguese edition regardless of the visitor's browser, which is what makes a shared
link keep its language. Sub-paths without a prefix (`/me`, `/portfolio`) exist only as a client-side
redirect to the reader's edition; they are **not** prerendered and must never be advertised in hreflang or
the sitemap. **The bare root `/` is the one exception, deliberately**: it *is* prerendered (the English
landing), *is* in the sitemap, and *is* the advertised `x-default` — it is the JS-less crawler's entry
point. `apps/fed/scripts/routes.mjs` is the build-time source of truth for the route set; read it before
assuming a route exists.

**Six public surfaces** — `STATIC_ROUTES` in `apps/fed/scripts/routes.mjs` is
`['/', '/me', '/portfolio', '/ramp-up', '/architecture', '/library']` — plus the article route, which is
**not** in that list:
1. **Landing** (`/`) — the storefront. It also **hosts the articles list** (`#artigos`), which is why there
   is no separate blog index (below).
2. **Interactive CV** (`/me`) — the canonical reference of the owner's experience, and now the **only** CV
   surface: the Canva CV was retired (ADR-0024 amendment) once `/cv.pdf` became a real artifact rather than
   a capability. `/me` is the full edition; `/cv.pdf` is the two-page recruiter edition printed from it at
   build time (ADR-0034). Both derive from `profile.ts` — nothing is maintained by re-typing. LinkedIn is
   the one CV-bearing surface still hand-maintained, so it is the one that can still drift.
3. **Portfolio** (`/portfolio`) — a curated **catalog** of public repos (automations, agents, MCP servers, AI-native tools) that back the positioning with real code. The bar a project must clear to be published is `docs/catalog-ready.md`.
4. **Ramp-up** (`/ramp-up`) — the open plan for the AI-Engineer transition. Markdown-in-repo, both locales.
5. **Architecture** (`/architecture`) — how the site is built, linking the ADRs and the two public repos.
   Markdown-in-repo, both locales.
6. **Library** (`/library`) — a curated reading shelf: each book with a 1–5 rating and one line on what
   he took from it. **Typed data, not markdown** — `src/data/library.ts` follows `catalog.ts`, so it is
   the `/portfolio` pattern rather than a third one. It shipped with **zero entries and an authored empty
   state** (a placeholder book is prose an OG scraper would pin) and **no nav entry**; both conditions were
   discharged by the first books (#166), so it now carries a **nav entry in both editions** and a
   cross-link from `/ramp-up`. **The empty state is still live copy, not dead code** — the page takes its
   entries through a seam so that reviewed sentence stays covered for the day the array is empty again.
   The label is bilingual ("Biblioteca" / "Library"); the slug is not — the localized pair
   `/pt/biblioteca ⇄ /en/library` was proposed and declined (ADR-0036's 2026-08-05 amendment).
   `/ramp-up` and `/library` name overlapping books by hand, and where they overlap they are asserted to
   agree on the facts — title, URL, finished status — never on prose.

**Blog** — long-form engineering writing with explicit trade-offs (distributed-systems / AI patterns) — is
**not a static route**. There is no `/blog` list page: it was retired, and `/blog` redirects to the
landing's `#artigos`. The only real article route is `/blog/:slug`, and the slug is **per-locale**
(ADR-0037), so the two editions of one article carry different URLs.

**Operating rules (not flavor):** defensible decisions with documented trade-offs (the code is public and IS
the pitch); **no over-engineering** (simplest thing that solves it), but **not a playground** (it must work);
**no client/employer references** in public writing (abstract any war-story to a generic principle).

## Architecture (static — read before changing infra)
A **fully static SPA** (React + Vite + TypeScript, no PWA) built to `dist/` and served from
**S3 + CloudFront**; a **CloudFront Function** (viewer-request) rewrites clean URLs. Content is **in the
repo**, in two shapes: **markdown** for long-form (articles, ramp-up, architecture — frontmatter +
react-markdown) and **typed TypeScript** for structured data (`src/data/profile.ts` is the CV,
`catalog.ts` the portfolio). The build **prerenders each route in both locales** (Playwright snapshot of
`vite preview`) so OG/SEO tags land in the served HTML, and prints `/cv.pdf` from `/en/me` in the same
pass. There is **no backend** — no API, no database, no auth, no Lambda.

**The prerender is not a visitor** (ADR-0036 amendment): it snapshots in a single en-US browser and that
HTML is served to everyone, so anything rendering off the **visitor** (language, storage, viewport) rather
than the **route** must opt out via `window.__PRERENDER__`. A post-mount flag does not do it — the
snapshot is taken from an already-hydrated page. The exemption is *"identical for every visitor"*, not
*"does not render"*.

`iac/` is **frontend infra plus one account-wide guardrail**: S3 (`storage.tf`), CloudFront + the
URL-rewrite function (`frontend.tf`), custom email via iCloud (MX/DKIM/SPF, `email.tf`), the GitHub OIDC
deploy roles (`iam.tf`), and an **account-level cost budget** (`budget.tf`) — deliberately *not* scoped to
this project's tags, so it catches spend this repo did not create. Plus the usual Terraform scaffolding
(`data.tf`, `locals.tf`, `outputs.tf`, `variables.tf`, `versions.tf`, `providers.tf`, `env/`). Cost is
**near-zero / scale-to-zero** (static objects on CloudFront `PriceClass_100`; no always-on compute). The
security surface is minimal (no server, no auth); the CI OIDC roles are least-privilege and pinned to the
repo's **immutable OIDC subject** (`repo:<org>@<org_id>/<repo>@<repo_id>:*` — see `iam.tf` `local.github_oidc_sub`).
The shared regional WAF was retired (nothing to protect on a static bucket behind CloudFront).

## Branching (trunk-based)
**Loop model: `trunk-single-env`.** This is the declaration the principles layer reads — see
`/principles/dev-loop`, which documents two models. Everything below follows from it, and the
`gitflow-multi-env` half of those skills (integration branch, staging→production promotion,
staging-backed local dev) **does not apply here**. If a principles skill and this file disagree, this
file wins.

Two consequences worth stating outright, because they are what the other model gets wrong:
- **The PR to `main` carries the gate.** There is no downstream *environment* to defer a check to, so a
  check skipped on the PR is a check that never runs — with **one deliberate exception**: assertions that
  are **unsatisfiable before the deploy exists** (today, that the CloudFront Function is attached and
  accepted at the edge — #216). Those live in the post-deploy smoke and **skip** elsewhere rather than
  going red for a harness reason. The test is not "is it convenient to defer" but "can this be true
  before merge at all"; if it can, it belongs on the PR.
- **`main` is the working branch, not a protected production mirror.** Never add tooling that blocks
  edits or commits by branch context; it would break every slice.

- **`main`** is the only branch. Feature/fix branches cut **from `main`** → PR (0 required approvals) → merge →
  **automatic deploy** to the single environment. The merge **is** the deploy, so it is the go/no-go —
  and **the `quality-assurance` subagent is who holds it**, not a human prompt on every PR. Run it on
  **every** PR before merging, unprompted; it verifies the MR Definition of Done with real evidence and
  then either **approves-and-merges the safe class itself** (docs, dependency bumps, tests, in-pattern
  work implementing an already-approved spec, **and the whole `product` backlog including
  reader-facing copy**) or **escalates the boundary class to the owner** — which since 2026-07-30 is
  three things and no longer includes reader-facing content: **`iac/`** and anything that threatens
  the site's continuity, **a change to the dev-loop's own rules** (this section, the ⚠️ section, an
  ADR that decides how work is decided), and **publishing an article** (the `content` backlog — the
  owner's voice). Contract/schema still escalates as `iac/`-adjacent. **An ADR amendment that *decides*
  something is safe class** (owner, 2026-07-31) — ADR-0003's 2026-07-29 table said otherwise and that
  clause is struck; the only ADRs that still escalate are the ones covered by the second item above,
  which decide *how work is decided*. *Significance beats in-pattern:* when the class is
  unclear, it is boundary. **The reviewer never merges an expansion of its own authority** — a change to
  this guide's merge rules is boundary by construction, whatever the diff looks like.
  A green CI is **not** a substitute for the review — CI proves nothing broke, the reviewer judges
  whether the change is right.
- **How a ratification is proven, and what no longer needs one** — the rule lives in
  **[ADR-0003](./docs/adr/0003-trunk-based-single-environment.md)'s 2026-07-29 amendment**, not here, so it
  is inside the decision record where the next sweep can audit it. In short: the owner ratifies by
  **commenting on the PR** and the reviewer **verifies that comment itself** (`gh pr view --json comments`
  — author, OWNER association, and that it post-dates the head); a relay is a notification, never the
  authority (#217). And **record correction is safe class** — a change that only makes the record match
  decisions already ratified, asserting nothing beyond a pointer to the ADR that superseded it, the
  reviewer merges. A discharge that asserts a new **fact** or reinterprets **scope** is still boundary.
  Read the amendment before classifying; the table there is the operative text.
- **Single environment** (the `tadeumendonca-io` TFC workspace); the public
  site serves at the **apex** `tadeumendonca.io`.
- **Single version** (numeric SemVer, root `VERSION`): the deploy's **`release`** job auto-bumps the patch
  on every push to `main`, tags `vX.Y.Z`, publishes a Release. A **deliberate** minor or major is the same
  job on a `workflow_dispatch` from `main`, via its **`part`** input (`none` | `patch` | `minor` | `major`,
  default `none`) — [ADR-0044](./docs/adr/0044-version-parts-deliberate-major-minor.md) decides what each
  digit means. The `bump:` commit is loop-guarded. It is
  the deploy's *first* job rather than a workflow of its own because `VERSION` is a **build input** — the
  bundle's footer renders it, so the bump has to precede the build that ships.

## Structure
- **`apps/fed/`** — the static SPA (React + Vite + Tailwind, no PWA). Own guide in `apps/fed/CLAUDE.md`.
- **`iac/`** — Terraform for the frontend infra (S3, CloudFront + URL-rewrite function, email, OIDC roles)
  plus the account cost budget. State in Terraform Cloud, **Local** execution; `apply`/`destroy` are
  **pipeline-only**. Note `iac/cloudfront-functions/` holds **application logic in JS**, unit-gated by
  the **`app`** workflow rather than only by `iac` — gate ownership is by what a file IS, not its
  directory (ADR-0018 amendment). It is filtered by **both**: `app` proves the rewrite logic, `iac` proves
  the edge is running it, since `frontend.tf` reads that file and an edit to it is a Terraform diff.
- **`docs/`** — **`docs/adr/`** is the decision library (`docs/adr/README.md` is the index, the reading
  order **and** the count). **No number is written here on purpose** — a literal count is correct until
  the next record lands and silently wrong afterwards, with nothing asserting it;
  `ls docs/adr/0*.md | wc -l` is the answer whenever one is actually wanted.
  Also `docs/catalog-ready.md` — the bar a project must clear to be published in the
  portfolio — and `docs/iac-deploy-policy.{md,json}`. **Read the relevant ADR before changing anything it
  decides**; the ADRs *are* the architecture documentation, this file is the map.
- **`.brand/`** — **gitignored, local-only, never published.** See below.

## Scratch — the session scratchpad, not a repo directory

**A repo-root `.scratch/` used to be the documented place for throwaway files, emptied by the plugin's
`session-scratch` hook. Both are retired**, mirroring the same call already made in the
`tadeumendonca-skills` harness repo (#245 there): the hook is gone, so an ignored-but-unswept `.scratch/`
was the worst of both worlds — invisible to `git status` and immortal. Carrying a repo-side scratch
directory bought nothing a session-scoped scratchpad doesn't already buy, at the cost of a sweep hook, a
`.gitignore` entry, and a rule that only lived in this file's prose.

**Use the harness's own session scratchpad instead** — the path it hands you at session start,
session-specific and isolated from the tracked tree by construction. No repo directory to document, no
sweep hook to maintain.

**The taxonomy still matters, only the location column changed:**

| what | where |
|---|---|
| PR bodies, commit messages | **the session scratchpad** — written once, consumed by `--body-file`, discarded when the session ends. |
| lens and gate verdicts | **the PR comment.** Already the durable record, already machine-read. |
| interview transcripts, raw source material | **`.brand/`** — private, gitignored, already the documented home for exactly this. |
| a diagnostic probe | **a real spec under `apps/fed/e2e/`, or nothing.** One worth running twice is a spec; one worth running once is not worth a home. |
| an isolated checkout | **not a scratch class.** Use the repo — WIP=1 already serialises — or a git worktree with its own install. |

**`apps/fed/.scratch/` stays retired** (#193 → #155) and is still not ignored by `.gitignore` or by
`eslint.config.mjs`, deliberately: a write there reddens `npm run lint` immediately instead of
accumulating unseen. The previous instance reached **seven files and ten days** precisely because it
was quiet. Its original constraint still holds and is recorded where it lived — `@playwright/test`
does not resolve from the repo root — which is a reason not to put probes in a scratch at all, rather
than a reason to keep one.

## Single workspace for the public presence
This repo is the **one place** the owner's professional presence is maintained from — the site is one
surface among several (LinkedIn, the GitHub catalog, X, the newsletter). The positioning,
the copy canonically published on each surface, and the playbook that keeps them in sync live in
**`.brand/`**, which is **gitignored and never published** (this repo is public).

Working rules that follow from that:
- **Read `.brand/positioning.md` + `.brand/surfaces.md` before writing any public-facing copy** —
  site content, READMEs, profile bios, CV text. Do not write positioning copy from memory; it drifts.
- **Never publish anything from `.brand/`** — no commits, PRs, issues, or quotes into public surfaces.
- **A positioning change propagates to every surface in one batch**, per the sync playbook, and
  `.brand/surfaces.md` is updated to match what actually shipped.
- **Writes to external public surfaces are ask-first** — show the diff/proposal and get an ok.
- MCP servers for this workflow are registered in **local scope** (`claude mcp add -s local …`),
  never in a committed `.mcp.json`.

## Fixed decisions (do NOT revert without discussion)
- **Static site**, no backend. Content is **markdown in the repo**, prerendered for OG/SEO.
- **fed:** own Tailwind, **no shadcn**; single theme (**brutalist mono**: near-black `#0A0A0A` / off-white
  `#F5F4EF` + one accent, safety orange `#FF5A00`; radius 0, no shadow, no gradient); **no PWA**.
- **CI OIDC roles** pinned to the **immutable OIDC subject**; role ARNs are **environment secrets**, tooling
  tokens are **repository** secrets (see `/workflow/github-actions`).
- **No client/employer references** in public writing.
- **The vocabulary for the practice is fixed, and it lives in `.brand/positioning.md`** — read it before
  writing copy that names the practice (owner decision, #245). The hierarchy, and which term is
  authoritative in which slot, is recorded there with the rest of the positioning and is **not** repeated
  here.

  **`agent-driven` is retired from reader-facing site copy** — the one part of that decision that is a
  repo fact rather than a positioning one. It survives in historical records (an ADR, the redesign comp)
  and those are not rewritten: supersede, never rewrite.

## ⚠️ Destructive / requires explicit confirmation
- **Merge to `main` that touches `iac/`** → the deploy's **`terraform-apply`** job = **real AWS infra**.
  Confirm the `plan`.
- **Publishing an ARTICLE** — the `content` backlog. Boundary because it is the owner's *voice*: what
  the piece argues, in whose words, is not a thing an agent supplies. This is the one content class
  that still routes to the owner, and the label is the boundary (owner decision, 2026-07-30).

  **Everything in the `product` backlog is safe class, including what a reader sees.** Prose on a
  page, the CV, portfolio copy, UI strings, OG cards, alt text — the reviewer merges them. The owner
  validates the product as a whole and adjusts afterwards; a correction costs a merge and an
  invalidation, and that cost is theirs to accept, which they did.

  **This supersedes the previous rule** — *"if a diff changes words or images a reader or a crawler
  will see, it is boundary"* — which stood from #233 until 2026-07-30. Where the boundary sits changed;
  **how any list in this guide fails did not.** That argument is restated in full inside ADR-0003's
  2026-07-30 amendment rather than left as a pointer, because it governs every enumeration here and
  outlives the rule it was written for. Supersede, never rewrite — including the reasoning.

  **The one residue, stated so it is a known cost rather than an oversight:** OG scrapers (LinkedIn,
  X, WhatsApp) pin the card they first fetch, so a wrong unfurl on an already-shared post is not
  fixed by the next merge — it stays wrong *on that post* and right everywhere after. The owner was
  shown this and accepted it. It is a bounded, per-post cost, not a threat to the site.

  **`product-lead` is still dispatched on reader-facing diffs — by the reviewer's own instructions,
  not by any check.** Nothing mechanical enforces it, and the owner is no longer a second backstop
  behind it, so a lens that is not dispatched now fails silently. Narrowing what reaches the owner does
  not narrow what gets reviewed — that lens catches calques, positioning drift and cross-surface
  contradiction, which is exactly the class the owner is *not* well placed to catch by reading the
  finished page. It advises the reviewer; it no longer wakes the owner.

  It is **one** lens where this used to name three, and the consolidation happened in two steps that are
  worth keeping distinct. `brand-guardian` (what the copy claims) and `editor` (how well it is written)
  merged into `marketing-lead`, which splits truth from craft *internally* and makes truth blocking and
  craft advisory (skills ADR-0002 amendment #7). `marketing-lead` then merged into **`product-lead`**
  (`-skills`#144): what to build and how it is said are one voice, and a persona exists only where
  conflict is wanted. The copy lens is not weaker for the move — it is the same blocking-truth /
  advisory-craft split, held by the lead that already owns positioning.

  The `reader-facing` label on the `product` queue is now an **ordering and lens** signal — which
  reviewers to dispatch — not a gate.
- `terraform apply`/`destroy`; changing DNS / CloudFront / S3 — confirm.
- **IaC is pipeline-only** — `apply`/`destroy` run in CI only. Local is read-only (`fmt`/`validate`/inspection `plan`).

## CI (`.github/workflows/`)
**The full map — diagrams, per-job path filters, and the reasons behind each — lives in
[`.github/workflows/README.md`](./.github/workflows/README.md). Read it before changing a workflow.**
It is kept next to the YAML deliberately: GitHub renders it when you open that directory, which is
where the questions get asked.

**Four workflows, each named after the top-level directory it gates.** Jobs are named after the command
they run; a job running a pipeline is named after the script.

- **`app`** (`apps/**`) — `npm-ci` → `npm-audit` · `eslint` · `tsc` · `vitest` · `build-static` →
  `playwright` · `sonarqube-scan`, behind a terminal **`build-test`** aggregator (that name is fixed by
  branch protection). Dependency audit blocks on high/critical prod advisories (ADR-0021); coverage ≥85%;
  SonarCloud's gate blocks.
- **`iac`** (`iac/**`) — credential-free `checkov` and `terraform-fmt` in parallel, then
  **`terraform-plan`** (init + validate + plan), the **only** job holding an AWS token. The cut is
  credentials, not commands.
- **`github`** (`.github/**`) — **`actionlint`** + shellcheck. Its own file on purpose: living inside
  `app` would mean a syntax error in `app` stops the linter that exists to catch it.
- **`deploy`** (push to `main`, skipping its own `bump:` commits) — `release` (bump + tag + Release) →
  `gate` → `terraform-apply` / `deploy-app` → `e2e` against the live apex. `release` must precede the
  build because `VERSION` is a build input; `terraform-apply` must precede `deploy-app` because the app
  resolves its bucket and distribution from SSM parameters Terraform creates.

**Three filter facts that look like mistakes and are not.** `iac/cloudfront-functions/**` is in **both**
the `app` and `iac` filters — it is JS with behaviour *and* a Terraform diff, and the two gates prove
different things (ADR-0018 amendment). `VERSION` is in the **PR** gate's filter but deliberately
**not** in the deploy gate's: the deploy diffs `<last tag>..HEAD`, and HEAD *is* the bump commit, whose
whole content is that file — including it would make the filter match everything, always. And
`docs/adr/**` is in the **`app`** filter because it is the authored source of a published artifact (the
decision index on `/architecture`); it is **not** in the deploy gate's, and that omission is about
**credentials**, not noise — `deploy`'s gate outputs decide whether an OIDC-credentialed job runs, so
every path added there widens the credential surface. The reasons for all three live in
[`.github/workflows/README.md`](./.github/workflows/README.md); this is the map, that is the territory.

**Every PR workflow runs on every PR and filters inside the job.** A workflow-level `paths:` filter can
never be a required check: on a non-matching PR it never reports and sits pending. Each ends with a
`::notice::` naming which of three cases happened — *nothing matched, so nothing was verified* · *a step
failed, so the rest never ran* · *the gate ran, here is the list*. A check that matched nothing must not
read like one that passed.

**The post-deploy `e2e` is not a gate.** It runs after the publish and cannot revert anything. A red one
means the site is broken and someone has to act.

- **`claude`**: `@claude` on-demand (Claude App). The MR review gate is the dev-loop's `quality-assurance` subagent (in-loop, against the Definition of Done) — the App-based auto-review (`claude-code-review.yml`) was retired as redundant.
