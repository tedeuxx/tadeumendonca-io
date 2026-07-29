# Catalog-ready — the bar for publishing a project

The **catalog** is the "além do SPA" surface of the public presence: a curated set of public GitHub
repos — automations, agents, MCP servers, AI-native tools — that back the **AI Engineer / agentic
development** positioning with real code. The portfolio on `tadeumendonca.io` links to them
(`apps/fed/src/data/catalog.ts`), and each graduated project seeds a **LinkedIn newsletter** edition.

Most raw material starts as a Claude cowork project. This doc is the bar it must clear to **graduate**
from cowork to a public catalog repo. The gate is deliberately about *proof of engineering*, not polish
for its own sake: someone who opens the repo should immediately see an AI Engineer who ships.

## What this bar governs — and the one repo it does not

It governs **projects that graduate into the catalog**: a tool someone else might adopt. Every box below
is a question that only makes sense about a tool — *what problem does it solve, how do I run it, what is
the honest limitation before I depend on it.*

**`tadeumendonca-io` — the platform repo — is not one of those, and is not measured by this.** It is
listed in the catalog because it is the site itself, not because it graduated onto its own shelf. Nobody
adopts someone else's presence, and "the real problem it solves" has no honest answer for a portfolio
that exists to be read.

That is a **scoping** statement, not an exemption, and the distinction matters because changing a
standard so the one item measured against it passes is otherwise indistinguishable from convenience.
What the platform is held to instead is **stricter, not lighter**: an ADR library recording every
decision and the trade-off it cost, blocking CI gates (lint · typecheck · coverage ≥85% · build · E2E ·
SonarCloud · dependency audit), and `/architecture`, which publishes how it is built **including its own
honest limitation**. The content this checklist asks for exists — it lives where a reader of a *site*
looks for it rather than in a README where a reader of a *tool* would.

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
- [ ] **No client/employer references** — abstract any war-story to a generic problem (the public-writing
      rule). Past private work stays private.
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
      description · stack · repoUrl · optional liveUrl · status).
5. **Write the newsletter** edition from the README's story; publish on LinkedIn linking the repo.
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
