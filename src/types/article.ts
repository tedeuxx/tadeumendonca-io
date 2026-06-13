// Article shape (mirrors the BFF's snake_case Article). /frontend/state.
export interface Article {
  article_id: string;
  slug: string;
  tag: string;
  title: string;
  body: string; // markdown
  excerpt?: string;
  published: boolean;
  author_sub?: string;
  short_code?: string; // share URL: /p/<short_code> → /blog/<slug>
  created_at: string;
  updated_at?: string;
}

export interface ArticleList {
  items: Article[];
  next_cursor?: string;
}
