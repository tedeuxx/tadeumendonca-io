---
title: "How to run your Claude Code like an AI-native company"
slug: what-my-agents-do
date: '2026-08-25T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
contentIssue: 259
excerpt: "Garry Tan breaks an AI-native company into four pieces that are all markdown, and a fifth one underneath: the brain. I took that breakdown and ran it against a loop I had already built without having seen the talk. Four of them matched. The one that did not is the one that matters."
takeaway: 'the four pieces of his company are files, which is why you can rearrange them; the brain is what makes the rearrangement teach you anything — and the discipline holding both up is to never do one-off work.'
---

https://www.youtube.com/watch?v=eBUyTS7SzV4

Garry Tan, who runs Y Combinator, gave a short talk called *Every company should have a Brain*. No slides, no deck, just him talking. It is about AI-native companies — the ones already running on Claude, on Codex, on harnesses built around them.

The conference published the [full timestamped transcript](https://ai.engineer/talks/eBUyTS7SzV4). So from here on, what is his goes in quotes with the minute on it, and you can check me. What is mine goes in quotes too, and for those I point at the file. A receipt and a recollection are not the same thing — and until last week all I had of this talk was the recollection, which is an awkward thing to admit in a piece about memory.

The whole argument fits in one sentence, at 3:17: *"the leverage is not in the weights. It's in how you wire the work."* He contrasts the people getting 2x with the people getting 100x on exactly the same Claude.

It is a pitch, and he treats it as one — he opens by saying this is the room that will stress-test his numbers. Not an accusation: it describes an approach, and there is more than one. His revenue and headcount numbers I am not repeating here, because the only place I found them was the talk itself, and one source is not a source.

He is describing companies with people in them. I am one person with two repositories and weekends. What I did was take his breakdown and run it against something I had already built without having seen the talk — piece by piece, to see what matched and what did not.

## A company expressed in files

The part that got me is that he never says "use AI". He describes the functions of a company, and each function is a file.

At 4:31: *"A skill file is an employee. It has one capability, one job, written down clearly enough that someone can execute it."*

At 5:02, about the table you end up creating when `CLAUDE.md` gets too big: *"That's an org chart. A task comes in, and the resolver decides who handles it and where it goes."*

Then filing rules, which are the internal process. And at 5:23, the tests that check whether the routing actually works — *"When I need to alter a test file, does test.md actually get loaded?... Those are performance reviews."*

And at 5:52, the sentence that ties the four together: *"you're not writing software, you're hiring, training, and managing a workforce made of markdown."*

I went and checked the four against my own loop. The interesting part is not that they matched — it is that I had chosen none of those names:

- **Skill file = employee.** Fifteen declared skills, one per subject.
- **Resolver table = org chart.** Here it is a table that decides, per kind of work, which reviewers get involved: `loop`, `product`, `content`.
- **Filing rules = internal process.** The rule my decision library runs on, which I quote in a minute.
- **Trigger evaluation = performance review.** A suite that reads the skill list in both directions: a declared skill that does not exist turns it red, and one that exists and was never declared does too.

Four for four, and not one of them built from theory. Those four are his table. There is a fifth thing underneath it that is not in the table — and that is the one that did not match.

## Keep judgment in the model, and state in code

Before the fifth, the line I most wish I had had in writing three years ago.

At 9:02 he splits computation into two places it can live. *Latent space* is the model: taste, judgment, working out what somebody meant by a vague request — the non-deterministic calls, steered with markdown. *Deterministic space* is ordinary code, which executes and holds state.

The bug source he names is putting work on the wrong side of that line.

His example is seating eight hundred people so that everyone's neighbour is worth meeting. The model judges who fits with whom. But where each person is sitting, at 9:56, *"must not live in the context window."*

That is my loop's architecture described by somebody else, and I had never had the words for it. The personas argue, weigh, hold opinions: judgment. Who may merge, what is irreversible, which verdict authorises what: those are hooks, and a hook has no opinion. I did not get there by theory. I got there by putting things on the wrong side of the line and paying for it.

## The brain, and what it costs

At 12:55, a company's brain is *"the library plus the librarian."* And at 13:21: *"Retrieval is easy. Being worth retrieving from is the product."*

He is blunt about what kills it, at 14:27: *"a brain nobody curates becomes a garbage dump with great search."* And the fix he offers, at 14:46, is a role rather than a feature — provenance on every fact, contradiction checks, and *"a librarian, human plus agent, whose actual job is pruning."*

That is the claim I have a receipt for.

Decisions here are MADRs, and the rule that library runs on is the title of one of its own records: *"An ADR earns its place by explaining the **current** codebase."* A record that stopped explaining the current codebase does not get a banner across the top saying it is out of date. Its file leaves the repository, and the trace stays as a row in a different file, under a clause I can point at: *"A record leaves this library only as a disposition, never as an absence."*

Twenty-one numbers have been issued. Seven are live. The fourteen that are gone each have a row saying what they decided and where that decision lives now. And a test reads it in both directions: a number with no file and no row turns the suite red, and so does a row for a number that is still alive.

Pruning is not the part that feels like progress. It is the part that made the rest usable.

And at 16:22 comes the sentence I cannot get out of my head: *"The organization that captures what it learns like this gets smarter every single day. The one that doesn't wakes up every morning with amnesia, no matter how good the model is."* And at 16:35: *"Model quality is rented."* The brain is the part you own.

Here I have to be honest about scale, because this is where his analogy touches my life and does not fit. Knowledge that does not leave when the people leave is a claim about organisations, and I am not one. What I have is the one-person version, and it is less impressive and just as real: what I wrote down still works after I have forgotten it. I have tested that by accident several times, coming back to a file of my own six months later remembering none of it.

## Never do one-off work

If you take one thing from here, take this one, and you can do it this week.

At 15:46 he lays out the whole cycle: give the agent the task, look at the output, correct what is not good enough — and then, once it is good, *"skillify it"*: turn the workflow that worked into a skill you can reuse. The order matters. You capture **after** correcting, so the skill is born with the correction already in it.

The standard he holds it to is harsh, at 16:05: *"if you have to ask for something twice, you failed."*

I read that and went to look at what I actually did. Sixty-nine skills became fourteen, and there are fifteen now. Nineteen personas became six, and there are eight now. A count that only falls tells a story by itself; a count that falls and then climbs back tells none at all — and that is exactly the shape that stops being readable the moment nobody wrote down why. Which is why each entry has to say what that behaviour is *for*, and what it does *not* do.

## What one has to do with the other

It took me a while to see that the two ideas are the same piece from two sides.

You can only rearrange the profiles because what each one does is not inside a person. An org chart of people cannot be re-run in a different shape; an org chart of files can. And you only learn anything from the rearrangement if the record says what each piece was there for — otherwise you changed the shape, the result changed with it, and you have no idea why.

So writing down what each piece is for is not tidiness. It is the only thing that lets you change the shape and learn from having changed it.

And here is the limit, before you reach it on your own: I do not have the measurement. I have not run two arrangements side by side to compare which produces more. What I have is the record that makes the comparison possible, and the counts above are change over time, not an experiment.

One thing I am leaving out, deliberately. Everything above is the part that worked. What none of it can check, and the two occasions where something was written down and then simply not read, is the next article — the one with the receipts I like least. Saying that costs me a sentence; letting this one look finished would have cost more.

He closes, at 18:15, by listing what is portable: *"Use skill files as employees. The library and the librarian. Never do one-off work. Those travel with you to any stack."* Mine travels as a plugin, in the other repository — the one thing here built to be carried off by somebody else. That it can be is not why I wrote it: I wrote the reasons for myself, and only afterwards found out the reasons were the part that could leave.

What this piece does not carry is the drawing. The tiers, what each one is *not* allowed to do, and how a change crosses them are on [the architecture page](/architecture) — the same loop, laid out to be inspected rather than read.

Good luck, and I hope you find yours in better shape than I found mine.
