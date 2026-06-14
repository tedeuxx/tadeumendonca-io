// Digest email rendering (/backend/notifications). Turns a window of recent feed items (merged posts +
// articles) into a simple, client-friendly HTML + text email. Links point at the canonical site URLs;
// unifying every off-platform link onto the short URL (/p/<code>) is a Phase 5 (5.4) cross-cutting task.
import { config } from '../shared/config';
import type { FeedItem } from '../modules/posts/feed';

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);

// Canonical URL for a feed item: posts → /posts/<id>, articles → /blog/<slug>.
export function itemUrl(item: FeedItem): string {
  return item.kind === 'article' ? `${config.spaOrigin}/blog/${item.slug}` : `${config.spaOrigin}/posts/${item.post_id}`;
}

export interface DigestEmail {
  subject: string;
  html: string;
  text: string;
}

// Build the digest for one cadence. `greetingName` personalizes the opener when the user has a nickname.
export function buildDigestEmail(items: FeedItem[], periodicity: 'daily' | 'weekly', greetingName?: string): DigestEmail {
  const cadenceLabel = periodicity === 'daily' ? 'do dia' : 'da semana';
  const subject = `Novidades ${cadenceLabel} em tadeumendonca.io`;
  const helloText = greetingName ? `Olá, ${greetingName}!` : 'Olá!';
  const hello = greetingName ? `Olá, ${escapeHtml(greetingName)}!` : 'Olá!';

  const rows = items
    .map((item) => {
      const url = itemUrl(item);
      const kindLabel = item.kind === 'article' ? 'Blog' : 'Post';
      const excerpt = item.kind === 'article' && item.excerpt ? `<p style="margin:4px 0 0;color:#555">${escapeHtml(item.excerpt)}</p>` : '';
      return `<li style="margin:0 0 16px"><span style="color:#E8A613;font-weight:bold">${kindLabel}</span> · <a href="${url}" style="color:#111;font-weight:bold;text-decoration:none">${escapeHtml(item.title)}</a>${excerpt}</li>`;
    })
    .join('');

  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto">
<p>${hello}</p>
<p>Aqui estão as novidades ${cadenceLabel}:</p>
<ul style="list-style:none;padding:0">${rows}</ul>
<p style="color:#888;font-size:13px">Você recebe este resumo porque ativou a newsletter em <a href="${config.spaOrigin}/conta">tadeumendonca.io</a>. Para parar, desative a newsletter na sua conta.</p>
</div>`;

  const lines = items.map((item) => `- [${item.kind === 'article' ? 'Blog' : 'Post'}] ${item.title}\n  ${itemUrl(item)}`).join('\n');
  const text = `${helloText}\n\nNovidades ${cadenceLabel}:\n\n${lines}\n\nVocê recebe este resumo porque ativou a newsletter em ${config.spaOrigin}/conta. Para parar, desative a newsletter na sua conta.`;

  return { subject, html, text };
}
