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

  // Against the real library, and the count is PINNED rather than bounded below. The first version
  // asserted `> 0` under a comment claiming it kept "five titles carry markup" true — green at one, at
  // six, at forty. A comment naming a guarantee its assertion does not make is this repo's recurring
  // defect, and it appeared here in the suite for the module written to fix that class.
  //
  // Seven is a real number about the library, so it goes where it can fail. When an ADR heading gains or
  // loses markup this turns red, someone looks, and the number moves deliberately.
  //
  // It moved from six to seven on 2026-08-08: ADR-0045's heading carries `nav.*` as a code span. That is
  // the guard working exactly as written — the number was not bumped to clear a red gate, it was bumped
  // because a seventh title really does carry markup, and it is rendered as an element like the other six.
  //
  // Seven to EIGHT on 2026-08-25, same shape and worth stating again: record 0050's heading carries
  // `{ company, start_date }` as a code span, because the record is about that pair specifically and a
  // title naming it in prose would be a title about something vaguer. The loop below is what makes the
  // bump safe — the eighth title is asserted to render as an element like the other seven, so the number
  // is never the only thing the case checks.
  //
  // EIGHT to SEVEN on 2026-11-01 (#456), the first move DOWN, and for the same kind of reason: the
  // downloadable-CV record, whose heading carried `/me` as a code span, was absorbed into ADR-0024 and
  // left the library, so one fewer title carries markup. Measured with this test's own filter over the
  // regenerated `adrs.json` rather than inferred; the record added in the same slice carries none. The
  // fold slices of #456 will move this again, each in the merge request that removes a titled record.
  //
  // SEVEN to SIX on 2026-11-01 (#456, the fourth slice): record 0050, the eighth title counted above,
  // was absorbed into ADR-0024 and left the library. Seen red at 7 with this filter over the regenerated
  // `adrs.json` before the number moved.
  it('finds markup in the library and renders every one of it as an element', () => {
    const withMarkup = adrRecords().filter((r) => /`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~/.test(r.title));
    expect(withMarkup).toHaveLength(6);
    for (const r of withMarkup) {
      const out = html(r.title);
      expect(out, `${r.file} still publishes its own syntax`).not.toMatch(/~~|\*\*|`/);
    }
  });
});
