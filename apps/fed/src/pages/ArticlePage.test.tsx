import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { BlogPost } from '../lib/content';

const { getPostBySlug } = vi.hoisted(() => ({ getPostBySlug: vi.fn() }));
vi.mock('../lib/content', () => ({ getPostBySlug }));

import { ArticlePage } from './ArticlePage';

const renderAt = (slug: string) =>
  render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<ArticlePage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('ArticlePage', () => {
  it('renders the post with its markdown body', () => {
    const post: BlogPost = {
      slug: 'building',
      title: 'Building Serverless',
      date: '2026-06-01T00:00:00Z',
      tag: 'aws',
      body: '## Why\n\ncode',
    };
    getPostBySlug.mockReturnValue(post);
    renderAt('building');
    expect(screen.getByText('Building Serverless')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why' })).toBeInTheDocument(); // markdown rendered
  });

  it('shows not-found for an unknown slug', () => {
    getPostBySlug.mockReturnValue(undefined);
    renderAt('nope');
    expect(screen.getByText(/não existe ou não está publicado/)).toBeInTheDocument();
  });
});
