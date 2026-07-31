# Catalog-ready — the bar for publishing a project

The **catalog** is the "além do SPA" surface of the public presence: a curated set of public GitHub
repos — automations, agents, MCP servers, AI-native tools — that back the **AI Engineer / agentic
development** positioning with real code. The portfolio on `tadeumendonca.io` links to them
(`apps/fed/src/data/catalog.ts`), and each graduated project seeds a **newsletter edition, distributed to
LinkedIn and X together** (ADR-0038).

Most raw material starts as a Claude cowork project. This doc is the bar it must clear to **graduate**
from cowork to a public catalog repo. The gate is deliberately about *proof of engineering*, not polish
for its own sake: someone who opens the repo should immediately see an AI Engineer who ships.

## What this bar governs — and the one repo it does not

It governs **projects that graduate into the catalog** — things you install and run. `tadeumendonca-io`,
the platform repo, is listed in the catalog because it **is** the site, not because it graduated onto
its own shelf, and it is measured differently.

**Where the line actually falls.** Not adopted-vs-not: this repo is emphatically meant to be taken from
— replicating it is the invitation `/architecture` makes under *"Replicate it for your own context"*,
and `/portfolio` says the catalog is there *"to study, clone and use."* A reader really does clone this
and run it. **What they end up running is their own site, not this one.** That is the difference the
checklist cannot see: for a catalog project the artifact *is* the deliverable, so *does it install, does
it run, what breaks* are the whole question. Here the structure is the deliverable and the artifact is
one worked example of it — which is what `/architecture` means by **"Take the pattern, not the
specifics."**

**The twelve boxes, accounted for — all of them, because a partial partition is how this section would
become the thing it argues against.** Row titles are the box titles verbatim; if the checklist below
changes and a row does not, the row is wrong.

| box | platform |
|---|---|
| Solves a real problem from my own workflow | **passes** — and the box's other half, *not a toy or a tutorial reproduction*, is the half it clears outright |
| Demonstrates an agentic / AI-native pattern | **fails** — see below |
| Python-first where it fits | **passes** on the box's own terms: *"a sharp TS/MCP tool qualifies"* |
| A clean clone runs by following the README only | **scoped out** — what a clone produces is *your* site, not a copy of this one |
| Config via env vars with a committed `.env.example` | **passes** — `apps/fed/.env.example`, added because writing this row is what revealed it was missing. It serves the row above rather than contradicting it: what a forker configures is *their* site's origin and analytics, which is the point |
| No secrets in history | **passes** |
| No client references, and no war-story that identifies a client | **passes** |
| A LICENSE | **passes** — MIT on the software, editorial content reserved. Two files: `LICENSE` is the exact MIT text so GitHub can classify it, `NOTICE` states the boundary |
| A README in the new framing | **partly substituted.** *What it does · the real problem · the stack* are in the root README. *The agentic pattern* is the failed box above. *How to run* is scoped out with the box above it. *One honest limitation* is published on `/architecture` instead of in the README — a substitution, not a satisfaction |
| Names each explicit choice and its trade-off | **passes** — that is what the ADR library is |
| Green on its own basics | **passes**, by a stricter mechanism than the box asks for (below) |
| Newsletter-ready: there's a story | **passes** |

Nine pass, one fails, one is scoped out, one is partly substituted. Nothing is claimed for boxes that are
not listed, because they are all listed.

*(This table is an enumeration, and two paragraphs down this document warns against keeping a fourth copy
of a list that drifts. The difference is **diff visibility**: the source of these rows is forty lines
below them in this same file, so a change to a box that does not update its row shows up in one hunk, to
the person making it. The CI-gate list this doc declines to copy lives in a workflow file nobody editing
this document has open. If this table is ever moved away from the checklist, it becomes the thing being
warned about.)*

**The failed box, said plainly rather than dissolved into a scoping question:** *demonstrates an agentic
/ AI-native pattern.* This site's shipped artifact is a static SPA, and a static SPA is not an agentic
tool. The repo is **built** agent-first — a claim about its process, not about what it hands you — and
the agentic artifact of this work is the reusable loop in
**[tadeumendonca-skills](https://github.com/tedeuxx/tadeumendonca-skills)**, a different repo. Scoping
does not rescue that box, and pretending the question does not apply would be exactly the move this
section exists to avoid.

That is a **scoping** statement, not an exemption, and saying so matters because changing a standard so
the one item measured against it passes is otherwise indistinguishable from convenience. What the
platform is held to instead is **heavier on the axis of construction rigor, and simply different on the
axis this checklist measures** — which is legibility to an adopter. Those are not points on one scale,
so a bare *"held to more"* would be flattery. Where the comparison **is** like-for-like it holds and is
checkable: this bar accepts *"green on its own basics **or a documented 'how I verified it'"*** — a prose
claim — where the platform is held to blocking CI. The substitutes are an ADR library recording every
**load-bearing** decision and the trade-off it cost, those gates (see
[ADR-0018](./adr/0018-ci-gates-e2e-on-pr-coverage.md) — enumerating them here would be a fourth copy of a
list that has already drifted once), and `/architecture`, which publishes how the site is built including
its own honest limitation. The ADRs are public and so is the CI config, so none of that has to be taken
on trust.

Two consequences, so this cannot be read as the bar getting easier:

- **Nothing below is weakened for catalogued projects.** If a future edit softens a box, it has gone
  wrong; this section changed *who* is measured, never *what* is demanded.
- **A future catalog entry does not inherit the exception.** The platform is the only repo that hosts
  the catalog. Anything else that appears on the shelf graduated onto it, and clears every box.

## The single triage question
> Does this repo help or hurt someone who opened my GitHub expecting an **AI Engineer, agentic**?

Helps a lot → catalog it. Neutral → keep it in cowork / private until it clears the bar. Only publish
what stands on its own.

## The bar (checklist — all must pass)

**Substance**
- [ ] Solves a **real problem from my own workflow** — not a toy or a tutorial reproduction.
- [ ] Demonstrates an **agentic / AI-native** pattern (tool-calling, RAG, memory, evaluation loop, MCP,
      an agent harness, an AI-in-the-SDLC automation…). If it's not obviously AI-native, it probably
      belongs elsewhere.
- [ ] **Python-first** where it fits (the preference, not a hard gate — a sharp TS/MCP tool qualifies).

**Runs from scratch**
- [ ] A clean clone runs by following the README **only** — no undocumented steps, no machine-specific
      assumptions. Pin versions; commit a lockfile.
- [ ] Config via env vars with a committed **`.env.example`**; the real `.env` is gitignored.

**Safe to be public**
- [ ] **No secrets** in history (tokens, keys, endpoints). Scan before the first push; if one ever
      landed, rotate it and scrub the history — don't just delete the file.
- [ ] **No client references, and no war-story that identifies a client** — abstract any to a generic
      problem (the public-writing rule), and never publish an employer's non-public internals. Past
      private work stays private.

      Describing **your own work at a named employer** is not that, and the box would be wrong to forbid
      it: a CV names employers and always has. The line is **who the work was for**, not what it was.

      **The test is "could a reader work out *which* client?", not "did I type the name?"** Those are
      different acts, and on a presence that publishes employer, role and dates, the second is far
      weaker than it looks — layer one described engagement on top of a public CV and the shortlist is
      often one. Specificity is what identifies: a sector plus a scale, a named programme, a regulatory
      deadline, a superlative.
      - ✅ *"Cut deploy time on a payments platform."* Sector, no entity.
      - ❌ *"Cut deploy time at the second-largest private bank in the country, during their
        core-banking migration."* Names nobody. Identifies exactly one company, and passes any rule
        written against typing the name.
- [ ] A **LICENSE** (MIT unless there's a reason otherwise).

**Presentable**
- [ ] A **README in the new framing** (see the template below): what it does · the real problem · the
      agentic pattern · stack · how to run · one honest limitation.
- [ ] Names each **explicit choice and its trade-off**, not just the rule — the house style.
- [ ] Green on its own basics (lint/test/build or a documented "how I verified it").

**Newsletter-ready**
- [ ] There's a **story**: the problem, the agentic approach, one thing that surprised me, the result.
      If I can't write that paragraph, it's not ready to be edition #N.

## Graduation process
1. **Extract** the project from cowork into a clean repo (no cowork-only cruft, no history baggage).
2. **Apply the bar** above; fix every unchecked box.
3. **Publish** as a public repo under `github.com/tedeuxx` with the README + LICENSE + `.env.example`.
4. **Link it** in the portfolio: add an entry to `apps/fed/src/data/catalog.ts` (name · tagline ·
      description · **proof** · stack · repoUrl · optional liveUrl · status). The prose fields —
      `tagline`, `description`, `proof` — are `Record<Locale, string>`: **both editions or it does not
      compile** (#235). `proof` is the reader-first payoff line rendered under *"What you take away"*,
      and it is the field most worth writing carefully.
5. **Distribute it** — the newsletter edition written from the README's story, published to **LinkedIn
      *and* X in the same batch** with the repo as the canonical link (ADR-0038). One surface is not the
      standard: the rule is both, together, or the distribution is half-done.
6. Keep the list **curated** — a short shelf of strong items beats a long shelf of weak ones.

## README template (drop into each catalog repo)

```markdown
# <project-name>

> <one-line hook — what it does, in the AI-Engineer-agentic framing>

## The problem
<the real problem from my workflow this solves — 2–3 sentences>

## How it works
<the agentic pattern: tool-calling / RAG / memory / evaluation loop / MCP / agent harness>.
Choices & trade-offs:
- **<choice>** over **<alternative>** — because <reason>; the cost is <trade-off>.

## Stack
<languages, key libs, model/provider, infra — e.g. Python · Anthropic Claude · MCP · ...>

## Run it
\`\`\`bash
cp .env.example .env   # fill in your keys
<install>
<run>
\`\`\`

## Limitation / next
<one honest limitation, or what I'd do next>
```

## Notes
- The bar is a floor, not a ceiling — clearing it makes a repo *safe and legible* to publish; strong
  items go further.
- First graduated item = the first newsletter edition. Pick the one with the best story-to-effort ratio.
  Note this is about the first item to **graduate**, which is not the same as the catalog's first entry:
  entry #1 is the site itself, which never graduated (see the scoping section above).
