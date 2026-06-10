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
  published: boolean;
  author_sub?: string;
  created_at: string;
  updated_at?: string;
}

export interface FeedPage {
  items: Post[];
  next_cursor?: string;
}
