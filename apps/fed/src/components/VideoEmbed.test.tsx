import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { VideoEmbed, youtubeId } from './VideoEmbed';
import { Markdown } from './Markdown';
import { renderWithLocale } from '../test-utils';

describe('youtubeId', () => {
  it('accepts the watch, short and embed forms', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('rejects anything else', () => {
    expect(youtubeId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(youtubeId('https://www.youtube.com/watch?v=short')).toBeNull();
    expect(youtubeId('not a url')).toBeNull();
  });
});

describe('VideoEmbed', () => {
  it('ships no third-party frame until the reader asks for one', () => {
    const { container } = renderWithLocale(<VideoEmbed id="dQw4w9WgXcQ" />);
    expect(container.querySelector('iframe')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Reproduzir vídeo/ }));
    expect(container.querySelector('iframe')).toHaveAttribute(
      'src',
      expect.stringContaining('youtube-nocookie.com/embed/dQw4w9WgXcQ'),
    );
  });

  // The assertion above was true and NARROWER THAN THE CLAIM. The component's header promised zero
  // third-party requests before a click; the not-playing branch fetched `i.ytimg.com/vi/<id>/…` on
  // render, and no test looked, because "is there an iframe" is not "is there a third-party request".
  // A frame is only the loudest way to make one.
  //
  // So this asserts the claim rather than one instance of it: every URL-bearing attribute in the
  // rendered markup, checked against being same-origin. It fails on a reintroduced ytimg thumbnail, on
  // a preconnect to Google, on a font or pixel from anywhere — the whole class, not the one spelling.
  it('makes no third-party request at all before the click', () => {
    const { container } = renderWithLocale(<VideoEmbed id="dQw4w9WgXcQ" />);

    const urls = [...container.querySelectorAll('*')].flatMap((el) =>
      ['src', 'href', 'srcset', 'poster', 'data-src'].map((a) => el.getAttribute(a)).filter((v): v is string => !!v),
    );
    expect(urls.length, 'nothing to check means this assertion cannot fail').toBeGreaterThan(0);
    for (const url of urls) {
      expect(url, `third-party URL in the not-playing branch: ${url}`).toMatch(/^\/(?!\/)/);
    }
  });

  it('points the poster at the committed local asset for that video', () => {
    const { container } = renderWithLocale(<VideoEmbed id="dQw4w9WgXcQ" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/video/dQw4w9WgXcQ.png');
  });
});

describe('Markdown video embedding', () => {
  it('turns a standalone YouTube link into the facade', () => {
    renderWithLocale(<Markdown>{'texto\n\nhttps://youtu.be/dQw4w9WgXcQ\n'}</Markdown>);
    expect(screen.getByRole('button', { name: /Reproduzir vídeo/ })).toBeInTheDocument();
  });

  it('leaves an inline link (and a non-YouTube link) alone', () => {
    renderWithLocale(<Markdown>{'veja [aqui](https://youtu.be/dQw4w9WgXcQ) e https://example.com/x\n'}</Markdown>);
    expect(screen.queryByRole('button', { name: /Reproduzir vídeo/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'aqui' })).toBeInTheDocument();
  });
});
