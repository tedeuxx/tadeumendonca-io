// Post + subscription mutations (/frontend/state, /frontend/forms). All authenticated (authedFetch).
// On success we invalidate the feed so the list reflects the change. The BFF re-checks the admin group.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authedFetch } from '../lib/api';
import type { Post } from '../types/post';

export interface PostInput {
  title: string;
  body: string;
  tags?: string[];
  published: boolean;
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) => authedFetch<Post>('/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useUpdatePost(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) =>
      authedFetch<Post>(`/posts/${postId}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => authedFetch<void>(`/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: (email: string) => authedFetch<{ email: string; status: string }>('/subscriptions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }),
  });
}

export function useUnsubscribe() {
  return useMutation({
    mutationFn: (email: string) => authedFetch<void>('/subscriptions', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }),
  });
}
