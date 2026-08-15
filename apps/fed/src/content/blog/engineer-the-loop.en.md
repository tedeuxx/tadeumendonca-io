---
title: "Why I Engineer the Loop, Not Just the Code"
slug: why-i-engineer-the-loop
date: '2026-08-14T12:00:00.000Z'
tag: harness-engineering
track: engenharia
excerpt: "Before I ever opened an AI coding tool, I already thought in terms of pipeline, gate and review. Agent Harness Engineering isn't a new idea I picked up from working with agents — it's an old one, aimed at a new object."
takeaway: "why engineering the loop — not the code inside it — is the actual differentiator, and the three traditional practices it comes from."
---
Most people who point an AI coding tool at their work end up doing the same thing faster, inside a process that never changes. I went a different way: I engineer the loop itself — how a change travels from an idea to something live, and every gate and guard it passes through on the way. The code that comes out is the loop's output, not the point of the exercise.

I want to be precise about where that came from, because it's easy to assume the opposite. **This didn't come from working with agentic AI first and generalizing from it.** It came from my career, from long before "agentic" was a word anyone used at work. I already thought in terms of pipeline, gate and review — that was ordinary architecture and DevOps thinking, years before an AI dev-loop was a thing to build. Pointing that same reasoning at an AI-driven loop wasn't a new idea for me. It was an old one, finding a new object.

## Three things I already knew, applied to a new object

If you've worked in software delivery for any length of time, you already know these three practices. What's different here is that they're not written down as policy anyone has to remember — they're mechanisms, checkable in the repository that runs them.

**Mandatory CI/CD gates before a deploy.** A pipeline that doesn't actually run and block on failure isn't a gate, it's decoration. In this loop, "done" is defined by a skill (`quality-gates`) and enforced mechanically: a hook (`permission-guard.sh`) refuses the merge command from every agent role except the one persona whose job is to review — `quality-assurance`. Nothing ships on an AI's self-report that it's finished. A required check has to actually run and actually block, the same way it always should have.

**Peer architecture review before you start building.** Long before anyone wrote code on my teams, a design got looked at by someone who didn't write it — that's what design review and ADRs are for. This loop does the same thing at intake: two personas, `product-lead` and `tech-lead`, have to close a piece of work's description together — reconciling what it needs to deliver and how it should be built — before a third persona is ever allowed to start building it. The disagreement happens on purpose, before anything is built, not after.

**Least-privilege access, the same discipline as segregation of duties.** You don't hand everyone the keys to everything just because it's convenient. This loop enforces that at the tool level: the persona that builds has no way to merge its own work — the same hook that denies the merge command to everyone except the reviewer denies it to the builder by construction. The persona that reviews has no `Edit` tool at all, so it cannot quietly rewrite what it's supposed to be judging. It's the same access segregation any regulated environment already asks for; here it's just enforced by what each role is literally handed, not by a rule someone has to remember to follow.

## No incident to point to — and that's the honest version

I don't have a single story to tell you here — one bad deploy, one review that would have caught it. I looked for one, honestly, and there isn't one worth narrating. What I have instead is a pattern I recognize across a career: the shape keeps showing up, and I keep reaching for the same fix. This is that fix, aimed at a new kind of work.

## Where to actually see it

Everything above is checkable, not just claimed. `/architecture` on this site is the machine itself, in the open — the gates, the review pyramid, which parts of the loop can actually stop you and which only advise. The loop lives in a separate, public plugin — [tadeumendonca-skills](https://github.com/tedeuxx/tadeumendonca-skills) — with six personas (two leads that disagree by design at intake, a builder, a second builder for published writing, a gate, and `harness-lead`, whose counterpart is me rather than another persona) and thirteen skills the model reaches for on its own. None of it is agents running unattended in production. It's a development loop, engineered the way I'd want to be hired to build one.
