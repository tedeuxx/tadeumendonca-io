import { describe, it, expect } from 'vitest';
import { Markdown } from './Markdown';
import { renderWithLocale } from '../test-utils';

describe('Markdown — the lone-URL repo-card facade (#122 / ADR-0035)', () => {
  it('turns a paragraph that is only a curated repo URL into a RepoCard', () => {
    const { container } = renderWithLocale(<Markdown>{'https://github.com/karpathy/nanoGPT'}</Markdown>, {
      locale: 'en',
    });
    const card = container.querySelector('[data-testid="repo-card"]');
    expect(card).not.toBeNull();
    expect(card).toHaveTextContent('karpathy/nanoGPT');
    // The card replaced the paragraph — the raw URL text is not sitting there as a plain link.
    expect(container.querySelector('a')).toHaveAttribute('href', 'https://github.com/karpathy/nanoGPT');
  });

  it('matches the curated URL case-insensitively and past a trailing slash', () => {
    const { container } = renderWithLocale(<Markdown>{'https://github.com/Karpathy/nanogpt/'}</Markdown>, {
      locale: 'en',
    });
    expect(container.querySelector('[data-testid="repo-card"]')).not.toBeNull();
  });

  it('leaves an UNREGISTERED github URL as a plain link, not a card (the facade is opt-in)', () => {
    const { container } = renderWithLocale(
      <Markdown>{'https://github.com/karpathy/some-other-repo'}</Markdown>,
      { locale: 'en' },
    );
    expect(container.querySelector('[data-testid="repo-card"]')).toBeNull();
    // react-markdown does not autolink a bare URL (no GFM), so it stays plain text — the key property is
    // simply that it did NOT become a card.
    expect(container).toHaveTextContent('https://github.com/karpathy/some-other-repo');
  });

  it('still renders ordinary prose as a paragraph', () => {
    const { container } = renderWithLocale(<Markdown>{'Just a sentence.'}</Markdown>, { locale: 'en' });
    expect(container.querySelector('p')).toHaveTextContent('Just a sentence.');
    expect(container.querySelector('[data-testid="repo-card"]')).toBeNull();
  });
});
