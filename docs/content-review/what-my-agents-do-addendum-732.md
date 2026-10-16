# Content review — the dated addendum to `what-my-agents-do` (#732)

The review record for the correction and the dated addendum that #732 adds to the published article
`what-my-agents-do`, in both editions. The original review record for the article is
`docs/content-review/what-my-agents-do.md`, and this slice does not touch it (AC 10).

The ruler is the `published-voice` skill. The sources are the owner's interview answers Q1 to Q6 on
#732, the repository at the branch base `b5c88ef`, and the publication commit `3389dbb`.

## Provenance — one row per addendum sentence (AC 10)

The reviewer checked every row against its source. Rows 1 to 20 are the English edition. The Portuguese
edition says the same thing sentence for sentence. "Q1" to "Q6" are the owner's interview comments on
#732. Paths are relative to the repository root at `b5c88ef`. Row 10 shows the wording after the round 1
repair.

| # | sentence (EN) | source |
|---|---|---|
| H | Addendum — 15 October 2026 | the drafting date; AC 4 requires a dated heading. See the ruling on the writer's flag 2 below |
| 1 | This piece is a record of the loop as it stood when I published it, on 18 September 2026, and it stays one. | Q1 "um registro de quando publiquei"; the front matter of both editions, `date: '2026-09-18T12:00:00.000Z'` |
| 2 | The drawing above is that loop. | connective: it restates the article's own claim at `3389dbb` (EN L157, PT L161) |
| 3 | Since then, part of what it says has stopped being true, and one sentence in it was already wrong on the day it went out. | AC 1 ("That was false on the day of publication") and AC 4a; the items are rows 4 to 14 |
| 4 | The correction first. The drawing's description said content-reviewer blocks a draft rather than a merge. | `git show 3389dbb:apps/fed/src/content/blog/what-my-agents-do.en.md`, L27: "what it blocks is a draft rather than a merge" |
| 5 | Not even then: it blocks nothing, it repairs the draft in place. That sentence is now fixed in the drawing above, and nothing else in it was touched. | AC 1. The wording is `apps/fed/src/content/architecture.en.md` L132: "it blocks nothing: it repairs the draft in place". The repair mode was ruled on 2026-09-03, before publication on 2026-09-18 (`content-publishing`, step 5). For "nothing else touched": `git diff 3389dbb -- <both editions>` changes one line inside the fence, the `accDescr` line |
| 6 | What changed since: | connective |
| 7 | **`ready` on a loop issue.** The drawing says that label is mine alone to apply. | `3389dbb`, L27 and L39: "mine alone to apply" |
| 8 | Today applying it is my decision, which the main session carries out once we are aligned. | `architecture.en.md` L132, verbatim; `AGENTS.md` standing rule 21 |
| 9 | **The orchestrator.** The drawing has it committing and pushing. | `3389dbb`, L41: "dispatches every persona, commits, pushes" |
| 10 | Today a written rule has it only dispatch and never edit a file in the repository, and nothing refuses it the edit. | `AGENTS.md` standing rule 21: "only dispatches and never edits a repository file" (a rule). `architecture.en.md` L146, the ORCH box: "dispatches every persona … the repository edit: nothing refuses it". **Repaired in round 1** |
| 11 | **The merge and the trunk push.** The drawing says a hook refuses the orchestrator both. | `3389dbb`, L41: "a hook refuses it the merge and the trunk push" |
| 12 | Today no hook refuses anything in this repository: the merge is held by a written rule, and a push straight to the trunk is refused by a deny rule committed in this repository, which matches the command by its spelling. | `architecture.en.md` L127: "In this repository no hook refuses anything. The merge is held by a written rule." `.claude/settings.json` `permissions.deny` holds `Bash(git push origin main)`, `Bash(git push origin main:*)` and `Bash(git push origin HEAD:main:*)`. The ORCH box at L146 says "a trunk push: a deny rule, by its spelling". No git hook manager is configured in the repository (no `.husky`, no `lefthook`) |
| 13 | **Where the method lives.** Near the end I wrote that mine travels as a plugin, in the other repository. | the article's own EN L159 / PT L163, unchanged |
| 14 | The `tadeumendonca-skills` plugin is disabled in this repository, and the method that runs here comes from the workstation at user level. Its agents, skills and commands are installed by tedeuxx/mhw. The plugin is still published, but it is deprecated as a source, and its README points to `tedeuxx/mhw`. | `architecture.en.md` L127, verbatim; `.claude/settings.json` and `apps/fed/.claude/settings.json` both set `tadeumendonca-skills@tadeumendonca` to `false` |
| 15 | The current drawing is on the architecture page. | AC 4a |
| 16 | Now the why. | connective; Q2 "o que mudou. e pq" |
| 17 | For me, as a software engineer, these are not capabilities of a project. They are capabilities of how I work. | Q3 "para mim (swe), nao sao capacidades de projeto, sao capacidades como eu trabalho", with his own correction "*capacidades" |
| 18 | Each person works differently — unless the organisation imposes a way of working on us. | Q4 "pq cada pessoa trabalha diferente" and "a nao ser que a organizacao nos obrigue uma forma de trablho" |
| 19 | That is why I needed to rehearse the organisations' way of working with myself. | Q4 "por isso precisava ensaiar a forma das organizacoes comigo msm" |
| 20 | And another point: perimeter defence. My workstation must set the rules of the game. The projects only follow. | Q5, verbatim in translation |

**Outside the addendum, the AC 3 sentence** (EN L157, PT L161): "it was the one that sat on the
architecture page when I published this. The loop has changed since; the dated addendum at the end of
this piece says what changed, and the architecture page carries the current drawing." Its source is
AC 3 and Q1.

**Social drafts** (`docs/social/what-my-agents-do-addendum.md`). The opening line and the "Why"
paragraph are rows 17 to 20; Q6 "total" puts them on the social surfaces. The September piece's
description comes from the article's front matter (its title and date). The method paragraph comes from
rows 13 and 14. The closing question to the reader makes no claim.

## Round 1 — 2026-10-15
draft: `apps/fed/src/content/blog/what-my-agents-do.en.md`, `apps/fed/src/content/blog/what-my-agents-do.pt.md`, `docs/social/what-my-agents-do-addendum.md` @ 34f3f00

### Repaired — ground 2, false against the source
1. **The orchestrator bullet stated a rule as observed behaviour.** Source: `AGENTS.md` standing rule
   21 states "only dispatches and never edits a repository file" as a rule. The current drawing's ORCH
   box (`architecture.en.md` L146) says "the repository edit: nothing refuses it", and the published
   drawing said the same. The sources never say the orchestrator does not edit. They say a rule forbids
   it and nothing stops it.
   - The draft claimed: "Today it only dispatches, and it never edits a file in the repository." /
     "Hoje ele só aciona as personas, e nunca edita um arquivo do repositório."
   - It now claims: "Today a written rule has it only dispatch and never edit a file in the
     repository, and nothing refuses it the edit." / "Hoje uma regra escrita diz que ele só aciona as
     personas e nunca edita um arquivo do repositório, e nada o impede de editar."
   - This matches how the next bullet already words the merge ("held by a written rule").
2. **The social digest named one change as the only one.** Source: the addendum's own list of four
   changes (rows 7 to 14).
   - The draft claimed: "What moved is where the method lives." / "O que mudou foi onde o método
     mora."
   - It now claims: "One thing that moved is where the method lives." / "Uma das coisas que mudaram
     foi onde o método mora."
   - I re-measured the character counts with the file's own command after this edit and updated them
     in the file: `linkedin whole 2102 | blocks 986 1107`, `x raw 286 | x weighted 262`.

### Checked and clear — stated so a clear check is not read as unrun
- **AC 4b.** Every reflection sentence (rows 17 to 20) traces to Q3, Q4 or Q5. It adds nothing he did
  not say, and it draws no link between Q4 and Q5 that he did not draw.
- **AC 4c.** The addendum is in the first person, about his own practice. It prescribes nothing.
  Row 18's general clause is his own sentence.
- **AC 9.** It names no employer and no client: "the organisation" is generic. It does not explain the
  layered configuration of #695. Row 20 states his principle and describes no layers. It claims nothing
  about the workstation beyond what the linked repository and the architecture page state.
- **AC 6.** The addendum publishes no number apart from two dates.
- **Rule 11.** The article now has six headings, which is still within "at most 6 sections".
- **Rule 19.** The LinkedIn post leads in English, its first line is "🇧🇷 Versão em português abaixo.",
  and the trailing block carries its own one-line 🇧🇷 marker.
- **Rule 21.** The precondition still holds, re-run 2026-10-15:
  `curl -s https://tadeumendonca.io/blog/what-my-agents-do | grep -oE 'rel="canonical" href="[^"]*"'`
  returns the article itself. The control, `/blog/zzz-not-a-page`, returns `https://tadeumendonca.io/en`.
- **The character counts carry their command** in the social file.
- **Locale parity.** `npm --prefix apps/fed exec -- vitest run --root apps/fed src/content` passes 61
  tests in 7 files, including the addendum's 12, after the repairs.

### Rulings on the writer's three flags
1. **AC 5's OG check. Yes, the PR states both readings.** The literal
   `git diff 3389dbb -- apps/fed/public/og/` is not empty: it lists only
   `ai-answers-in-seconds-you-dont-have-to.{en,pt}.png`, which another article added after `3389dbb`.
   Two other commands show what AC 5 protects:
   - this article's own cards are unchanged since publication:
     `git diff --stat 3389dbb -- 'apps/fed/public/og/what-my-agents-do*' 'apps/fed/public/og/o-que-os-meus-agentes-fazem*'`
     is empty;
   - the branch regenerates no card: `git diff --stat b5c88ef -- apps/fed/public/og/` is empty.

   Give all three commands in the PR, so the gate does not read the literal command as a failed
   criterion.
2. **The addendum date (advisory; no clause of the ruler governs it).** The heading should carry the
   day the addendum goes live, because merging is deploying here and the article's own date is its
   publication date. If the merge lands after 15 October, the builder moves the date in all four places
   **before the gate's final read**, so that the gate's verdict covers the head that carries the date.
3. **UTM (outside my ruler; this is a `content-publishing` step-10 mechanic).** Keep the draft
   untagged. Decide at posting time, and only after the tagged form is confirmed to unfurl with the
   right card. The tagged address stays locale-neutral, so rule 21 holds either way.

### Advisory and droppable
- **Rule 17.** The signature now sits above the addendum instead of on the last line. AC 4 places the
  addendum after the signature, and rule 17 tells a reviewer that is unsure what counts as a *themed*
  article to ask rather than assume. So this is a question for the owner, not an edit: should the
  addendum end with its own "This is what I think." / "Isso é o que eu penso."?
- **Row 17 / the social opening line.** "these are not capabilities of a project" has no noun in front
  of it for "these" to refer to. In the addendum it reads as the changes listed above it. As the
  opening line of a post, it has nothing to refer to at all.
- **The social method paragraph.** It joins Q5's "the projects only follow" to the install fact. That
  is a fair reading of his answer, but it is a link the addendum itself does not draw.

### What no one checks on this lane
No world-check runs on the content lane. Cross-surface staleness, evidence proximity, the machine/ATS
read and durability reach the owner without anyone reading them first. A clear check above is not a
fact-check against the world.

**Terminal.** The pair stops at this round. I repaired my own findings, and nobody else changed the
draft since. That is a judgement, not the mechanical cap of two rounds. A round 2 is owed only if
another hand changes the draft. The next act is the held preview, not prose handed to the owner.

CONTENT-REVIEW-FINDINGS

## Round 2 — 2026-10-15
draft: `apps/fed/src/content/blog/what-my-agents-do.en.md`, `apps/fed/src/content/blog/what-my-agents-do.pt.md`, `docs/social/what-my-agents-do-addendum.md` @ 2a3afd27001909914ed15a662a826c426b874432

A fresh reviewer read this round. No other hand changed the draft after round 1:
`git diff --stat 93be5b8 2a3afd2 -- apps/fed/src/content/blog docs/social` is empty. The orchestrator
opened this round because AC 10 requires the file to end on `CONTENT-REVIEW-CLEAR` or after a second
round. This round re-read the whole addendum, the erratum, the EN L157 / PT L161 sentence and the social
drafts. It did not read only round 1's repairs.

### Round 1's repairs, re-read
- **The orchestrator bullet** holds against its sources. `AGENTS.md` standing rule 21 states the rule.
  The ORCH box in `architecture.en.md` says "the repository edit: nothing refuses it". The PT wording
  says the same thing.
- **"One thing that moved"** holds. The addendum lists four changes, and the social post names one of
  them without calling it the only one.

### Checked and clear — a fresh read against the sources
- **Each "the drawing says" clause matches the published drawing.** `git show 3389dbb:<edition>` shows
  the RQ label ("mine alone to apply" / "só eu ponho") at L39. It shows the ORCH box ("commits, pushes",
  "a hook refuses it the merge and the trunk push") at L41. Both editions match.
- **"Already wrong on the day it went out" names only one sentence, and that is still true against the
  repository.** The orchestrator's dispatch-only rule entered the brief after publication:
  `git log --format='%h %ad' --date=short -S 'only dispatches' -- AGENTS.md CLAUDE.md` returns only
  `7a45ddd 2026-10-11`. The brief at `3389dbb` has no such rule. So the "commits, pushes" clause was true
  on the day of publication. The `ready` change came later too (the ruling of 2026-09-25).
- **The trunk push.** `.claude/settings.json` `permissions.deny` holds `Bash(git push origin main)`,
  `Bash(git push origin main:*)` and `Bash(git push origin HEAD:main:*)`. Both settings files set
  `tadeumendonca-skills@tadeumendonca` to `false`. `architecture.en.md` L127 says "In this repository no
  hook refuses anything. The merge is held by a written rule."
- **The erratum.** Inside the fence, only the `accDescr` line differs from `3389dbb` in each edition.
- **Rows 17 to 20** trace to Q3, Q4 and Q5 in both editions. The PT reflection is close to his own words.
- **Rules 19 and 20** hold for the social drafts. The post leads in English. It opens with
  "🇧🇷 Versão em português abaixo." and the trailing block has its own 🇧🇷 marker. The blocks are
  986 and 1107 characters, well below the ceiling.

No edit was made in this round, so the provenance table above is still accurate.

### Advisory and droppable
- **Round 1's open question about the signature.** I agree that it is still open, and it is the owner's
  call. AC 4 puts the addendum after the signature. Rule 17 tells a reviewer to raise the question about
  what counts as *themed* rather than assume either way. So this round makes no edit and states no
  preference.
- **The referent of "these"** (row 17, and the opening line of both social posts). I agree with round 1
  that this is advisory. The sentence is his, nearly verbatim from Q3, and no ruler clause makes it a
  repair ground.
- **The social post says "installed from my workstation".** The source says the method comes from the
  workstation and is installed there by `tedeuxx/mhw`. The post's phrasing compresses that but is not
  false, so it is left as it is.

### What no one checks on this lane
This is unchanged from round 1. No world-check runs on the content lane, and a clear round is not a
fact-check against the world.

**Terminal.** This round made no repair and cut nothing. The pair ends on this literal, and the cap of two
rounds is reached in any case. The next act is the held preview.

CONTENT-REVIEW-CLEAR
