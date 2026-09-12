---
title: "I wrote down what my agents do. The half worth writing is the why."
slug: what-my-agents-do
date: '2026-08-25T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
contentIssue: 259
excerpt: "Garry Tan's talk sent me back to a file in my own repository: 55 behaviours, each with a line saying why it exists. That is the column I would keep if I had to throw the rest away, and the reason is that a model can fill in the rest."
takeaway: 'the inventory is the half a model completes on its own; what has to exist in writing is the central idea — the purpose, the limit, and the reason something was removed.'
---

Garry Tan, who runs Y Combinator, gave a short talk called *Every company should have a Brain*. No slides, no deck, just him talking.

https://www.youtube.com/watch?v=eBUyTS7SzV4

This piece turns on the difference between a receipt and a recollection, so: everything I attribute to him is reported in my own words, from no transcript. Every passage I quote verbatim is my own file, and I can point at the line.

It is a pitch — he says so himself, halfway through, and stops to stress-test it on the grounds that the room would do it for him anyway. I want to be precise about that word, because it usually arrives as an accusation and I do not mean it as one. **It describes the shape. It says nothing about whether the thing is right.**

One idea in it sent me back to my own repositories. This is how I have carried it since — his argument, my sentence:

> Retrieval is easy. Being worth retrieving from is the product.

The obvious objection is that most of the people watching do not have a company. I do not have one either. I have two repositories and weekends. He closes on exactly that, with a story: a friend whose son has a rare form of epilepsy, who built a repository of eighty thousand markdown files and pushed himself to the edge of what is known about that child's condition. A father, a laptop, and a library. Then he lands what makes it a claim instead of an anecdote — that is the same architecture he had spent the whole talk describing. Not a comparable one. The same one.

So it is claimed to hold at a scale of one, and I am a scale of one. So I went to look at what I had actually built, and at which part of it would survive being read by somebody who will never run any of it.

## The word for it

The vocabulary in the talk is a library: books, a librarian, three books open on a desk at once, a retrieval layer whose whole job is choosing which three. The word that has started to appear in AI for the same idea — organising a company's knowledge so that something can work from it — is **ontology**. It is not his word; he does not use it once and does not need it.

I am naming it anyway, because naming something you already have is what lets you go looking for other people who have built one, instead of quietly assuming you invented a filing habit.

## What I already had, and had not called anything

The loop that publishes this site is a plugin I built and operate. Eight personas, several of them there specifically to disagree with another one before anything gets written, hooks that refuse certain commands outright, a skill library, a set of decision records. All of it running, all of it in the open.

What I did not have until recently was one place saying what all of it *is*. So I wrote one — a registry, one entry per behaviour rather than per file, because one file can carry two behaviours and one behaviour can span three files. There are **55 entries** in it today. Each carries an id assigned once and never reused, one of five types from a closed list, a purpose, what it does — and a column for **what it does not do**.

**The column I care most about is the one that says what each behaviour is for**, and the reason is mechanical rather than sentimental. A model is good at completing the text once the central idea is captured. If somebody reads that file and understands what a piece of my harness is *for*, most of the rest reconstructs itself with the tool already open in front of them. What cannot be reconstructed is a decision nobody made. That has to exist in writing, because there is nowhere else for it to come from.

My own file defines the field drily, and the last three words are the rule: *"why the behaviour is wanted — the obligation, stated so a reader on a harness nobody here has measured can decide whether it matters to them. Never a content list."*

Never a content list. The list is the part I do not have to be careful about.

The last column belongs to the same family, and the file says why better than I could paraphrase it: *"The most transferable cell in the row: a limit is a property of the strategy, so it ports even where the mechanism does not."* Somebody running a completely different setup cannot use my hook. They can absolutely use the sentence saying what my hook fails to catch.

Purpose and limit are both reasons. Only the middle column is inventory, and it is the only one I would hand to a machine to draft — which is how I read his argument now. Being worth retrieving from is not about how much is in there. It is whether what is in there is the part that could not have been derived.

## Removal is the part nobody writes down

Here is the second thing.

My decision records have issued twenty-one numbers. **Seven are live. Fourteen are gone** — folded into other records when the decision they carried stopped being a decision of its own. And not one of those fourteen is simply missing. Each has a row in a table saying what it decided and where that decision lives now. The rule, written at the top of that table: *"A record leaves this library only as a disposition, never as an absence."* A test reads it in both directions: a number with no file and no row turns the suite red, and so does a row for a number that is still alive.

The same discipline shows up in the shape of the loop itself — and the numbers do not only go down. Nineteen personas were cut to six, and there are eight now. Sixty-nine skills were consolidated into fourteen, and there are fifteen. A count that only falls tells a story by itself; a count that falls and then climbs back tells none at all, and that is exactly the shape that stops being readable when nobody wrote down why. I am not working from my memory of why. I am reading the why.

**Tan names this failure mode, and he names it as the thing that kills a brain:** a brain nobody curates becomes a garbage dump with excellent search. The fix he offers is a role rather than a feature — a librarian, human plus agent, whose actual job is pruning.

That is the claim I have a receipt for. Pruning is not the part that feels like progress. It is the part that made the rest usable.

One thing I am leaving out, deliberately. Everything above is the part that worked. What none of it can check, and the two occasions where something was written down and then simply not read, is the next article — the one with the receipts I like least. Naming that costs a sentence; letting this one look finished would have cost more.

## If you want to start one

You do not need my tools or his. Three habits carried everything above, and none needs a repository:

**Write the reason, not the inventory.** Why the thing exists, and what it refuses to do. The list of what it does is the part you can afford to be lazy about — something will fill that in for you.

**When you remove something, leave a disposition, not a hole.** Where did that decision go. One line.

**Declare what is incomplete instead of letting it look finished.** A knowledge base that quietly under-claims and one that quietly over-claims fail the same way, and both fail silently.

So — go and look at whatever you have been writing down for the last three months. Not to admire it. Ask it one question: if somebody read only this, what would they have to guess? That is the line that should have been in there.

Good luck, and I hope you find yours in better shape than I found mine.
