---
title: "How to run your Claude Code/Codex/Kiro like an AI-native company"
slug: what-my-agents-do
date: '2026-08-25T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
contentIssue: 259
excerpt: "Garry Tan breaks an AI-native company into four pieces that are all files, and a fifth one underneath: the brain. I took that breakdown and ran it against a loop I had already built without having seen the talk. Three of the four matched. The fourth and the brain break differently."
takeaway: 'the four pieces of his company are files, which is why you can rearrange them; the brain is what makes the rearrangement teach you anything — and the discipline holding both up is to never do one-off work.'
---

https://www.youtube.com/watch?v=eBUyTS7SzV4

Garry Tan, who runs Y Combinator, gave a twenty-minute talk called *Every company should have a Brain*. No slides, no deck, just him talking. It is about AI-native companies — the ones already running on Claude, on Codex, on harnesses built around them.

His argument fits in one sentence: the leverage is not in the model, it is in how you wire the work. Two people with the same Claude, the same weights, the same context window — one gets a bit more done, the other gets a lot more, and the whole difference is the wiring.

He is describing companies with people in them. I am one person, two repositories and weekends. What I did was take his breakdown and run it against something I had already built without having seen the talk — piece by piece, to see what matched and what did not.

## A company written in files

```mermaid
flowchart TB
  accTitle: How work crosses the agent tiers — and where I come in
  accDescr: A top-to-bottom flow in three tiers, with the owner at both ends and one large box in the middle that runs without him. At the top is me: I am the only origin of demand, and I open the Issue. Tier 1 is intake, and it is not one box: it is three lanes, and the issue's type decides which one it enters. A product issue closes through the two leads that disagree by design, product-lead and tech-lead. A content issue closes through product-lead alone, judging whether the piece is worth writing at all — not how it will be written. A loop issue, which is the machinery itself, closes through agents-lead alone — never paired, and with no exception — because the machinery is that profile's object and nobody else's. The three lanes all reach the same ready label, which is the artifact saying the description was closed — and on a loop issue that label is mine alone to apply. From ready downwards the AFK stretch begins, the part that runs without asking once I tell it to drain the queue: everything inside passes through the orchestrator, which is the main session and the hub every lane goes through, which commits and pushes, and which never merges and never decides the irreversible — a hook refuses it both of those from the main session. On the repository edit there is no lock at all: the hook that used to refuse it was deleted, so what keeps an edit flowing through the persona that owns it is now a rule and not a mechanism. What stands beside that rule is scrum-master, drawn off the path here: a profile holding no tools whatsoever — it cannot dispatch, edit, run a command or apply a label — which ranks the eligible pool and names in a record who should act next. Three parts, and the third is the one to keep: nothing prevents the edit, the record names who should have acted, and the record is written by the party it constrains and read by nothing. That is detection, self-attested, rather than prevention. It dispatches tier 2, the build, split by type as well: developer on product, content-writer on content, agents-lead on loop, building what it has just stress-tested. On content the build is a pair rather than one profile, which is why that one box carries two names: content-reviewer reads the draft against the same ruler it was written against, at most two rounds, and what it blocks is a draft rather than a merge. The orchestrator dispatches both, like everything else in here — neither hands work to the other directly. Out of that comes one merge request per story, reaching tier 3 — fresh context, no authorship bias — where quality-assurance checks the Definition of Done and, separately, whether this can break production; it is the only one that may merge. The loop lane reaches that same box rather than going round it, and it answers for more there rather than less: on a change to the machinery itself, quality-assurance checks the same Definition of Done and the same question about production, and additionally requires that agents-lead left its verdict marker before it may merge at all — a reviewer that has to have been present, not a review that is skipped. Safe-class work it merges itself, and the merge is the deploy. Boundary-class work — infrastructure, the loop's own rules, publishing in my voice — leaves the AFK stretch and comes back to me, and only after my go does it ship. Once a merge request exists, refusal is a single channel: the gate asking for changes and my no-go land in the same sent-back box, and that box returns through the orchestrator, never straight to whoever built it. Nine persona boxes, eight names, for two different reasons: product-lead and agents-lead each appear twice, because the same profile is dispatched at different moments; and one box carries two names rather than one, because the content lane is a pair. And there is a dashed channel between me and the orchestrator for when something is stuck — it exists throughout and it is not on the path. That is the claim this drawing makes: between the ready label and the merge there is no human on the path, and I appear only at the two ends — what crosses that stretch alone is the safe class only.
  H(["HITL · ME<br/>the only origin of demand<br/>I open the Issue"])
  subgraph L3["TIER 1 · loop"]
    LM["agents-lead<br/>alone — the machinery is its object"]
  end
  subgraph L1["TIER 1 · product"]
    PL["product-lead"]
    TL["tech-lead<br/>they disagree by design"]
  end
  subgraph L2["TIER 1 · content"]
    PC["product-lead<br/>alone — whether it is worth writing at all"]
  end
  RQ{{"TIER 1 CLOSES HERE · the ready label<br/>the description closed — and on a loop issue,<br/>mine alone to apply"}}
  subgraph AFK["AFK · from ready to merge, nothing on the path is human"]
    ORCH["ORCHESTRATOR ·<br/>the main session<br/>dispatches every persona, commits, pushes<br/>a hook refuses it the merge and the trunk push<br/>on the repository edit nothing refuses it"]
    SM["scrum-master · holds no tools at all<br/>ranks the pool, names who acts next<br/>a record it writes itself — nothing reads it"]
    DEV["TIER 2 · BUILD<br/>developer — product"]
    WRT["TIER 2 · BUILD<br/>content-writer with content-reviewer — content<br/>at most two rounds, against the same ruler"]
    LB["TIER 2 · BUILD<br/>agents-lead — loop<br/>builds what it stress-tested"]
    MR{{"MERGE REQUEST · one per story"}}
    QA["TIER 3 · GATE<br/>— fresh context, no authorship bias<br/>quality-assurance · the only one that may merge<br/>every lane — the Definition of Done,<br/>and whether this breaks production<br/>loop — plus an agents-lead verdict marker"]
    V["sent back — one return channel"]
    M{{"merge to main = the deploy"}}
  end
  HO(["HITL · ME<br/>boundary class: irreversible, architectural<br/>go / no-go"])
  H -- "product" --> PL
  H -- "product" --> TL
  H -- "content" --> PC
  H -- "loop" --> LM
  PL --> RQ
  TL --> RQ
  PC --> RQ
  LM --> RQ
  RQ --> ORCH
  ORCH -- "product" --> DEV
  ORCH -- "content" --> WRT
  ORCH -- "loop" --> LB
  DEV --> MR
  WRT --> MR
  LB --> MR
  MR -- "dispatched by the orchestrator" --> QA
  QA -- "safe class" --> M
  QA -- "boundary class" --> HO
  HO -- "go" --> M
  QA -- "changes" --> V
  HO -- "no-go" --> V
  V --> ORCH
  SM -.-> ORCH
  H <-.-> ORCH
```

The part that got me is that he never says "use AI". He describes the functions of a company, and each one turns out to be a file.

He names four. A skill file, he says, is an employee: one capability, one job, written down clearly enough that someone else can execute it. The resolver table — the table you end up writing when your `CLAUDE.md` grows past what anybody wants to read, the one that says *when the work looks like this, load that* — is the org chart. Filing rules and trigger evals are the other two.

Then the line that ties them together, and this one is worth his exact words:

> *"When you sit down with Claude Code or Codex, you're not writing software, you're hiring, training, and managing a workforce made of markdown."*
>
> — Garry Tan, 2026

I went looking for those four in my own loop, and three of them were already there, under names I had not borrowed from him. What decides which reviewers get involved is a table keyed on the kind of work — `loop`, `product`, `content`. The internal process is the one rule my decision library runs on, which I quote in a minute. And the performance review is a suite that reads the skill list in both directions: a declared skill that does not exist turns it red, and one that exists and was never declared does too. Not one of the three was built from theory. Each of them is a thing that broke first.

The fourth did not hold, and it is the more interesting of the two places this comes apart. His model puts the employee and the capability in the same file. Mine keeps them apart. The employee here is the agent declaration — eight of them, each carrying a mandate, a tool grant and the list of skills it loads. The fifteen skills are not employees at all: they are capabilities, and several employees carry the same one. Two of them are loaded by all eight. One artifact on his side, two on mine, with a many-to-many relation between them that his mapping has nowhere to put.

And there is a fifth piece underneath the four, which he does not put on that list. That one comes apart for a different reason.

## Keep judgment in the model, and state in code

Before the fifth, the line I most wish I had had in writing three years ago.

He splits computation into the two places it can live. *Latent space* is the model: taste, judgment, working out what somebody meant by a vague request — the non-deterministic part, steered with markdown. *Deterministic space* is ordinary code, which executes and holds state. The bugs, he says, are usually work sitting on the wrong side of that line.

His example is seating eight hundred people so that whoever ends up next to you is worth meeting. The model decides who fits with whom. Where each of the eight hundred is actually sitting must not live in the context window.

That is my loop's architecture described by somebody else, and I had never had the words for it. The personas argue, weigh, hold opinions: judgment. Who may merge, what counts as irreversible, which verdict authorises what: those are hooks, and a hook has no opinion. I did not get there by theory. I got there by putting things on the wrong side of that line and paying for it.

## The brain, and what it costs

The fifth piece is the one underneath the other four: the company's memory. His name for it is the library plus the librarian, and his sharpest line about it is that retrieval is the easy half — being worth retrieving from is the product.

He is blunt about how it dies:

> *"a brain nobody curates becomes a garbage dump with great search."*
>
> — Garry Tan, 2026

And what he offers instead is a role rather than a feature — provenance on every fact, a check for when a new one contradicts an old one, and a librarian whose actual job is pruning.

That is the one claim here I can hand you a receipt for rather than a recollection.

Decisions here are records in a library, and the library is the development journey: every decision taken along the way, why it was taken, and none of them closed for good — any record can be re-opened. Keeping that usable takes one rule, the title of one of the records: *"An ADR earns its place by explaining the **current** codebase."* A record that stops doing that does not get a banner saying it is out of date. Its file leaves the repository; the trace stays as a row elsewhere, under a clause I can point at: *"A record leaves this library only as a disposition, never as an absence."*

Twenty-one numbers have been issued. Seven are live. The fourteen that are gone each have a row saying what they decided and where that decision lives now. And a test reads it in both directions: a number with no file and no row turns the suite red, and so does a row for a number that is still alive.

Pruning is not the part that feels like progress. It is the part that made the rest usable.

His reason for bothering is that model quality is rented and the brain is the part you own: the organisation that writes down what it learns gets better every day, and the one that does not wakes up every morning with amnesia, however good the model is.

Here I have to be honest about scale, because this is where his analogy touches my life and stops fitting. Knowledge that does not leave when the people leave is a claim about organisations, and I am not one. What I have is the one-person version, and it is less impressive and just as real: what I wrote down still works after I have forgotten it. I have tested that by accident several times, coming back to a file of my own six months later remembering none of it.

## Never do one-off work

If you take one thing from here, take this one, and you can do it this week.

Give the agent the task. Look at what comes back. Correct what is not good enough — and then, once it is good, turn that corrected workflow into a skill you can use again. The order is the whole trick: you capture **after** correcting, so the skill is born with the correction already inside it. The standard he holds it to is harsh, and I have not met it yet — *"if you have to ask for something twice, you failed."* Why that is right is mine rather than his. The point of capturing is behaviour that repeats — the same process run the same way, because the correction is written down instead of remembered. With people, failing at that was survivable: plenty of managers were bad at giving effective feedback, and the organisation absorbed it. With agents it costs more, because a correction nobody captured is not just lost — it gets paid again, every time.

I read that and went to look at what I actually did. Sixty-nine skills became fourteen, and there are fifteen now. Nineteen personas became six, and there are eight now. A count that only falls tells a story by itself; a count that falls and then climbs back tells none at all — and that is exactly the shape that stops being readable the moment nobody wrote down why. Which is why the behaviours here are rows in a registry, and each entry has to say what that behaviour is *for*, and what it does *not* do.

## What one has to do with the other

It took me a while to see that the two ideas are the same piece from two sides.

You can only rearrange the profiles because what each one does is not inside a person. An org chart of people cannot be re-run in a different shape; an org chart of files can. And you only learn anything from the rearrangement if the record says what each piece was there for — otherwise you changed the shape, the result changed with it, and you have no idea why.

And the shape worth changing it into is a disagreement. A profile here earns its place mostly by producing one somebody needs to hear — that is the first of four reasons one may exist, and the version of the rule that said it was the only reason got struck, because it could not explain two of the profiles that are actually there.

What took me longer to see is that the useful disagreement is not the same at every stage. Two leads arguing about a piece of work before anything is built is one act; a gate whose whole job is to fight the builder after it is built is another; the drafting pair reading the same ruler is a third. And some stages want none at all — a change to the loop itself is closed by one reviewer alone, with no exception, because an exception there becomes the default case.

So writing down what each piece is for is not tidiness. It is the only thing that lets you change the shape and learn from having changed it.

**What to take out of this:**

- **A profile earns its place by producing a disagreement somebody needs to hear** — not by filling a box on an org chart. If nobody would argue back, what you have is a handoff, and a handoff is the thing that never gets used.
- **Match the conflict to the stage.** Before anything is built you want two opinions that genuinely differ; after it is built you want an adversary; while a draft is being written you want one ruler, read twice. Using the same conflict everywhere is how a review turns into a ceremony.

And here is the limit, before you reach it on your own: I do not have the measurement. I have not run two arrangements side by side to compare which produces more. What I have is the record that makes the comparison possible, and the counts above are change over time, not an experiment.

One thing I am leaving out, deliberately. Everything above is the part that worked. What none of it can check, and the two occasions where something was written down and then simply not read, is the next article — the one with the receipts I like least. Saying that costs me a sentence; letting this one look finished would have cost more.

The tiers, what each one is *not* allowed to do, and how a change crosses them are in one drawing — the same loop, laid out to be inspected rather than read. It is not a second drawing: it is the one that sits on [the architecture page](/architecture), taken as it is. Drawing it twice is exactly the one-off work this piece is against.

He closes by listing what is portable: skill files as employees, the library and the librarian, never do one-off work. Those, he says, travel with you to any stack. Mine travels as a plugin, in the other repository — the one thing here built to be carried off by somebody else. That it can be is not why I wrote it: I wrote the reasons for myself, and only afterwards found out the reasons were the part that could leave.

Good luck, and I hope you find yours in better shape than I found mine.

This is what I think.
