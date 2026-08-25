---
title: "I wrote down what my agents do. The half worth writing is the why."
slug: what-my-agents-dont-do
date: '2026-12-31T12:00:00.000Z'
tag: harness
track: engenharia
hasVideo: true
excerpt: "Garry Tan's talk sent me back to a file in my own repository: 33 behaviours, each with a line saying why it exists. That is the column I would keep if I had to throw the rest away, and the reason is that a model can fill in the rest."
takeaway: 'the inventory is the half a model completes on its own; what has to exist in writing is the central idea — the purpose, the limit, and the reason something was removed.'
---

Garry Tan, who runs Y Combinator, gave a twenty-minute talk called *Every company should have a Brain*. No slides, no deck, just him talking.

https://www.youtube.com/watch?v=eBUyTS7SzV4

It is a pitch. He says so himself, halfway through — *"let me stress test my own pitch because you would anyway"* — and I want to be precise about that word, because it usually shows up as an accusation and I do not mean it as one. **Pitch describes the shape of the thing. It says the talk is organised to persuade you. It says nothing about whether it is right.**

One line in it sent me back to my own repositories:

> "Retrieval is easy. Being worth retrieving from is the product."

So I went to look at what I had actually built, and at which part of it would survive being read by somebody who will never run any of it.

## The word for it

The vocabulary in the talk is a library. Books, a librarian, three books open on a desk at once, a retrieval layer whose whole job is choosing which three. It is a good image and it carries the argument without any help.

The word that has started to appear in AI for the same idea — organising the knowledge of a company so that something can actually work from it — is **ontology**. It is not his word. He does not use it once in twenty minutes, and he does not need it: the talk describes the thing perfectly well without it.

I am naming it here anyway, and for one reason. Naming something you already have is what lets you go looking for other people who have built one, instead of quietly assuming you invented a filing habit.

## The scale question, which he answers himself

The obvious objection to "every company should have a brain" is that most of the people watching do not have a company. I do not have one either. I have two repositories and weekends.

He closes the talk on that exact objection, and he closes it with a story rather than an argument: a friend whose son has a rare form of epilepsy, who built a repository of eighty thousand markdown files — *"a company brain for one small boy"* — and pushed himself to the edge of what is known about that child's condition. A father, a laptop, and a library. Then he says the thing that makes it a claim instead of an anecdote: *"That is the exact architecture I've been describing for the last 20 minutes."*

So the architecture is claimed to hold at a scale of one. I am a scale of one. That is the only reason I have anything to say here at all — it is not that I run a company like the ones in the talk, it is that the talk says the shape does not need one.

## What I already had, and had not called anything

The loop that publishes this site is a plugin I built and operate. Seven personas that argue with each other before anything gets written, hooks that refuse certain commands outright, a skill library, a set of decision records. All of it running, all of it in the open.

What I did not have until recently was one place that said what all of it *is*. So I wrote one — a registry, one entry per behaviour rather than per file, because one file can carry two behaviours and one behaviour can span three files. There are **33 entries** in it today. Each one carries an id assigned once and never reused, one of five types from a closed list, a purpose, what it does — and a column for **what it does not do**.

**The column I care most about is the one that says what each behaviour is for**, and the reason is mechanical rather than sentimental. A model is good at completing the text once the central idea is captured. If somebody reads that file and understands what a piece of my harness is *for*, most of the rest can be reconstructed with the tool already open in front of them. What cannot be reconstructed is a decision nobody made. That part has to exist in writing, because there is nowhere else for it to come from.

My own file defines the field in the driest way available, and the last three words are the whole rule: *"why the behaviour is wanted — the obligation, stated so a reader on a harness nobody here has measured can decide whether it matters to them. Never a content list."*

Never a content list. The list is the part I do not have to be careful about.

The last column belongs to the same family, and the file says why better than I could paraphrase it: *"The most transferable cell in the row: a limit is a property of the strategy, so it ports even where the mechanism does not."* Somebody running a completely different setup cannot use my hook. They can absolutely use the sentence that says what my hook fails to catch.

Purpose and limit are both reasons. Only the middle column is inventory — and the middle column is the only one I would hand to a machine to draft.

Which is also how I read Tan's line now. Being worth retrieving from is not a property of how much is in there. It is whether what is in there is the part that could not have been derived.

## Removal is the part nobody writes down

Here is the second thing.

My decision records have issued twenty numbers. **Six are live. Fourteen are gone** — folded into other records when the decision they carried stopped being a decision of its own. And not one of those fourteen numbers is simply missing. Each has a row in a table saying what it decided and where that decision lives now. The rule, written at the top of that table: *"A record leaves this library only as a disposition, never as an absence."*

There is a test that reads it in both directions. A number with no file and no row turns the suite red. A row for a number that is still alive turns it red too.

The same discipline shows up in the shape of the loop itself. Nineteen personas became seven. Sixty-nine skills became fourteen. Every one of those cuts carries a date and a reason, and I can go and read them. I am not working from my memory of why; I am reading the why.

**Tan names this failure mode, and he names it as the thing that kills a brain:** *"a brain nobody curates becomes a garbage dump with great search"*, and the fix he gives is a role rather than a feature — *"a librarian, human plus agent, whose actual job is pruning."*

That is the sentence I have a receipt for. Pruning is not the part that feels like progress. It is the part that made the rest usable.

## What none of it can check, and my own file says so

Now the honest half, because a piece that agrees with a pitch and stops there has sold you the easy version.

**Nothing I built can tell whether any of it is true.** The purpose column is unfalsifiable — that word is in my own file: *"No instrument in this repository can tell a true purpose from a plausible one, or a limit that is complete from one that is merely well-written."* An entry whose reasoning went stale two months ago passes every check I have.

**And capturing the central idea does not make anybody read it.** Two receipts, both mine. One of my decision records described a file that had been deleted five hours before the record was written — false the day it shipped, and still false weeks later, because nobody re-reads a decision record. And in one session I wrote a rule into a guide, that an enumeration fails open, and then the very next list written under that rule left out the exact file the rule had been written about. The idea was captured. It was captured and then not consulted. Both of those are retrieval failures, not authoring failures, and nothing in my registry touches them.

Notice what went stale in the first one, though. It was a file path.

Exactly one half of the registry is checkable, and only because of a formatting decision: the quoted limit has to be the source's own words, verbatim, so a script can grep for it. A paraphrase would have been nicer to read and impossible to verify.

And the coverage table declares itself **incomplete** rather than looking finished. Six skills still have no entry. Writing six thin ones to turn that declaration green is precisely the failure the file exists to prevent, so it says `partial` and names which six. Absence is a value there, never a gap — which sounds like bookkeeping until the first time you look at a knowledge base and cannot tell "we decided this is out of scope" from "nobody got to it."

## If you want to start one

You do not need my tools and you do not need his. Three habits carried everything above, and none of them requires a repository:

**Write the reason, not the inventory.** Why the thing exists, and what it refuses to do. The list of what it does is the part you can afford to be lazy about — something will fill that in for you.

**When you remove something, leave a disposition, not a hole.** Where did that decision go. One line.

**Declare what is incomplete instead of letting it look finished.** A knowledge base that quietly under-claims and one that quietly over-claims fail the same way, and both fail silently.

So — go and look at whatever you have been writing down for the last three months. Not to admire it. Ask it one question: if somebody read only this, what would they have to guess? That is the line that should have been in there.

Good luck, and I hope you find yours in better shape than I found mine.
