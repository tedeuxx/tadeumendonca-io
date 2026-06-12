import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useFeed } = vi.hoisted(() => ({ useFeed: vi.fn() }));
vi.mock('../hooks/useFeed', () => ({ useFeed }));
// SubscribeButton / NewPostButton have their own suites + need QueryClient/auth — stub them here.
vi.mock('../components/SubscribeButton', () => ({ SubscribeButton: () => null }));
vi.mock('../components/NewPostButton', () => ({ NewPostButton: () => null }));

import { FeedPage } from './FeedPage';

const renderFeed = () =>
  render(
    <MemoryRouter>
      <FeedPage />
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('FeedPage', () => {
  it('shows an empty state when there are no posts', () => {
    useFeed.mockReturnValue({ data: { pages: [{ items: [] }] }, isLoading: false, isError: false, hasNextPage: false });
    renderFeed();
    expect(screen.getByText('Ainda não há posts.')).toBeInTheDocument();
  });

  it('renders posts from the pages', () => {
    useFeed.mockReturnValue({
      data: { pages: [{ items: [{ post_id: 'p1', title: 'First', body: 'b', published: true, created_at: '2026-06-01T00:00:00Z' }] }] },
      isLoading: false,
      isError: false,
      hasNextPage: false,
    });
    renderFeed();
    expect(screen.getByText('First')).toBeInTheDocument();
  });

  it('renders an article entry with a link to its blog page', () => {
    useFeed.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              { kind: 'article', article_id: 'a1', slug: 'building', tag: 'aws', title: 'Building on AWS', excerpt: 'why', created_at: '2026-06-02T00:00:00Z' },
              { kind: 'post', post_id: 'p1', title: 'First', body: 'b', published: true, created_at: '2026-06-01T00:00:00Z' },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      hasNextPage: false,
    });
    renderFeed();
    expect(screen.getByRole('link', { name: 'Building on AWS' })).toHaveAttribute('href', '/blog/building');
    expect(screen.getByText('First')).toBeInTheDocument(); // posts still render alongside articles
  });

  it('shows an error state', () => {
    useFeed.mockReturnValue({ data: undefined, isLoading: false, isError: true, hasNextPage: false });
    renderFeed();
    expect(screen.getByText(/Não foi possível carregar o feed/)).toBeInTheDocument();
  });

  it('shows a Load more button and fetches the next page on click', () => {
    const fetchNextPage = vi.fn();
    useFeed.mockReturnValue({
      data: { pages: [{ items: [{ post_id: 'p1', title: 'First', body: 'b', published: true, created_at: '2026-06-01T00:00:00Z' }] }] },
      isLoading: false,
      isError: false,
      hasNextPage: true,
      fetchNextPage,
      isFetchingNextPage: false,
    });
    renderFeed();
    const btn = screen.getByRole('button', { name: 'Carregar mais' });
    fireEvent.click(btn);
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
