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

// Site-internal links (#166). Markdown is authored once per locale but a site path is not: a bare
// `/library` in `rampup.pt.md` is a path this site never prerenders and never advertises, resolving only
// by a client-side redirect that reads the BROWSER's language — so a Portuguese page would hand a reader
// with an English browser the English shelf. Authors write the LOGICAL path; this resolves it.
describe('Markdown — site-internal links are localized (#166)', () => {
  const hrefOf = (markdown: string, locale: 'pt' | 'en') =>
    renderWithLocale(<Markdown>{markdown}</Markdown>, { locale }).container.querySelector('a')?.getAttribute('href');

  it('prefixes a root-relative link with the ACTIVE locale', () => {
    expect(hrefOf('[Biblioteca](/library)', 'pt')).toBe('/pt/library');
    expect(hrefOf('[Library](/library)', 'en')).toBe('/en/library');
  });

  // The two mutations that would make the test above pass for the wrong reason: hardcoding a prefix, and
  // prefixing everything. Each is asserted from the other side.
  it('leaves an absolute URL exactly as authored', () => {
    expect(hrefOf('[O’Reilly](https://www.oreilly.com/library/view/ai-engineering/9781098166298/)', 'pt')).toBe(
      'https://www.oreilly.com/library/view/ai-engineering/9781098166298/',
    );
  });

  it('leaves a protocol-relative URL alone — a leading slash is not a site path', () => {
    expect(hrefOf('[cdn](//example.com/thing)', 'pt')).toBe('//example.com/thing');
  });

  it('leaves an in-page anchor and a mailto alone', () => {
    expect(hrefOf('[artigos](#artigos)', 'pt')).toBe('#artigos');
    expect(hrefOf('[mail](mailto:someone@example.com)', 'pt')).toBe('mailto:someone@example.com');
  });

  // It is a react-router navigation, not a full reload — the whole reason for going through the router
  // rather than rewriting the href on a plain <a>. `RouterLink` renders an anchor whose click is handled;
  // what is observable here is that it lives in the router's world at all, so a missing Router context
  // would throw rather than silently degrade.
  it('renders the internal link as an anchor a reader can still see and copy', () => {
    const { container } = renderWithLocale(<Markdown>{'[Biblioteca](/library)'}</Markdown>, { locale: 'pt' });
    const link = container.querySelector('a');
    expect(link).toHaveTextContent('Biblioteca');
    expect(link).toHaveAttribute('href', '/pt/library');
  });
});
