import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderAdrTitle } from './adr-title';
import { adrRecords } from './adrs';

const html = (title: string) => render(<span>{renderAdrTitle(title)}</span>).container.innerHTML;

describe('renderAdrTitle', () => {
  it('leaves a plain title alone', () => {
    expect(html('Fully static SPA, no backend')).toBe('<span>Fully static SPA, no backend</span>');
  });

  // The one that is not cosmetic. ADR-0032 marks half of its own decision retired with a strikethrough;
  // flattened, the row publishes "English-pinned crawlable baseline" as a live claim — untrue, and
  // contradicted by the same page. Asserted as `<del>` rather than as styling, because the retirement is
  // semantic and a screen reader announcing "deleted" is the whole point.
  it('renders a retired clause as <del>, which is where the meaning lives', () => {
    expect(html('locale layer, ~~English-pinned crawlable baseline~~')).toBe(
      '<span>locale layer, <del>English-pinned crawlable baseline</del></span>',
    );
  });

  it('renders code spans and bold', () => {
    expect(html('the `profile.ts` shape')).toBe('<span>the <code>profile.ts</code> shape</span>');
    expect(html('one **and** two')).toBe('<span>one <strong>and</strong> two</span>');
  });

  // Not a decorative concern: this is the property `security` approved the flat version on, and it has to
  // survive the change. Nothing here goes through dangerouslySetInnerHTML, so a title containing markup
  // characters is escaped by React rather than interpreted.
  it('escapes rather than interprets HTML in a title', () => {
    expect(html('a <script>alert(1)</script> title')).toBe(
      '<span>a &lt;script&gt;alert(1)&lt;/script&gt; title</span>',
    );
  });

  it('leaves an unclosed delimiter as literal text rather than swallowing the rest', () => {
    expect(html('half ~~open')).toBe('<span>half ~~open</span>');
    expect(html('tick ` alone')).toBe('<span>tick ` alone</span>');
  });

  // Against the real library, so the claim "five titles carry markup" cannot quietly stop being true.
  it('finds markup in the library and renders every one of it as an element', () => {
    const withMarkup = adrRecords().filter((r) => /`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~/.test(r.title));
    expect(withMarkup.length).toBeGreaterThan(0);
    for (const r of withMarkup) {
      const out = html(r.title);
      expect(out, `${r.file} still publishes its own syntax`).not.toMatch(/~~|\*\*|`/);
    }
  });
});
