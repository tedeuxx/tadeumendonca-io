import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { BlogPost } from '../lib/content';
import { LocaleProvider } from '../i18n';

const { getPostBySlug, getEditions } = vi.hoisted(() => ({ getPostBySlug: vi.fn(), getEditions: vi.fn() }));
vi.mock('../lib/content', () => ({ getPostBySlug, getEditions }));

import { ArticlePage } from './ArticlePage';

const alternateHref = (hreflang: string) =>
  document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`)?.getAttribute('href');
const canonicalHref = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');

// Render under a locale-prefixed route (ADR-0036): the LocaleProvider reads the locale off the path, and
// the :slug param comes from the matched route. Default locale pt (the suite's historical baseline).
// `search` defaults to empty — the published-reader case every existing test was written against. It is a
// parameter rather than a second helper so the review-bar cases below differ from those by exactly the
// one thing under test (#506).
const renderAt = (slug: string, locale: 'pt' | 'en' = 'pt', search = '') =>
  render(
    <MemoryRouter initialEntries={[`/${locale}/blog/${slug}${search}`]}>
      <LocaleProvider>
        <Routes>
          <Route path="/:locale/blog/:slug" element={<ArticlePage />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );

const post = (over: Partial<BlogPost> = {}): BlogPost => ({
  slug: 'building',
  // The page never reads this — a retired slug is intercepted by `ArticleRoute` in App.tsx before the
  // page renders — so the default is the empty list, i.e. an article that has never moved.
  previousSlugs: [],
  title: 'Building Serverless',
  date: '2026-06-01T00:00:00Z',
  tag: 'aws',
  track: 'engenharia',
  // Published by default (#510). The held case is the exception and every test that wants it says so,
  // which is what keeps `robots` assertions below from passing for the wrong reason.
  draft: false,
  body: '## Why\n\ncode',
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  document.head.innerHTML = '';
  // A sensible default edition group so the article branch renders; the wiring test overrides it.
  getEditions.mockReturnValue({ en: post({ slug: 'building' }), pt: post({ slug: 'building' }) });
});

describe('ArticlePage', () => {
  it('renders the post with its markdown body', () => {
    getPostBySlug.mockReturnValue(post());
    renderAt('building');
    expect(screen.getByText('Building Serverless')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why' })).toBeInTheDocument(); // markdown rendered
  });

  it('links back to the articles section and, when present, to the LinkedIn edition', () => {
    getPostBySlug.mockReturnValue(post({ linkedinUrl: 'https://linkedin.com/pulse/x' }));
    renderAt('building');
    expect(screen.getByRole('link', { name: /Todos os artigos/ })).toHaveAttribute('href', '/pt/#artigos');
    expect(screen.getByRole('link', { name: 'Ver no LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com/pulse/x');
  });

  // #450 — THE ARTICLE HALF OF THE SHARE-GROUP NAME, and it exists to stay boring. `ShareLinks` grew an
  // optional `labelKey` so /architecture can name its group "Compartilhar esta página"; the default is
  // still the article string, and this page must keep announcing "Compartilhar este artigo" byte for byte
  // — it renders on four live article pages and this slice is scoped to change one non-article page.
  //
  // ASSERTED POSITIVELY, BY THE NAME IT MUST HAVE, not as the absence of the page name. An absence
  // assertion passes on a page that renders no share group at all, and it passes on a page that renders
  // one under a third name nobody wrote — the two failures this default would actually produce.
  // Mutation-checked by flipping ShareLinks' default to `share.linksLabelPage`: this goes red, and the
  // /architecture assertion stays green, which is what proves the two sides are independently pinned.
  it.each([
    ['pt', 'Compartilhar este artigo'],
    ['en', 'Share this article'],
  ] as const)('names the share group as an ARTICLE, the component default (%s)', (locale, name) => {
    getPostBySlug.mockReturnValue(post());
    renderAt('building', locale);
    expect(screen.getByRole('navigation', { name })).toBeInTheDocument();
  });

  // #409 — THE TWO SHARE TRIGGERS, AND THE PROPERTY IS THAT THEY DIFFER. This page renders `ShareButton`
  // twice (header + footer), so the accessible name stopped being a component constant and became a
  // per-call-site decision; nothing below the page could see that, and this is the level where it is
  // decidable.
  //
  // IT LIVES HERE AND NOT IN `ShareButton.test.tsx` BECAUSE OF WHAT HAPPENED THERE. That file's
  // `describe('the two share entry points')` renders `ShareLinks` in ISOLATION, so it passed unchanged on
  // the diff that put a second trigger on this page — an assertion that reads as covering the pair while
  // being structurally unable to fail for it. Those assertions are LEFT ALONE and are still correct:
  // their subject is the destination parity between the modal and `ShareLinks` (#314), which this slice
  // does not touch. What they never covered is co-existence in one document, which needs a real DOM
  // region containing both, i.e. this page.
  //
  // THE TRIGGERS ARE SELECTED BY `aria-haspopup="dialog"`, NOT BY NAME. Selecting them by the names under
  // test would make the test assert its own premise: a page that renders one trigger, or three, would
  // still find the two it looked for. The filter is what the DOM says a share trigger IS, so the count is
  // a real claim.
  //
  // THREE ASSERTIONS, ORDERED SO THAT EACH ONE CAN ACTUALLY FAIL, and the order is the finding rather
  // than a style choice. Written the obvious way first — `getByRole(name)` per trigger, then the pair —
  // the pair assertions were unreachable: `getByRole` throws on BOTH a missing name and a duplicated one,
  // so it consumed every mutation before the property was ever evaluated, and the distinctness check
  // would have been an assertion that cannot fail while appearing to be the point of the test. That is
  // this repo's recurring defect and it does not get to ship inside the test written to prevent it.
  //   1. `toHaveLength(2)` — the footer trigger exists at all. Red on its removal.
  //   2. the `Set` — the PROPERTY the owner decided: the two names differ. Red on either trigger adopting
  //      the other's key, and it survives a rewording of either string.
  //   3. `toEqual` — the published strings, in DOM order (header, then footer). Red on copy drift and on
  //      a reorder, neither of which 1 or 2 can see.
  //
  // The name is read off `aria-label`, which IS the computed accessible name here: `aria-label` outranks
  // the button's text content, so there is no second source for these to disagree with.
  it.each([
    ['pt', 'Compartilhar', 'Mais opções de compartilhamento'],
    ['en', 'Share', 'More options for sharing'],
  ] as const)('names its two share triggers distinctly, header then footer (%s)', (locale, headerName, footerName) => {
    getPostBySlug.mockReturnValue(post());
    renderAt('building', locale);

    const names = screen
      .getAllByRole('button')
      .filter((el) => el.getAttribute('aria-haspopup') === 'dialog')
      .map((el) => el.getAttribute('aria-label'));

    expect(names).toHaveLength(2);
    expect(new Set(names).size).toBe(2);
    expect(names).toEqual([headerName, footerName]);
  });

  it('omits the LinkedIn link when the post has no edition there', () => {
    getPostBySlug.mockReturnValue(post());
    renderAt('building');
    expect(screen.queryByRole('link', { name: 'Ver no LinkedIn' })).toBeNull();
  });

  it('shows not-found for an unknown slug', () => {
    getPostBySlug.mockReturnValue(undefined);
    renderAt('nope');
    expect(screen.getByText(/não existe ou não está publicado/)).toBeInTheDocument();
  });

  // Per-locale slugs (ADR-0037): the canonical / og:url stay THIS locale's own slug (self), while the
  // hreflang alternates advertise each locale's OWN slug from the edition group — so a crawler pairs
  // `/en/blog/building` with `/pt/blog/construindo`, x-default → the PREFIXED English URL (#200 — the
  // bare slug is not prerendered and dead-ends a pt-BR reader).
  it('wires self-canonical to this locale’s slug and hreflang to the localized pair', () => {
    getPostBySlug.mockReturnValue(post({ slug: 'construindo' })); // the pt edition (renderAt default = pt)
    getEditions.mockReturnValue({ en: post({ slug: 'building' }), pt: post({ slug: 'construindo' }) });
    renderAt('construindo', 'pt');
    expect(canonicalHref()).toBe('https://tadeumendonca.io/pt/blog/construindo'); // self
    expect(alternateHref('en')).toBe('https://tadeumendonca.io/en/blog/building');
    expect(alternateHref('pt')).toBe('https://tadeumendonca.io/pt/blog/construindo');
    expect(alternateHref('x-default')).toBe('https://tadeumendonca.io/en/blog/building');
  });

  // #510 — the weaker half of the hold, and it is written as the weaker half deliberately.
  //
  // A held article's real protection is that it is in no sitemap and no snapshot, so a crawler has no
  // path to it. `noindex` covers the case where the URL reaches one anyway — pasted somewhere, or picked
  // out of a referrer log. It is emitted from the CLIENT head, so a JS-less crawler never reads it, which
  // is exactly why it is belt and not braces.
  describe('robots', () => {
    const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content');

    it('marks a held article noindex, nofollow', () => {
      getPostBySlug.mockReturnValue(post({ draft: true }));
      renderAt('building');
      expect(robots()).toBe('noindex, nofollow');
    });

    // The half that would silently de-index the site. `upsertMeta` only ever WRITES, so a `noindex` left
    // behind by a held article would ride into the next article the reader navigates to — a
    // client-side-navigation-only defect, invisible on every hard load and on every prerendered snapshot.
    it('emits no robots tag for a published article', () => {
      getPostBySlug.mockReturnValue(post());
      renderAt('building');
      expect(robots()).toBeUndefined();
    });

    it('removes a stale noindex when navigating from a held article to a published one', () => {
      getPostBySlug.mockReturnValue(post({ draft: true }));
      const { unmount } = renderAt('building');
      expect(robots()).toBe('noindex, nofollow');
      unmount();
      getPostBySlug.mockReturnValue(post({ slug: 'other' }));
      renderAt('other');
      expect(robots()).toBeUndefined();
    });
  });
});

// #506 — the review bar, and specifically ITS GATE, which is the only part of the feature that lives on
// this page. What the bar itself does is `DraftReviewBar.test.tsx`'s subject; what is asserted here is
// which visitors meet it at all, because that is what keeps the slice reader-invisible.
describe('the draft review bar', () => {
  const ISSUE_LINK = 'Abrir a issue deste artigo no GitHub';
  const COPY = 'Copiar o texto do artigo';

  // THE WHOLE SAFE-CLASS CLAIM, in one assertion. If this goes green with the bar rendered, two controls
  // and four strings a reader was never meant to see are on every published article.
  it('renders NOTHING for a visitor with no preview parameter', () => {
    getPostBySlug.mockReturnValue(post({ contentIssue: 506 }));
    renderAt('building');
    expect(screen.queryByRole('group', { name: 'Revisão do artigo' })).toBeNull();
    expect(screen.queryByRole('link', { name: ISSUE_LINK })).toBeNull();
    expect(screen.queryByRole('button', { name: COPY })).toBeNull();
  });

  it('renders both affordances behind the preview parameter', () => {
    getPostBySlug.mockReturnValue(post({ contentIssue: 506 }));
    renderAt('building', 'pt', '?preview');
    expect(screen.getByRole('group', { name: 'Revisão do artigo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ISSUE_LINK })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COPY })).toBeInTheDocument();
  });

  // THE GATE IS THE PARAMETER ALONE, and this is the assertion that pins that decision rather than
  // leaving it as a comment. The article here is PUBLISHED (`draft: false`, the helper's default), so a
  // gate narrowed to `draft && preview` — the reading the Issue's title invites — turns this red. It is
  // written this way round on purpose: the decision is reversible, and a reviewer who wants the narrower
  // gate should have to delete an assertion that states the current one.
  it('renders for a PUBLISHED article too, when the parameter is present', () => {
    getPostBySlug.mockReturnValue(post({ draft: false, contentIssue: 506 }));
    renderAt('building', 'pt', '?preview');
    expect(screen.getByRole('group', { name: 'Revisão do artigo' })).toBeInTheDocument();
  });

  // The degradation, at the page's own seam: `contentIssue` travels from frontmatter to the bar, and an
  // article that names no Issue offers the copy control and no link. Asserted here as well as in the
  // component's suite because what could break here is the WIRING — passing a constant, or nothing.
  it('offers the copy control and no link for an article that names no Issue', () => {
    getPostBySlug.mockReturnValue(post({ contentIssue: undefined }));
    renderAt('building', 'pt', '?preview');
    expect(screen.getByRole('button', { name: COPY })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: ISSUE_LINK })).toBeNull();
  });

  // And the wiring in the other direction: the link carries THE ARTICLE'S number, not a fixed one. Two
  // different numbers, because an assertion against a single value passes for a hardcoded constant.
  it('carries the article’s own Issue number into the link', () => {
    getPostBySlug.mockReturnValue(post({ contentIssue: 4242 }));
    const { unmount } = renderAt('building', 'pt', '?preview');
    expect(screen.getByRole('link', { name: ISSUE_LINK })).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx/tadeumendonca-io/issues/4242',
    );
    unmount();

    getPostBySlug.mockReturnValue(post({ contentIssue: 7 }));
    renderAt('building', 'pt', '?preview');
    expect(screen.getByRole('link', { name: ISSUE_LINK })).toHaveAttribute(
      'href',
      'https://github.com/tedeuxx/tadeumendonca-io/issues/7',
    );
  });
});
