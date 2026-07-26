import { describe, it, expect } from 'vitest';
import { RepoCard } from './RepoCard';
import { repoCards, type RepoCardData } from '../data/repoCards';
import { renderWithLocale } from '../test-utils';

const nanoGpt = repoCards.find((r) => r.name === 'nanoGPT') as RepoCardData;

describe('RepoCard', () => {
  it('renders the facts (owner/name + language chip) and links out to the canonical repo, once', () => {
    const { container } = renderWithLocale(<RepoCard repo={nanoGpt} />, { locale: 'en' });

    expect(container).toHaveTextContent('karpathy/nanoGPT');
    expect(container).toHaveTextContent('Python');

    // Exactly one anchor per card (the whole card is the single control), to the canonical URL, opened
    // safely. More than one would violate the card contract (ADR-0035) and double-count in the parity test.
    const anchors = [...container.querySelectorAll('a')];
    expect(anchors).toHaveLength(1);
    expect(anchors[0]).toHaveAttribute('href', 'https://github.com/karpathy/nanoGPT');
    expect(anchors[0]).toHaveAttribute('target', '_blank');
    expect(anchors[0]).toHaveAttribute('rel', 'noreferrer');
  });

  it('shows the description in the visitor language, and NOT the other edition (no cross-locale leak)', () => {
    const en = renderWithLocale(<RepoCard repo={nanoGpt} />, { locale: 'en' });
    expect(en.container).toHaveTextContent(nanoGpt.description.en);
    expect(en.container).not.toHaveTextContent(nanoGpt.description.pt);
    en.unmount();

    const pt = renderWithLocale(<RepoCard repo={nanoGpt} />, { locale: 'pt' });
    expect(pt.container).toHaveTextContent(nanoGpt.description.pt);
    expect(pt.container).not.toHaveTextContent(nanoGpt.description.en);
  });

  it('loads nothing third-party — pure static text + one anchor, no image or iframe', () => {
    const { container } = renderWithLocale(<RepoCard repo={nanoGpt} />, { locale: 'en' });
    // The card's whole value over a GitHub OG-card image is that it costs the reader zero requests.
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('obeys the fixed identity — no rounded/shadow/gradient anywhere in the card', () => {
    const { container } = renderWithLocale(<RepoCard repo={nanoGpt} />, { locale: 'en' });
    const html = container.innerHTML;
    expect(html).not.toMatch(/\brounded/);
    expect(html).not.toMatch(/\bshadow/);
    expect(html).not.toMatch(/gradient/);
  });
});
