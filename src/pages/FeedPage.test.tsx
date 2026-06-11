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
    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
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

  it('shows an error state', () => {
    useFeed.mockReturnValue({ data: undefined, isLoading: false, isError: true, hasNextPage: false });
    renderFeed();
    expect(screen.getByText(/Couldn't load the feed/)).toBeInTheDocument();
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
    const btn = screen.getByRole('button', { name: 'Load more' });
    fireEvent.click(btn);
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
