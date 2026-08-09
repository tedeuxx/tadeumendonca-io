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
    // Under GFM this bare URL IS autolinked — it is an <a>, not plain text as this used to say.
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
describe('Markdown — GFM tables render as tables', () => {
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

  // A table does not wrap, so a rendering table pushed /pt/architecture sideways at 320px and took the
  // overflow sweep red — three E2E specs, caught only because they run against the BUILT site. The
  // container is the fix, and this is the unit-level guard for it; the sweep is the real one.
  it('wraps the table in a keyboard-reachable horizontal scroll container', () => {
    const { container } = renderWithLocale(<Markdown>{TABLE}</Markdown>, { locale: 'pt' });

    const scroller = container.querySelector('.overflow-x-auto');
    expect(scroller).not.toBeNull();
    expect(scroller).toHaveAttribute('tabindex', '0');
    // The table is INSIDE it — a scroller that is not an ancestor of the table scrolls nothing.
    expect(scroller?.querySelector('table')).not.toBeNull();
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
describe('Markdown — bare URLs autolink under GFM, and the facades survive it', () => {
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

// The photograph facade (#415). Hooked on `p` and NOT on `img`, for the reason `isAdrIndex` and
// `mermaidBlock` record: react-markdown delivers a lone image as <p><img></p>, so an `img` handler
// returning a <figure> would nest a block element inside a paragraph — invalid HTML and a hydration
// mismatch on a prerendered page. These assertions are on the ELEMENT and its ancestry rather than on the
// text, because the broken render carries exactly the same words.
describe('Markdown — the lone-image photograph facade (#415)', () => {
  const KNUTH = '![A wall at a museum](/photos/knuth-cv-museum.jpg "Where I was standing")';

  it('turns a paragraph that is only a registered photograph into a captioned figure', () => {
    const { container } = renderWithLocale(<Markdown>{KNUTH}</Markdown>, { locale: 'en' });
    const figure = container.querySelector('figure[data-photo]');
    expect(figure).not.toBeNull();
    expect(figure!.querySelector('img')).toHaveAttribute('alt', 'A wall at a museum');
    expect(figure!.querySelector('figcaption')).toHaveTextContent('Where I was standing');
  });

  // THE HYDRATION DEFECT, asserted directly. A <figure> inside a <p> is invalid HTML; the browser closes
  // the paragraph and reparents it, so the prerendered tree and the client tree disagree and React
  // discards the markup. Checked as ANCESTRY, which is the only form that can fail: both the correct and
  // the broken render contain a figure and contain the caption text.
  it('does not nest the figure inside a paragraph', () => {
    const { container } = renderWithLocale(<Markdown>{KNUTH}</Markdown>, { locale: 'en' });
    const figure = container.querySelector('figure[data-photo]')!;
    expect(figure.closest('p')).toBeNull();
    // And no empty paragraph is left behind where the image used to be.
    expect(container.querySelector('p')).toBeNull();
  });

  it('reserves the box from the registry, so the page does not jump when the bytes land', () => {
    const { container } = renderWithLocale(<Markdown>{KNUTH}</Markdown>, { locale: 'en' });
    const img = container.querySelector('figure[data-photo] img')!;
    expect(img).toHaveAttribute('width', '1600');
    expect(img).toHaveAttribute('height', '704');
  });

  // The opt-in half, and the same shape as the repo-card facade above: an image this site did not measure
  // stays a plain <img>. Inventing a size for it is the one thing worse than not reserving a box.
  it('leaves an UNREGISTERED image as a plain image, not a figure', () => {
    const { container } = renderWithLocale(
      <Markdown>{'![Card](/og-default.png "Not a photo")'}</Markdown>,
      { locale: 'en' },
    );
    expect(container.querySelector('figure[data-photo]')).toBeNull();
    expect(container.querySelector('img')).toHaveAttribute('src', '/og-default.png');
  });

  // An inline image must stay inline, exactly as an inline link does. The facade is opt-in by being the
  // WHOLE paragraph, and a rule that fired on any image would silently restructure prose.
  it('leaves an image with surrounding prose inline, not a figure', () => {
    const { container } = renderWithLocale(
      <Markdown>{`Here it is ${KNUTH} in a sentence.`}</Markdown>,
      { locale: 'en' },
    );
    expect(container.querySelector('figure[data-photo]')).toBeNull();
    expect(container.querySelector('p')).not.toBeNull();
    expect(container.querySelector('p img')).not.toBeNull();
  });

  // BOTH WORDS ARE REQUIRED, and the failure is loud. A photograph whose alt is empty publishes its
  // content to nobody using a screen reader; one with no caption publishes a holiday snapshot with no
  // stated reason to be there. Silent degradation is what a content author would never notice.
  it('refuses a registered photograph with no alt text', () => {
    expect(() =>
      renderWithLocale(<Markdown>{'![](/photos/knuth-cv-museum.jpg "A caption")'}</Markdown>, {
        locale: 'en',
      }),
    ).toThrow(/alt text/);
  });

  it('refuses a registered photograph with no caption', () => {
    expect(() =>
      renderWithLocale(<Markdown>{'![Some alt](/photos/knuth-cv-museum.jpg)'}</Markdown>, {
        locale: 'en',
      }),
    ).toThrow(/caption/);
  });

  // The image target is NOT localized — no `img` handler is registered, so the browser resolves it
  // against the origin. This is the renderer half of the contract `shareMarkdown.ts` mirrors by
  // absolutizing images to the origin WITHOUT the locale prefix; the two have to agree, and pt is the
  // locale where a stray prefix would show up.
  it('leaves the image target unlocalized in the pt edition', () => {
    const { container } = renderWithLocale(<Markdown>{KNUTH}</Markdown>, { locale: 'pt' });
    expect(container.querySelector('figure[data-photo] img')).toHaveAttribute(
      'src',
      '/photos/knuth-cv-museum.jpg',
    );
  });
});
