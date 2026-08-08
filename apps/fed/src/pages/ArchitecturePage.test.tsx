import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ArchitecturePage } from './ArchitecturePage';
import { renderWithLocale } from '../test-utils';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const renderPage = (locale: 'pt' | 'en' = 'pt') => renderWithLocale(<ArchitecturePage />, { locale });

describe('ArchitecturePage', () => {
  it('renders the page heading and the markdown body', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /Arquitetura/ })).toBeInTheDocument();
    // A section heading from the markdown body (pt is the suite's default locale) — proves the body
    // actually rendered, not just the chrome around it.
    expect(screen.getByRole('heading', { name: /O registro de decisões É a documentação/ })).toBeInTheDocument();
  });

  // ADR-0045 — the defect the owner reported, asserted on the COMPOSED string rather than on the catalog
  // key. `useDocumentHead` appends " · tadeumendonca.io", so the key is only ever a prefix and a test
  // that stops at the key is not testing what a tab shows. `messages.test.ts` holds the catalog-wide
  // rule; this holds the wiring — that THIS page is the one passing THAT key.
  it.each([
    ['pt', 'Arquitetura — como este site é construído · tadeumendonca.io'],
    ['en', 'Architecture — how this site is built · tadeumendonca.io'],
  ] as const)('titles the tab with the section name the reader clicked (%s)', (locale, expected) => {
    document.title = '';
    renderPage(locale);
    expect(document.title).toBe(expected);
    // og:title is the same string — one prop feeds four surfaces (MarkdownPage), and the OG half is the
    // irreversible one: scrapers pin a card on first fetch (ADR-0041).
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(expected);
  });

  // THE SEAM ADR-0045 REFUSES TO CROSS, pinned on the rendered page and not only in the catalog. The
  // title now leads with "Arquitetura" and so does the heading, which makes collapsing the two look
  // harmless — and it is the one change this slice was told not to make. The H1 is the page's argument;
  // the title is its address.
  it.each([
    ['pt', 'Arquitetura — a planta, em aberto'],
    ['en', 'Architecture — the blueprint, in the open'],
  ] as const)('leaves the editorial H1 alone (%s)', (locale, heading) => {
    document.title = '';
    renderPage(locale);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading);
    expect(document.title.startsWith(heading)).toBe(false);
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
  });

  // The two site repos are CARDS, not links (#318) — and the test above cannot tell the difference,
  // because a <RepoCard> IS an <a>. `querySelectorAll('a')` reads the same href either way.
  //
  // That distinction is the section's whole point. The setup walkthrough moved to the READMEs, so what
  // the page owes a reader at the end is a way INTO the two repos, rendered as the page's call to action
  // rather than as a bullet. The delivery is invisible in the markdown source: `Markdown.tsx` turns a
  // paragraph holding a LONE self-labelled repo URL into a <RepoCard>, opt-in through `repoCards.ts`.
  //
  // WHAT THE TEST ABOVE DOES AND DOES NOT SEE, stated as the invariant rather than as a list — an
  // earlier version of this comment enumerated five mutations and claimed the checks above stayed green
  // for all of them, which was false for three:
  //
  //   · a mutation leaving both hrefs INTACT is invisible up there — a deleted registry row, or both
  //     paragraphs merged into one. The cards become anchors; every `toContain` still passes.
  //   · a mutation that CHANGES or REMOVES an href is caught up there for `-io`, and missed for
  //     `-skills`.
  //
  // The asymmetry is not an accident of this file: the page already links `-skills` inline in prose,
  // higher up, so `toContain` for that URL is satisfied no matter what the closing card does.
  //
  // Asserted through the real <Markdown> rather than by pattern-matching the markdown source: a check
  // that models markdown is a second implementation of the renderer, and it is wrong in exactly the
  // cases the renderer is subtle about — an indented paragraph is a code block, not a link, and a
  // source-level matcher that trims whitespace cannot see that. `e2e/routes.spec.ts` makes this
  // assertion on the served build, but only for `/pt/architecture`; this is what covers en. Same shape
  // as `RampUpPage.test.tsx` for the ramp-up cards (#157), and its own `it` for the same reason: a
  // failure here is about RENDERING, and reporting it under a name about reachability misdirects.
  it.each(['pt', 'en'] as const)('closes with both repos as cards, in order (%s edition)', (locale) => {
    const { container } = renderPage(locale);

    expect(
      [...container.querySelectorAll('[data-testid="repo-card"]')].map((c) => c.getAttribute('href')),
    ).toEqual([
      'https://github.com/tedeuxx/tadeumendonca-io',
      'https://github.com/tedeuxx/tadeumendonca-skills',
    ]);
  });

  // COPY-AS-MARKDOWN AGAINST THE SHIPPED BODY (#387). The payload builder has its own unit tests against
  // synthetic input; this is the one that reads the file that actually ships, and it is where the
  // `adr-index` defect lives — `architecture.{en,pt}.md` carries an EMPTY fence that only the renderer
  // expands, so a verbatim copy hands the reader three backticks and nothing.
  it.each(['pt', 'en'] as const)('copies the shipped body with no bare adr-index fence (%s edition)', async (locale) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderPage(locale);

    fireEvent.click(screen.getByRole('button', { name: locale === 'pt' ? 'Compartilhar' : 'Share' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: locale === 'pt' ? 'Copiar markdown para a área de transferência' : 'Copy markdown to clipboard',
      }),
    );
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const payload = writeText.mock.calls[0][0] as string;

    expect(payload).not.toContain('adr-index');
    expect(payload).toContain('https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr)');
    // …and the mermaid fences that SHOULD survive did. Dropping every fence would pass the assertion
    // above while silently gutting four diagrams a reader can render on GitHub.
    expect(payload).toContain('```mermaid');
    // The canonical URL of the edition being copied, clean.
    expect(payload).toContain(`https://tadeumendonca.io/${locale}/architecture`);
    expect(payload).not.toContain('utm_');
  });
});
