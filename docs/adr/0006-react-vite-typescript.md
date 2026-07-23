# 0006. React + Vite + TypeScript

- **Status:** accepted
- **Date:** 2026-07-22
- **Deciders:** the owner
- **Driven by:** [ADR-0001](./0001-lean-by-design-calibrated-to-strategy.md), [ADR-0002](./0002-fully-static-spa-no-backend.md)

## Context & problem
The static site (ADR-0002) needs a frontend toolchain: a component model, a build tool, and a language.
The choice should serve a content-first SPA that is prerendered at build, and it should be a stack the
owner can defend as engineering (the repo is public and is the pitch).

## Decision drivers
- ADR-0002: a client-rendered SPA, prerendered at build — the toolchain must support a static build.
- Type safety and a fast dev/build loop.
- A mainstream, defensible stack — not an exotic bet on a personal site.

## Considered options
1. **React + Vite + TypeScript** (chosen) — React for the component model, Vite for a fast dev server and
   static build (and `import.meta.glob` for build-time content, ADR-0004), TypeScript throughout.
   *Trade-off:* a SPA framework is heavier than a static-site generator for what is largely content.
2. **A static-site generator (Astro/Eleventy)** — lighter for content. *Why not:* the site is also an
   interactive CV/portfolio and an agent-built engineering artifact; a component SPA carries that better,
   and the prerender step already gives the SEO/OG a generator would.
3. **Next.js** — *Why not:* its value is SSR/edge/server components — exactly what ADR-0002 removed;
   running it purely static is using a fraction of it and carrying its weight.

## Decision outcome
Chosen: **React + Vite + TypeScript.** Vite builds the static bundle and hosts the build-time content
glob and prerender; React models the interactive CV/portfolio/blog; TypeScript types it end to end.

## Consequences
**Good**
- Fast dev loop and static build; `import.meta.glob` gives build-time content for free (ADR-0004).
- Mainstream, well-understood, type-safe — defensible and low-risk.

**Bad / accepted costs**
- A SPA framework is more than a pure content site strictly needs; justified by the interactive surfaces
  and the engineering-artifact purpose.
- The bundle grows with features (a bundle-size concern the performance work watches).

## Links
- Driven by ADR-0001, ADR-0002 · Vite enables ADR-0004 (build-time content + prerender).
