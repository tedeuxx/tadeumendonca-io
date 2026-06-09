// Feed + single-post queries (/frontend/api-client, /frontend/pagination). The feed is cursor-paginated
// (useInfiniteQuery → next_cursor); single posts are cached by id. Public reads (no auth).
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { FeedPage, Post } from '../types/post';

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      apiFetch<FeedPage>(`/posts?limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ''}`),
    getNextPageParam: (last) => last.next_cursor,
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => apiFetch<Post>(`/posts/${postId}`),
  });
}
