import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from './ShareButton';

const post = { post_id: 'p1', short_code: 'aB3xK9q', title: 'Hello' };
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('ShareButton', () => {
  it('uses the native share sheet with the short URL when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    render(<ShareButton post={post} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(share.mock.calls[0][0].url).toContain('/p/aB3xK9q');
  });

  it('falls back to copying to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } }); // no navigator.share
    render(<ShareButton post={post} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain('/p/aB3xK9q');
    expect(await screen.findByText('Copiado')).toBeInTheDocument();
  });

  it('falls back to /posts/<id> when there is no short_code', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<ShareButton post={{ post_id: 'p1', title: 'Hello' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(writeText.mock.calls[0][0]).toContain('/posts/p1');
  });
});
