---
title: "I ran three agent loops for a month. The expensive part was deciding."
slug: three-agent-loops-one-month
date: '2026-09-02T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
contentIssue: 577
excerpt: "Three agentic projects in parallel, on top of a full project calendar, and a bill of USD 4,207 covering two of them. The money is the least interesting number in it: what August actually cost was deciding the same thing over and over without noticing."
takeaway: 'how to notice you are burning hours and money on the wrong thing — three signals that need none of my tools — and what to do in the minute you notice.'
---

Three agentic projects, running at the same time, all of August, on top of a full project calendar that did not get any lighter to make room.

One of them is this platform — you can read every line of it: the repository, the loop that builds it, the decision records where I changed my mind. One of them is an internal knowledge platform I am building for the modernization practice inside AWS Professional Services in LATAM, to speed up how AI knowledge moves between colleagues — my thesis, and building it was my decision too. And one of them was a client engagement, which arrives here with no client, no domain and no stack — a deliberate hole, not an oversight.

Three loops, three different amounts I am allowed to tell you.

There was a reason it was August. Inside AWS it was **Agentic August** — a programme promoting the use of AI and experimentation with it, with some training goals and a hackathon that had its own rules.

I preferred to do it differently, my own way. That is where the three loops came from.

By the second week I was working well past office hours. By the third I was leaving loops running overnight. By the end of the month I was sleeping with the laptop in the bed and checking on agents from my phone, at three in the morning, the way you check on something that is cooking.

The bill for August was **USD 4,207.13** — and it covers two of those three loops. This platform's runs on my Claude Max 10x subscription instead: two loops metered in credits, one flat.

I want to be careful with that number, because it is the one thing in this piece somebody will screenshot. It is **credits**, not tokens — the unit my plan bills in. The plan covers 10,000. I went **105,178.21 credits** past it, at four cents a credit, which is where the 4,207.13 comes from; the arithmetic closes to the cent. Total on that bill for the month, plan included, around **115,000 credits**.

And here is the part I would rather not write. **I cannot tell you which of the two on it spent more.** One bill, two loops, no split.

I know what you are about to ask, because it is the question I would ask, so let me answer it before anything else: **I spent it. It was my decision.** Every one of those credits was consumed by a choice I made — which loop to start, when to let it run, when to accept an answer and when to send it back. Whoever the money belonged to is not the interesting part of this story. The choices are.

Because this is not a piece about what a month of agentic development costs. It is about something narrower and, I think, more useful to you: **how you notice that you are burning hours and money on the wrong thing, and what you do in the minute you notice.**

## I opened August without an anchor

I started the month still working out my own feelings about what good work and bad work even *are* when agents are doing the building.

That sounds soft. It was not. It was a completely practical problem, and it was blocking me: **I could not decide which expectation anchor to use.** How long should this have taken? Is one review round good or bad? Is three? Was that fast, or did I just watch a lot of tokens go by and feel busy?

You make those calls constantly and normally you make them against a rational history — you have shipped things like this before, your team has, your industry has. Here there is none. No historical base of my own, and no clear benchmark in the industry either. Individual activities, individual observations. **It is like being cavemen discovering the world for the first time**, each of us in our own cave, none of us able to check.

And there is a second thing underneath it that took me most of the month to see. **My bias as a human was making me believe we got things right the first time far more often than we actually did.** Not occasionally. Systematically. The loop would produce something, it would look right, I would accept it, and the defect would surface two slices later.

## The premise I borrowed, and it changed the shape of everything after it

The thing that reorganised this for me was not a tool. It was Ethan Mollick's *Co-Intelligence*, and then his talk, which I watched after finishing the book.

https://www.youtube.com/watch?v=9YMYVb1ASCg

The idea I took from it is one sentence: **treat it as a person.** A very large machine for imitating average human behaviour.

I had been treating the thing as a compiler that occasionally hallucinated. Once you treat it as an imitator of average human behaviour instead, some very concrete design consequences fall out, and they are the reason the rest of this piece looks the way it does:

- **Average humans agree too easily.** So two agents reading the same request will hand you one answer twice and you will mistake it for corroboration. If you want disagreement, you have to *design* it in. It does not occur.
- **Humans in a room cannot un-hear a number.** So if one estimate is spoken before the others, the others are anchored to it. Same machine, same problem.
- **Humans overestimate how often they got it right first time.** Which is *exactly the bias I had just caught in myself* — and it is a property of the tool too, because imitating us is what the tool does.

That last one is the sharp one, and it took me a while to sit with it. **I was not a fallible human working with a reliable machine. I was the same bias, appearing on both sides of the desk, agreeing with itself.** That is a materially different problem to solve, and nearly everything I built in August was built for it.

## Someone else's month looked like mine

Somewhere in the middle of all this I watched Matt Pocock's workflow video.

https://www.youtube.com/watch?v=-QFHIoCo-Ko

I am putting it here, before the cost, on purpose — because of what it did for me at the time. **It made me see I was on the right track.** A lot of the conclusions he had reached, I had already experienced in some form, in my own cave, without the words for them.

If you have never had that experience while learning something with no map, I am not sure I can convey how much it is worth. It is not "someone agrees with me." It is the first evidence that the ground under you is real.

And it was not only recognition. I took four things from him and all four are in the repositories now. **The UX of invoking a command** — what a human types, what the hint says while they are typing it, what a bare invocation does when they get it wrong. **The flow from a document of intent to tracked items** before anything gets built; mine lands on an issue with a closed description rather than on a PRD, but the movement is his. **The practice of writing decision records** as MADRs, with the rejected option and its trade-off on the page instead of only the choice. And **how to manage contexts**, which is the second of the four design decisions further down.

## What made deciding expensive

So: where did it go?

**I cannot show you the split**, and an invoice would not have told me anyway — it does not know which decisions inside a month were the wasteful ones.

What I can tell you is the design that made deciding cost so much, because I learned that one the hard way. **I put too many actors at the same level, all of them having to agree.** It felt like rigour. What it produced was that nothing got delivered — the agile loop I was trying to run stopped shipping, and not because anyone in it was wrong. Everyone had to converge before anything could move.

Conflict is not uniformly good, and that is the part I had backwards. **Some layers want it. Some layers must not have it.** Peers at one level who all have to agree is not more scrutiny; it is a loop that cannot close.

That is the cause. What follows is what it looked like from the inside, in the one loop whose every round is public — this one, which is not even on that invoice. Same month, same person, same habit. What is different is that this one you can open.

The clearest example I have is public, dated, and happened on the last day of the month, which is how I know I am not reconstructing it kindly. One pull request in my loop repository went through **eight review rounds and nine repair commits**, and every single round found *one more instance of the same class of defect*.

The class was never wrong. The diagnosis was right in round one. What was wrong was that I kept fixing instances instead of sweeping the set.

Watch the shape of it, because the shape is the lesson:

- **Round 1** — two files, one identifier. Fixed.
- **Round 2** — a wider pattern. 42 matches. Fixed.
- **Round 3** — a gap-tolerant pattern, six identifiers, 49 files, 369 matches. Fixed.
- Widening it once more took the same scope to **1,055 matches**.

And the instance that actually mattered **was not found by any of those sweeps.** It was found by a person reading the section, because the word it hid behind was not in my pattern's vocabulary.

There is a repair in the middle of that sequence that I think about a lot. It published a command that returned the whole set — and then hand-checked three members of it. **I verified the members instead of the set**, which is precisely why the next instance survived and cost another round.

Two other things from the same month, both cheap to describe and both expensive to have lived:

**A check that failed open.** I published a verification command with a quoting mistake in it. It returned zero lines. Zero lines *reads as clean*. It survived four rounds looking like proof.

**An instrument that lied.** The loop keeps its own record of what each agent costs to dispatch. When I finally audited it, it was **wrong about five of the seven profiles** — inflated for some, deflated for others. The thing that was supposed to tell me what my own loop cost me could not tell me.

## So — how do you notice?

This is the part I would want if I were you, so here it is as plainly as I can put it. **Three signals — and you read them the way you would read a human team.** None of them needs my setup, my tools or a repository:

**1. The same class of finding keeps coming back after you widened the search.** That is not thoroughness. That is you verifying members instead of verifying the set. Widening the same method a fourth time will not find it — the method is what is wrong.

**2. Your check came back empty and you felt relieved.** Empty and clean look identical and are not the same thing. Before you trust a green, break it on purpose and confirm it can go red. If it cannot fail, it is not a check.

**3. Your instrument disagrees with your memory and you believe your memory.** That is the moment. Every time.

And what you do in that minute is the same in all three cases, and it is not "try harder": **stop the round and change the ruler.** Not more effort against the same method — a different method, or a different reader. In my case the different reader was literal, and I will come back to that.

## It is not only me, and it has a name

The month ended and I found out the condition I had been describing as a cave already has a term. Clare, at AWS, calls it **frontier development**.

https://www.youtube.com/watch?v=pqlWNihgdjI

A frontier is territory with no map, where the only evidence is what you walked yourself. That is one word for four things I had been treating as four separate problems — no expectation anchor, no industry benchmark, no prior art, individual observations only. They are not four problems. **They are one condition, and it has a name.**

I called it a cave. She calls it a frontier. We are both describing the absence of a map, and I find it genuinely reassuring that we got there separately.

## The four things I changed

Everything above is what August cost me. This is what I bought with it. Four design decisions, in the order I arrived at them.

**1 · Brute force, plus feedback loops that actually feed back.**

I could not find the expectation anchor, so I stopped looking for one and replaced it with a process: set an objective, design the way the work happens, improve it, continuously, and let volume do what certainty could not. It is less elegant than knowing. It works, and knowing was not on offer.

**2 · Model the context windows, deliberately fresh.**

Subagents, and a skill library specialised per profile. The reason is Mollick's premise applied directly: **a reviewer that already holds the author's reasoning is not giving you feedback. It is agreeing with you, with extra steps.**

I have a receipt for this one. My last iteration closed by consulting seven profiles in isolation, each fed only its own artifacts. **The seventh one demolished, with evidence, a decision the process had already made** — a profile had been dropped from that consult set because a metric read zero for it, and it had in fact read six drafts across twelve rounds. None of the six before it caught that, because none of them could see anything but its own record.

And the counter-example, from the same week, stated by a fresh reviewer about itself. Arriving after eight rounds of review, it opened its verdict with: *"independent convergence is gone — nothing below is corroborated by it, including where we agree."* A reader counting nine reviews would have counted nine confirmations. It then found a blocker that all eight had walked past.

**Here is the honest half, because isolation is not free.** A fresh context inherits nothing, so it has to be briefed, and **a wrong briefing propagates faster than a wrong answer.** Three times in a single day an agent had to correct what I had handed it — a commit reference that did not resolve, a "denominator" in a sentence that stated none, a "the previous one listed two" that was three. Fresh contexts catch what continuity cannot. They also believe whatever you tell them, immediately.

**3 · Model the layers — and decide which ones are supposed to argue.**

Which layers exist at all; which ones I *want* conflict in; which ones have to be objective.

Upstream, at ideation, I want conflict. Two specialists reading one request from two different mandates return two different answers, and **the disagreement is the product.** They define and refine the backlog, which is the one artifact everything downstream reads — get it wrong there and it is wrong everywhere after, quietly.

Downstream — review, QA, the merge — I want the opposite. Objective, against a written Definition of Done.

The asymmetry is the whole design, and it comes down to what being wrong costs at each end. **Being wrong at ideation costs a described item nobody builds. Being wrong at the merge costs a deploy** — on this platform, merging *is* deploying. So: argue where correction is cheap, be boring where it is not.

I learned this by getting it wrong first. I built a roster like an org chart — nineteen profiles, one per concern — and it collapsed to six. **Everything that generated no disagreement turned out to be a handoff, and the handoff was why it never ran.** Three specialists existed and not one of them was ever called.

If you take one testable thing from this whole piece, take that one: **a profile with no counterpart is a handoff. A mandate with no trigger is a document.**

**4 · The main session is the interface to the human. It is not the manager.**

This is the mistake I am most interested in, because it was not laziness — it was the *obvious* design, and it was wrong.

I gave the orchestrating session the management work precisely because it seemed the safest place for it. It sees everything, so let it enforce everything. Then I counted: in one session, that session performed **120 write actions** — opening items, commenting, editing labels, filing. **None of them was interface with me.** The one context whose entire job is talking to the human had spent itself on bookkeeping, and my questions were queueing behind clerical work.

The balance came from a new profile that does the deciding — and the shape it took is the point. **It holds no tools at all.** It cannot dispatch, cannot edit, cannot run a command. It decides who acts next and writes that down; the main session executes it and gets its purpose back.

And that profile nearly shipped as the exact opposite of itself. I first built it by simply *omitting* the tools declaration, on the reasonable assumption that omitting a grant grants nothing. **Measured through the loader, with a filesystem side effect rather than by asking it — because a tool-less agent will happily tell you it ran the command — omission inherits every tool the parent holds.** The profile whose entire justification was holding nothing was holding everything.

I keep that one close. **Absence was the largest grant in the system, not the smallest**, and nothing I had written down would have told me.

## Where it all landed, and I did not plan this part

Reading the month back, every one of those corrections was pushing in the same direction, and I only saw it at the end.

**The loop had been turning into the Scrum I always wanted to see implemented in a real company and never once saw work that well.** Iterations with a real start and a real exhaustion condition. Ceremonies that actually run — the retrospective happened, in full, and nobody skipped it for being busy. Estimation with no anchoring, because the estimators never hear each other. A retrospective with no politics, because there is nobody in the room protecting a relationship. And a Definition of Done that genuinely gates, because a machine refuses the merge.

**What the agents removed is exactly what I had never managed to hold in place with people** — the ceremony that gets skipped because everyone is busy, the estimate that anchors because somebody said a number first, the retrospective that goes quiet because there is a relationship in the room.

There is a second convergence in here that I find harder to dismiss than the first. I run another harness, on a different runtime, for different work. When I finally exported one and compared it against the other, **24 of about 36 mechanisms were already present in both, and five of the agent profiles matched almost exactly** — arrived at separately, months apart, by me, without either one looking at the other.

I said earlier that the answer to *"how do you decide with no benchmark"* is not "you guess." Here it is properly: **you keep a record good enough that convergence becomes visible when it shows up.** A field gets its baseline when enough people describe the same thing separately and somebody writes it down. That is what the writing-down is for.

And one more piece of it, which is the actual resolution of the problem I opened August with. The agents estimate the work — I do not, which removes my bias by removing me. What they produce comes out in **story points**, and a story point is not an agent's unit. It is the unit corporate agile has been recording in Jira for fifteen years across thousands of projects. **The anchor I could not find in the future was sitting in the baseline that already exists.**

**Now the limits, because a piece that stops at the good part has sold you the easy version:**

- **This is one person, not a team.** Some of it works *because* there is nobody to negotiate with, and that is precisely the constraint real Scrum has and I do not. If you read this as "Scrum finally works," you have taken the wrong thing. What works is the shape: fixed cadence, isolated inputs, an explicit ruler at the exit, a human at the boundary.
- **Two of the rites do not exist yet.** They were designed at the end of the month and are not built.
- **The profile I just called my final balance has never actually run.** It was designed two days ago.
- **The story-point comparison has not been made.** Comparable in principle is not compared. Nobody has put a corporate velocity record next to mine, and until somebody does, that paragraph is a hypothesis with good reasons.

So the honest sentence is: **the loop now mirrors the model. It has not yet run a full iteration in that shape.** That costs the ending nothing, and it is the only version I would want to read.

## Where this goes next, and I have already hit the wall

I will end where the month ended, which is at a limit rather than a conclusion.

https://www.youtube.com/watch?v=vJEy3nP2_C8

Ryan Carson, on Greg's channel, is talking about scaling agent work onto cloud machines — getting out of the limits of your local environment. I did not go looking for that video. **I hit the ceiling it describes while doing ordinary work, and then watched it.**

Here is the ceiling, concretely. My last retrospective consulted seven profiles **one after another**, and the only reason was that there is one working tree and one git index, and two agents committing into the same tree corrupt each other. I split a piece of work across a second checkout to run two things at once, and one of the checkouts the harness created for me **was unwritable by every profile in the harness**, because of where it puts them.

And the uncomfortable part: **a second checkout does not solve what is actually blocking parallelism anyway.** Four slices editing the same file conflict in any topology. My review gate is one profile and reviews in a queue. And merging is deploying, so two parallel merges are two parallel deploys with nowhere to look first.

**Which is the real reason this is where the piece stops.** The constraint stopped being the model, and it stopped being the money too. It is one machine and one of me, and a phone in the dark at three in the morning is not a workstation — it is the symptom.

---

If you are somewhere near the same point — enough experience to know what good looks like in the old shape, and no idea what it looks like in this one — I would like you to take three things away and none of them needs my setup.

**Design the disagreement.** It will not happen on its own, on either side of the desk.

**Argue where being wrong is cheap, and be boring where it is not.** Upstream is where opinions belong. The gate is not.

**Write down what you did and why, even though nobody is asking.** Not for the record. So that the day somebody on the other side of the world describes your cave and calls it a frontier, you can check whether they mean the same thing you do.

There is one thing I already know about September: **no structural change to a loop in more than one project at the same time.** That is what most produces the feeling of discouragement — things starting to go wrong at once.

And when you do change a loop, be very narrow about it, and then watch what the loop's behaviour does with all of your attention and focus on it.

https://www.youtube.com/watch?v=S-sYlFiGFv8

One of the engineers in there says he had wanted to know how to program so he could make a video game, and that now every idea he has, he can put into practice.

That is how I feel making this site.

This is what I think.

Go and look at what your loops actually did last month — not the output, the *rounds*. Count how many of them found the same thing twice.

A hug, and see you next time.
