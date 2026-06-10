import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
const { usePostComments, useCreateComment, useDeleteComment } = vi.hoisted(() => ({
  usePostComments: vi.fn(),
  useCreateComment: vi.fn(),
  useDeleteComment: vi.fn(),
}));
vi.mock('../auth/authStore', () => ({ useAuth }));
vi.mock('../hooks/useComments', () => ({ usePostComments, useCreateComment, useDeleteComment }));

import { CommentsSection } from './CommentsSection';

const comment = { comment_id: 'c1', post_id: 'p1', author_sub: 'u-1', author_name: 'Ana', body: 'great post', created_at: '2026-06-01T00:00:00Z' };

beforeEach(() => {
  vi.clearAllMocks();
  usePostComments.mockReturnValue({ data: { pages: [{ items: [comment] }] }, isLoading: false, hasNextPage: false });
  useCreateComment.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useDeleteComment.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

describe('CommentsSection', () => {
  it('prompts anonymous users to sign in', () => {
    const signIn = vi.fn();
    useAuth.mockReturnValue({ status: 'anonymous', signIn });
    render(<CommentsSection postId="p1" />);
    expect(screen.getByText('great post')).toBeInTheDocument(); // list is public
    fireEvent.click(screen.getByRole('button', { name: /Entrar para comentar/ }));
    expect(signIn).toHaveBeenCalled();
  });

  it('lets a logged-in user submit a comment with their display name', () => {
    const mutate = vi.fn();
    useAuth.mockReturnValue({ status: 'authenticated', sub: 'u-2', name: 'Bob', isAdmin: false, signIn: vi.fn() });
    useCreateComment.mockReturnValue({ mutate, isPending: false });
    render(<CommentsSection postId="p1" />);
    fireEvent.change(screen.getByPlaceholderText('Escreva um comentário…'), { target: { value: 'hi there' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));
    expect(mutate).toHaveBeenCalledWith({ body: 'hi there', author_name: 'Bob' }, expect.anything());
  });

  it('shows a delete control for the author and deletes', () => {
    const mutate = vi.fn();
    useAuth.mockReturnValue({ status: 'authenticated', sub: 'u-1', name: 'Ana', isAdmin: false, signIn: vi.fn() });
    useDeleteComment.mockReturnValue({ mutate, isPending: false });
    render(<CommentsSection postId="p1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete comment' }));
    expect(mutate).toHaveBeenCalledWith('c1');
  });

  it('hides the delete control from a different non-admin user', () => {
    useAuth.mockReturnValue({ status: 'authenticated', sub: 'u-9', name: 'X', isAdmin: false, signIn: vi.fn() });
    render(<CommentsSection postId="p1" />);
    expect(screen.queryByRole('button', { name: 'Delete comment' })).toBeNull();
  });
});
