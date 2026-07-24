_Target role: **AI Engineer** (applied GenAI / agentic — not ML research)._

This is my ramp-up in the open. I'm a cloud application architect (AWS, 17 years across SDLC and distributed systems) moving into AI Engineering — and this page is the plan I built for myself, the reasoning behind it, and the exact sources I'm using. I'm sharing it because most "become an AI Engineer" content is either ML-PhD gatekeeping or hype threads, and neither helped me.

Fair warning: this is a plan in progress, not a victory lap. I'm mid-transition. Take what's useful, ignore the rest.

---

## 1. Get the category right first

"AI Engineer" and "ML Engineer" are different jobs that share a word. I wasted time before I saw this clearly.

- **ML / Data Science lane:** training and fine-tuning models, SageMaker, PyTorch, diffusion/LoRA, recommendation and fraud systems. This is a real job. It is **not** the one I'm targeting.
- **Applied GenAI / Agentic lane:** building applications *on top of* foundation models — agents, tool-calling, RAG, evaluation, orchestration — and shipping them with production rigor. This is the lane.

I read agentic job postings across Brazilian fintechs and marketplaces and US AI-native startups. They almost never ask you to train a model. They ask for agents, evaluation, observability, prompt/context management, and distributed-systems sense. That's the target profile — filter your learning to it.

The one-line filter: **applied GenAI, not ML research.**

---

## 2. If you come from software, your background is a moat — not a handicap

The instinct is to feel behind because you didn't do ML. Wrong instinct.

"Knowing how to wire up an agent" becomes commodity fast — everyone moving into this will learn it. The scarce skill is building agents with the rigor most AI work is missing: **evaluation, observability, testing, cost control, failure modes, blast radius.** That's exactly what years of SDLC and distributed systems give you.

So the strategy inverts the obvious: don't over-index on the glamorous "build an agent" part. Over-index on the unglamorous production-grade part. That's where a software background wins and an ML background often doesn't. The agentic job postings confirm it — evaluation and observability show up more consistently than any model-building skill.

---

## 3. The method: practice-first, and every topic ships something

I don't retain from reading. I retain from building. So the plan has one rule:

**No topic ends in a summary. Every topic ends in a small, published artifact.**

The loop:

> study a topic → build a Python artifact that uses it → publish it (GitHub) → write about what I learned

One move, four outcomes: you retain it (because you built it), you get proof (public code), you get content, and you get something to talk about in interviews. Spaced review means *re-solving without looking*, not re-reading.

If you also don't retain from passive reading, steal this. It's the highest-leverage decision in the whole plan.

---

## 4. The topics — five pillars

Derived from real job postings, not a generic curriculum. In order:

1. **Python-agentic foundation** — Python + an agent framework (LangGraph is the market default right now) + FastAPI/Docker/Git. If you come from another language (I come from Java), this is your real gap. Not the concepts — the *proof* in Python.
2. **Evaluation + Observability of agents** — LLM-as-judge, prompt A/B testing, eval pipelines; plus tracing, metrics, logging. This is the single most recurring requirement in the postings, and where a software background shines.
3. **RAG + MCP** — embeddings, vector search, semantic retrieval; and the Model Context Protocol for tool/connector integration. MCP is still rare on résumés, which makes it a differentiator.
4. **Cloud-native agents** — running agents in production on a cloud (for me: AWS Bedrock + AgentCore), with guardrails and prompt-injection defense.
5. **Credential + narrative** — an optional cert as a filter (I'm eyeing the AWS Certified Generative AI Developer – Professional), and turning the artifacts into a public portfolio.

Transversal, applied everywhere: prompt/context engineering and plain SDLC rigor (tests, CI/CD, clean architecture).

A note on the cert: it's a *filter*, not a differentiator. No agentic team hires on a certificate — they hire on proof of code. Treat it as a milestone, not the center.

---

## 5. The roadmap (6–12 months, one thing at a time)

Built as a planned move, not a sprint — I have a job. A cadence that survives a bad week beats a burst that burns out. Each phase ships one artifact; the same agent evolves across phases (easier to build and easier to narrate than five disconnected demos).

- **Phase 0 — Setup:** Python environment, a portfolio repo, and pick the first agent's domain from real work.
- **Phase 1 — Python-agentic:** build the first real agent with LangGraph.
- **Phase 2 — Eval + Observability:** instrument that agent — eval harness + tracing/metrics. *(This is where the moat stops being invisible: the rigor is the artifact, not the biography.)*
- **Phase 3 — RAG + MCP:** add a knowledge layer and expose a capability as an MCP server.
- **Phase 4 — Cloud-native:** run it in production with guardrails.
- **Phase 5 — Credential + consolidation:** cert + polished portfolio + write-ups.

"Done" for me means: 3–4 published Python-agentic projects (each with eval/observability proof), the cert, a handful of write-ups, and the ability to hold a technical interview on agent design, evaluation, and trade-offs.

---

## 6. The sources I'm actually using

Real list, with links. Books are the canonical/deep layer; YouTube is the applied/explained layer; X and Instagram are the frontier/signal layer — where I find out something exists, not where I learn it.

### Books (O'Reilly)

Half of this shelf is still shipping chapter by chapter as I read it. That's the field: wait for the finished book and you're reading a lagging indicator.

- **[AI Engineering](https://www.oreilly.com/library/view/ai-engineering/9781098166298/)** — Chip Huyen. *The* foundation. Model-centric: foundation models, evaluation, prompting, RAG, finetuning, inference, architecture. If you read one, read this. *(finished)*
- **[Building Applications with AI Agents](https://www.oreilly.com/library/view/building-applications-with/9781098176495/)** — Michael Albada. Agents end-to-end: design, tools, orchestration, memory, multi-agent, validation, monitoring, security, human-agent collaboration. *(finished)*
- **[AI Agents with MCP](https://www.oreilly.com/library/view/ai-agents-with/9798341639546/)** — Kyle Stratis. Focused, hands-on MCP: clients, servers, transports, testing/securing. *(reading)*
- **[AI Agents: The Definitive Guide](https://www.oreilly.com/library/view/ai-agents-the/0642572247775/)** — Nicole Koenigstein. Production-leaning: contracts, tool governance, cost design, threat modeling. *(on my list)*
- **[An Illustrated Guide to AI Agents](https://www.oreilly.com/library/view/an-illustrated-guide/9798341662681/)** — Maarten Grootendorst & Jay Alammar. Visual, intuition-first: reasoning models, memory, planning, multi-agent, code agents. *(on my list)*
- **[Hands-On Large Language Models](https://www.oreilly.com/library/view/hands-on-large-language/9781098150952/)** — Jay Alammar & Maarten Grootendorst. The layer underneath the agent: tokens, embeddings, attention, fine-tuning — visual and hands-on. Same authors as the illustrated guide above, but about the model rather than the agent. *(on my list)*

Links go to O'Reilly's catalog; reading them needs an O'Reilly subscription.

### YouTube

Three to start with — one per channel, picked to show why the channel earns its place, not because it has the biggest number on it. Watch one, and if it lands, follow the channel.

**Anthropic** — the clearest short explanation of what is actually happening inside a model. Not a product demo: an interpretability result, told in five minutes.

https://www.youtube.com/watch?v=rKV5JcALQoQ

**Claude** — the entry point. If you only know the chat product, this is the two minutes that reframe it as a tool you drive from a terminal.

https://www.youtube.com/watch?v=fl1DSmwQKKY

**Lucas Montano** — PT-BR, and the most honest take I've found on the actual question this page is about: what senior engineers are really doing with AI, past the demos.

https://www.youtube.com/watch?v=P1-8da1GgBg

The rest of what I watch, ranked by how much I actually watch it — not by follower count:

- **[Anthropic](https://www.youtube.com/channel/UCrDwWp7EBBv4NwvScIpBDOA)** · **[Claude](https://www.youtube.com/channel/UCV03SRZXJEz-hchIAogeJOg)** · **[Lucas Montano](https://www.youtube.com/channel/UCyHOBY6IDZF9zOKJPou2Rgg)** — the three above, by a wide margin the ones I return to.
- **[Kiro](https://www.youtube.com/channel/UCXouiHXUN8mba_K-jn1gqVg)** — agentic IDE, worth watching even if you use something else.
- **[AWS](https://www.youtube.com/channel/UCd6MoB9NC6uYN2grvUNT-Zg)** · **[AWS Developers](https://www.youtube.com/channel/UCT-nPlVzJI-ccQXlxjSvJmw)** · **[AWS Events](https://www.youtube.com/channel/UCdoadna9HFHsxXWhafhNvKw)** — Bedrock and cloud-native AI.
- **[Y Combinator](https://www.youtube.com/channel/UCcefcZRL2oaA_uBNeo5UOWg)** — where the field is heading, builder-side.
- **[Dwarkesh Patel](https://www.youtube.com/channel/UCXl4i9dYBrFOabk0xGmbkRA)** — long-form with AI researchers; depth and alignment thinking.
- **[Chase AI](https://www.youtube.com/channel/UCoy6cTJ7Tg0dqS-DI-_REsA)** · **[Zack the AI Guy](https://www.youtube.com/channel/UCppvQz-ua7Rfi1Ca2qV9nzw)** — hands-on Claude/agent walkthroughs.
- **[IBM Technology](https://www.youtube.com/channel/UCKWaEZ-_VweaEx1j62do_vQ)** — clean whiteboard explainers on core concepts.
- **[Matt Pocock](https://www.youtube.com/@mattpocockuk)** · **[bycloud](https://www.youtube.com/channel/UCgfe2ooZD3VJPB6aJAnuQng)** · **[Shaw Talebi](https://www.youtube.com/channel/UCa9gErQ9AE5jT2DZLjXBIdA)** — hands-on AI coding and agent tutorials.
- **[Jeff Su](https://www.youtube.com/@JeffSu)** · **[Fireship](https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA)** — AI-for-work and fast frontier context.
- **[Brock Mesarich](https://www.youtube.com/@BrockMesarich)** — AI for non-technical folks; a soft on-ramp if you're starting from zero.
- **[Systems Made Better](https://www.youtube.com/channel/UCNZd3Osk_AIOxz2aydFYhHg)** — AI-driven systems and workflow automation.

### X / Twitter

- **[@AnthropicAI](https://x.com/AnthropicAI)** · **[@ClaudeDevs](https://x.com/ClaudeDevs)** · **[@bcherny](https://x.com/bcherny)** (Boris Cherny, Claude Code) — closest to the source on agentic dev tooling.
- **[@OpenAI](https://x.com/OpenAI)** · **[@OpenAIDevs](https://x.com/OpenAIDevs)** — Codex and the other side of the frontier.
- **[@rubenhassid](https://x.com/rubenhassid)** · **[@sairahul1](https://x.com/sairahul1)** · **[@tom_doerr](https://x.com/tom_doerr)** — practitioners posting techniques and tools worth stealing.
- **[@virattt](https://x.com/virattt)** — AI applied to finance, if that's your domain.
- **[@garrytan](https://x.com/garrytan)** (Garry Tan, YC) — founder/investor lens on where AI is heading.
- PT-BR: **[@AkitaOnRails](https://x.com/AkitaOnRails)** (Fabio Akita) · **[@glaucia_lemos86](https://x.com/glaucia_lemos86)** (Glaucia Lemos) — Brazilian dev voices going deep on this.

Treat X as signal, not truth — it's where you spot what's new, then you go verify it in the books.

### Instagram

Short video is genuinely part of how I keep up, so leaving it off this page would be posturing. But I'll be blunt about the ratio: most "Claude" content on Instagram is a lead magnet — *"comment GUIDE and I'll send you my prompt library"* — and a fair amount of it is simply wrong about what the product does. I went through my own saved folder to write this section and threw out about two thirds of it.

What survived, and why:

- **[@lucasmontano](https://www.instagram.com/lucasmontano/)** — PT-BR, the short-form counterpart of the channel I already watch long-form.
- **[@codewithbrij](https://www.instagram.com/codewithbrij/)** — the clearest short breakdown I've seen of Claude Code as a layered system: `CLAUDE.md` → skills → hooks → subagents → plugins. It matches the architecture I actually run in my own repos, which is why I trust it.
- **[@brunobracaioli](https://www.instagram.com/brunobracaioli/)** — PT-BR on MCP, and the best one-line framing of it I've read: without MCP the model is a genius locked in an empty room.
- **[@allesinisgalli](https://www.instagram.com/allesinisgalli/)** — PT-BR, Claude Code skills, concrete and ungated.
- **[@oleg.build](https://www.instagram.com/oleg.build/)** — MCP servers worth wiring up; useful as a scan of what exists.

Links only, no embeds — deliberately. The rule on this site is that nothing third-party loads until you ask for it: the videos above stay behind a click-to-load facade. Instagram's embed doesn't offer that — its script runs the moment the page opens — so it doesn't get in.

### GitHub — skills & loops they actually run

The configs and skill sets these people run, in the open — official profiles and repos only.

- **[Matt Pocock](https://github.com/mattpocock)** → **[mattpocock/skills](https://github.com/mattpocock/skills)**: Claude Code skills from his own `.claude` setup — TDD, engineering guardrails, constraints that keep AI coding honest.
- **[Garry Tan](https://github.com/garrytan)** → **[gstack](https://github.com/garrytan/gstack)** (opinionated agent stack, ships a `skills.md`) and **[gbrain](https://github.com/garrytan/gbrain)** (his agent-memory / "brain").
- **[Andrej Karpathy](https://github.com/karpathy)** → the special one: **[nanoGPT](https://github.com/karpathy/nanoGPT)**, **[llm.c](https://github.com/karpathy/llm.c)**, **[nanochat](https://github.com/karpathy/nanochat)**, **[minGPT](https://github.com/karpathy/minGPT)** — the best free way to actually understand what runs under the hood.

---

## 7. The honest part

I haven't shipped agents at scale in production, and I'm not going to claim I have. What I'm building is a development loop that turns AI-native techniques into production-ready software — and the public proof of that loop as I go.

If you're a software engineer eyeing this move: your background isn't a deficit to overcome, it's the thing that makes you rare in this lane. Build in public, ship small, and let the artifacts do the arguing.
