// Comments (/frontend/state). Public read (infinite, oldest-first); authenticated write + delete.
// On change we invalidate the comment list and the post (its denormalized comment_count).
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, authedFetch } from '../lib/api';
import type { CommentPage } from '../types/post';

export function usePostComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => apiFetch<CommentPage>(`/posts/${postId}/comments?limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ''}`),
    getNextPageParam: (last) => last.next_cursor,
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; author_name: string }) =>
      authedFetch(`/posts/${postId}/comments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comments', postId] });
      void qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => authedFetch<void>(`/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comments', postId] });
      void qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}
