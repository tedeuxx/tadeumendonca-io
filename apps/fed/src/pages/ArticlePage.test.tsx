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
const renderAt = (slug: string, locale: 'pt' | 'en' = 'pt') =>
  render(
    <MemoryRouter initialEntries={[`/${locale}/blog/${slug}`]}>
      <LocaleProvider>
        <Routes>
          <Route path="/:locale/blog/:slug" element={<ArticlePage />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );

const post = (over: Partial<BlogPost> = {}): BlogPost => ({
  slug: 'building',
  title: 'Building Serverless',
  date: '2026-06-01T00:00:00Z',
  tag: 'aws',
  track: 'engenharia',
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
});
