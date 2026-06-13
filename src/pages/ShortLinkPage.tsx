// Short-link landing (/frontend/routing). Resolves /p/<code> → its target via the BFF, then redirects
// to the canonical URL: a post → /posts/<id>, an article → /blog/<slug>. Social/SEO crawlers never
// reach this (og-edge serves them the OG card at the edge); this is the human path.
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { ColumnHeader, CenterLoader, Notice } from '../components/Column';

export function ShortLinkPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data, isError } = useQuery({
    queryKey: ['shortlink', code],
    queryFn: () => apiFetch<{ type: string; target_id: string }>(`/shortlinks/${code}`),
    retry: false,
  });

  useEffect(() => {
    if (!data?.target_id) return;
    const to = data.type === 'article' ? `/blog/${data.target_id}` : `/posts/${data.target_id}`;
    navigate(to, { replace: true });
  }, [data, navigate]);

  return (
    <div>
      <ColumnHeader title="Link" back />
      {isError ? <Notice>Este link não existe ou expirou.</Notice> : <CenterLoader />}
    </div>
  );
}
