// New-post notification fan-out (/backend/notifications). Called when a post transitions to published.
// FAIL-OPEN: a send failure (e.g. SES sandbox rejecting an unverified recipient, or a rate trip) must
// never break the post mutation — we log and move on. Sends run concurrently via allSettled.
//
// TRADE-OFF: this fans out INLINE in the request. Fine for a personal feed's subscriber count; the
// documented scale path is SNS → a consumer Lambda → SES batch (so the publish request returns
// immediately and sends are throttled to the SES rate limit). Wire that when the list grows.
import { config } from '../../shared/config';
import { logger } from '../../shared/middleware/logger';
import { sendEmail } from '../../shared/ses/client';
import { listActiveEmails } from '../subscriptions/repository';
import type { Post } from '../../shared/types/entities';

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function notifyPostPublished(post: Post): Promise<void> {
  try {
    const emails = await listActiveEmails();
    if (emails.length === 0) return;
    const url = `${config.spaOrigin}/posts/${post.post_id}`;
    const subject = `New post: ${post.title}`;
    const html = `<p>A new post is live:</p><h2><a href="${url}">${escapeHtml(post.title)}</a></h2><p><a href="${url}">Read it →</a></p>`;
    const text = `A new post is live: ${post.title}\n${url}`;

    const results = await Promise.allSettled(emails.map((to) => sendEmail({ to, subject, html, text })));
    const failed = results.filter((r) => r.status === 'rejected').length;
    logger.info('notify fan-out', { post_id: post.post_id, recipients: emails.length, failed });
  } catch (err) {
    logger.error('notify fan-out failed', err as Error); // fail-open — never block the publish
  }
}
