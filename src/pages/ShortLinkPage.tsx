// Short-link landing (/frontend/routing). Resolves /p/<code> → the post via the BFF, then redirects to
// the canonical /posts/<id>. Social/SEO crawlers never reach this (og-edge serves them the OG card at
// the edge); this is the human path.
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
    if (data?.target_id) navigate(`/posts/${data.target_id}`, { replace: true });
  }, [data, navigate]);

  return (
    <div>
      <ColumnHeader title="Link" back />
      {isError ? <Notice>Este link não existe ou expirou.</Notice> : <CenterLoader />}
    </div>
  );
}
