import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BlogPost } from '../lib/content';

const { getAllPosts } = vi.hoisted(() => ({ getAllPosts: vi.fn() }));
vi.mock('../lib/content', () => ({ getAllPosts }));

import { ArticlesSection } from './ArticlesSection';

const post = (over: Partial<BlogPost> = {}): BlogPost => ({
  slug: 'building',
  title: 'Building',
  date: '2026-06-01T00:00:00Z',
  tag: 'aws',
  track: 'engenharia',
  excerpt: 'x',
  body: '# hi',
  ...over,
});

const renderSection = () =>
  render(
    <MemoryRouter>
      <ArticlesSection />
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('ArticlesSection', () => {
  it('shows the empty state', () => {
    getAllPosts.mockReturnValue([]);
    renderSection();
    expect(screen.getByText('Ainda não há artigos nesta trilha.')).toBeInTheDocument();
  });

  it('lists posts with their title link and track chip', () => {
    getAllPosts.mockReturnValue([post()]);
    renderSection();
    expect(screen.getAllByRole('link', { name: 'Building' })[0]).toHaveAttribute('href', '/blog/building');
    // "Engenharia" also labels a filter tab — the chip is the one inside the article row.
    expect(screen.getByRole('article').textContent).toContain('Engenharia');
  });

  it('renders the reader-first takeaway when the post declares one', () => {
    getAllPosts.mockReturnValue([post({ takeaway: 'onde serverless paga.' })]);
    renderSection();
    expect(screen.getByText('Você sai sabendo')).toBeInTheDocument();
    expect(screen.getByText(/onde serverless paga/)).toBeInTheDocument();
  });

  it('advertises an embedded video and the LinkedIn edition when present', () => {
    getAllPosts.mockReturnValue([post({ hasVideo: true, linkedinUrl: 'https://linkedin.com/pulse/x' })]);
    renderSection();
    expect(screen.getByText('▶ vídeo no artigo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver no LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com/pulse/x');
  });

  it('omits the video badge and LinkedIn link by default', () => {
    getAllPosts.mockReturnValue([post()]);
    renderSection();
    expect(screen.queryByText('▶ vídeo no artigo')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Ver no LinkedIn' })).toBeNull();
  });

  it('starts on "Tudo" and asks the loader for every track', () => {
    getAllPosts.mockReturnValue([post()]);
    renderSection();
    expect(getAllPosts).toHaveBeenCalledWith(undefined);
    expect(screen.getByRole('tab', { name: 'Tudo' })).toHaveAttribute('aria-selected', 'true');
  });

  it('filters by track in local state (no URL param)', () => {
    getAllPosts.mockReturnValue([post()]);
    renderSection();

    fireEvent.click(screen.getByRole('tab', { name: 'Vida pessoal' }));
    expect(getAllPosts).toHaveBeenLastCalledWith({ track: 'pessoal' });
    expect(screen.getByRole('tab', { name: 'Vida pessoal' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('tab', { name: 'Engenharia' }));
    expect(getAllPosts).toHaveBeenLastCalledWith({ track: 'engenharia' });

    fireEvent.click(screen.getByRole('tab', { name: 'Tudo' }));
    expect(getAllPosts).toHaveBeenLastCalledWith(undefined);
  });
});
