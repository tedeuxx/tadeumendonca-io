import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { VideoEmbed, youtubeId, embeddingDisabled } from './VideoEmbed';
import { Markdown } from './Markdown';
import { renderWithLocale } from '../test-utils';
import videos from '../content/videos.json';

// Derived from the manifest, deliberately NOT from `embeddingDisabled` — that is the function under
// test, and a set built by it would agree with it by construction. The two are cross-checked in the
// `embeddingDisabled` block at the bottom of this file, which is where the agreement is the claim.
const FLAGGED = Object.entries(videos)
  .filter(([, entry]) => 'embeddable' in entry && entry.embeddable === false)
  .map(([id]) => id);

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

// #591 — THE TEST THAT WOULD HAVE CAUGHT THE DEFECT.
//
// The defect is a video whose owner has disabled embedding: the facade renders a play button, the
// reader clicks, an iframe mounts and YouTube renders "Video unavailable" inside it. Every assertion
// in the block above stays green through all of that, because they all stop at the click — and so did
// every build, every gate and every review. The failure lives on the far side of an interaction, which
// is exactly the far side a test can reach and a reviewer cannot.
//
// FLAGGED IDS COME FROM THE MANIFEST, not from a literal typed here. A hardcoded id would keep passing
// after the flag was removed from `videos.json`, which is the one change these assertions exist to
// catch. `NOT_FLAGGED` is the control on the same axis: without it, a bug that renders the preview for
// EVERY video passes this whole block.
describe('VideoEmbed when the owner has disabled embedding', () => {
  const NOT_FLAGGED = Object.keys(videos).filter((id) => !FLAGGED.includes(id));

  it('has something to test — an empty flag set would make every assertion below vacuous', () => {
    expect(FLAGGED.length, 'src/content/videos.json declares no non-embeddable video').toBeGreaterThan(0);
    expect(NOT_FLAGGED.length, 'no control video — a global regression would pass unseen').toBeGreaterThan(0);
  });

  it('never mounts an iframe, before OR after a click — there is no control that could', () => {
    for (const id of FLAGGED) {
      const { container, unmount } = renderWithLocale(<VideoEmbed id={id} />);
      expect(container.querySelector('iframe'), id).toBeNull();
      // The play button is the thing that must not exist. Asserting "no iframe after clicking it" would
      // need it to exist first; asserting it is ABSENT is the stronger claim and the one that fails if
      // the flag stops being read.
      expect(screen.queryByRole('button', { name: /Reproduzir vídeo/ }), id).toBeNull();
      expect(container.querySelector('iframe'), id).toBeNull();
      unmount();
    }
  });

  it('offers a link to the watch page instead, marked as leaving the site', () => {
    for (const id of FLAGGED) {
      const { unmount } = renderWithLocale(<VideoEmbed id={id} />);
      const link = screen.getByTestId('video-preview');
      expect(link.tagName, `${id}: the control must be an anchor, not a button`).toBe('A');
      expect(link).toHaveAttribute('href', `https://www.youtube.com/watch?v=${id}`);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
      unmount();
    }
  });

  // "It must not pretend to be a player" is a claim about what the reader can tell BEFORE clicking, so
  // it is asserted on the rendered words rather than on the branch taken. The play glyph is the whole
  // affordance — a control carrying it reads as a player whatever its tag name — and the disabled state
  // is stated in words, which is the part a reader can act on.
  it('tells the reader it opens elsewhere, and carries no play affordance', () => {
    for (const id of FLAGGED) {
      const { unmount } = renderWithLocale(<VideoEmbed id={id} />);
      const link = screen.getByTestId('video-preview');
      expect(link.textContent, id).toContain('Assistir no YouTube');
      expect(link.textContent, `${id}: the play glyph must not appear on a control that navigates away`)
        .not.toContain('▶');
      expect(screen.getByText(/Reprodução incorporada desativada pelo canal/), id).toBeInTheDocument();
      unmount();
    }
  });

  it('reuses the committed local poster rather than fetching one', () => {
    for (const id of FLAGGED) {
      const { container, unmount } = renderWithLocale(<VideoEmbed id={id} />);
      expect(container.querySelector('img'), id).toHaveAttribute('src', `/video/${id}.png`);

      // The same claim the player branch makes, re-asserted for this branch rather than assumed to
      // carry over: the ONLY off-origin URL is the watch link the reader chose to be offered.
      const urls = [...container.querySelectorAll('*')].flatMap((el) =>
        ['src', 'srcset', 'poster', 'data-src'].map((a) => el.getAttribute(a)).filter((v): v is string => !!v),
      );
      expect(urls.length, 'nothing to check means this assertion cannot fail').toBeGreaterThan(0);
      for (const url of urls) expect(url, `${id}: third-party asset in the preview: ${url}`).toMatch(/^\/(?!\/)/);
      unmount();
    }
  });

  // The change is PER VIDEO. Without this, replacing the player everywhere passes every assertion above
  // and silently removes inline playback from the other ten.
  it('leaves every video that is not flagged as a player', () => {
    for (const id of NOT_FLAGGED) {
      const { unmount } = renderWithLocale(<VideoEmbed id={id} />);
      expect(screen.getByRole('button', { name: /Reproduzir vídeo/ }), id).toBeInTheDocument();
      expect(screen.queryByTestId('video-preview'), id).toBeNull();
      unmount();
    }
  });
});

describe('embeddingDisabled', () => {
  // UNKNOWN IS NOT NO. An id the manifest says nothing about renders the player — today's behaviour for
  // the ten unchecked videos, and the honest default: this repository has verified nothing about them,
  // so it claims nothing about them either.
  it('treats an unknown id as unknown, and unknown renders the player', () => {
    expect(embeddingDisabled('dQw4w9WgXcQ')).toBe(false);
  });

  // The agreement claim: the component reads the manifest the same way this file does. Both directions,
  // because a function returning `true` for everything satisfies only the first loop.
  it('is true exactly for the ids the manifest declares', () => {
    for (const id of Object.keys(videos)) expect(embeddingDisabled(id), id).toBe(FLAGGED.includes(id));
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
