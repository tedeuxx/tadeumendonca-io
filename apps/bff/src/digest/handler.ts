// Newsletter digest Lambda (/backend/notifications). NOT part of the Hono BFF — a standalone handler
// invoked by EventBridge on a daily and a weekly schedule (api.tf fn_digest), each passing a static
// { periodicity } input. It Queries opted-in users for that cadence via the users `by-digest` sparse GSI
// (no Scan), gathers the recent feed window (merged posts + articles), resolves each user's email from
// Cognito, and sends one personalized digest via SES. FAIL-OPEN per recipient — a bad address (e.g. SES
// sandbox) never aborts the run.
import { logger } from '../shared/middleware/logger';
import { listFeed } from '../modules/posts/feed';
import { listByDigestSchedule } from '../modules/users/repository';
import { sendEmail } from '../shared/ses/client';
import { buildSubEmailMap } from './cognito';
import { buildDigestEmail } from './email';
import type { DigestSchedule } from '../shared/types/entities';

interface DigestEvent {
  periodicity?: DigestSchedule;
}

const WINDOW_MS: Record<DigestSchedule, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};
const MAX_ITEMS = 50; // cap the digest size; a quiet personal feed never approaches this

export async function handler(event: DigestEvent): Promise<void> {
  const periodicity = event?.periodicity;
  if (periodicity !== 'daily' && periodicity !== 'weekly') {
    logger.error('digest: invalid periodicity', { periodicity });
    return;
  }

  // Recent window of merged posts + articles (newest-first), filtered to the cadence window.
  const cutoff = new Date(Date.now() - WINDOW_MS[periodicity]).toISOString();
  const feed = await listFeed(MAX_ITEMS);
  const items = feed.items.filter((i) => i.created_at >= cutoff);
  if (items.length === 0) {
    logger.info('digest: nothing new in window — skipping', { periodicity, cutoff });
    return;
  }

  const users = await listByDigestSchedule(periodicity);
  if (users.length === 0) {
    logger.info('digest: no opted-in users for cadence', { periodicity });
    return;
  }

  // Resolve emails once (sub -> email); skip users we can't address.
  const emailBySub = await buildSubEmailMap();
  const recipients = users
    .map((u) => ({ email: emailBySub.get(u.cognito_sub), nickname: u.nickname }))
    .filter((r): r is { email: string; nickname: string | undefined } => Boolean(r.email));

  if (recipients.length === 0) {
    logger.info('digest: opted-in users have no resolvable email', { periodicity, opted_in: users.length });
    return;
  }

  const results = await Promise.allSettled(
    recipients.map((r) => {
      const { subject, html, text } = buildDigestEmail(items, periodicity, r.nickname);
      return sendEmail({ to: r.email, subject, html, text });
    }),
  );
  const failed = results.filter((res) => res.status === 'rejected').length;
  logger.info('digest sent', { periodicity, items: items.length, recipients: recipients.length, failed });
}
