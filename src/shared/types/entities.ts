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

export interface Post {
  post_id: string; // opaque nanoid (never sequential)
  gsi_pk?: typeof FEED_PK; // present iff published — sparse feed index
  title: string;
  body: string; // markdown
  tags?: string[];
  published: boolean;
  author_sub?: string; // Cognito sub of the admin author
  created_at: string; // ISO-8601
  updated_at?: string;
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
