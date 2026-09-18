---
title: "How to run your Claude Code like an AI-native company"
slug: what-my-agents-do
date: '2026-08-25T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
contentIssue: 259
excerpt: "Garry Tan's talk is about AI-native companies — the ones running on Claude, on Codex, on harnesses. I run the same architecture on two repositories and weekends. What holds it up is not any of those products: it is a written model of your own loop, and the discipline to delete the parts of it that stopped being true."
takeaway: 'the products are the part you can swap; what has to be written down is the model of your own loop — why each piece exists, what it refuses to do, and where a decision went when you threw it out.'
---

https://www.youtube.com/watch?v=eBUyTS7SzV4

Garry Tan, who runs Y Combinator, gave a short talk called *Every company should have a Brain*. No slides, no deck, just him talking. It is about AI-native companies — the ones already running on Claude, on Codex, on harnesses built around them — and about what those companies have to keep in writing for any of it to pay off.

This piece turns on the difference between a receipt and a recollection, so: everything I attribute to him is reported in my own words, from no transcript. Every passage I quote verbatim is my own file, and I can point at the line.

It is a pitch — he says so himself, halfway through, and stops to stress-test it because the room would do it for him anyway. I mean the word descriptively. **It describes an approach. There is more than one.**

He is describing companies. I am one person with two repositories and weekends — and one idea in that talk still sent me to look at what I had actually built, and at which part of it would still be standing if you took the products away.

## How this runs, and the decisions underneath it

The loop that publishes this site is a plugin I built and operate. Eight personas, several of them there specifically to disagree with another one before anything gets written; hooks that refuse certain commands outright; a skill library; a set of decision records. Work enters as an issue, one lead argues with another about what it is worth, something builds it, and a gate that did not write it decides whether it ships. All of it running, all of it in the open.

None of that answers the question I had just asked myself. The products are what the loop runs on, and they are also the part I can swap. What took the work was the decisions underneath, and two of them carry most of the weight.

The first is who gets to exist at all. A persona here is not a job title — it earns its place by producing a disagreement somebody needs to hear. A mandate with no trigger is a document, and an agent with no counterpart is a handoff. I did not start there, and arriving at it cost me most of what I had built.

The second I trust least and use most: **the loop is a machine for grinding work down, not for generating it.** A review that comes back with twenty-two findings has quietly turned one slice into fifteen. So anything a gate notices that is not the slice in front of it gets named out loud and left alone.

What those two decisions eventually produced is a file — the model of my own loop, written down instead of carried around in my head. One entry per behaviour rather than per file, because one file can carry two behaviours and one behaviour can span three. Each entry has to say what the behaviour is *for*, and what it does *not* do. The rest of the row is inventory, and the inventory is the part I would hand to a machine to draft. Which is how I read his argument now: it is not about how much is in there. It is whether what is in there is the part that could not have been derived.

That is the story of it. The architecture itself — the tiers, the gates, the diagrams, the parts I am still arguing with — is written up in full on [the architecture page](/architecture), and that is where I would go next.

## Reassess it, and be willing to throw the thing out

There were nineteen personas once. Most of them never ran.

They were an org chart: one role per concern, a specialist for every noun I could think of. An org chart made of agents mostly produces handoffs, and a handoff is a thing that does not happen. I cut them to six. There are eight today, and the ones that came back had to come back against a written rule about what a persona is for — not because the chart had a hole in it. The skill library went the same way and did not stay put either: sixty-nine skills consolidated into fourteen, and there are fifteen now.

A count that only falls tells a story by itself. A count that falls and then climbs back tells none at all — and that is exactly the shape that stops being readable the moment nobody wrote down why.

So the throwing-out is the part that gets tracked hardest. Decisions here are MADRs, and the rule that library runs on is the title of one of its own records: *"An ADR earns its place by explaining the **current** codebase."* A record that stopped explaining the current codebase does not get a banner across the top saying it is out of date. It gets deleted — and the deletion is the tracked event. Twenty-one numbers have been issued. Seven are live. The fourteen that are gone each have a row saying what they decided and where that decision lives now, under a clause I can point at: *"A record leaves this library only as a disposition, never as an absence."* A test reads it in both directions — a number with no file and no row turns the suite red, and so does a row for a number that is still alive.

**Tan names this as the thing that kills a brain:** one that nobody tends becomes a landfill with excellent search. The fix he offers is a role rather than a feature — a librarian, human plus agent, whose actual job is pruning.

That is the claim I have a receipt for. Pruning is not the part that feels like progress. It is the part that made the rest usable.

One thing I am leaving out, deliberately. Everything above is the part that worked. What none of it can check, and the two occasions where something was written down and then simply not read, is the next article — the one with the receipts I like least. Saying that costs me a sentence; letting this one look finished would have cost more.

## The word for it

His vocabulary for all of this is a library: books, a librarian, three books open on a desk at once, a retrieval layer whose whole job is choosing which three. The word that has started to appear in AI for the same idea — organising what somebody knows so that something else can work from it — is **ontology**. It is not his word; he does not use it once and does not need it.

I did not set out to build one, and what makes that file an ontology rather than notes is the dull part. The ids are assigned once and never reused. The types are *"one of five, closed and gated"* — my own file's words, and the clause after them is the one that counts: *"A name outside the set reddens the suite."* A vocabulary that is only a convention is not a vocabulary. Something has to be willing to fail over it.

Which is also why it matters once a model is the one reading. Elsewhere in the same file I had already written down what a loose vocabulary does: a value *"re-decided on every invocation would look exactly like a derived one and be neither."* That is the failure, and it is not a wrong answer. It is an answer regenerated every time, indistinguishable from one somebody decided once.

Every file I have quoted here sits in the other repository — the plugin, the one thing here built to be carried off by somebody else. That it can be is not why I wrote it: I wrote the reasons for myself, and only afterwards found out the reasons were the part that could leave.

So I am naming it late, and naming it anyway. Putting a word on something you already have is what lets you go looking for the other people who built one, instead of assuming you invented a filing habit. Good luck, and I hope you find yours in better shape than I found mine.
