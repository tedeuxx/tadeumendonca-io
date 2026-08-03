import { describe, it, expect } from 'vitest';
import { AdrTable } from './AdrTable';
import { adrRecords, supersededCount } from '../content/adrs';
import { renderWithLocale } from '../test-utils';

const records = adrRecords();

describe('AdrTable', () => {
  it('renders one row per decision in the library, not a sample of them', () => {
    const { container } = renderWithLocale(<AdrTable />, { locale: 'en' });

    // Against the artifact's own length rather than a literal. A hardcoded 41 would go red every time an
    // ADR is written — a check that fails on correct behaviour gets deleted, and then nothing counts rows.
    expect(container.querySelectorAll('tbody tr')).toHaveLength(records.length);
    expect(records.length).toBeGreaterThan(30);
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

    expect(superseded).toHaveLength(supersededCount());
    expect(supersededCount()).toBeGreaterThan(5);
  });
});
