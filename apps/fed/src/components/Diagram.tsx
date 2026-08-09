// Renders a build-time compiled mermaid diagram as inline SVG (#170, ADR-0040).
//
// dangerouslySetInnerHTML is used, and the justification is the trust boundary rather than the API: the
// string comes from src/content/generated/diagrams.json, which is produced by scripts/gen-diagrams.mjs
// from markdown IN THIS REPO and committed. It is not user input, not fetched, and not reachable at
// runtime — the same trust level as importing a .svg asset, which is what this replaces. mermaid renders
// with securityLevel 'strict' and htmlLabels:false, and a unit test asserts the compiled output contains
// no <script>, no on* attribute and no <foreignObject>, so the property is checked rather than assumed.
//
// The <figure>/<figcaption>/`.diagram-canvas` shell moved to DiagramFigure.tsx when the Venn figure
// arrived — see the note there for why it is shared rather than duplicated.
import { diagramSvg } from '../content/diagrams';
import { DiagramFigure } from './DiagramFigure';

/**
 * `source` is the mermaid text as authored in the markdown body; `caption` is the reader-visible label,
 * already in the active locale (each edition authors its own).
 */
export function Diagram({ source, caption }: { source: string; caption: string }) {
  return <DiagramFigure caption={caption} html={diagramSvg(source)} />;
}
