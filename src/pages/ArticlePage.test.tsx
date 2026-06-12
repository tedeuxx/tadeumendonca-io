import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { useArticle, useDeleteArticle } = vi.hoisted(() => ({ useArticle: vi.fn(), useDeleteArticle: vi.fn() }));
vi.mock('../hooks/useArticles', () => ({ useArticle, useDeleteArticle }));

import { ArticlePage } from './ArticlePage';

const renderAt = (slug: string) =>
  render(
    <MemoryRouter initialEntries={[`/articles/${slug}`]}>
      <Routes>
        <Route path="/articles/:slug" element={<ArticlePage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  useDeleteArticle.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

describe('ArticlePage', () => {
  it('renders the article with its markdown body', () => {
    useArticle.mockReturnValue({
      data: { article_id: 'a1', slug: 'building', tag: 'aws', title: 'Building Serverless', body: '## Why\n\ncode', published: true, created_at: '2026-06-01T00:00:00Z' },
      isLoading: false,
      isError: false,
    });
    renderAt('building');
    expect(screen.getByText('Building Serverless')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why' })).toBeInTheDocument(); // markdown rendered
  });

  it('shows not-found on error', () => {
    useArticle.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderAt('nope');
    expect(screen.getByText(/não existe ou não está publicado/)).toBeInTheDocument();
  });
});
