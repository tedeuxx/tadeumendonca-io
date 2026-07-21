import { describe, it, expect } from 'vitest';
import { getAllPosts, getPostBySlug } from './content';

// Exercises the real glob + frontmatter parse against the seeded markdown in content/blog.
describe('content (markdown-in-repo)', () => {
  it('loads the seeded post with parsed frontmatter + body', () => {
    const post = getPostBySlug('building-serverless-on-aws');
    expect(post).toBeDefined();
    expect(post?.title).toBe('Building Serverless on AWS');
    expect(post?.tag).toBe('aws');
    expect(post?.date).toBe('2026-06-09T19:00:00.000Z'); // stayed a string (not a YAML Date)
    expect(post?.body).toContain('Why serverless');
    expect(post?.body).not.toContain('---'); // frontmatter fence stripped
  });

  it('filters by tag and returns [] for an unknown tag', () => {
    expect(getAllPosts('aws').length).toBeGreaterThan(0);
    expect(getAllPosts('does-not-exist')).toEqual([]);
  });
});
