// Live link-preview for compose (/frontend/state). Debounces URLs typed in the post body and resolves
// each via the admin /unfurl endpoint, so the admin sees the card before saving. The stored previews
// are re-resolved server-side on save (the BFF is authoritative) — this is purely the compose preview.
import { useEffect, useRef, useState } from 'react';
import { authedFetch } from '../lib/api';
import type { LinkPreview } from '../types/post';

const URL_RE = /https?:\/\/[^\s<>()\]]+/gi;
const TRAILING_PUNCT = '.,;:!?';

export function extractUrls(body: string, max = 4): string[] {
  const seen = new Set<string>();
  for (const m of body.matchAll(URL_RE)) {
    let end = m[0].length; // trim trailing punctuation (linear scan, no regex backtracking)
    while (end > 0 && TRAILING_PUNCT.includes(m[0][end - 1])) end--;
    const url = m[0].slice(0, end);
    if (!seen.has(url)) seen.add(url);
    if (seen.size >= max) break;
  }
  return [...seen];
}

async function unfurl(url: string): Promise<LinkPreview> {
  return authedFetch<LinkPreview>('/admin/unfurl', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  });
}

// Returns the resolved previews for the URLs currently in `body`, debounced. Caches per-URL across
// keystrokes so editing text doesn't re-fetch links that haven't changed.
export function useUnfurl(body: string, debounceMs = 700): { previews: LinkPreview[]; loading: boolean } {
  const [previews, setPreviews] = useState<LinkPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const cache = useRef<Map<string, LinkPreview>>(new Map());

  useEffect(() => {
    const urls = extractUrls(body);
    if (urls.length === 0) {
      setPreviews([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const missing = urls.filter((u) => !cache.current.has(u));
      if (missing.length > 0) {
        setLoading(true);
        const settled = await Promise.allSettled(missing.map(unfurl));
        settled.forEach((s, i) => {
          if (s.status === 'fulfilled') cache.current.set(missing[i], s.value);
        });
      }
      if (cancelled) return;
      setPreviews(urls.map((u) => cache.current.get(u)).filter((p): p is LinkPreview => !!p));
      setLoading(false);
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [body, debounceMs]);

  return { previews, loading };
}
