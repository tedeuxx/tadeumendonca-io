import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
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
    // Under GFM this bare URL IS autolinked (#402) — it is an <a>, not plain text as this used to say.
    // The key property is unchanged and is what the name promises: it did not become a card. The
    // autolinking itself is asserted in the autolink describe below, where it can actually fail.
    expect(container).toHaveTextContent('https://github.com/karpathy/some-other-repo');
  });

  it('still renders ordinary prose as a paragraph', () => {
    const { container } = renderWithLocale(<Markdown>{'Just a sentence.'}</Markdown>, { locale: 'en' });
    expect(container.querySelector('p')).toHaveTextContent('Just a sentence.');
    expect(container.querySelector('[data-testid="repo-card"]')).toBeNull();
  });
});

// GFM tables. react-markdown is CommonMark-only by default and a table is a GFM extension, so before
// `remark-gfm` was enabled the pipes rendered as literal text inside a <p> — which is how two tables
// shipped to production unrendered, the second one in v1.0.0. The assertion is deliberately on the
// ELEMENT (`table`/`th`/`td`), not on the text: the broken render contains the very same characters, so
// a text assertion here passes in both worlds and is exactly the un-failable assertion this repo keeps
// producing. Mutation-checked by removing the plugin — see the MR.
describe('Markdown — GFM tables render as tables (#402)', () => {
  const TABLE = ['| removed | replaced by |', '|---|---|', '| ADR-0025 | ADR-0002 |'].join('\n');

  it('renders a pipe table as a real <table>, not literal pipes in a paragraph', () => {
    const { container } = renderWithLocale(<Markdown>{TABLE}</Markdown>, { locale: 'pt' });

    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    expect(container.querySelectorAll('th')).toHaveLength(2);
    expect(container.querySelectorAll('tbody td')).toHaveLength(2);
    expect(container.querySelector('th')).toHaveTextContent('removed');
    expect(container.querySelector('tbody td')).toHaveTextContent('ADR-0025');
  });

  it('leaves no literal pipe characters behind once the table is parsed', () => {
    const { container } = renderWithLocale(<Markdown>{TABLE}</Markdown>, { locale: 'pt' });
    expect(container.textContent).not.toContain('|');
  });

  it('renders a link authored INSIDE a table cell', () => {
    const cellLink = ['| adr | doc |', '|---|---|', '| 0025 | [record](/library) |'].join('\n');
    const { container } = renderWithLocale(<Markdown>{cellLink}</Markdown>, { locale: 'pt' });

    const link = container.querySelector('tbody a');
    expect(link).toHaveTextContent('record');
    // The `a` handler still runs inside a cell — a table must not bypass locale routing (#166).
    expect(link).toHaveAttribute('href', '/pt/library');
  });
});

// GFM autolink literals are the RISK this change carried, not a feature anyone asked for. Enabling GFM
// turns every bare URL into an <a>, so the 22 lone URLs in `rampup.{pt,en}.md` stopped reaching
// `loneUrl`'s string branch and started reaching its element branch. They resolve because an autolink's
// label equals its href — that was a prediction when the change was written, and these are the
// assertions that make it a checked one.
describe('Markdown — bare URLs autolink under GFM, and the facades survive it (#402)', () => {
  it('autolinks a bare URL that is NOT a facade, instead of leaving it as text', () => {
    const { container } = renderWithLocale(
      <Markdown>{'https://github.com/karpathy/some-other-repo'}</Markdown>,
      { locale: 'en' },
    );
    expect(container.querySelector('a')).toHaveAttribute(
      'href',
      'https://github.com/karpathy/some-other-repo',
    );
  });

  it('still builds a video facade from a bare YouTube URL — now via the autolinked element', () => {
    const { container } = renderWithLocale(
      <Markdown>{'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}</Markdown>,
      { locale: 'pt' },
    );
    // Queried by the facade's play button, the way VideoEmbed's own suite does it.
    expect(screen.getByRole('button', { name: /Reproduzir vídeo/ })).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', '/video/dQw4w9WgXcQ.png');
  });

  it('leaves a URL with surrounding prose as an inline link, not a facade', () => {
    const { container } = renderWithLocale(
      <Markdown>{'See https://github.com/karpathy/nanoGPT for the code.'}</Markdown>,
      { locale: 'en' },
    );
    expect(container.querySelector('[data-testid="repo-card"]')).toBeNull();
    expect(container.querySelector('p a')).toHaveAttribute('href', 'https://github.com/karpathy/nanoGPT');
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
