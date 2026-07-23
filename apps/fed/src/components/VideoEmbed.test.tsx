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
