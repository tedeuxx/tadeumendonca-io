import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { RampUpPage } from './RampUpPage';
import { renderWithLocale } from '../test-utils';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const renderPage = (locale: 'pt' | 'en' = 'pt') => renderWithLocale(<RampUpPage />, { locale });

describe('RampUpPage', () => {
  it('renders the page heading and the markdown body', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /Ramp-Up/ })).toBeInTheDocument();
    // A section heading from the markdown body (pt is the suite's default locale) — proves the body
    // actually rendered, not just the chrome around it.
    expect(screen.getByRole('heading', { name: /Primeiro, acerte a categoria/ })).toBeInTheDocument();
  });

  it('serves the whole page in the visitor language — chrome AND body', () => {
    const { unmount } = renderPage('pt');
    expect(screen.getByText('Plano aberto · em andamento')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Primeiro, acerte a categoria/ })).toBeInTheDocument();
    // Parity means the English body is ABSENT, not merely that Portuguese is present — a fallback
    // rendering both, or the wrong file, would pass a laxer assertion.
    expect(screen.queryByRole('heading', { name: /Get the category right first/ })).toBeNull();
    unmount();

    renderPage('en');
    expect(screen.getByText('Open plan · in progress')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Get the category right first/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Primeiro, acerte a categoria/ })).toBeNull();
  });

  // DECISION 2 ON #450, ASSERTED ON THE PAGE THAT WOULD HAVE PAID FOR IT. /ramp-up shares `MarkdownPage`
  // with /architecture, and #450 added an end-of-page contact route plus share deeplinks to that shell.
  // Rendering them unconditionally would hand a personal plan in progress a distribution affordance and a
  // contact CTA nobody decided to give it — a reader-facing change to a second page, arriving as a side
  // effect of a slice about a different one. So the shell's flag defaults to false and this page never
  // passes it.
  //
  // MUTATION-CHECKED BY DOING IT: flipping `endMatter = false` to `= true` in MarkdownPage.tsx turns both
  // assertions red. Queried by ACCESSIBLE NAME through the same strings the positive arm uses in
  // MarkdownPage.test.tsx — a negative assertion with a wrong query passes on a healthy page and on a
  // broken one alike, and this repo has shipped that defect before.
  it.each(['pt', 'en'] as const)('renders no share block and no contact route (%s edition)', (locale) => {
    renderPage(locale);
    expect(
      screen.queryByRole('navigation', {
        name: locale === 'pt' ? 'Compartilhar este artigo' : 'Share this article',
      }),
    ).toBeNull();
    expect(
      screen.queryByRole('heading', { name: locale === 'pt' ? 'Onde me encontrar' : 'Where to find me' }),
    ).toBeNull();
    // The header's compact ShareButton is UNCHANGED and must stay — this page's share affordance was never
    // the thing in question, and asserting the absence without it would be green on a page that lost both.
    expect(
      screen.getByRole('button', { name: locale === 'pt' ? 'Compartilhar' : 'Share' }),
    ).toBeInTheDocument();
  });

  // The two editions are separate files, so they can drift. This pins the SOURCES — every outbound
  // link and every embedded video, in order — plus the section count. It does NOT check that the
  // prose means the same thing; a structurally identical bad translation passes, and that limit is
  // recorded in ADR-0032 rather than implied away.
  //
  // Videos need their own extraction: a facade renders a <button>, not an <a>, so a link-only
  // comparison is blind to exactly the sources that were hand-verified against their channels.
  //
  // SITE-INTERNAL links are compared with their locale prefix stripped (#166). Markdown authors the
  // LOGICAL path — `[Biblioteca](/library)` in both files — and `Markdown`'s link handler resolves it to
  // the active locale's real, prerendered URL, so the pt render legitimately emits `/pt/library` where
  // the en render emits `/en/library`. Stripping ONLY that leading prefix keeps the guard exact: it is
  // still the same source, and everything after the prefix is still compared byte for byte, so a link
  // pointing at a different page in one edition still goes red.
  it('keeps the two editions in sync on every source they cite', () => {
    // Read everything BEFORE unmounting — unmount empties the container, so a later query silently
    // returns zero and the comparison passes for the wrong reason.
    const logical = (href: string | null) => href?.replace(/^\/(?:pt|en)(?=\/|$)/, '') ?? null;
    const sourcesOf = (container: HTMLElement) => ({
      links: [...container.querySelectorAll('a')].map((a) => logical(a.getAttribute('href'))),
      // `/video/<id>.png` — the committed local poster. It was `img[src*="/vi/"]`, YouTube's own path,
      // until the facade stopped fetching from i.ytimg.com on render.
      videos: [...container.querySelectorAll('img[src^="/video/"]')].map((img) => img.getAttribute('src')),
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
    expect(ptSources.videos).toHaveLength(4);
    expect(ptSources.sections).toBeGreaterThan(0);
  });

  // The GitHub sources render as static repo cards (#122 / #157, ADR-0035) — Pocock, then Tan's two, then
  // Karpathy's four — in both editions, each card showing ITS locale's description, not the other's. The
  // cards embed per-locale prose inside a per-locale page, so ADR-0032's "each edition renders without the
  // other's text" invariant must reach the descriptions, not just the section headings.
  const CARD_URLS = [
    'https://github.com/mattpocock/skills',
    'https://github.com/garrytan/gstack',
    'https://github.com/garrytan/gbrain',
    'https://github.com/karpathy/nanoGPT',
    'https://github.com/karpathy/llm.c',
    'https://github.com/karpathy/nanochat',
    'https://github.com/karpathy/minGPT',
  ];

  it('renders the GitHub sources as cards, in order, each in the visitor language only', () => {
    const { container, unmount } = renderPage('en');
    const en = [...container.querySelectorAll('[data-testid="repo-card"]')];
    // Each card links out to its canonical repo, in the authored order, and to nothing else.
    expect(en.map((c) => c.getAttribute('href'))).toEqual(CARD_URLS);
    // The English hook is present; its Portuguese counterpart is absent (no cross-locale leak).
    expect(container).toHaveTextContent('the architecture stops being a black box');
    expect(container).not.toHaveTextContent('a arquitetura deixa de ser caixa-preta');
    unmount();

    const pt = renderPage('pt');
    expect([...pt.container.querySelectorAll('[data-testid="repo-card"]')].map((c) => c.getAttribute('href'))).toEqual(
      CARD_URLS,
    );
    expect(pt.container).toHaveTextContent('a arquitetura deixa de ser caixa-preta');
    expect(pt.container).not.toHaveTextContent('the architecture stops being a black box');
  });

  it('turns the YouTube links into click-to-load facades, not eager iframes', () => {
    const { container } = renderPage();
    // The property that matters: nothing third-party is loaded before the reader asks for it.
    expect(container.querySelector('iframe')).toBeNull();

    // Count facades by their accessible role, not by the thumbnail host — the CDN hostname is an
    // internal of VideoEmbed, and pinning it would fail a rename that changes no behavior.
    const facades = screen.getAllByRole('button', { name: /Reproduzir vídeo/ });
    expect(facades).toHaveLength(4);

    // Pin WHICH videos: each was chosen and verified against the channel it is attributed to, so a
    // wrong or silently-swapped id is the failure worth catching. A host-shaped assertion would miss
    // it. I4B37S1dyQQ is the Y Combinator talk added by #165 — a source, not a starting pick.
    const thumbs = [...container.querySelectorAll('img[src^="/video/"]')].map((img) => img.getAttribute('src') ?? '');
    expect(thumbs).toHaveLength(4);
    ['rKV5JcALQoQ', 'fl1DSmwQKKY', 'P1-8da1GgBg', 'I4B37S1dyQQ'].forEach((id) =>
      expect(thumbs).toContain(`/video/${id}.png`),
    );
    // The poster is now a LOCAL asset (public/video/<id>.png). The selector changed with it, and the
    // change is the fix: `/vi/` was YouTube's path, and this test passing on it was the page proving
    // it fetched from i.ytimg.com on render. It still must not block the page.
    container.querySelectorAll('img[src^="/video/"]').forEach((img) => expect(img).toHaveAttribute('loading', 'lazy'));

    // …and clicking one does swap in the player, so the facade is a facade and not a dead thumbnail.
    // Target the facade by its label — the page also renders a ShareButton, so index 0 is not it.
    fireEvent.click(facades[0]);
    expect(container.querySelector('iframe')?.getAttribute('src')).toMatch(
      /^https:\/\/www\.youtube-nocookie\.com\/embed\//,
    );
  });

  // The cross-link to the shelf (#166), deferred by `product-lead` to the slice that lands the first
  // entries. It is the first site-INTERNAL link any markdown body carries, and the property that matters
  // is the one a bare `/library` would break: a Portuguese page must not hand a reader with an English
  // browser the English shelf. The href is resolved per locale, so it is asserted per locale.
  it('sends the reader to the shelf in their own edition', () => {
    const { unmount } = renderPage('pt');
    const pt = screen.getByRole('link', { name: 'Biblioteca' });
    expect(pt).toHaveAttribute('href', '/pt/library');
    // The claim around the link is a FACT about the shelf, and it is here so a reworded sentence that
    // drops it is visible: the shelf carries a rating, which is what makes it more than a second list.
    expect(pt.closest('p')).toHaveTextContent('com nota de 1 a 5');
    unmount();

    renderPage('en');
    const en = screen.getByRole('link', { name: 'Library' });
    expect(en).toHaveAttribute('href', '/en/library');
    expect(en.closest('p')).toHaveTextContent('with a 1–5 rating');
  });

  it('links the sources out to their public canonical URLs', () => {
    const { container } = renderPage();
    const book = screen.getByRole('link', { name: 'AI Engineering' });
    expect(book).toHaveAttribute('href', 'https://www.oreilly.com/library/view/ai-engineering/9781098166298/');

    // Every O'Reilly link must be the PUBLIC catalog, never the subscriber reader. This has to query
    // by href: a link's accessible name is its text ("AI Engineering"), so a name-based query can
    // never see the host and would pass no matter what the hrefs said.
    const oreilly = [...container.querySelectorAll('a[href*="oreilly.com"]')];
    expect(oreilly).toHaveLength(6);
    oreilly.forEach((a) => expect(a.getAttribute('href')).toMatch(/^https:\/\/www\.oreilly\.com\/library\/view\//));
    expect(container.querySelectorAll('a[href*="learning.oreilly.com"]')).toHaveLength(0);
  });

  // COPY-AS-MARKDOWN AGAINST THE SHIPPED BODY (#387). This page is where BOTH remaining payload defects
  // actually live: `rampup.{pt,en}.md` carries the literal `{{years}}` token, resolved by this page before
  // render, and `[Biblioteca](/library)` — the site's only root-relative markdown link, and a dead link
  // the moment it leaves the origin.
  //
  // The `{{years}}` half is the assertion the design is built around, and it is green only because the
  // shell is handed the RENDERED body. Passing `BODIES[locale]` to `<ShareButton body=…>` instead of the
  // resolved string turns this red and nothing else in the suite notices — mutation-checked, by doing it.
  it.each(['pt', 'en'] as const)('copies the RESOLVED body, with working links (%s edition)', async (locale) => {
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

    expect(payload).not.toContain('{{years}}');
    // Positively: the figure the token resolves to is in there. Asserting only the absence would also be
    // green if the whole sentence had gone missing. The published value is the EVERGREEN FLOOR — "18+",
    // not a bare count (#124) — so the `+` is part of the shape, and a regex without it would fail
    // against correct output.
    expect(payload).toMatch(/\d+\+ (anos|years)/);

    expect(payload).not.toContain('](/library)');
    expect(payload).toContain(`[${locale === 'pt' ? 'Biblioteca' : 'Library'}](https://tadeumendonca.io/${locale}/library)`);

    // Nothing else was rewritten on the way past: the O'Reilly catalogue links are the largest external
    // set on the page and an over-broad rewrite would be visible here first.
    expect(payload).toContain('https://www.oreilly.com/library/view/');
    expect(payload).toContain(`https://tadeumendonca.io/${locale}/ramp-up\n`);
    expect(payload).not.toContain('utm_');
  });
});
