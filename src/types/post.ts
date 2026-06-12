// Link preview card for a curated external URL (mirrors the BFF LinkPreview). `image`, when present,
// is already our own CDN URL (the BFF cached the thumbnail to S3). /frontend/state.
export interface LinkPreview {
  url: string;
  provider: string; // 'YouTube' | 'Spotify' | 'X' | 'Instagram' | 'web'
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
  author?: string;
}

// Feed post shape (mirrors the BFF's snake_case Post; gsi_pk is stripped server-side). /frontend/state.
export interface Post {
  post_id: string;
  title: string;
  body: string; // markdown
  tags?: string[];
  link_previews?: LinkPreview[];
  reaction_counts?: Record<string, number>; // emoji → count (public reactions)
  comment_count?: number;
  short_code?: string; // share URL: /p/<short_code>
  published: boolean;
  author_sub?: string;
  created_at: string;
  updated_at?: string;
}

// A post-moderated comment (mirrors the BFF Comment). author_name is the display name. /frontend/state.
export interface Comment {
  comment_id: string;
  post_id: string;
  author_sub: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface CommentPage {
  items: Comment[];
  next_cursor?: string;
}

// An article as it appears in the unified feed (mirrors the BFF feed.ts article variant — a trimmed
// Article: no body, just the headline fields + excerpt, linking out to /blog/:slug). /frontend/state.
export interface ArticleFeedItem {
  kind: 'article';
  article_id: string;
  slug: string;
  tag: string;
  title: string;
  excerpt?: string;
  created_at: string;
}

// The unified public feed mixes posts and published articles, discriminated by `kind` (mirrors the BFF
// FeedItem; the BFF tags each item so the client can pick a renderer). /frontend/state.
export type FeedItem = ({ kind: 'post' } & Post) | ArticleFeedItem;

export interface FeedPage {
  items: FeedItem[];
  next_cursor?: string;
}
