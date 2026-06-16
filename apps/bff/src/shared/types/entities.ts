// Domain entity types. snake_case everywhere (DynamoDB attribute = TS field = JSON) — no mapping
// layer (/backend/dynamodb). Phase 1 ships `profile`; posts/articles/subscriptions/audits follow.

export interface ExperienceItem {
  company: string;
  title: string;
  start_date: string; // ISO yyyy-mm
  end_date: string | null; // null = current
  description?: string;
  highlights?: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field?: string;
  start_date: string;
  end_date: string | null;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  issued_date: string;
  credential_url?: string;
}

export interface Profile {
  profile_id: string; // "me" — single-item table
  name: string;
  headline: string;
  summary?: string;
  location?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  skills: Record<string, string[]>; // category → skills
  metadata: Record<string, string>; // links (github, linkedin, …)
  updated_at?: string;
}

// Feed post (Phase 2). The `by-created` GSI is SPARSE: gsi_pk = "POST" is set ONLY when published,
// so the public feed query (gsi_pk = "POST", created_at desc) returns published posts only — drafts
// carry no gsi_pk and never appear in the index (/backend/dynamodb).
export const FEED_PK = 'POST';

// Link preview ("unfurl") for a curated external URL found in a post body. Resolved server-side on
// save (oEmbed for YouTube/Spotify, Open Graph for the generic web, a degraded card for X/Instagram
// which block unauthenticated reads). `image` is always our own CDN URL — the source thumbnail is
// downloaded and cached to S3 (og/unfurl/<hash>) so the card never hotlinks or breaks (/backend/unfurl).
export interface LinkPreview {
  url: string; // the original external URL
  provider: string; // 'YouTube' | 'Spotify' | 'X' | 'Instagram' | 'web'
  title?: string;
  description?: string;
  image?: string; // cached thumbnail, served from our CDN (spaOrigin/og/unfurl/<hash>.<ext>)
  site_name?: string;
  author?: string;
}

export interface Post {
  post_id: string; // opaque nanoid (never sequential)
  gsi_pk?: typeof FEED_PK; // present iff published — sparse feed index
  title: string;
  body: string; // markdown
  tags?: string[];
  link_previews?: LinkPreview[]; // server-derived from the body URLs (curated external content)
  reaction_counts?: Record<string, number>; // emoji → count, denormalized on the item (public reactions)
  comment_count?: number; // denormalized comment total (so the feed shows it without a join)
  short_code?: string; // share URL code → tadeumendonca.io/p/<short_code>
  published: boolean;
  author_sub?: string; // Cognito sub of the admin author
  created_at: string; // ISO-8601
  updated_at?: string;
}

// Post-moderated comment (Phase: interactions). Hash key = comment_id; the by-post GSI (post_id,
// created_at) lists a post's comments oldest-first. author_sub is server-verified (from the token);
// author_name is client-supplied (cosmetic, moderated) since the access token carries no name claim.
export interface Comment {
  comment_id: string; // opaque nanoid
  post_id: string;
  author_sub: string; // Cognito sub (verified)
  author_name: string; // display name (cosmetic)
  body: string;
  link_previews?: LinkPreview[]; // server-derived from the body URLs (curated external content)
  created_at: string;
}

// Short link: maps an opaque short code to a target — a post (target_id = post_id) or an article
// (target_id = slug). Hash key = code. The /p/<code> resolver returns {type, target_id} so the SPA
// can navigate to the right canonical URL (/posts/<id> vs /blog/<slug>).
export interface ShortLink {
  code: string; // base62, 7 chars
  type: 'post' | 'article';
  target_id: string;
  created_at: string;
}

// Newsletter subscription (Phase 2). Hash key = email. The `by-status` GSI (status, email) lists
// active subscribers for the notification fan-out; `by-cognito` finds a user's subscription by sub.
export type SubscriptionStatus = 'active' | 'unsubscribed';

export interface Subscription {
  email: string; // hash key
  status: SubscriptionStatus;
  cognito_sub: string; // the authenticated subscriber
  created_at: string;
  updated_at?: string;
}

// Long-form article (Phase 3). Hash key = article_id (opaque). `by-slug` GSI routes the public URL
// (/articles/<slug>); `by-tag` GSI (tag, created_at) lists a category newest-first; `by-created` GSI
// (gsi_pk, created_at) lists ALL published articles newest-first for the public list + unified feed.
// Like posts, `by-created` is SPARSE: gsi_pk = "ARTICLE" is set ONLY when published, so drafts never
// appear in it — and the read path is a Query, never a Scan (/backend/dynamodb).
export const ARTICLE_FEED_PK = 'ARTICLE';

// Body format. Legacy articles (pre-Phase-4) have no field → treated as 'markdown'. The Phase-4 rich
// editor (TipTap) stores 'html', server-sanitized on save. render/prerender branch on this.
export type ArticleContentFormat = 'markdown' | 'html';

export interface Article {
  article_id: string; // opaque nanoid
  gsi_pk?: typeof ARTICLE_FEED_PK; // present iff published — sparse by-created index
  slug: string; // human-readable, unique (by-slug GSI)
  tag: string; // primary category (by-tag GSI hash)
  title: string;
  body: string; // long-form content; format given by content_format (absent → markdown for legacy items)
  content_format?: ArticleContentFormat; // 'markdown' (legacy) | 'html' (Phase 4 rich editor, sanitized)
  excerpt?: string;
  published: boolean;
  author_sub?: string;
  short_code?: string; // share URL code → tadeumendonca.io/p/<short_code> (resolves to /blog/<slug>)
  link_previews?: LinkPreview[]; // server-derived from the body URLs (curated external content)
  created_at: string;
  updated_at?: string;
}

// Poll / "enquete" (Phase 2). Hash key = poll_id (opaque). The `by-created` GSI (gsi_pk, created_at)
// lists published polls newest-first for the aside widget. Like posts/articles it is SPARSE: gsi_pk =
// "POLL" is set ONLY when published, so drafts never appear in it and the read path is a Query, never a
// Scan. Votes are PUBLIC and anonymous (the SPA dedupes one-per-browser via localStorage) and stored
// DENORMALIZED as a vote_counts map (option_id → count) ADDed atomically on the item — no votes table.
// Entity names are English even though the UI label is pt-BR ("Enquete") (/infrastructure/dynamodb).
export const POLL_FEED_PK = 'POLL';

export interface PollOption {
  id: string; // opaque, server-generated; stable across edits so vote_counts stays meaningful
  label: string;
}

export interface Poll {
  poll_id: string; // opaque nanoid
  gsi_pk?: typeof POLL_FEED_PK; // present iff published — sparse by-created index
  question: string;
  options: PollOption[]; // 2..10 choices
  vote_counts?: Record<string, number>; // option_id → count, denormalized on the item (public votes)
  published: boolean;
  author_sub?: string; // Cognito sub of the admin author
  created_at: string; // ISO-8601
  updated_at?: string;
}

// User account (Phase 3) — profile + communication prefs, keyed by the Cognito sub (one item per
// signed-in user, created lazily on the first PUT /me). The SPARSE by-digest GSI key `digest_schedule`
// (= "daily" | "weekly") is set ONLY while opted in, so the newsletter-digest Lambda Queries opted-in
// users by cadence WITHOUT a Scan (mirrors the sparse feed indexes). `avatar_key` points at the upload
// in the assets bucket (avatars/<sub>.<ext>); the public URL is /assets/<avatar_key> via CloudFront.
export type DigestSchedule = 'daily' | 'weekly';

export interface User {
  cognito_sub: string; // hash key (the Cognito user id)
  nickname?: string; // apelido / display name (cosmetic)
  avatar_key?: string; // assets-bucket key, e.g. avatars/<sub>.png (managed by the avatar endpoint)
  newsletter_opt_in: boolean;
  newsletter_schedule?: DigestSchedule; // chosen cadence; remembered even while opted out
  digest_schedule?: DigestSchedule; // SPARSE by-digest GSI key — present iff opted in (derived, never client-set)
  created_at: string; // ISO-8601
  updated_at?: string;
}
