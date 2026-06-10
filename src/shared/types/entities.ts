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
  created_at: string;
}

// Short link: maps an opaque short code to a target (a post for now). Hash key = code.
export interface ShortLink {
  code: string; // base62, 7 chars
  type: 'post';
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
// (/articles/<slug>); `by-tag` GSI (tag, created_at) lists a category newest-first. `tag` is the single
// indexed category; drafts are filtered out by `published` (not a sparse index, since slug must resolve
// for previews). No "list all" GSI — that path Scans (articles are low-volume; see repository).
export interface Article {
  article_id: string; // opaque nanoid
  slug: string; // human-readable, unique (by-slug GSI)
  tag: string; // primary category (by-tag GSI hash)
  title: string;
  body: string; // markdown (long-form)
  excerpt?: string;
  published: boolean;
  author_sub?: string;
  created_at: string;
  updated_at?: string;
}
