# Content review: build-your-first-ai-app

Issue #712. Both editions:
`apps/fed/src/content/blog/build-your-first-ai-app.en.md` and
`apps/fed/src/content/blog/build-your-first-ai-app.pt.md`
(renamed from `your-agent-says-the-numbers-add-up.*` on 2026-10-24; the `draft:` lines below
name the path as it was at their pinned commit).

## Round 1 — 2026-10-19
draft: apps/fed/src/content/blog/your-agent-says-the-numbers-add-up.{en,pt}.md @ 3b6dbc9c2a5cd4fbe88dc40b4bc6dbbe68c036dc

Ruler: `published-voice`. Source: the Issue body (the owner's sanitised prompt and his three verbatim
lines) and its comments, the published `three-agent-loops-one-month` piece, and the workstation brief
for the restart guard's removal.

### Repaired — ground 1, a quoted clause

1. **The opening invents two facts about the wrong quote.** Clause: "if you cannot point to where in
   the source material (an ADR, an `AGENTS.md` passage, a transcript, a prior published piece, an
   explicit answer he gave) a claim, a number or a stance comes from, it does not go in the draft as
   his. Cut it, flag it as a question back to him"
   - The draft said: "The call returned a price, a perfectly plausible one, for an asset I do not
     track." The PT edition said the same.
   - It now says: "The call returned a price." / "A chamada devolveu um preço."
   - Why this is the smallest change: the source says only that the first quote after launch returned
     the wrong symbol. Nothing in it says the price was plausible or that the asset is one he does not
     track. The sourced half of the sentence stays.
   - What would bring the clause back: his answer on whether the returned price looked plausible and
     whether the symbol was one he holds.
2. **A mechanism sentence admits the opposite reading.** Clause: "**13. Write the opposite-meaning
   paraphrase of the sentence using the same words. If one can be built, the sentence is ambiguous**"
   - The draft said: "The wrong symbol from the top of this piece runs across all four layers."
   - One reading is that the wrong symbol passed through all four gates. The other is that the habit
     the retry shows underlies all four. The quote check happens at step 3, before any of the four
     layers, so the first reading is false.
   - It now says: "The habit behind the wrong symbol at the top of this piece runs through all four
     layers." / "O hábito por trás do símbolo errado lá do começo atravessa as quatro camadas."

### Repaired — ground 2, false against the source

1. **The human-in-the-loop takeaway contradicts the source and the body.** Source: the prompt says
   "Unexplained fixed-income drops are flagged for confirmation. After the first run this was relaxed
   for the cash product". His own line in the Issue is «This is a good example of tuning the
   human-in-the-loop policy to real behavior instead of guessing it upfront.»
   - So the rule existed before the first run and was tuned after it. The body says this too ("one
     rule I wrote before the first run and had to change").
   - The draft claimed, in the takeaway block: "write the human-in-the-loop rule after a real run, not
     before one." In the frontmatter `takeaway` it said "why the human-in-the-loop rule is written
     after a run, not before."
   - It now claims, in the block: "tune the human-in-the-loop rule to a real run instead of guessing it
     upfront." PT: "ajuste a regra de human-in-the-loop a uma execução de verdade, em vez de chutar ela
     de antemão."
   - In the frontmatter it now says: "why the human-in-the-loop rule gets tuned to a real run instead
     of guessed upfront." PT: "por que a regra de human-in-the-loop se ajusta a uma execução de verdade
     em vez de ser chutada de antemão."
   - The replacement wording is his own sentence.
2. **Two figure descriptions state the wrong direction.** Source: each fence declares
   `flowchart TB`. The rendered SVG in `apps/fed/src/content/generated/diagrams.json` confirms it:
   figure 1's clusters sit at y = 8, 225 and 574, and figure 3 runs from its inputs node at y = 38 to
   publish at y = 814.
   - Figure 1's `accDescr` said "Three zones from left to right". It now says "Three zones from top to
     bottom". PT: "Três zonas, de cima para baixo".
   - Figure 3's `accDescr` said "A left-to-right pipeline". It now says "A top-to-bottom pipeline". PT:
     "Um pipeline de cima para baixo".
   - `diagrams.json` was regenerated with `npm run gen-diagrams`. Only the four edited fences changed.

### Advisory and droppable
- The title says "Make **it** prove it twice", while the body's second proof comes from the validator
  script, "something that is not the agent". "It" can be read as the agent's run, which includes the
  script, so the title stands.
- The title promises two proofs, but the closing act ("recompute it with something that is not the
  agent") asks for one. Adding "then run it against a number you already know" would cover the
  second, at the cost of rule 14's one-act close.
- The reader question "did you write them before it ever ran, or after?" still leans toward "after",
  while the repaired takeaway says "tune". It is a question, not a claim, so it stays.
- "that account moves money in and out every month by design": the source says "outflows between
  paychecks are normal for him". "By design" is a gloss.
- The PT prose runs at 1,363 words, above the 900–1,300 band and under the 1,500 target. EN runs at
  1,290. Both counts exclude the Mermaid fences.

### The writer's report, checked against the files rather than inherited
- **Length:** EN at 1,290 and PT at 1,363 prose words, counted with the fences excluded. This holds.
- **Sections:** six `##` headings in each edition (rule 11). This holds.
- **Reproducibility:** no mechanism is given in enough detail to rebuild it (rule 9), and no code or
  snippet is invented. Both hold.
- **Figures:** there are three Mermaid figures per edition, and figure 3 (the mockup) is dropped.
  The Issue's figure 2 was a sequence diagram; the draft renders it as an eight-step flowchart that
  merges the Issue's steps 8 and 9. This holds.
- **Source gaps, all three confirmed as open and none invented:**
  - The October run says only "did not execute" and "ran by hand, from a handoff note", which is the
    source's wording. It has no date and no cause.
  - The restart guard says "at the time" and "has since been removed". It has no date. That is past
    tense, not a dated fact, so intake blocking item 2 is half met.
  - The scale claim says "one writer, one row a month". The monthly row is derived from the
    append-only history and the monthly schedule. "One writer" is a fair reading of the source.

### Checks the brief named
- **Spine surfaces (rule 15):** the title, excerpt and `takeaway` name the same article as the body,
  and every concept in the three fields appears in the body. The only mismatch was the takeaway's
  human-in-the-loop clause, which is repaired above.
- **Title gate and experiment:** neither sentence of the title has the author as its subject, and the
  title gives the reader something to try. The body's act is to recompute one number with something
  that is not the agent (rule 14). See the advisory note on "twice".
- **Takeaways (rule 16):** they are explicit and set in a blockquote. Read alone, they still say
  something.
- **Signature (rule 17):** both editions have it. EN "This is what I think." and PT "Isso é o que eu
  penso." come last, after the warm sign-off.
- **Quotations (rule 18):** there is no verbatim external quotation, so the rule does not fire. The
  owner's own lines ("Scheduling is not the same as reliability.", the tuning sentence) appear as his
  prose in his own piece. The link to `three-agent-loops-one-month` matches that piece's bolded line
  in both editions.
- **Audience (rule 23):** the PT address uses "toda pessoa que roda agentes" and "você", with no
  masculine default.
- **Firewall:** the drafts contain no balance, total, quantity, cost, account name, institution count,
  employer-account count or allocation. No client is named. Nothing in them comes from the private
  directory.

### What this round does not cover
No world-check runs on this lane. Cross-surface staleness, evidence proximity, the machine/ATS read
and durability all go to the owner unread. The vendor-terms exposure of naming TradingView over CDP is
the owner's accepted and unverified risk (2026-10-10). Nobody has re-read the repairs above. They are
listed here so the gate and the held preview can find them.

**The pair stops after this round.** The ordinary case applies: the reviewer repaired its own
findings, and no other hand has changed the draft, so no round 2 is owed. The two-round cap is not
the reason. The next step is the held preview.

CONTENT-REVIEW-FINDINGS

## Round 2 — 2026-10-24
draft: apps/fed/src/content/blog/your-agent-says-the-numbers-add-up.{en,pt}.md @ 5bcff0f2231c0f6f53e6833042a73a267cc3b8d3

Why this round exists: another hand changed the draft after round 1. Commit 9840be8 applied the
owner's new title, and commit 5bcff0f rewrote line 95 in both editions so it no longer cites the old
title. The owner chose the title himself (#712, 2026-10-24, option B), so this round does not edit it.
Scope is the diff from `origin/main` plus the parts of the piece the new title now depends on.

The owner's rule for the title, quoted on #712: «precisa deixar bem claro no titulo o produto que o
leitor ganha».

### Repaired — ground 1, a quoted clause
1. **The frontmatter `takeaway` lists three checks under a title that promises four.** Clause:
   "**15. Title, `excerpt` and `takeaway` name the same article the body delivers.**"
   - The body delivers four layers: the source checks itself, something that is not the agent adds it
     up, the validator proves itself, and the page has to load. The new title counts four. The
     `takeaway` named only the first three, so the page-load check appeared in the body and the title
     but not in the field that travels without them.
   - EN before: "… prove that something against a known answer first — and why …". After: "… prove
     that something against a known answer first, check that the page still loads — and why …".
   - PT before: "… provar esse algo contra uma resposta conhecida antes — e por que …". After: "…
     provar esse algo contra uma resposta conhecida antes, conferir se a página ainda carrega — e por
     que …".
   - Why this is the smallest change: it adds one clause, taken from the body's fourth layer ("The
     page has to load." / "A página tem que carregar."). The rest of the field is unchanged.

### Advisory and droppable
- **The closing blockquote says "Three things"; the title says "Four checks".** Its three items are:
  check 1, then checks 2 and 3 joined into one item, then the human-in-the-loop rule. The page-load
  check is missing. This is not wrong, but a reader carrying "four checks" from the title finds three
  things that do not map to them. One option is to set the four checks as four items and keep the
  human-in-the-loop rule as a separate line. That restructures a takeaway block, so it is the
  writer's call, not a repair.
- **The fourth check does not answer the title's question.** The title says the checks tell you
  "if they [the numbers] add up". The page-load check confirms the file renders, not that the
  numbers are right. The body is accurate: it calls them four layers, "each one catches something the
  others cannot". The title is the owner's, so this is noted for his read only.
- **Line 95's new wording holds.** "So it runs twice — once on this month, and once on a month whose
  answer I already know." / "Então ele roda duas vezes …" is true against the paragraph above it, and
  it no longer points at a title.
- **Title gate.** Neither sentence has the author as its subject: "Your agent" in the first, and no
  subject in the second fragment. The reader has something to try. Both editions survive uppercasing.
  The body delivers the four checks it promises, in "Checked, not trusted" / "Conferido, não
  confiado", and the excerpt still matches.
- **Round 1's advisories still stand.** One concerned "Make it prove it twice"; the new title retires
  it.

### What this round does not cover
No world-check runs on this lane. Nobody has re-read the repair above. It is listed here so that the
gate and the owner's preview read can find it.

**The pair stops here, on the cap.** This is the second `## Round` section, so no round 3 exists,
whatever happens next. The next step is the gate, then the owner's preview read of the new title.

CONTENT-REVIEW-FINDINGS

## Revision after the owner's preview read — 2026-10-30 (not a review round)

The pair's two rounds are spent, so this is **not** a third `## Round`, and `content-reviewer` did
not read it. The revision is driven by the owner's own preview read and goes to the gate and back to
his preview. Its specification is his two comments on #712:

- the preview read: https://github.com/tedeuxx/tadeumendonca-io/issues/712#issuecomment-6532308225
- how the reader tries the result: https://github.com/tedeuxx/tadeumendonca-io/issues/712#issuecomment-6532368142

What changed, in both editions:

- **An illustration before the first paragraph**
  (`/illustrations/build-your-first-ai-app-cover.{pt,en}.jpg`): before (six apps with invented names,
  balances hidden) and after (one screen). Every name and number in it is fictional, and the image
  says so. It is not registered in `photos.json`, like the other `/illustrations/` files, so it renders
  as a plain image with its alt text.
- **A link to the sample Artifact** with a fictional portfolio, presented as something to open and
  try. The link was not opened from this branch; the owner shares it before release.
- **Lower technical density, layered** (`published-voice` rule 22): the opening states the reader's
  problem; a new "What you get" section carries the business outcome (time, clarity, trust); the four
  checks are numbered and each ends with what the reader gains. The architecture list, the
  monthly-run diagram and the tool names moved to a late "Under the hood" section that nothing earlier
  depends on. Nothing was deleted: every fact of the previous draft is still in the piece.
- **A copyable prompt** for a non-engineer, in natural language, with bracketed fictional
  placeholders, no account, broker or credential, and an explicit no-transactions, no-password rule.
  It is a blockquote rather than a fenced block, because `.markdown pre` scrolls sideways on a phone
  and a blockquote wraps.
- **Spine surfaces** (rule 15): excerpt and takeaway rewritten to name the outcome, the sample and the
  prompt. Title and slug unchanged.

Length (rule 10, a reason owed): the body is about 2,290 words (pt) and 2,270 (en), Mermaid fences
and the image line excluded, up from about 1,580 (pt) on `origin/main`. The increase is the prompt,
the outcome section and the reader's-problem opening, all three asked for, while deleting the
technical material was ruled out. Counted with a Python whitespace split over the body minus those
two elements.

## Second revision after the owner's preview read — 2026-10-30 (not a review round)

Still not a `## Round`: the cap is spent and `content-reviewer` did not read this. Its specification
is comments 2 and 3 of the owner's second preview read, after #784:
https://github.com/tedeuxx/tadeumendonca-io/issues/712#issuecomment-6532954722

Comment 1 (the sample link opening in a new tab) is a code change on another branch and is not
touched here.

What changed, in both editions, inside "Build your own" and before the prompt (no new heading, so
the piece stays at six sections):

- **What you need**: a Claude account, the Claude app on the phone, screenshots of the balance
  screens, no code.
- **What this version does not do**: no automatic prices, no update on its own, it reads pixels, it
  never touches money or credentials, and the sample link lives on claude.ai and may change.
- **To reproduce the exact setup**: the pieces "Under the hood" names (Claude desktop app on a Mac
  mini, Claude Cowork's cloud side, TradingView Desktop with a local MCP server over CDP, a scheduled
  task), and the limits "What broke" already states.

Every item is sourced to the Issue body, the owner's comments on #712, or the article as merged.
Which Claude plan, which TradingView plan, and the other open points are not written; they are
questions back to the owner.

**Follow-up, same day:** the answers recorded at
https://github.com/tedeuxx/tadeumendonca-io/issues/712#issuecomment-6533156563 are now in both
editions: the Free plan is enough for the reader's version (with the setting and the two vendor help
pages), the exact setup needs Pro at minimum for scheduled tasks (with its vendor page), TradingView
Desktop is available on the free plan with no claim about data tier, the monthly update is a return
to the same conversation, "a computer that stays on (in my case a Mac mini)", and keep your own
Artifact private. Which local TradingView MCP server is used is still open with the owner and is
not written.

**Second follow-up, same day:** the owner allowed naming the server
(https://github.com/tedeuxx/tadeumendonca-io/issues/712#issuecomment-6533335216). Both editions now
name it as tradingview-mcp, linked to https://github.com/tradesdontlie/tradingview-mcp, in the
exact-setup list.

**Gate fix, same day:** the gate's REQUEST-CHANGES on #786
(https://github.com/tedeuxx/tadeumendonca-io/pull/786#issuecomment-6533459570) and the correction on
#712 (https://github.com/tedeuxx/tadeumendonca-io/issues/712#issuecomment-6533472379), in both
editions:

- B1: "on by default" is gone. The reader is told to turn the setting on (named "Create and edit
  files" in the newer layout) and to check it before starting.
- A1: the scheduled-tasks plan list now includes Ultra. "Pro at minimum" stays.
- A3: the sharing page moved off the Free bullet. The phone bullet says the reader opens their own
  app there, and that sharing by link depends on the plan. Prompt step 1 and the monthly-update
  bullet no longer say "publish", which a Free reader cannot do for a new artifact.
- A2: TradingView Desktop on the free plan now cites TradingView's own blog post (2022).
