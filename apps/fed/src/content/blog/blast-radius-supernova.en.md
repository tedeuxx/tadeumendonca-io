---
title: "Blast Radius Supernova"
slug: blast-radius-supernova
date: '2026-08-27T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
excerpt: "I asked for a parody of a song I like, about my own work. Then I went and checked whether every image in it was true — and the checking is the article, because each one turned out to be a real failure mode with a file behind it."
takeaway: 'that a prompt and its output prove nothing on their own; what makes the output worth publishing is going image by image and naming what each one refers to.'
---

I like *Champagne Supernova*, by Oasis. The song is thirty years old, the video is a band walking through a room in slow motion, and I have had it on while working more times than I can count.

**Source, up front: the meter, the shape and the rhyme scheme that started this are Oasis's — *Champagne Supernova*, from *(What's the Story) Morning Glory?*, 1995. Everything I wrote is mine.** The video is here, and it is the only reason I got the idea at all:

https://www.youtube.com/watch?v=P5AjSVwZ9H0

## 1 · The provocation

The idea was not sophisticated. I wanted a version of that song about **my own work** — the harness I build on weekends, the loop that publishes this site, and the very specific kind of grief that comes with running agents against your own repositories.

I want to be exact about why I am publishing anything at all, because "I made an AI write a funny thing" is not a reason.

Everything else on this site is a technical argument with receipts under it. This is the same move applied to **form** instead of to subject: I took a fixed shape I did not invent, put my own material through it, and then did the thing that makes it mine — I went back over every image and asked what it actually refers to.

That second half is the article. The first half is a Tuesday.

## 2 · The prompt

Here is what I typed, unedited, lowercase and typos included. I write to Claude in Portuguese, so this is the Portuguese, with the English underneath:

> *"qual a letra de champagne supernova oasis? eu gosto desse clip […] quero ter uma versao de champagne supernova relacionada com meu trabalho, meu drama, minha jornada de aprendizado de harness engineering, claude code, etc."*

> *("what are the lyrics to champagne supernova oasis? i like that clip […] i want a version of champagne supernova related to my work, my drama, my learning journey through harness engineering, claude code, etc.")*

**I am showing you the prompt because it is the method, not because it is evidence.** A prompt plus its output proves one thing: that a model produced text. It is circular as an argument about engineering, and I would not waste your time on it.

What the prompt is good for is showing you where the material came from. "My work, my drama, my learning journey" is not a creative brief — it is a pointer at two repositories I have been living in for months. The model supplied the meter. The grief was already there, and so were the files.

## 3 · What came back, and why you are not reading it

What came back was a full parody, in his shape: three verses, a chorus, a bridge, an outro. It scanned. It made me laugh on a Tuesday night. It is titled *Blast Radius Supernova*, which is where this piece gets its name.

**And it is not printed here, deliberately.** It is not a piece that echoes a song — it is that song with the words swapped, line for line, position for position. Reproducing it in full is reproducing somebody else's form with my substitutions in it, and that is not a thing this platform should publish. I would rather lose the joke than have the one page on this site that is playing loose.

So what is left is the part that was always worth reading anyway.

**Fourteen images.** A doc nobody read. Infrastructure back from the dead. A pager at three in the morning. A change going out faster than anyone could look at it. A plan that ate the state. A rollback with a blast radius. Hooks firing twice. A file I had declared dead and that loads anyway. Scope being cut. A sprint that never converges. The same maze again. Drift. A context deadline. And, at the end, three repetitions of a line about having shipped blind.

I read those fourteen and had the reaction that made this an article instead of a screenshot: **none of them is generic.** Every single one has a file, a bill, a commit or a measurement behind it, in the two repositories that produce this site. A model wrote a joke about a stranger's job and hit fourteen of mine.

**That gap is the punchline, and it is the thing worth your time** — not the verse it arrived in. So here is the audit.

## 4 · The receipt, one image at a time

The vocabulary is glossed as it comes, because half of it is specific to the way I work and none of it should need a tool open to follow.

**Three words that recur.** A **harness** is the setup around a coding agent — the rules it loads, the permissions it has, the checks it must pass. A **hook** is a script the harness runs at a fixed moment, like just before a command executes, and which can refuse it. A **persona** is a subagent with a written brief and a narrow job, dispatched for one task and thrown away after.

### The doc that is read constantly and consulted never

There is a paragraph in my plugin's own instruction file that had been **wrong for six days** before anybody noticed — it pointed at a file that had stopped being a file. It was fixed only because a piece of unrelated work happened to make somebody read that sentence, and the correction says so in as many words rather than quietly repairing the line.

The interesting part is not that a doc went stale. It is that the doc in question is the one **loaded into every single session** — it is not a README somebody forgot in a folder, it is the file the agent reads first, every time.

I have a second one, worse, from a different week: I wrote a rule into a guide saying that a list which enumerates things will fail *silently* when something is missing from it — and the very next list written under that rule left out the exact file the rule had been written about.

### The infrastructure I retired, which kept billing

I have no clusters. I have something that behaves identically.

When I cut the backend off this platform — the whole thing, the API layer, the database, the auth — the retirement was clean in the code and **not clean in the account**. Roughly **USD 12.80 a month** kept leaving: firewall ACLs and idle public IP addresses, sitting there attached to nothing, billing on schedule. I found them by reading the invoice, which is the late way to find them.

Infrastructure you stop using does not stop existing. It stops being *in the diff*, which is a completely different thing.

### The text I struck, which loads anyway

This one I quote, because the phrase is the mechanism: *"a steering file I swore would die."*

A **steering file** is the standing-instructions document an agentic tool loads before it does anything — the thing that tells the agent how this project works. I run two harnesses, one at work and one here, and both have a version of it.

Mine is full of text I have declared dead. It is a convention I chose and still defend: when a rule turns out to be wrong, I **strike it through and leave it in place**, with the date and the reason, because somebody made a decision based on the old sentence and deserves to find out it changed rather than to find it silently gone.

The cost is exact and I pay it every session. That file is loaded at session start, in full, struck passages included. And it is not alone: at one measured point, the descriptions of my skill library alone had become roughly **ten thousand tokens loaded before a single word of the actual task** — a decision that had been free while nothing loaded them, and stopped being free the moment something did.

Everything I have buried is still in the room. On purpose, and not for free.

### The change that goes out at the speed of one click

There is no slow rollout here. There is no staging environment, no canary, no percentage. **Merging is deploying** — one branch, one destination, and the merge that closes the pull request is the same act that puts it in front of you.

That is a deliberate choice and it has a stated price, which I will restate rather than soften: what decides whether a change is safe enough to merge without me is the same kind of thing that wrote the change. Mis-classify one and it goes straight out. What makes that acceptable is not confidence — it is that this is a static site and a revert is a merge.

### The plan that is blind to the one thing granting access to everything else

`terraform plan` is the command that tells you what is about to change in your cloud account before it changes. The joke in the image is that the plan is supposed to be the safe part.

The referent is a hole I documented on purpose. The trust between my pipeline and AWS — the identity provider and the role the pipeline assumes — is **created by hand, outside Terraform**, because there is no way to bootstrap it from inside. Which means the sentence in that decision record reads, in full: if somebody edits that trust policy in the console, **no `plan` objects**. The tool that exists to tell you the truth about your infrastructure is structurally blind to the one piece of it that grants access to the rest.

I wrote that down as a limitation instead of decorating it, and it is still a limitation.

### The two places a revert does not reach

This is the title, and it is the one concept I would carry out of this whole piece if I could only keep one.

**Blast radius** is how much of the world a change can damage if it is wrong. It is the dial I calibrate everything else against: how much planning, how much review, whether a human has to say yes. High blast radius gets maximum ceremony. Cheap-to-revert gets product speed.

Here almost everything has a small radius, and I say so. But there are exactly two places on this platform where the radius is genuinely wide, and both are wide for the same reason — **undo does not arrive**:

The first is a published URL and its social card. The first scraper that fetches a new article pins the title and the image it saw. Change them afterwards and the pin does not move. That is why the title and the slug of *this* article were the one thing I would not let the loop decide.

The second is git history. A file committed to a public repository is committed; deleting it in a later commit removes it from the tree and not from the record. That constraint is why the preview images for the videos on this site are drawn by me, in my own design system, instead of being copies of the ones YouTube serves — a licensing question that a `git rm` would not have answered.

Everywhere else, I can undo it. In those two, "undo" is a word that stops working, and that is what a wide radius actually feels like.

### Two hooks, one command, every time

Here I quote as well, because both halves of the sentence do work: *"the hooks fire twice, I don't know why."*

The first half is literally true and I can point at the line. My plugin registers **two** hooks on the same trigger — every shell command I run passes through `permission-guard`, which can refuse it outright, and then through `wip-guard`, which checks whether I already have work in flight. Two scripts, one command, every time. It is in `hooks.json` and you can count them.

The second half is the honest part. I know why *those two* fire. What I have repeatedly not known is why a rule I wrote once keeps needing to be written again — one of my decision records notes that a particular guard **stated the same rule twice in its own header**, and the body of the record repeated it a third time, and it was still broken afterwards.

Saying a thing twice is not a mechanism. That took an embarrassing number of repetitions to accept, and it is the single strongest argument I have for why this loop is made of hooks and gates rather than of a very long document explaining to the agent how to behave.

### The drift detector, and the hole in it

**Drift** is when the thing you deployed and the thing you wrote down stop agreeing, and nothing tells you.

I have a detector for one flavour of it: my site keeps a committed inventory of what the plugin contains — how many hooks, which personas, what each one can and cannot refuse — and a job compares that inventory against the plugin's live tree. Rename a persona over there and the build over here goes red. That is the mechanism I am proudest of, because it is what turns a diagram into a claim.

And I will tell you exactly where it stops, because a guard described as catching more than it does is how the uncaught case survives. That check compares **names and counts**. It does not check what a row says a persona *does*, and it does not check which skills each one loads. There is a table on my architecture page where somebody could change a brief tomorrow and the table would start lying the next day **with no signal at all**. I know that, it is written down there in those terms, and there is currently no detector for it.

One kind of drift caught mechanically, one kind caught only by a human re-reading. The second kind is the one that runs for weeks.

### The context that runs out

An agent's context is finite and it runs out, and the way it runs out is the defining constraint of everything above. Seeing a distributed-systems error string land in the middle of a song about somebody's dreams is funnier than it should be, and it is also the most accurate line in the set.

This is what the personas are actually for. When I dispatch a subagent, it reads, runs, gets things wrong and redoes them **inside its own session**, and what comes back to the main session is the conclusion rather than the work. The main session pays for the verdict, not for the execution. I measured it once on my own transcripts: what stayed inside the subagents was more than an order of magnitude larger than what came back.

And it is not an escape. That same session ran out of room and compacted twice anyway. The lever is real and it has a ceiling, and if I ever write a piece claiming I solved this, do not believe me.

### The queue that grew by being worked

Until three days ago my loop had **no iteration at all**. It had a queue and a command that drained it, and the command's stopping condition was "until the queue is dry" — which is not a stopping condition, because the queue grows by working.

I have the measurement. In one session the backlog grew by **19 issues net**, of which roughly **13 were born inside a review of something else**. Every finding turned into work nobody had decided to do. The loop was not failing; it was succeeding at the wrong thing, which is much harder to see.

The fix was to bound the pool instead of the ambition: what gets drained is now one iteration, fixed at a moment when I am in the room, rather than everything that happens to be marked ready. It does not bound the backlog. It moves the growth somewhere a human has to look at it, which is the only place this loop has ever bounded anything that is a matter of worth rather than arithmetic.

### The scope that got cut

The cutting is the most documented thing about this platform, and it is the part I am least embarrassed by.

This site was not built lean. It was built **full and then cut**. There was a backend on Lambda, a database, an authentication service, a mail service, an edge function rendering social cards per request, a link-unfurling service, a two-environment branching model and an offline-first mobile app. A database with nothing to store. Auth with nobody to authenticate. A staging environment for a site whose rollback is a merge. Every one of those reversals is a numbered record you can open.

The harness went the same way. **Nineteen personas became seven. Sixty-nine skills became fourteen.** Each cut carries a date and a reason.

I am not going to pretend cutting is heroic. It is what happens when you finally ask a component what it is for *here*, and it has no answer.

### The maze I had already learned

I will not name anyone, and there is nothing to name: the point is precisely that they stopped being distinguishable.

I have written about this already, so I will keep it to the shape. The work I was doing had reached a place where each new engagement rhymed with the last one — same integration problems, same organisational shapes, same solutions, and technical growth I could no longer feel. That is what sent me looking for a different kind of problem, and it is why there is a site here at all.

That is a description of a ceiling, not a complaint about anybody. The mazes were fine. I had learned the maze.

### The pager that does not exist

This is the one image whose referent is an **absence** rather than a mechanism — and the absence is deliberate and already published on my architecture page, so I am not confessing anything here.

Nothing on this site pages anyone. There is no uptime monitor, no error tracker watching the reader's browser, no access log. A static site served from a bucket has almost nothing that can wake you up, and building an on-call apparatus for it would be a costume.

What exists instead is one file, `iac/budget.tf`, which sets a ceiling on the whole account and emails me when the spend crosses it. It is the only continuous watcher in the system. It does not sing at three; it sends mail. And it is the thing that would have caught the dead firewall ACLs above months earlier, which is exactly why it is there now.

### The one with nothing behind it

The outro repeats a single line three times: *"we were shipping blind."*

It is the only image in the set with no mechanism under it, and I want to be blunt about that, because the rest of this piece would be worth nothing if I let a good closing line make a false claim.

It is not a description of this platform. Everything above exists precisely so that sentence is not true here: gates that refuse, hooks that deny a command before it runs, an inventory that reddens a build when it stops being accurate.

**Read the tense.** *Were.* It is the condition the whole apparatus was built against — the ordinary state of a lot of software work, mine included, for a long stretch of it. That state is the profession's, not a verdict on anybody in it, and certainly not on the people I did that work beside.

The reason it belongs at the end is that it is what a chorus is for. You do not build gates because you are careful by temperament. You build them because you remember what it was like without them.

## What I would take from this

Not the parody — you are not even reading it. Take the exercise.

Something hands you a piece of machine-generated nonsense about your own work, and it lands. The useful question is never *is this good* — it is **what does each image refer to**. Fourteen of them, and going through them one at a time turned up a doc that had been wrong for six days, a bill for infrastructure I thought I had deleted, a drift detector with a hole I had documented and then stopped thinking about, and a backlog that was growing by being worked on.

The model supplied the shape. The audit is what made it worth your time, and the audit is not a thing a model can do for you, because the referents are in your repositories and your invoices and your memory.

So — put something you made through a shape you did not invent, and then go and check what it claims about you, one item at a time. I would genuinely like to know what falls out. **Which of the fourteen above is a Tuesday in your week, and which one is the file you have been meaning to open?**

Good luck out there, and may your radius be narrow.
