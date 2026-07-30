// Article shape (mirrors the BFF's snake_case Article). /frontend/state.
import type { LinkPreview } from './post';

export interface Article {
  article_id: string;
  slug: string;
  tag: string;
  title: string;
  body: string; // markdown
  excerpt?: string;
  published: boolean;
  author_sub?: string;
  link_previews?: LinkPreview[]; // server-derived rich previews of curated body URLs
  created_at: string;
  updated_at?: string;
}

export interface ArticleList {
  items: Article[];
  next_cursor?: string;
}
