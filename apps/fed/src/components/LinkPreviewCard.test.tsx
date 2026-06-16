import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LinkPreviewCard } from './LinkPreviewCard';
import type { LinkPreview } from '../types/post';

const base: LinkPreview = {
  url: 'https://www.youtube.com/watch?v=abc',
  provider: 'YouTube',
  title: 'A great video',
  description: 'Some description',
  image: 'https://staging.tadeumendonca.io/og/unfurl/deadbeef.jpg',
  site_name: 'YouTube',
};

describe('LinkPreviewCard', () => {
  it('renders title, domain, image and links to the original (new tab)', () => {
    const { container } = render(<LinkPreviewCard preview={base} />);
    expect(screen.getByText('A great video')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', base.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(container.querySelector('img')).toHaveAttribute('src', base.image);
  });

  it('renders the description', () => {
    render(<LinkPreviewCard preview={base} />);
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('falls back to the hostname when there is no site_name, and uses the compact (imageless) layout', () => {
    const { container } = render(<LinkPreviewCard preview={{ url: 'https://blog.example.com/x', provider: 'web', title: 'No image here' }} />);
    expect(screen.getByText('blog.example.com')).toBeInTheDocument();
    expect(screen.getByText('No image here')).toBeInTheDocument(); // compact layout still shows the title
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows a remove button only when onRemove is provided', () => {
    const onRemove = vi.fn();
    const { rerender } = render(<LinkPreviewCard preview={base} />);
    expect(screen.queryByRole('button', { name: 'Remove preview' })).toBeNull();
    rerender(<LinkPreviewCard preview={base} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove preview' }));
    expect(onRemove).toHaveBeenCalled();
  });
});
