# The loop mode of record

**This file is the RECORD of which named agile method this loop is currently running.** It declares; it
decides nothing. **The CONTRACT — what a mode may vary and what it may never touch — is the
`<!-- loop-mode-contract -->` block in `CLAUDE.md` at the root of this repository**, and where this file
and that block disagree, the block wins and the disagreement is a finding.

**Read this before any pool query. Never infer the mode from what a pool query returns.** That is the
one place in this design where a wrong guess is silent, and the reason is measured below.

**This is the `tedeuxx/tadeumendonca-io` half of `tedeuxx/tadeumendonca-skills#406`.** The sibling record
lives at `docs/loop-mode.md` in that repository. **The two are NOT byte-identical and must not be made
so** — each carries its own repository's measurements, and the figures below were re-derived here rather
than copied. The one thing that must agree between them is the **value**, and that agreement is checked
by nothing but the drain (see *The two repositories* below).

---

## The declaration

Four lines, each at column 0, each a parsing contract read literally — the same positional shape
`invocable:` already uses across this loop's Issues, chosen for the same reason: a declaration a reader
can find with an anchored `grep` rather than by reading prose around it.

loop-mode: kanban
loop-mode-since: 2026-08-29
loop-mode-enum: scrum kanban
loop-mode-repos: tedeuxx/tadeumendonca-skills tedeuxx/tadeumendonca-io

**`loop-mode-enum` is closed at two, and an unrecognised value is refused BY NAME rather than defaulted.**
A mode selects a pool predicate and a ceremony set; a session that cannot resolve the value has no
predicate, and guessing one is strictly worse than stopping — it drains a queue nobody scoped.

---

## Why the date is `2026-08-29`, and why it is NOT the sibling's `2026-08-30`

**It is DERIVED from this repository's own artifact, and it is a lower bound on the switch rather than
the switch itself.** Nothing recorded a mode change, because until this file there was nothing in this
repository to record one in. What is measurable is when this repository's container last carried
anything:

```
gh issue list --repo tedeuxx/tadeumendonca-io --state all --limit 300 \
  --json number,closedAt,milestone \
  --jq '[.[]|select(.milestone!=null)|{n:.number,m:.milestone.title,c:.closedAt}]|sort_by(.c)|last'
# -> {"c":"2026-08-29T21:06:33Z","m":"sprint-01","n":516}
```

**Five issues here have ever carried a milestone, all of them `sprint-01`, all of them closed** — the
same query without `|sort_by(.c)|last` returns a five-element array whose `.m` values are `sprint-01`
five times. So the last item of the last iteration closed on **2026-08-29**, and every item since was
worked with no container, no ranking and no rite.

**The record is back-dated to that day rather than to the day this file lands**, because a record written
as though today were the first day of the mode it names is a false claim on a surface whose whole thesis
is rigor. **What it cannot say is the hour or the intent** — the switch was an omission, not an act, and
an omission has no timestamp.

### The sibling says `2026-08-30`, and that is not a drift to repair

`tedeuxx/tadeumendonca-skills` derives its own `loop-mode-since` from its own last milestoned close
(`#355`, 2026-08-30). **Both numbers are correct and they are answers to a per-REPOSITORY question**:
*when did this tree's container last carry anything*. A mode, however, is a **workspace** property, so
the honest workspace-level lower bound is the **later** of the two — **2026-08-30** — because the
workspace was still running a container on the day this repository had already stopped.

**Stated rather than harmonised, and the choice is deliberate.** Writing `2026-08-30` here would publish
a figure this repository's artifact does not support, which is the copied-measurement defect this whole
slice exists to avoid. Writing `2026-08-29` and saying nothing would leave two dates in two files with no
explanation. **So: this file's date is this repository's derivation; the workspace's is the later of the
two; and anyone computing *how long have we been in `kanban`* at workspace grain takes the maximum.**

**Nothing checks this, and the drain does not trip on it.** `/autonomy on` compares the two records with
`grep -m1 '^loop-mode: '` — **the value line only** — so a `loop-mode-since` disagreement is invisible to
the one reader that exists. That is a residual, not a mitigation.

**The proportion is available from version history over one path, with no ceremony in the chain** —
which is the whole reason the record is a tracked file rather than a field on the container the lighter
mode demotes:

```
git log --follow --format='%ad %h %s' --date=short -- docs/loop-mode.md
```

**The denominator is TIME, never periods.** A period is an iteration, and `kanban` has none; a
proportion denominated in periods inherits exactly the container that is being demoted. Weeks work, and
they are already the denominator the points-per-week rate chose for the same reason.

---

## What each value selects — and the POOL PREDICATE is the operative difference

**Published in full, per mode, rather than as one predicate plus a description of how to edit it.** A
described mutation of a published command is not a published command; that defect cost three corrections
in slice A of `-skills#406`, and two of the three "right" numbers came from different readings of one
sentence. **Each command below is complete and runnable as written, with the output it returned in THIS
repository beside it.**

### `scrum` — the container is a COMMITMENT and is a limb of the predicate

```
gh issue list --repo tedeuxx/tadeumendonca-io --state open --limit 200 --json number,labels,milestone \
  --jq '[.[]|select(.milestone!=null)
          |select((.labels|map(.name)|index("ready"))
                  and ((.labels|map(.name)|index("product")) or (.labels|map(.name)|index("loop"))))
          |.milestone.number]|min'
# -> one EMPTY LINE, EXIT=0        (measured 2026-09-09; `od -c` on the output is `\n` and nothing else)
```

That is the **active-iteration derivation**, unchanged, and the pool is the eligible items carrying the
milestone it returns. Ordering is the ordered body composed at planning; exhausting the drain's entry
snapshot is the terminal condition and hands off to the closing rites.

**The output is an empty line, not an empty stream, and the distinction is worth one sentence** because
the whole hazard here is a silent result: `jq`'s `min` over `[]` returns `null`, and `--jq` with `-r`
renders `null` as a bare newline. **A reader who takes it for "no output" is reading it correctly for the
purpose that matters — nothing usable came back — and would be wrong about the bytes.** The sibling
record states this case as *"(no output)"*; that is a colloquial reading of the same measurement, not a
different one.

### `kanban` — the container is a LABEL and is NOT a limb of the predicate

```
gh issue list --repo tedeuxx/tadeumendonca-io --state open --limit 300 --json number,labels \
  --jq '[.[]|{n:.number,l:[.labels[].name]}
          |select(.l|index("ready"))
          |select((.l|index("loop")) or (.l|index("product")))
          |{n,t:(if (.l|index("loop")) then "loop" else "product" end)}]
        |sort_by(.t=="product",.n)|map("\(.t) #\(.n)")|join(" | ")'
# -> product #580 | product #597 | product #611          (measured 2026-09-09, EXIT=0)
```

Ordering is **FIFO within the `loop`/`product` partition** — `loop` in arrival order, then `product` in
arrival order — which is the owner's ruling that loop-first survives in both modes, plus the
filing-order tiebreak `commands/sprint-planning.md` already defines and labels as arrival order rather
than a ranking. **Nothing ranks and nothing estimates the order.** Exhausting the snapshot ends the
drain and **fires no rite**: in `kanban` an empty container means nothing at all, and a ceremony fired on
it would be firing on noise.

**No OPEN item here carries `loop` today, so the partition's first half is empty in that output and all
three results are `product`.** That is a fact about contents on a date and not a property of the rule:

```
gh issue list --repo tedeuxx/tadeumendonca-io --state all --label loop --limit 200 \
  --json number,state --jq '{ever:length, open:[.[]|select(.state=="OPEN")]|length}'
# -> {"ever":3,"open":0}      (#614, #615, #618 — all filed and closed 2026-09-07)
```

**And it corrects a claim that is live in the universal preload.** `/agents-configuration`, under *More
than one batch per iteration is NORMAL*, publishes that same command and states *"the product repo has
**never** carried a `loop` item — … → **0**"*. **It returns 3 at head.** The conclusion that paragraph
draws is unaffected — it was arguing that a `loop`-typed change to this repository belongs here, and
three of them now have — but the number beside it is false and the correction is owed in that file, not
in this one.

### The mode becoming operative, in one tracker state

**One tracker state, read under two modes, gives an empty pool and a three-item pool.** The `scrum`
derivation returns nothing usable — indistinguishable from a drained iteration, which is
`/agents-configuration` rule 1's own named failure arriving by default rather than by a typo. **A session
that inferred its mode from that result would report a healthy queue over a dark one, with every check
green.**

**And the `ready` limb does not vary.** Owner ruling 2026-09-09: *«Mantém o `sp:N` nos dois modos»* — the
readiness bar is identical in both modes, so `ready` asserts the same thing on both sides of this
section and `/definition-of-ready` needs no per-mode branch.

**Two facts about that measurement, both of which are about the QUEUE rather than about this file, and
neither repaired here.** Zero open items carry a milestone, which is why the `scrum` pool is empty. And
this repository carries **16** `ready` items of which only **3** carry a routing type label, so thirteen
`ready` items are outside both predicates:

```
gh issue list --repo tedeuxx/tadeumendonca-io --state open --limit 300 --json number,labels,milestone \
  --jq '{open:length, ready:[.[]|select(.labels|map(.name)|index("ready"))]|length,
         ready_typed:[.[]|select((.labels|map(.name)|index("ready"))
             and ((.labels|map(.name)|index("product")) or (.labels|map(.name)|index("loop"))))]|length,
         milestoned:[.[]|select(.milestone!=null)]|length,
         sp:[.[]|select(.labels|map(.name)|map(startswith("sp:"))|any)]|length}'
# -> {"milestoned":0,"open":45,"ready":16,"ready_typed":3,"sp":0}
```

**Both zero columns are calibrated rather than trusted** — a selector that cannot go non-zero is not a
check. The same two selectors over `--state all`, published whole rather than as an edit to the command
above:

```
gh issue list --repo tedeuxx/tadeumendonca-io --state all --limit 500 --json number,labels,milestone \
  --jq '{all:length, milestoned:[.[]|select(.milestone!=null)]|length,
         sp:[.[]|select(.labels|map(.name)|map(startswith("sp:"))|any)]|length}'
# -> {"all":240,"milestoned":5,"sp":6}
```

So neither zero is a dead pattern: both selectors return non-zero on this repository's closed history.

---

## What READS this file — one thing, and it is not a mechanism

**The plugin's `/autonomy` command reads it at entry, before the pool query, and selects the predicate
and the terminal behaviour from it** (`commands/autonomy.md` in `tedeuxx/tadeumendonca-skills`, *FIRST:
read the LOOP MODE from its record*). That is a rule the session executes, in the file the loop executes.
It is a real reader and it is not a mechanism, and both halves of that sentence matter.

**That command reads this file by a repo-relative path and instructs the drain to run its read in BOTH
repositories** — which is why this file existing here is not decoration: until it landed, a drain obeying
that instruction found no value in this tree and was instructed to refuse by name.

**Nothing mechanical reads it, and this is the `tedeuxx/tadeumendonca-io`-TRUE command that says so.**
The contract block above publishes two commands over `hooks/hooks.json`; **that file does not exist in
this repository**, so those commands measure nothing here — see *The contract's untouchable list is a
measurement about the PLUGIN* below. The form that has a subject in this tree:

```
ls -d hooks
# -> ls: hooks: No such file or directory

git grep -lE 'loop-mode' -- .github scripts apps/fed/scripts .claude
# -> no output, EXIT=1
```

**Calibrated, because a selector that cannot go non-zero is not a check** — the same selector over the
same paths, against a generated artifact those paths genuinely do resolve:

```
git grep -lE 'harness\.json|check-harness-drift' -- .github scripts apps/fed/scripts .claude
# -> 9 files, EXIT=0   (.github/workflows/{README.md,app.yml,deploy.yml} and six apps/fed/scripts/*.mjs)
```

**That absence is DELIBERATE and is a property to preserve rather than a gap to close.** The contract's
untouchable list is backed by a measurement that no registered hook reads any object a mode varies; the
moment a hook — or a workflow, or a `.mjs` gate in this repository — is taught to read this file, that
measurement needs re-scoping and the enforcement layer stops being mode-blind by construction. **If a
later slice needs a mechanism to know the mode, that review happens before it is written, not after.**

**No gate asserts this file exists, parses, or agrees with the contract**, in either repository. A drift
arm would be cheap and is deliberately not added here: this slice is the `-io` sibling of an enum and its
carrier, and a check is its own decision with its own calibration.

---

## The contract's untouchable list is a measurement about the PLUGIN, not about this repository

**The `<!-- loop-mode-contract -->` block in `CLAUDE.md` is shared byte-for-byte with the sibling
repository, and it publishes three commands that read `hooks/hooks.json`. There is no `hooks/` directory
in this repository at all.** Measured here, 2026-09-09:

```
jq -r '.hooks|to_entries[]|.value[]|.hooks[]|.command' hooks/hooks.json \
  | sed 's|.*/hooks/scripts/|hooks/scripts/|; s|"$||' | sort -u \
  | xargs grep -nE -- '--milestone|--label|--json [^|"]*(milestone|labels)' \
  | grep -vE ':[0-9]+:[[:space:]]*#'
# stdout: nothing.  stderr: jq: error: Could not open file hooks/hooks.json.  EXIT=1
```

**Run in `tedeuxx/tadeumendonca-skills` the same command also produces no stdout and exits 1 — and there
it means the opposite.** There it means *fourteen hook registrations were scanned and none of them
selects a milestone or a label*; here it means *nothing was scanned*. **The two cases are identical on
stdout and identical on exit code**, which is this repository's own named worst failure shape: a
falsifier that fails open reads to whoever runs it as *nothing to worry about*.

**The claim the block makes is nonetheless TRUE in this repository, and the reason is that its subject is
the plugin rather than the containing repo.** The enforcement layer governing a session rooted here is
`tedeuxx/tadeumendonca-skills`'s `hooks/`, installed through `.claude/settings.json` and running against
this tree — the same fourteen registrations, the same twenty-five vocabulary matches, all of them comments
or deny strings. Re-derived at that repository's head on 2026-09-09, from this repository's session:

```
# run with the -skills checkout as cwd:
jq -r '.hooks|to_entries[]|.value[]|.hooks[]|.command' hooks/hooks.json | wc -l          # -> 14
jq -r '.hooks|to_entries[]|.value[]|.hooks[]|.command' hooks/hooks.json \
  | sed 's|.*/hooks/scripts/|hooks/scripts/|; s|"$||' | sort -u \
  | xargs grep -hcE 'milestone|iteration|sprint' | paste -sd+ - | bc                     # -> 25
```

**And the three commands are the sharp case of a wider one: EVERY repo-relative path in that shared block
names the PLUGIN's tree, not this one.** Checked one by one, 2026-09-09: `hooks/scripts/permission-guard.sh`,
`agents/quality-assurance.md`, `commands/autonomy.md` and `docs/prompts/loop-mode-contract.md` all resolve
in `tedeuxx/tadeumendonca-skills` and **none of the four resolves here**; the single exception is
`docs/loop-mode.md`, which is this file and resolves in both. **Nothing in this repository
asserts that a path named in `CLAUDE.md` resolves** — the only reader of this file is
`check-harness-drift.mjs`, and it reads strictly between the `<!-- roster:dispatch -->` markers
(`rosterDispatchNames`) — so the mismatch is silent here and would be silent anywhere.

**So the block is not corrected here, and the reason is a rule rather than deference.** The block is one
artifact shared by two repositories; editing one copy to make its falsifier resolve locally would break
the byte-identity that is the only instrument either copy has. **The fix is a two-repository edit —
qualify the plugin-relative paths and re-scope the three commands to name the plugin tree explicitly
rather than resolving them against whatever `cwd` happens to be — and it is its own slice, in both
repositories, not a unilateral edit here.** Recorded rather than absorbed.

---

## The two repositories, and the residual this inherits

**A mode is a WORKSPACE property and this file is a REPOSITORY object.** `loop-mode-repos` above names
both trees because the mode is one fact about one development effort — the owner, 2026-08-29: *«nao
existe separacao no desenvolvimento do skills e do io»* — and there is no object in either tracker or
either tree that spans them.

**So this is the second hand-maintained two-repository artifact `-skills#406` produces**, after the
contract block itself, and it carries the same residual in a sharper form: set one repository's value to
`scrum` and the other's to `kanban` and **each repository's session reports a coherent, healthy mode**.
The failure presents as everything being fine. Same class as the `sprint-01`/`sprint-1` pairing residual,
one layer up.

**No cheap mitigation from a hook**, and the reason is structural rather than budgetary: a hook receives
one `cwd`, so it would have to discover the sibling tree first — the plugin's own controls record calls
sibling-tree discovery *"a heuristic and the weakest part"* — in order to compare a string. **A detector
that must guess where the other copy is in order to check the other copy is assuming what it checks.**

**The number is deliberately not written.** The sibling record cites it as `ADR-0004` because its library
is the METHODOLOGY one; **this repository's `docs/adr/` is the PRODUCT library, where `0004` is a
different record entirely** (`0004-build-time-render-not-ssr-or-edge.md`). A bare `ADR-0004` here would
pass this repository's dangling-citation gate — the number resolves — while pointing at the wrong
document, which is worse than a citation that fails. **Quote the clause, name the library, skip the
number** is the general form.

**The affordable form, and it is the drain's rather than a hook's:** `/autonomy on` already reads both
trees, so it compares the two records at entry and stops on a disagreement. **Price of what remains:**
every context that is *not* the drain — a rite, an ad-hoc session, a dispatched persona — sees one
repository's record and has no way to know the other disagrees. **And the comparison is on the value line
only**, so `loop-mode-since`, `loop-mode-enum` and `loop-mode-repos` can each disagree between the two
copies with nothing observing it.

---

## A naming collision, stated because it is the first thing a reader trips on

**`/autonomy` has `on` and `off`, and calls them MODES. Those are not loop modes and the two enums must
not be conflated.** `on|off` is *who holds the wheel for this session*; `scrum|kanban` is *how work
flows*, and it persists across sessions in this tracked file. A session can be `off` in either loop mode
and `on` in either. **Nothing anywhere records whether autonomy is on** — that command says so in its own
words — while the loop mode is recorded here, which is the whole difference between the two.

---

## What changing the value actually changes today — the honest answer

**The pool predicate, and effectively nothing else.** The three rites have never fired in either mode:
their only trigger is a drain reaching exhaustion of its entry snapshot, which is an instruction rather
than a mechanism, and no layer here observes a snapshot going empty. So *"`kanban` does not run the
rites"* costs nothing that was being collected, which is the honest comparison — **clock versus nothing,
never clock versus boundary** — and it is why the cadence carrier the owner authorised (`-skills#406`
slice C) is worth building rather than merely worth naming. **That carrier is not built, and nothing in
this slice builds one.**

**What it does change is measured above and is not small:** under `scrum` this repository's pool is empty
at head, and under `kanban` it is three items. **A mode nobody had recorded was already selecting which
of those two answers the loop got, in this tree as much as in the other one.**
