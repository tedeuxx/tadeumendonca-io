import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useArticles } = vi.hoisted(() => ({ useArticles: vi.fn() }));
vi.mock('../hooks/useArticles', () => ({ useArticles }));

import { ArticlesPage } from './ArticlesPage';

const renderAt = (path = '/articles') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ArticlesPage />
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('ArticlesPage', () => {
  it('shows empty state', () => {
    useArticles.mockReturnValue({ data: { pages: [{ items: [] }] }, isLoading: false, isError: false, hasNextPage: false });
    renderAt();
    expect(screen.getByText('No articles yet.')).toBeInTheDocument();
  });

  it('lists articles with their title link', () => {
    useArticles.mockReturnValue({
      data: { pages: [{ items: [{ article_id: 'a1', slug: 'building', tag: 'aws', title: 'Building', excerpt: 'x', published: true, created_at: '2026-06-01T00:00:00Z' }] }] },
      isLoading: false,
      isError: false,
      hasNextPage: false,
    });
    renderAt();
    expect(screen.getByRole('link', { name: 'Building' })).toHaveAttribute('href', '/articles/building');
  });

  it('passes the tag from the URL to the hook + shows a clear filter', () => {
    useArticles.mockReturnValue({ data: { pages: [{ items: [] }] }, isLoading: false, isError: false, hasNextPage: false });
    renderAt('/articles?tag=aws');
    expect(useArticles).toHaveBeenCalledWith('aws');
    expect(screen.getByRole('button', { name: 'Clear filter' })).toBeInTheDocument();
  });

  it('shows error state', () => {
    useArticles.mockReturnValue({ data: undefined, isLoading: false, isError: true, hasNextPage: false });
    renderAt();
    expect(screen.getByText("Couldn't load articles")).toBeInTheDocument();
  });

  it('filters by clicking a tag badge and loads more', () => {
    const fetchNextPage = vi.fn();
    useArticles.mockReturnValue({
      data: { pages: [{ items: [{ article_id: 'a1', slug: 'building', tag: 'aws', title: 'Building', excerpt: 'x', published: true, created_at: '2026-06-01T00:00:00Z' }] }] },
      isLoading: false,
      isError: false,
      hasNextPage: true,
      fetchNextPage,
      isFetchingNextPage: false,
    });
    renderAt();
    fireEvent.click(screen.getByText('aws')); // tag badge → setParams
    expect(screen.getByRole('button', { name: 'Clear filter' })).toBeInTheDocument(); // URL now has ?tag=aws
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it('clears the tag filter', () => {
    useArticles.mockReturnValue({ data: { pages: [{ items: [] }] }, isLoading: false, isError: false, hasNextPage: false });
    renderAt('/articles?tag=aws');
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(screen.queryByRole('button', { name: 'Clear filter' })).toBeNull();
  });
});
