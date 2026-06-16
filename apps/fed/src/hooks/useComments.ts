// Comments (/frontend/state). Public read (infinite, oldest-first); authenticated write + delete.
// On change we invalidate the comment list and the post (its denormalized comment_count).
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, authedFetch } from '../lib/api';
import type { CommentVars } from '../lib/offline';
import type { CommentPage } from '../types/post';

export function usePostComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => apiFetch<CommentPage>(`/posts/${postId}/comments?limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ''}`),
    getNextPageParam: (last) => last.next_cursor,
  });
}

// Offline-first: the request fn + invalidation live in the keyed 'comment' mutation defaults
// (src/lib/offline.ts), so a comment written offline is queued (paused) and replayed on reconnect with
// a fresh token. The wrapper injects postId into the variables so the persisted mutation can replay
// after a reload (when this component is long gone). `isPaused` lets the form show a "queued" notice.
export function useCreateComment(postId: string) {
  const m = useMutation<unknown, unknown, CommentVars>({ mutationKey: ['comment'] });
  // Inject postId into the variables (so the persisted mutation can replay after a reload) while keeping
  // the caller's {body, author_name} shape. Spread the rest of the result through (isPending/isPaused/…).
  return {
    ...m,
    mutate: (input: { body: string; author_name: string }, opts?: { onSuccess?: () => void }) => m.mutate({ postId, ...input }, opts),
  };
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
