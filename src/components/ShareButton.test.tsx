import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton, postShareUrl, articleShareUrl } from './ShareButton';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('ShareButton', () => {
  it('uses the native share sheet with the absolute URL when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    render(<ShareButton title="Hello" url="/p/aB3xK9q" />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(share.mock.calls[0][0].title).toBe('Hello');
    expect(share.mock.calls[0][0].url).toContain('/p/aB3xK9q');
    expect(share.mock.calls[0][0].url).toMatch(/^https?:\/\//); // origin prepended
  });

  it('falls back to copying to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } }); // no navigator.share
    render(<ShareButton title="Hello" url="/blog/my-slug" />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain('/blog/my-slug');
    expect(await screen.findByText('Copiado')).toBeInTheDocument();
  });
});

describe('share URL helpers', () => {
  it('postShareUrl prefers the short code, else /posts/<id>', () => {
    expect(postShareUrl({ post_id: 'p1', short_code: 'aB3xK9q' })).toBe('/p/aB3xK9q');
    expect(postShareUrl({ post_id: 'p1' })).toBe('/posts/p1');
  });

  it('articleShareUrl prefers the short code, else /blog/<slug>', () => {
    expect(articleShareUrl({ slug: 'my-slug', short_code: 'cD4yL0r' })).toBe('/p/cD4yL0r');
    expect(articleShareUrl({ slug: 'my-slug' })).toBe('/blog/my-slug');
  });
});
