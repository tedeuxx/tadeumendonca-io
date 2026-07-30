import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Diagram } from './Diagram';
import { Markdown } from './Markdown';
import { diagramSources, normaliseDiagramSource } from '../content/diagrams';

const REAL_SOURCE = diagramSources()[0];

describe('Diagram', () => {
  it('inlines the compiled SVG and labels it for a screen reader and for the eye', () => {
    render(<Diagram source={REAL_SOURCE} caption="A caption" />);
    const fig = screen.getByRole('figure', { name: 'A caption' });
    expect(fig.querySelector('svg')).not.toBeNull();
    // The <figcaption> is not redundant with the label: mermaid's accTitle becomes an SVG <title>,
    // which a screen reader announces and a sighted reader never sees. A diagram labelled only there is
    // labelled for the audit rather than for the audience.
    expect(screen.getByText('A caption').tagName).toBe('FIGCAPTION');
  });

  // `role="img"` on the wrapper is a LEAF role — assistive technology collapses the subtree to a single
  // graphic, so the SVG's <title> and its whole <desc> (the fence's per-locale accDescr) stop being
  // reachable. That was the first version here, and it made a test three files away assert a property
  // this component discarded. Asserted structurally so it cannot come back by convenience.
  it('does not collapse the SVG behind a leaf role — title and desc must stay reachable', () => {
    const { container } = render(<Diagram source={REAL_SOURCE} caption="A caption" />);
    expect(container.querySelector('[role="img"]')).toBeNull();
    const svg = container.querySelector('svg')!;
    expect(svg.querySelector('title')?.textContent).toBeTruthy();
    expect(svg.querySelector('desc')?.textContent).toBeTruthy();
  });

  // The alternative was a render-time fallback — an error card, an empty box, the raw source. On a
  // static site the prerender bakes whatever happened into the served bytes, so a silent failure is not
  // a moment, it is an artifact a scraper can pin. Throwing fails the build, the prerender and the E2E.
  it('throws on a source with no compiled artifact, naming the command that fixes it', () => {
    expect(() => render(<Diagram source="flowchart LR\n  X --> Y" caption="Nope" />)).toThrow(
      /npm run gen-diagrams/,
    );
  });

  it('normalises the same way the generator does — the key is a contract between them', () => {
    expect(normaliseDiagramSource('flowchart LR  \r\n  A --> B\t\n\n')).toBe('flowchart LR\n  A --> B');
    // Whitespace-only edits must not orphan a diagram; a guard that fails on re-indentation gets disabled.
    render(<Diagram source={`\n  ${REAL_SOURCE}  \n`} caption="Padded" />);
    expect(screen.getByRole('figure', { name: 'Padded' }).querySelector('svg')).not.toBeNull();
  });
});

describe('Markdown mermaid fences', () => {
  it('turns a ```mermaid fence into a diagram, taking its caption from accTitle', () => {
    render(<Markdown>{`\`\`\`mermaid\n${REAL_SOURCE}\n\`\`\``}</Markdown>);
    const caption = /^\s*accTitle:\s*(.+)$/m.exec(REAL_SOURCE)![1].trim();
    expect(screen.getByRole('figure', { name: caption })).toBeInTheDocument();
  });

  // Hooked on `pre`, not `code`: react-markdown delivers a fence as <pre><code class="language-…">, so a
  // `code` handler would nest the <figure> INSIDE a <pre> — invalid, and a hydration mismatch on a
  // prerendered page. Asserted structurally so the hook cannot be moved back without failing.
  it('replaces the <pre> entirely rather than nesting a figure inside one', () => {
    const { container } = render(<Markdown>{`\`\`\`mermaid\n${REAL_SOURCE}\n\`\`\``}</Markdown>);
    expect(container.querySelector('pre')).toBeNull();
    expect(container.querySelector('figure svg')).not.toBeNull();
  });

  it('leaves an ordinary code fence alone', () => {
    const { container } = render(<Markdown>{'```js\nconst a = 1;\n```'}</Markdown>);
    expect(container.querySelector('pre code')).not.toBeNull();
    expect(container.querySelector('figure')).toBeNull();
  });

  // An unlabelled diagram is invisible to a screen reader, and inline SVG was chosen precisely so it
  // would not be. Failing loudly at authoring time is the only moment this is cheap to fix.
  it('refuses a diagram with no accTitle', () => {
    expect(() => render(<Markdown>{'```mermaid\nflowchart LR\n  A --> B\n```'}</Markdown>)).toThrow(/accTitle/);
  });
});
