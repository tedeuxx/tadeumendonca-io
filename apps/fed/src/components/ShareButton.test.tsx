import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton, articleShareUrl } from './ShareButton';
import { renderWithLocale } from '../test-utils';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('ShareButton', () => {
  it('uses the native share sheet with the absolute URL when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/meu-compromisso" />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(share.mock.calls[0][0].title).toBe('Hello');
    expect(share.mock.calls[0][0].url).toContain('/pt/blog/meu-compromisso');
    expect(share.mock.calls[0][0].url).toMatch(/^https?:\/\//); // origin prepended
  });

  it('falls back to copying to the clipboard and confirms in the active locale', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } }); // no navigator.share
    renderWithLocale(<ShareButton title="Hello" url="/blog/my-slug" />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain('/blog/my-slug');
    expect(await screen.findByText('Copiado')).toBeInTheDocument();
  });

  it('labels the button in English when the locale is en', () => {
    vi.stubGlobal('navigator', { share: vi.fn() });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/meu-compromisso" />, { locale: 'en' });
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });
});

describe('share URL helpers', () => {
  // The share path is the canonical route and nothing else (#268). The previous test asserted a
  // `/p/<short_code>` form — green, and about a route that has never existed on the static site: it
  // would have fallen through to the `*` catch-all and redirected the reader to the home page, which
  // is the worst outcome for a shared link because the sender sees a working URL.
  it('is the canonical article route — there is no short-code form to prefer', () => {
    expect(articleShareUrl({ slug: 'my-slug' })).toBe('/blog/my-slug');
  });
});
