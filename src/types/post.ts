// Feed post shape (mirrors the BFF's snake_case Post; gsi_pk is stripped server-side). /frontend/state.
export interface Post {
  post_id: string;
  title: string;
  body: string; // markdown
  tags?: string[];
  published: boolean;
  author_sub?: string;
  created_at: string;
  updated_at?: string;
}

export interface FeedPage {
  items: Post[];
  next_cursor?: string;
}
