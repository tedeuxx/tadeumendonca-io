import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { usePost } = vi.hoisted(() => ({ usePost: vi.fn() }));
vi.mock('../hooks/useFeed', () => ({ usePost }));
// CommentsSection has its own suite + needs a QueryClient; stub it here.
vi.mock('../components/CommentsSection', () => ({ CommentsSection: () => null }));

import { PostPage } from './PostPage';

const renderAt = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/posts/${id}`]}>
      <Routes>
        <Route path="/posts/:postId" element={<PostPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('PostPage', () => {
  it('renders the post when loaded', () => {
    usePost.mockReturnValue({
      data: { post_id: 'p1', title: 'A Post', body: 'body', published: true, created_at: '2026-06-01T00:00:00Z' },
      isLoading: false,
      isError: false,
    });
    renderAt('p1');
    expect(screen.getByText('A Post')).toBeInTheDocument();
  });

  it('shows not-found on error', () => {
    usePost.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderAt('nope');
    expect(screen.getByText(/não existe ou não está publicado/)).toBeInTheDocument();
  });
});
