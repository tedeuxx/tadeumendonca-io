// Renders a build-time compiled mermaid diagram as inline SVG (#170, ADR-0040).
//
// dangerouslySetInnerHTML is used, and the justification is the trust boundary rather than the API: the
// string comes from src/content/generated/diagrams.json, which is produced by scripts/gen-diagrams.mjs
// from markdown IN THIS REPO and committed. It is not user input, not fetched, and not reachable at
// runtime — the same trust level as importing a .svg asset, which is what this replaces. mermaid renders
// with securityLevel 'strict' and htmlLabels:false, and a unit test asserts the compiled output contains
// no <script>, no on* attribute and no <foreignObject>, so the property is checked rather than assumed.
import { diagramSvg } from '../content/diagrams';

/**
 * `source` is the mermaid text as authored in the markdown body; `caption` is the reader-visible label,
 * already in the active locale (each edition authors its own).
 *
 * The caption is a real <figcaption> and not only the SVG's internal <title>. mermaid emits accTitle as
 * <title>, which a screen reader announces but a sighted reader never sees — a diagram whose only label
 * is invisible to most readers is labelled for the audit, not for the audience.
 */
export function Diagram({ source, caption }: { source: string; caption: string }) {
  return (
    <figure className="diagram my-8">
      <div
        className="diagram-canvas overflow-x-auto border border-border bg-background p-4"
        // Wide diagrams scroll INSIDE this box. The page body must never scroll sideways — asserted at
        // 320px by the existing width sweep, which this would otherwise be the first thing to break.
        role="img"
        aria-label={caption}
        dangerouslySetInnerHTML={{ __html: diagramSvg(source) }}
      />
      <figcaption className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
