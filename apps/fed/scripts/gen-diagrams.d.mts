// Types for `gen-diagrams.mjs`, so the end-to-end spec that imports it is checked by `npm run typecheck`.

/**
 * Compile every mermaid fence under `src/content` and write the map to `outPath` (default: the committed
 * `src/content/generated/diagrams.json`). Resolves to the exact text written and the diagram count.
 * Rejects, writing nothing, if any fence fails to compile.
 */
export function renderDiagrams(outPath?: string): Promise<{ text: string; count: number }>;
