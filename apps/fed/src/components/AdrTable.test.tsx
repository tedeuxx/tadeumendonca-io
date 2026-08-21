import { describe, it, expect } from 'vitest';
import { AdrTable } from './AdrTable';
import { adrRecords } from '../content/adrs';
import { renderWithLocale } from '../test-utils';

const records = adrRecords();

describe('AdrTable', () => {
  it('renders one row per decision in the library, not a sample of them', () => {
    const { container } = renderWithLocale(<AdrTable />, { locale: 'en' });

    // Against the artifact's own length rather than a literal. A hardcoded 41 would go red every time an
    // ADR is written — a check that fails on correct behaviour gets deleted, and then nothing counts rows.
    expect(container.querySelectorAll('tbody tr')).toHaveLength(records.length);

    // RE-KEYED from `> 30` (#456). The equality above is the real assertion; this line exists only so
    // that `0 === 0` cannot pass for it. `> 30` said the same thing in the vocabulary of a 48-record
    // library, and #456 folds that library toward roughly six — at which point the floor reddens on a
    // correct library and the anti-vacuity guard is deleted along with the stale number. Non-empty is
    // the property; 30 was never anything but today's population wearing it.
    expect(records.length).toBeGreaterThan(0);
  });

  it('links the TITLE to the record on GitHub, opened safely', () => {
    const { container } = renderWithLocale(<AdrTable />, { locale: 'en' });
    const first = records[0];

    // The WHOLE href, not a `href$=` suffix match. The first version used a suffix selector, and
    // `quality-assurance` falsified it by replacing ADR_BASE with https://example.invalid/WRONG — six
    // tests still passed. Both link assertions were blind to the origin, so every outbound link on the
    // page was unguarded at one end while the suite claimed to cover them.
    const anchor = container.querySelector(
      `a[href="https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/${first.file}"]`,
    );

    expect(anchor).not.toBeNull();
    // The accessible name is the title, not the number. "0034" tells a screen-reader user nothing about
    // where the link goes, which is why the anchor is on the title cell and this asserts it.
    expect(anchor).toHaveTextContent(first.title);
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  // A title's inline markup is rendered, not published as syntax — and for ADR-0032 the strikethrough IS
  // the meaning, so flattening it puts a retired claim on the page as a live one. Asserted HERE and not
  // only in adr-title.test.tsx, because that suite proves the renderer works while this one proves the
  // table actually calls it: the existing title assertion reads the RAW record title and is structurally
  // blind to whether any rendering happened at all.
  it('renders a title that carries markup, rather than publishing its syntax', () => {
    const marked = records.find((r) => r.title.includes('~~'));
    expect(marked, 'the library should contain a title with a retired clause').toBeDefined();

    const { container } = renderWithLocale(<AdrTable />, { locale: 'en' });
    const row = container.querySelector(`tbody tr:has(a[href$="${marked!.file}"])`);

    // `row` asserted first, and not folded into optional chaining: `row?.querySelector('del')` returns
    // `undefined` when the ROW is missing, and `not.toBeNull()` passes on `undefined` — so a selector
    // that found nothing would have read as a pass. Found by `security`.
    expect(row).not.toBeNull();
    expect(row!.querySelector('del')).not.toBeNull();
    expect(row?.textContent, 'the table must not publish markdown syntax').not.toContain('~~');
  });

  it('identifies each row by its number as a row header, so the status cell has an antecedent', () => {
    const { container } = renderWithLocale(<AdrTable />, { locale: 'en' });
    const rowHeaders = [...container.querySelectorAll('tbody th[scope="row"]')];

    expect(rowHeaders).toHaveLength(records.length);
    expect(rowHeaders[0]).toHaveTextContent(records[0].id);
  });

  // The reason the status column exists as a CLASS rather than the ADRs' own status prose. Both locales
  // asserted, because a status rendered in English inside the Portuguese edition is exactly the drift
  // this repo compiles as an error everywhere else.
  it('localises the status class in both editions', () => {
    const en = renderWithLocale(<AdrTable />, { locale: 'en' }).container;
    expect(en).toHaveTextContent('accepted');
    expect(en).toHaveTextContent('superseded');

    const pt = renderWithLocale(<AdrTable />, { locale: 'pt' }).container;
    expect(pt).toHaveTextContent('aceita');
    expect(pt).toHaveTextContent('substituída');
    expect(pt).not.toHaveTextContent('superseded');
  });

  // `amended` is appended to the status, never a replacement for it. A decision that stands but has been
  // revised is neither plainly accepted nor superseded, and rendering only "amended" would lose which.
  it('appends the amendment marker to a status instead of replacing it', () => {
    const amended = records.find((r) => r.amended);
    expect(amended, 'the library should contain at least one amended record').toBeDefined();

    const { container } = renderWithLocale(<AdrTable />, { locale: 'en' });
    const row = container.querySelector(`tbody tr:has(a[href$="${amended!.file}"])`);

    expect(row).toHaveTextContent(amended!.status);
    expect(row).toHaveTextContent('amended');
  });

  // Guards the reconciliation this slice made in the prose. The page used to state "five reversals" as a
  // hand-typed figure; the library holds more, and the copy now defers to this table rather than naming a
  // number. If the two ever have to agree again, this is where it is noticed.
  it('shows every superseded record, not only the five the prose discusses', () => {
    const { container } = renderWithLocale(<AdrTable />, { locale: 'en' });
    const superseded = [...container.querySelectorAll('tbody tr')].filter((r) =>
      r.textContent?.includes('superseded'),
    );

    const inLibrary = records.filter((r) => r.status === 'superseded').length;
    expect(superseded).toHaveLength(inLibrary);

    // RE-KEYED from `inLibrary > 5` (#456), and the re-key CHANGES WHAT IS GUARDED rather than just
    // lowering a number. `> 5` was doing two jobs at once: stopping `0 === 0` from passing for the
    // equality above, and asserting a population of superseded records. Only the first is a property
    // of this component — the second is a fact about the library, and #456's deactivation rule drives
    // it to zero, at which point even `> 0` reddens on a library that is entirely correct.
    //
    // So the vacuity guard is moved onto the thing that can actually be vacuous: whether the table
    // rendered the library at all. If it did, and no row says "superseded", then zero is the right
    // answer and this assertion is telling the truth. If it rendered nothing, this catches it — which
    // is the failure `> 5` was really there for.
    expect(container.querySelectorAll('tbody tr')).toHaveLength(records.length);
    expect(records.length).toBeGreaterThan(0);
  });
});
