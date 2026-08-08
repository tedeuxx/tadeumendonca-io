---
title: "The Green Checks That Verified Nothing"
slug: green-checks-that-verify-nothing
date: '2026-08-08T21:00:00.000Z'
tag: agentic
track: engenharia
hasVideo: true
excerpt: "One session of agentic development left me seven passing checks that proved nothing. Five are below, each with the file you can open — and the reason the loop accumulates them faster than it removes them."
takeaway: 'why a passing check can be worth nothing, and the one habit that finds it.'
---
https://www.youtube.com/watch?v=qyPCVqFUyDo

Boris Cherny's thesis in that conversation, paraphrased rather than quoted: the model is the product, and the layer around it should stay thin enough to get out of the model's way. He is right, and it is why the thing works.

The part nobody mentions is what is left standing once it does get out of the way. **Your gates are left standing — and an agentic loop is extremely good at producing something that passes.** A check that verifies nothing looks exactly like a check that verifies everything. Both are green. In one session I found seven of them here; five are below, and the first one is the worst.

## Four, from one session

**The queue that grew while Google received nothing.** Analytics here loads only after the reader accepts, and the shim that queues commands for GA4 was written the way TypeScript wants it written — a rest parameter pushed onto `dataLayer`. Type-correct, callable, and it grew the queue on every call. But `gtag.js` only honours a queue entry as a *command* when it is an `arguments` object; a genuine Array is ignored in silence. The test asserted the queue had grown. It had. GA4 received nothing at all. [The shim](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/analytics.ts) carries the reason it is spelled the awkward way, and [the guard](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/analytics.test.ts) now asserts the *shape* of each entry, because the length was equally true of the working version and the broken one.

**The scanner that read none of the build tooling.** [`sonar-project.properties`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/sonar-project.properties) said `sonar.sources=src`. So the blocking quality gate analysed zero lines of `scripts/` — which on a site with no backend is not a detail: that directory holds the single source of truth for every public URL, the prerender that produces the served HTML and its social tags, and the sitemap generator Google reads. The most consequential code in the repository was the code no static analysis had ever looked at, and the gate reported clean the whole time.

**The job that passed by not running.** Every CI job here filters on which files changed, which is correct and which is where this hid. The decision records are compiled into a committed artifact the site renders, and a test fails when the two separate — a good guard. The filter did not list `docs/adr/**`. So a pull request touching only decision records skipped the test job entirely and the aggregate check reported success, having verified nothing. The guard was never wrong; it simply never ran on its own trigger. [`app.yml`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/.github/workflows/app.yml) now names the three cases apart, so a pass that skipped everything says so in as many words.

**The test whose name claimed every URL and checked one.** A test called *every advertised URL resolves to its own prerendered page* fetched the sitemap and then checked exactly one address. The name was the specification; the body was a smoke test. The real property — that no advertised URL serves the home page's metadata under someone else's address — is a different assertion, and it is the one that had to be written. [`seo.spec.ts`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/e2e/seo.spec.ts) carries both now: the narrow one renamed to what it does, and the all-of-them one beside it.

## The fifth, which reading was never going to find

Articles carry a `track`, and the parser keeps a known value and falls back to `engenharia` for anything else. Every fixture and every published article carried `track: engenharia` — which is *also* the fallback. Both branches of that ternary returned the same value. A membership test that always answered *false* would have passed the entire suite.

There is nothing to notice. [The parser](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/content.ts) looks right, the tests look thorough, and the coverage line counts the branch as taken. And nothing found it on purpose: it surfaced as a side effect of an unrelated tidy-up, turning a two-element array into a Set because a Set says at the declaration what an array only implied. The defect was what the change exposed, not what anyone went looking for. [The test](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/content.test.ts) now pins the other value explicitly — and mutation is what proved the replacement could fail, in both directions, which is the job it actually does here.

## Why the loop makes this easier to accumulate, not harder

None of the five is a mistake in the ordinary sense. Each is a competent artifact that satisfies the goal it was given, and the goal it was given was *make the check pass*. An agent is very good at that, which is the point of using one — and it means the cheapest path to green is always available, including the paths where green means nothing.

I approved all five. Not one of them looked wrong on review, and I want to be exact about why: reviewing a check tells you whether it is well written, not whether it can fail. Those are different questions and only one of them is answerable by reading.

So the honest shape of it is not "the agent made mistakes I would not have made". It is that the loop moved my bottleneck. Producing verification became nearly free; deciding whether the verification is real did not, and there is now much more of it arriving per hour than there used to be.

## What I do now, and what it still does not fix

One habit, and it is mechanical rather than clever: **break the source, not the test.** Change the line the assertion exists to protect, run it, and confirm it goes red. If it stays green the assertion is decoration. It costs a minute, and it is worth being exact about what it buys. Not discovery — it is not how any of these came to light. It answers the one question review cannot: whether an assertion can fail at all.

It does not fix everything, and two of the gaps are structural. It only reaches assertions I think to mutate — the fifth one above sat under a suite nobody suspected. And it cannot touch a filter that skips a job at all, because there is no source to break: the job did not run, so there is nothing to make red. That class needs a different answer, which is that an aggregate check has to report *what* it verified rather than only that it passed. Mine does that now. It did not before, and I do not know how long it had been that way.

None of this is an argument against the tools. I would not have built this in the time I had without them, and I have said so elsewhere on this site. The narrower claim is the one I would defend: the faster you can produce something that passes, the less a pass is worth on its own — and the more of your attention has to move from writing the check to proving it can fail.
