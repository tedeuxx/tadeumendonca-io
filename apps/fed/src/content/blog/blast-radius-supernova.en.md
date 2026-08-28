---
title: "Blast Radius Supernova"
slug: blast-radius-supernova
date: '2026-08-28T12:00:00.000Z'
tag: harness
track: engenharia
draft: false
hasVideo: true
excerpt: "I asked for a parody of a song I like, about my own work. Then I went image by image to check what each one actually referred to — and the checking is the article."
takeaway: 'that a prompt and its output prove nothing on their own; what makes the output worth publishing is going image by image and naming what each one refers to.'
---

I like *Champagne Supernova*, by Oasis. The song is thirty-one years old, the video is a band walking through a room in slow motion, and I have had it on while working more times than I can count.

**Source, up front, in three parts, because this piece only works if the borrowing is named exactly.** The meter, the shape and the rhyme scheme are Oasis's — *Champagne Supernova*, from *(What's the Story) Morning Glory?*, 1995. **The lines are Claude's**, written to my instruction, on that form. **Mine are the idea, the prompt you are about to read, and every word of the audit that follows them.**

## 1 · The provocation

The idea was not sophisticated. I wanted a version of that song about **my own work** — the harness I build on weekends, the loop that publishes this site, and the very specific kind of grief that comes with running agents against your own repositories.

Everything else on this site is a technical argument with receipts under it. This is the same move applied to **form** instead of to subject: I pointed a model at a fixed shape I did not invent and at my own material, and then did the part that makes any of it mine — I went back over every image it produced and asked what that image actually refers to.

That second half is the article. The first half is a Tuesday.

## 2 · The prompt

Here is what I typed, unedited, lowercase and typos included. I write to Claude in Portuguese, so this is the Portuguese, with the English underneath:

> *"qual a letra de champagne supernova oasis? eu gosto desse clip […] quero ter uma versao de champagne supernova relacionada com meu trabalho, meu drama, minha jornada de aprendizado de harness engineering, claude code, etc."*

> *("what are the lyrics to champagne supernova oasis? i like that clip […] i want a version of champagne supernova related to my work, my drama, my learning journey through harness engineering, claude code, etc.")*

**I am showing you the prompt because it is the method, not because it is evidence.** A prompt plus its output proves one thing: that a model produced text. It is circular as an argument about engineering, and I would not waste your time on it.

What the prompt is good for is showing you where the material came from. "My work, my drama, my learning journey" is not a creative brief — it is a pointer at two repositories I have been living in for months, and the model has never seen either of them. It wrote the lines. The grief was already there, and so were the files.

## 3 · The result — the parody

What came back was a full parody, in that shape. It scanned. It made me laugh on a weeknight. It is titled *Blast Radius Supernova*, which is where this piece gets its name.

The video is here, and it is the only reason I got the idea at all. Put it on for what follows — the lines are sitting in its shape:

https://www.youtube.com/watch?v=P5AjSVwZ9H0

> [verse 1]  
> Another README no one read  
> Another cluster back from dead  
> Where were you when the pager sang at three?  
> Slowly rolling out the change  
> Faster than the diff can rage  
> Where were you when the plan ate the state?
>
> [chorus]  
> One day they will find me  
> Buried in the rollback  
> With a blast radius wide as the sky  
> One day they will find me  
> Buried in the rollback  
> With a blast radius  
> A blast radius wide as the sky
>
> [verse 2]  
> The hooks fire twice, I don't know why  
> A steering file I swore would die  
> Still loading every time the session starts  
> Slowly rolling out the change  
> Faster than the diff can rage  
> Where were you when the plan ate the state?
>
> [bridge]  
> 'Cause everybody swears  
> they're gonna have it done by summer  
> But you and me, we cut the scope  
> The sprint just keeps turning around  
> and no one knows  
> why, why, why, why
>
> [verse 3]  
> Another client, same old maze  
> Terraform drift for eighteen days  
> Context deadline exceeded in my dreams
>
> [outro]  
> We were shipping blind  
> We were shipping blind  
> We were shipping blind  
> (repete até o solo do Weller acabar)

Source, restated once where it belongs: the meter, the shape and the rhyme scheme are Oasis's, *Champagne Supernova*, 1995. The lines above are Claude's, written to my instruction.

## 4 · The receipt, one image at a time

**Fourteen images**, and I read them the way you just did — with the difference that I know what is behind each one. That is the reaction that made this an article instead of a screenshot, and I will give you the count with its exceptions rather than round it up. **Twelve** have a file, a bill, a commit or a measurement behind them, in the two repositories that produce this site. **One** lands next to a real thing rather than on it. **One** has nothing under it at all, and I will tell you which when we reach it.

A model wrote a joke about a stranger's job and hit twelve of mine dead on.

**That gap is the punchline, and it is the thing worth your time.** So here is the audit.

The vocabulary is glossed as it comes, because half of it is specific to the way I work and none of it should need a tool open to follow.

**Three words that recur.** A **harness** is the setup around a coding agent — the rules it loads, the permissions it has, the checks it must pass. A **hook** is a script the harness runs at a fixed moment, like just before a command executes, and which can refuse it. A **persona** is a subagent with a written brief and a narrow job, dispatched for one task and thrown away after.

### The doc that is read constantly and consulted never

There is a paragraph in my plugin's own instruction file that had been **wrong for three days** before anybody noticed — it pointed at a file that had stopped being a file. It was fixed only because a piece of unrelated work happened to make somebody read that sentence, and the correction says so in as many words rather than quietly repairing the line.

The interesting part is not that a doc went stale. It is that the doc in question is the one **loaded into every single session** — it is not a README somebody forgot in a folder, it is the file the agent reads first, every time.

I have a second one, worse, from a different week: I wrote a rule into a guide saying that a list which enumerates things will fail *silently* when something is missing from it — and the very next list written under that rule left out the exact file the rule had been written about.

And I owe you the ugly half of the first one. I first wrote *six days* here, because six days is what the correction itself says, and I copied it across without checking. It is just over three days — `git log` on the deleted file, against the commit that fixed the text. **A record about a stale claim was carrying a stale number, and this article about auditing claims reprinted it until somebody re-ran it.** The count above is measured. The record still needs fixing.

### The infrastructure I retired, which kept billing

I have no clusters. I have something that behaves identically.

When I cut the backend off this platform — the whole thing, the API layer, the database, the auth — the retirement was clean in the code and **not clean in the account**. Roughly **USD 12.80 a month** kept leaving: firewall ACLs and idle public IP addresses, sitting there attached to nothing, billing on schedule. I found them by reading the invoice, which is the late way to find them.

Infrastructure you stop using does not stop existing. It stops being *in the diff*, which is a completely different thing.

### The text I struck, which loads anyway

The image is a file somebody swore they had killed, loading anyway at the start of every session. That is the mechanism, and it is mine.

A **steering file** is the standing-instructions document an agentic tool loads before it does anything — the thing that tells the agent how this project works. I run two harnesses, one at work and one here, and both have a version of it.

Mine is full of text I have declared dead. It is a convention I chose and still defend: when a rule turns out to be wrong, I **strike it through and leave it in place**, with the date and the reason, because somebody made a decision based on the old sentence and deserves to find out it changed rather than to find it silently gone.

The cost is exact and I pay it every session. That file is loaded at session start, in full, struck passages included. And it is not alone: at one measured point, the descriptions of my skill library alone had become roughly **ten thousand tokens loaded before a single word of the actual task** — a decision that had been free while nothing loaded them, and stopped being free the moment something did. That figure was taken when the library held sixty-nine skills. It holds fourteen now, so today's number is smaller, and I have deliberately not restated it: re-measuring would trade a checkable old figure for a new one nobody but me can re-run.

Everything I have buried is still in the room. On purpose, and not for free.

### The change that goes out at the speed of one click

There is no slow rollout here. There is no staging environment, no canary, no percentage. **Merging is deploying** — one branch, one destination, and the merge that closes the pull request is the same act that puts it in front of you.

That is a deliberate choice and it has a stated price, which I will restate rather than soften: what decides whether a change is safe enough to merge without me is the same kind of thing that wrote the change. Mis-classify one and it goes straight out. What makes that acceptable is not confidence — it is that this is a static site and a revert is a merge.

### The plan that is not the safety net it looks like

`terraform plan` is the command that tells you what is about to change in your cloud account before it changes. The image is a plan that ate the state — the safeguard itself doing the damage. What I have is the same fear from the other side: a plan that says nothing at all.

The referent is a hole I documented on purpose. The trust between my pipeline and AWS — the identity provider and the role the pipeline assumes — is **created by hand, outside Terraform**, and the reason is not the obvious one.

There *is* a bootstrapping problem, and my own record files it under *"mechanical, and would go away"*. The permanent reason is the other one, and the record says in terms that the two must not be collapsed: **a role that can rewrite its own trust policy has no ceiling on it.** It could add a subject to its own trust, and the change would arrive down the same automated path as a routine one. The rule that follows is one line, and it is this article's title stated as a constraint — *"The blast radius of an `apply` must not include the authority to perform the next `apply`."*

The cost of holding that line is the blind spot: *"If the provider's thumbprint or the infra role's trust policy is edited in the console, no `plan` objects."* The tool that exists to tell you the truth about your infrastructure is structurally blind to the one piece of it that grants access to the rest.

I wrote that down as a limitation instead of decorating it, and it is still a limitation.

### The two places a revert does not reach

This is the title, and it is the one concept I would carry out of this whole piece if I could only keep one.

**Blast radius** is how much of the world a change can damage if it is wrong. It is the dial I calibrate everything else against: how much planning, how much review, whether a human has to say yes. High blast radius gets maximum ceremony. Cheap-to-revert gets product speed.

Here almost everything has a small radius, and I say so. But there are exactly two places on this platform where the radius is genuinely wide, and both are wide for the same reason — **undo does not arrive**:

The first is a published URL and its social card. The first scraper that fetches a new article pins the title and the image it saw. Change them afterwards and the pin does not move. That is why the title and the slug of *this* article were the one thing I would not let the loop decide.

The second is git history. A file committed to a public repository is committed; deleting it in a later commit removes it from the tree and not from the record. That constraint is why the preview images for the videos on this site are drawn by me, in my own design system, instead of being copies of the ones YouTube serves — a licensing question that a `git rm` would not have answered.

Everywhere else, I can undo it. In those two, "undo" is a word that stops working, and that is what a wide radius actually feels like.

### Two hooks, one command, every time

The image has two halves and they land differently — hooks firing twice, and not knowing why. Both are true of me, and not in the same way.

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

Until late August my loop had **no iteration at all** — the decision landed on the 24th and the mechanism merged on the 26th. It had a queue and a command that drained it, and the command's stopping condition was "until the queue is dry" — which is not a stopping condition, because the queue grows by working.

The figure sits in my own decision record, and it was recorded once and never re-run, which is how you should weigh it: in one session the backlog grew by **19 issues net**, of which roughly **13 were born inside a review of something else**. Every finding turned into work nobody had decided to do. The loop was not failing; it was succeeding at the wrong thing, which is much harder to see.

The fix was to bound the pool instead of the ambition: what gets drained is now one iteration, fixed at a moment when I am in the room, rather than everything that happens to be marked ready. It does not bound the backlog. It moves the growth somewhere a human has to look at it, which is the only place this loop has ever bounded anything that is a matter of worth rather than arithmetic.

### The scope that got cut

The cutting is the most documented thing about this platform.

This site was not built lean. It was built **full and then cut**. There was a backend on Lambda, a database, an authentication service, a mail service, an edge function rendering social cards per request, a link-unfurling service, a two-environment branching model and an offline-first mobile app. A database with nothing to store. Auth with nobody to authenticate. A staging environment for a site whose rollback is a merge. Every one of those reversals is a numbered record you can open.

The harness went the same way. **Nineteen personas became seven. Sixty-nine skills became fourteen.** Each cut carries a date and a reason.

Cutting is what happens when you finally ask a component what it is for *here*, and it has no answer.

### The maze I had already learned

I will not name anyone, and there is nothing to name: the point is precisely that they stopped being distinguishable.

I have written about this already, so I will keep it to the shape. The work I was doing had reached a place where each new engagement rhymed with the last one — same integration problems, same organisational shapes, same solutions, and technical growth I could no longer feel. That is what sent me looking for a different kind of problem, and it is why there is a site here at all.

That is a description of a ceiling, not a complaint about anybody. The mazes were fine. I had learned the maze.

**This is the one I promised that lands next to a real thing rather than on it.** There is no file, no bill and no commit under it — what it points at is a stretch of my own career, and the only artifact it left is this site.

### The pager that does not exist

The referent here is an **absence** rather than a mechanism — and the absence is deliberate and already published on my architecture page, so I am not confessing anything here.

Nothing on this site pages anyone. There is no uptime monitor, no error tracker watching the reader's browser, no access log. A static site served from a bucket has almost nothing that can wake you up, and building an on-call apparatus for it would be a costume.

What exists instead is one file, `iac/budget.tf`, which sets a ceiling on the whole account and emails me when the spend crosses it. It is the only continuous watcher in the system. It does not sing at three; it sends mail. And it is the thing that would have caught the dead firewall ACLs above months earlier, which is exactly why it is there now.

### The one with nothing behind it

The piece ends on one statement, repeated three times: that we used to ship without being able to see what we had shipped.

It is the one image in the set with nothing at all under it, and I want to be blunt about that, because the rest of this piece would be worth nothing if I let a good closing line make a false claim.

It is not a description of this platform. Everything above exists precisely so that it is not true here: gates that refuse, hooks that deny a command before it runs, an inventory that reddens a build when it stops being accurate.

**And the tense is the whole thing.** It is written as something that *was*, not something that is — a condition closed off and looked back at. That is what the apparatus above was built against: the ordinary state of a lot of software work, mine included, for a long stretch of it.

And I have a small, exact receipt for what it actually looks like. A path misroute once sent every per-article social card into this site's catch-all route, so each one answered every scraper that asked with a `200` and the home page's HTML. Well-formed, confident, wrong. Nothing was watching that path, so nothing said anything, and I found out the way you always find out — afterwards, from the outside. What watches it now is that rewrite function's own unit tests and a post-deploy check that the live function still matches this repository, which is the shape every fix in this piece takes: not more care, something that fails loudly.

The reason it belongs at the end is that it is what a chorus is for. You do not build gates because you are careful by temperament. You build them because you remember what it was like without them.

## What I would take from this

Not the parody. Take the exercise.

A model that has never opened your repositories writes a joke about your job, and twelve of the fourteen have a file, a bill, a commit or a measurement behind them. The useful question is never *is this good* — it is **what does each image refer to**. Fourteen of them, and going through them one at a time turned up a doc that had been wrong for three days, a stale number inside the correction that fixed it, a bill for infrastructure I thought I had deleted, a drift detector with a hole I had documented and then stopped thinking about, and a backlog that was growing by being worked on.

The model wrote it. The audit is what made it worth your time, and the audit is not a thing a model can do for you, because the referents are in your repositories and your invoices and your memory.

So — put something you made through a shape you did not invent, and then go and check what it claims about you, one item at a time. I would genuinely like to know what falls out. **Which of the fourteen above is a Tuesday in your week, and which one is the file you have been meaning to open?**

Good luck out there, and may your radius be narrow.
