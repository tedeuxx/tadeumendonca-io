import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ArchitecturePage } from './ArchitecturePage';
import { renderWithLocale } from '../test-utils';

const renderPage = (locale: 'pt' | 'en' = 'pt') => renderWithLocale(<ArchitecturePage />, { locale });

describe('ArchitecturePage', () => {
  it('renders the page heading and the markdown body', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /Arquitetura/ })).toBeInTheDocument();
    // A section heading from the markdown body (pt is the suite's default locale) — proves the body
    // actually rendered, not just the chrome around it.
    expect(screen.getByRole('heading', { name: /O registro de decisões É a documentação/ })).toBeInTheDocument();
  });

  it('serves the whole page in the visitor language — chrome AND body', () => {
    const { unmount } = renderPage('pt');
    expect(screen.getByText('A planta · aberta')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /O registro de decisões É a documentação/ })).toBeInTheDocument();
    // Parity means the English body is ABSENT, not merely that Portuguese is present — a fallback
    // rendering both, or the wrong file, would pass a laxer assertion.
    expect(screen.queryByRole('heading', { name: /The decision record IS the documentation/ })).toBeNull();
    unmount();

    renderPage('en');
    expect(screen.getByText('The blueprint · open')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /The decision record IS the documentation/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /O registro de decisões É a documentação/ })).toBeNull();
  });

  // The two editions are separate files, so they can drift. This pins the SOURCES — every outbound link,
  // in order — plus the section count. It does NOT check that the prose means the same thing; a
  // structurally identical bad translation passes, and that limit is recorded in ADR-0032. The page has
  // no video embeds (unlike the ramp-up page), so a link-only comparison is complete here.
  it('keeps the two editions in sync on every source they cite', () => {
    // Read everything BEFORE unmounting — unmount empties the container, so a later query silently
    // returns zero and the comparison passes for the wrong reason.
    const sourcesOf = (container: HTMLElement) => ({
      links: [...container.querySelectorAll('a')].map((a) => a.getAttribute('href')),
      sections: container.querySelectorAll('h2').length,
    });

    const pt = renderPage('pt');
    const ptSources = sourcesOf(pt.container);
    pt.unmount();

    const en = renderPage('en');
    const enSources = sourcesOf(en.container);

    expect(ptSources).toEqual(enSources);
    // Guard against two empty renders comparing equal.
    expect(ptSources.links.length).toBeGreaterThan(0);
    expect(ptSources.sections).toBeGreaterThan(0);
  });

  // The orientation contract (issue #113): the page LINKS canonical detail, it does not restate it. The
  // proof is mechanical — both public repos and the catalog-ready gate must be reachable from the page,
  // in BOTH editions. A page that lost its outbound links (drifting into a restated copy) fails here.
  it.each(['pt', 'en'] as const)('links out to both public repos and catalog-ready (%s edition)', (locale) => {
    const { container } = renderPage(locale);
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');

    expect(hrefs).toContain('https://github.com/tedeuxx/tadeumendonca-io');
    expect(hrefs).toContain('https://github.com/tedeuxx/tadeumendonca-skills');
    expect(hrefs).toContain('https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md');
    // And the ADR record is reachable — the keystone plus its README index.
    expect(hrefs).toContain('https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/README.md');
    expect(hrefs).toContain(
      'https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0001-lean-by-design-calibrated-to-strategy.md',
    );

    // …and the two site repos are CARDS, not links (#318). The assertions above cannot tell the
    // difference: a <RepoCard> IS an <a>, so `querySelectorAll('a')` sees the same href either way.
    //
    // That distinction is the section's whole point. The setup walkthrough moved to the READMEs, so what
    // the page owes a reader at the end is a way INTO the two repos — rendered as the page's call to
    // action rather than as a bullet. The delivery is invisible in the markdown source: `Markdown.tsx`
    // turns a paragraph holding a LONE self-labelled repo URL into a <RepoCard>, opt-in through the
    // `repoCards.ts` registry. Deleting a registry row, deepening a URL to a `tree/` path, giving the
    // link a label that differs from its href, indenting the paragraph, or merging the two into one
    // paragraph each silently demotes the cards back to plain anchors — and the checks above stay green
    // for every one of them.
    //
    // Asserted HERE, through the real <Markdown>, rather than by pattern-matching the markdown source:
    // a check that models markdown is a second implementation of the renderer, and it is wrong in
    // exactly the cases the renderer is subtle about. `e2e/routes.spec.ts` makes the same assertion on
    // the served build, but only for `/pt/architecture`; this is what covers en. Same shape as
    // `RampUpPage.test.tsx` for the ramp-up cards (#157).
    expect(
      [...container.querySelectorAll('[data-testid="repo-card"]')].map((c) => c.getAttribute('href')),
    ).toEqual([
      'https://github.com/tedeuxx/tadeumendonca-io',
      'https://github.com/tedeuxx/tadeumendonca-skills',
    ]);
  });
});
