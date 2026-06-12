// Article queries + admin mutations (/frontend/api-client, /frontend/pagination). Public list (cursor,
// optional tag) + single-by-slug; admin create via authedFetch (invalidates the list). The BFF re-checks
// the admin group server-side.
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, authedFetch } from '../lib/api';
import type { Article, ArticleList } from '../types/article';

export function useArticles(tag?: string) {
  return useInfiniteQuery({
    queryKey: ['articles', tag ?? 'all'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '20' });
      if (tag) params.set('tag', tag);
      if (pageParam) params.set('cursor', pageParam);
      return apiFetch<ArticleList>(`/articles?${params.toString()}`);
    },
    getNextPageParam: (last) => last.next_cursor,
  });
}

export function useArticle(slug: string, enabled = true) {
  return useQuery({ queryKey: ['article', slug], queryFn: () => apiFetch<Article>(`/articles/${slug}`), enabled: enabled && Boolean(slug) });
}

export interface ArticleInput {
  title: string;
  body: string;
  tag: string;
  excerpt?: string;
  published: boolean;
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ArticleInput) => authedFetch<Article>('/articles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}

// Update by the article's CURRENT slug (the BFF resolves the id and re-checks slug uniqueness → 409 if a
// retitle collides). Invalidate the list plus both the old and (if it changed) the new slug's detail.
export function useUpdateArticle(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ArticleInput) =>
      authedFetch<Article>(`/articles/${slug}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: (article) => {
      void qc.invalidateQueries({ queryKey: ['articles'] });
      void qc.invalidateQueries({ queryKey: ['article', slug] });
      if (article.slug !== slug) void qc.invalidateQueries({ queryKey: ['article', article.slug] });
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => authedFetch<void>(`/articles/${slug}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}
