import { describe, it, expect } from 'vitest';
import { buildDigestEmail, itemUrl } from '../email';
import type { FeedItem } from '../../modules/posts/feed';

const post = (over: Partial<Extract<FeedItem, { kind: 'post' }>> = {}): FeedItem =>
  ({ kind: 'post', post_id: 'p1', title: 'Hello', body: 'b', published: true, created_at: '2026-06-14T10:00:00.000Z', ...over });
const article = (over: Partial<Extract<FeedItem, { kind: 'article' }>> = {}): FeedItem =>
  ({ kind: 'article', article_id: 'a1', slug: 'my-slug', tag: 'eng', title: 'My Article', excerpt: 'short', created_at: '2026-06-14T09:00:00.000Z', ...over });

describe('itemUrl', () => {
  it('links posts to /posts/<id> and articles to /blog/<slug>', () => {
    expect(itemUrl(post({ post_id: 'p9' }))).toBe('https://staging.tadeumendonca.io/posts/p9');
    expect(itemUrl(article({ slug: 'the-slug' }))).toBe('https://staging.tadeumendonca.io/blog/the-slug');
  });
});

describe('buildDigestEmail', () => {
  it('builds a daily digest with a personalized greeting and both kinds', () => {
    const mail = buildDigestEmail([post({ title: 'Post One' }), article({ title: 'Article Two' })], 'daily', 'Tadeu');
    expect(mail.subject).toContain('do dia');
    expect(mail.html).toContain('Olá, Tadeu!');
    expect(mail.html).toContain('Post One');
    expect(mail.html).toContain('Article Two');
    expect(mail.html).toContain('/posts/p1');
    expect(mail.html).toContain('/blog/my-slug');
    expect(mail.text).toContain('[Post] Post One');
    expect(mail.text).toContain('[Blog] Article Two');
  });

  it('weekly label + neutral greeting when no nickname', () => {
    const mail = buildDigestEmail([article()], 'weekly');
    expect(mail.subject).toContain('da semana');
    expect(mail.html).toContain('Olá!');
    expect(mail.html).not.toContain('Olá,');
  });

  it('escapes HTML in titles (no injection)', () => {
    const mail = buildDigestEmail([post({ title: '<script>x</script>' })], 'daily');
    expect(mail.html).not.toContain('<script>x');
    expect(mail.html).toContain('&lt;script&gt;');
  });
});
