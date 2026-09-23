# Sprint Review — sprint-02

**FAILED**

routes emitted: **22** / routes visited: **0**

The route generator completed and returned a non-zero set, but the read-only browser failed before the first navigation. This is a failed sweep, not a clean sweep.

## Procedure and scope

- Procedure source: `agents/product-lead.md`, its declared `agents-configuration`, `engineering-standards`, `definition-of-ready`, and `shell` skills, and `commands/sprint-review.md` from `tadeumendonca-skills` at commit `819efedace16cb2c1b23c8ee9230587a4d280734`.
- Consumer sources: this repository's `AGENTS.md` and `apps/fed/scripts/routes.mjs` on branch `chore/sprint-02-closing-rites`.
- Route derivation command:

  ```sh
  node --input-type=module -e "const m = await import('./apps/fed/scripts/routes.mjs'); console.log(JSON.stringify(m.localizedRoutes()))"
  ```

- Derived set: 11 Portuguese routes and 11 English routes.
- Intended viewports: phone and desktop on every emitted route.
- Judgement weighting, had the browser started: `/pt/architecture` and `/en/architecture`, changed for sprint-02 Issue #636; `/pt/blog/o-que-os-meus-agentes-fazem` and `/en/blog/what-my-agents-do`, produced by sprint-02 Issue #259. Weighting would have affected judgement depth only; every emitted route still required the mechanical pass.

## Mechanical

The browser precondition failed.

1. Opening an isolated page at `https://tadeumendonca.io/pt` returned:

   ```text
   Failed to construct 'URLPattern': A base URL must be provided for a relative constructor string.
   ```

2. Enumerating browser pages returned the same error.

Consequences:

- no emitted route was visited;
- neither locale received rendered-page evidence;
- neither phone nor desktop received rendered-page evidence;
- no accessibility/DOM snapshot was captured;
- no console log was inspected;
- no network log was inspected;
- missing images and failed requests were not assessed;
- the PDF download was not assessed.

This evidence identifies a browser-tool startup/configuration failure. It does not establish a defect in the live site.

## Judgement

Not run. The browser failure left no rendered layout or wording to inspect, so this report asserts no layout, wording, or preference findings.

## Lower-bound limits

Even a successful run would be a lower bound: the read-only browser cannot reach interaction-gated surfaces, sees only one logged-out moment in a throwaway profile, and an emulated phone is not a physical phone. In this failed run the observed bound is smaller still: route derivation succeeded, but rendered-product coverage is zero.

All sprint-review findings are advisory and droppable. This report is not a verdict and gates nothing. The owner decides whether the browser-tool failure becomes tracked work.
