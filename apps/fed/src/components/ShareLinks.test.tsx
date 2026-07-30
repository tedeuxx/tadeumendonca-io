import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ShareLinks } from './ShareLinks';
import { renderWithLocale } from '../test-utils';
import { SITE_URL } from '../lib/site';

const TITLE = 'My Commitment';
const PT_PATH = '/pt/blog/meu-compromisso';

describe('ShareLinks', () => {
  it('renders one deeplink per platform', () => {
    renderWithLocale(<ShareLinks title={TITLE} path={PT_PATH} />, { locale: 'pt' });
    expect(screen.getByRole('link', { name: /WhatsApp/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /X:/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /LinkedIn/ })).toBeInTheDocument();
  });

  // The defect this guards is the one that ships silently: a share button that works, opens the right
  // platform, and hands it the WRONG URL. Nothing visible breaks — the reader only finds out when
  // someone follows the link.
  it('shares the CANONICAL absolute URL, never a relative path or a preview origin', () => {
    renderWithLocale(<ShareLinks title={TITLE} path={PT_PATH} />, { locale: 'pt' });
    const expected = encodeURIComponent(`${SITE_URL}${PT_PATH}`);
    for (const name of [/WhatsApp/, /X:/, /LinkedIn/]) {
      const href = screen.getByRole('link', { name }).getAttribute('href') ?? '';
      expect(href, `${name} must carry the absolute canonical URL`).toContain(expected);
      expect(href).not.toContain('localhost');
    }
  });

  // ADR-0037: the two editions of one article have DIFFERENT slugs, so a share link built from the wrong
  // edition sends a pt reader an English article. The component takes the resolved path rather than a
  // slug precisely so it cannot get this wrong — this asserts the caller's contract is honoured.
  it('carries the locale-prefixed path it was given, not a guessed one', () => {
    const { unmount } = renderWithLocale(<ShareLinks title={TITLE} path="/en/blog/my-commitment" />, { locale: 'en' });
    expect(screen.getByRole('link', { name: /LinkedIn/ }).getAttribute('href')).toContain(
      encodeURIComponent(`${SITE_URL}/en/blog/my-commitment`),
    );
    unmount();

    renderWithLocale(<ShareLinks title={TITLE} path={PT_PATH} />, { locale: 'pt' });
    const pt = screen.getByRole('link', { name: /LinkedIn/ }).getAttribute('href') ?? '';
    expect(pt).toContain(encodeURIComponent(PT_PATH));
    expect(pt).not.toContain('my-commitment');
  });

  // Nothing third-party loads until the reader clicks (ADR-0002). Plain anchors are how that holds, so
  // the assertion is on the anchor-ness itself: a widget that replaced these with a script would be
  // invisible to every other test in this file.
  it('is plain anchors — no script, and every outbound link is rel-guarded', () => {
    const { container } = renderWithLocale(<ShareLinks title={TITLE} path={PT_PATH} />, { locale: 'pt' });
    expect(container.querySelectorAll('script')).toHaveLength(0);
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('rel')).toBe('noreferrer');
      expect(a.getAttribute('target')).toBe('_blank');
    }
  });

  // WhatsApp takes a single `text` field, so the title has to travel inside it or it is lost — the other
  // two carry the title separately. Asserted because "the URL is there" would pass either way.
  it('sends the title to WhatsApp inside the text, since it has no title field', () => {
    renderWithLocale(<ShareLinks title={TITLE} path={PT_PATH} />, { locale: 'pt' });
    const href = screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href') ?? '';
    expect(href).toContain(encodeURIComponent(`${TITLE}\n${SITE_URL}${PT_PATH}`));
  });

  it('labels the group and each link in the active edition', () => {
    const { unmount } = renderWithLocale(<ShareLinks title={TITLE} path={PT_PATH} />, { locale: 'pt' });
    expect(screen.getByRole('navigation', { name: 'Compartilhar este artigo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `Compartilhar em LinkedIn: ${TITLE}` })).toBeInTheDocument();
    unmount();

    renderWithLocale(<ShareLinks title={TITLE} path="/en/blog/my-commitment" />, { locale: 'en' });
    expect(screen.getByRole('navigation', { name: 'Share this article' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `Share on LinkedIn: ${TITLE}` })).toBeInTheDocument();
  });
});
