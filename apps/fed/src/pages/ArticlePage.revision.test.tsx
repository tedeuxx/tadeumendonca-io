import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { BlogPost } from '../lib/content';
import { LocaleProvider } from '../i18n';
import { strings as messages } from '../i18n/messages';

// #741 — a PENDING REVISION of a published article, at the page's seam: which text renders, which text
// the review bar's copy and the share modal carry, what the bar says is shown, and the robots tag.
//
// `content` is mocked so each case states exactly which published edition and which revision exist.
// `diagrams` is mocked to an identity renderer so a fence's SOURCE is readable in the DOM: that is what
// lets the diagram case tell the revision's fence from the published one without depending on which
// sources happen to be compiled in the committed artifact.
const { getPostBySlug, getEditions, getRevision } = vi.hoisted(() => ({
  getPostBySlug: vi.fn(),
  getEditions: vi.fn(),
  getRevision: vi.fn(),
}));
vi.mock('../lib/content', () => ({ getPostBySlug, getEditions, getRevision }));
vi.mock('../content/diagrams', () => ({
  diagramSvg: (source: string) => `<svg data-diagram-source="${source.trim()}"></svg>`,
  normaliseDiagramSource: (s: string) => s.trim(),
  diagramSources: () => [],
}));

import { ArticlePage } from './ArticlePage';

const renderAt = (search = '', locale: 'pt' | 'en' = 'en') =>
  render(
    <MemoryRouter initialEntries={[`/${locale}/blog/fixed${search}`]}>
      <LocaleProvider>
        <Routes>
          <Route path="/:locale/blog/:slug" element={<ArticlePage />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );

const post = (over: Partial<BlogPost> = {}): BlogPost => ({
  slug: 'fixed',
  previousSlugs: [],
  title: 'Fixed',
  date: '2026-07-01T00:00:00Z',
  tag: 'ai',
  track: 'engenharia',
  draft: false,
  body: 'PUBLISHED-ONLY sentence.',
  ...over,
});

const PUBLISHED = post();
const REVISION = post({ body: 'REVISION-ONLY sentence.' });

const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content');
const marker = () => document.querySelector('[data-review-shown]');
const bodyText = () => document.body.textContent ?? '';

beforeEach(() => {
  vi.clearAllMocks();
  document.head.innerHTML = '';
  getEditions.mockReturnValue({ en: PUBLISHED, pt: post({ slug: 'corrigido' }) });
  getPostBySlug.mockReturnValue(PUBLISHED);
  getRevision.mockReturnValue(REVISION);
});

describe('selection — the revision under the parameter, the published text without it', () => {
  it('renders the REVISION body under ?preview', () => {
    renderAt('?preview');
    expect(bodyText()).toContain('REVISION-ONLY sentence.');
    expect(bodyText()).not.toContain('PUBLISHED-ONLY sentence.');
  });

  // The control for the case above, and the mutation that drops `reviewing &&` turns it red: the revision
  // exists (the mock returns it), so only the parameter keeps it off the page.
  it('renders the PUBLISHED body without the parameter, although a revision exists', () => {
    renderAt();
    expect(bodyText()).toContain('PUBLISHED-ONLY sentence.');
    expect(bodyText()).not.toContain('REVISION-ONLY sentence.');
    expect(screen.queryByRole('group', { name: 'Article review' })).toBeNull();
  });

  it('asks for the revision by the published edition’s own slug and locale', () => {
    renderAt('?preview', 'pt');
    expect(getRevision).toHaveBeenCalledWith('fixed', 'pt');
  });

  it('renders the published body under ?preview when no revision is pending', () => {
    getRevision.mockReturnValue(undefined);
    renderAt('?preview');
    expect(bodyText()).toContain('PUBLISHED-ONLY sentence.');
  });

  // A held article never has a revision (content.ts refuses one at module load); the page does not even ask.
  it('does not look for a revision on a HELD article', () => {
    getPostBySlug.mockReturnValue(post({ draft: true }));
    renderAt('?preview');
    expect(getRevision).not.toHaveBeenCalled();
    expect(marker()).toBeNull();
  });
});

describe('the bar states which text is shown (both locales, from the catalog)', () => {
  it.each(['en', 'pt'] as const)('%s: says "pending revision" when the revision renders', (locale) => {
    renderAt('?preview', locale);
    expect(marker()?.textContent).toBe(messages.review.shownRevision[locale]);
  });

  it.each(['en', 'pt'] as const)('%s: says "published text, no pending revision" when none exists', (locale) => {
    getRevision.mockReturnValue(undefined);
    renderAt('?preview', locale);
    expect(marker()?.textContent).toBe(messages.review.shownPublished[locale]);
  });

  // The two strings must not collapse into one: a marker that read the same either way would say nothing.
  it('the two states are different strings in each locale', () => {
    for (const locale of ['en', 'pt'] as const) {
      expect(messages.review.shownRevision[locale]).not.toBe(messages.review.shownPublished[locale]);
    }
  });
});

describe('robots — noindex, nofollow while a revision is rendered, and only then', () => {
  it('marks a rendered revision noindex, nofollow', () => {
    renderAt('?preview');
    expect(robots()).toBe('noindex, nofollow');
  });

  it('emits no robots tag for the published text under ?preview with no revision', () => {
    getRevision.mockReturnValue(undefined);
    renderAt('?preview');
    expect(robots()).toBeUndefined();
  });

  it('emits no robots tag without the parameter, although a revision exists', () => {
    renderAt();
    expect(robots()).toBeUndefined();
  });

  it('removes the tag when navigating from a revision to an article without one', () => {
    const { unmount } = renderAt('?preview');
    expect(robots()).toBe('noindex, nofollow');
    unmount();
    getRevision.mockReturnValue(undefined);
    renderAt('?preview');
    expect(robots()).toBeUndefined();
  });
});

describe('every payload follows what is rendered', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it('the review bar copies the REVISION body', async () => {
    renderAt('?preview');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy the article text' }));
    });
    const copied = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(copied).toContain('REVISION-ONLY sentence.');
    expect(copied).not.toContain('PUBLISHED-ONLY sentence.');
  });

  it('the share modal’s markdown copy carries the REVISION body', async () => {
    renderAt('?preview');
    // The header trigger; the modal's copy-as-markdown row is the body-carrying control.
    fireEvent.click(screen.getAllByRole('button', { name: /share|compartilhar/i })[0]);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: messages.share.copyMarkdown.en }));
    });
    const calls = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls;
    const copied = calls[calls.length - 1][0] as string;
    expect(copied).toContain('REVISION-ONLY sentence.');
    expect(copied).not.toContain('PUBLISHED-ONLY sentence.');
  });
});

describe('diagrams follow the revision (AC 14)', () => {
  const fence = (src: string) => `\`\`\`mermaid\n${src}\n\`\`\``;

  beforeEach(() => {
    getPostBySlug.mockReturnValue(post({ body: fence('flowchart TB\n  accTitle: Flow\n  A --> PUBLISHED_NODE') }));
    getRevision.mockReturnValue(post({ body: fence('flowchart TB\n  accTitle: Flow\n  A --> REVISED_NODE') }));
  });

  const sources = () =>
    [...document.querySelectorAll('[data-diagram-source]')].map((el) => el.getAttribute('data-diagram-source'));

  it('renders the revision’s own fence under ?preview', () => {
    renderAt('?preview');
    expect(sources().join()).toContain('REVISED_NODE');
    expect(sources().join()).not.toContain('PUBLISHED_NODE');
  });

  it('renders the published fence without the parameter', () => {
    renderAt();
    expect(sources().join()).toContain('PUBLISHED_NODE');
    expect(sources().join()).not.toContain('REVISED_NODE');
  });
});
