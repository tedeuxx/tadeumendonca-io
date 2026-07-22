import { describe, it, expect } from 'vitest';
import { getAllPosts, getPostBySlug } from './content';

// Exercises the real glob + frontmatter parse against the seeded markdown in content/blog.
describe('content (markdown-in-repo)', () => {
  it('loads the seeded post with parsed frontmatter + body', () => {
    const post = getPostBySlug('building-serverless-on-aws');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Aposentei o backend do meu próprio site — e por que isso foi engenharia, não preguiça');
    expect(post?.tag).toBe('aws');
    expect(post?.date).toBe('2026-07-22T19:00:00.000Z'); // stayed a string (not a YAML Date)
    expect(post?.body).toContain('A pergunta que decidiu');
    expect(post?.body).not.toContain('---'); // frontmatter fence stripped
  });

  it('parses the track and the reader-first takeaway', () => {
    const post = getPostBySlug('building-serverless-on-aws');
    expect(post?.track).toBe('engenharia');
    expect(post?.takeaway).toBeTruthy();
  });

  it('defaults the optional fields conservatively', () => {
    const post = getPostBySlug('building-serverless-on-aws');
    expect(post?.hasVideo).toBe(false); // an absent flag is never truthy
    expect(post?.linkedinUrl).toBeUndefined();
    expect(post?.cover).toBeUndefined();
  });

  it('filters by tag and returns [] for an unknown tag', () => {
    expect(getAllPosts({ tag: 'aws' }).length).toBeGreaterThan(0);
    expect(getAllPosts({ tag: 'does-not-exist' })).toEqual([]);
  });

  it('filters by track', () => {
    expect(getAllPosts({ track: 'engenharia' }).length).toBeGreaterThan(0);
    expect(getAllPosts({ track: 'pessoal' })).toEqual([]);
  });

  it('returns everything when no filter is given', () => {
    expect(getAllPosts().length).toBeGreaterThan(0);
    expect(getAllPosts({})).toEqual(getAllPosts());
  });
});
