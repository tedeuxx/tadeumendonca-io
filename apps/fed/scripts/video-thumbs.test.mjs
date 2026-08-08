import { describe, it, expect } from 'vitest';
import { resolve, join } from 'node:path';
import {
  videoIdsIn,
  markdownFilesIn,
  generatedThumbsIn,
  requiredThumbs,
  diffThumbs,
  diffManifest,
  readManifest,
  cardLines,
  thumbPath,
  facadeIdOnLine,
} from './video-thumbs.mjs';
import { youtubeId } from '../src/components/VideoEmbed';

const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src', 'content');
const thumbDir = join(root, 'public', 'video');
const manifestPath = join(contentDir, 'videos.json');

describe('the thumbnail set matches the embedded-video set', () => {
  // THE GATE, and the reason this slice exists rather than a one-line edit to VideoEmbed.tsx.
  //
  // Pointing the facade at a local asset fixes today's five videos. It does nothing about the sixth:
  // an author adds a YouTube URL to a markdown file, no asset exists, the facade renders a broken
  // image — and the cheapest-looking repair is to put the ytimg URL back. That reintroduces a GET to a
  // Google host on render and re-falsifies four published sentences on /architecture, silently.
  // This test is what makes the sixth video fail here instead.
  it('has a thumbnail for every embedded video, and no thumbnail without a video', () => {
    const ids = videoIdsIn(contentDir);
    const { missing, orphaned } = diffThumbs(requiredThumbs(ids), generatedThumbsIn(thumbDir));

    expect(missing.map((t) => t.path), 'run `npm run gen-video-thumbs`').toEqual([]);
    expect(orphaned, 'art for videos no longer embedded — run `npm run gen-video-thumbs`').toEqual([]);
  });

  // Guards the false green above: with no ids found, `required` is empty, `diffThumbs` returns two
  // empty lists and the assertion passes having compared nothing. That is the shape a scanner bug
  // takes — a changed content path, a tightened regex — and it reads identical to a healthy repo.
  it('found videos at all — an empty scan must not pass as “in sync”', () => {
    const ids = videoIdsIn(contentDir);
    expect(ids.length).toBeGreaterThan(0);
    expect(generatedThumbsIn(thumbDir).length).toBe(ids.length);
  });

  // The second half of the same gate. The card is generated FROM the manifest, so an id with no entry
  // has no words; without this the failure surfaces only when someone next runs the generator.
  it('has a caption entry for every embedded video, and no entry without a video', () => {
    const { unlabelled, unused } = diffManifest(videoIdsIn(contentDir), readManifest(manifestPath));
    expect(unlabelled, 'add it to src/content/videos.json').toEqual([]);
    expect(unused, 'stale entries in src/content/videos.json').toEqual([]);
  });

  // Not a formality: the scan reads the whole content tree, and articles live one level down in
  // `blog/`. A non-recursive walk would still find the ramp-up videos and pass every assertion above.
  it('scans the article subdirectory, not just the top level', () => {
    const files = markdownFilesIn(contentDir);
    expect(files.some((f) => f.includes(`${join('content', 'blog')}`))).toBe(true);
  });
});

describe('which lines become a facade', () => {
  // The scanner and the component must agree on what a video URL is, or the set-equality gate above
  // measures a different population than the one that renders. Asserted against the component's own
  // exported parser rather than against a copy of its regex.
  const urls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10',
    'https://example.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/channel/UCrDwWp7EBBv4NwvScIpBDOA',
  ];

  it('agrees with the component parser on every form', () => {
    for (const url of urls) expect(facadeIdOnLine(url), url).toBe(youtubeId(url));
  });

  it('accepts the `[url](url)` lone-link form the renderer also turns into a facade', () => {
    expect(facadeIdOnLine('[https://youtu.be/dQw4w9WgXcQ](https://youtu.be/dQw4w9WgXcQ)')).toBe('dQw4w9WgXcQ');
  });

  it('ignores a URL with prose around it — an inline link stays an inline link', () => {
    expect(facadeIdOnLine('see https://youtu.be/dQw4w9WgXcQ for more')).toBeNull();
    expect(facadeIdOnLine('- **[Kiro](https://www.youtube.com/watch?v=dQw4w9WgXcQ)** — agentic IDE')).toBeNull();
  });
});

describe('thumbnail naming', () => {
  // Keyed by the video id and NOT by locale, unlike the OG cards. Both editions of an article embed the
  // same video, so a per-locale copy would be two identical files free to diverge by accident.
  it('is keyed by the video id alone', () => {
    expect(thumbPath('dQw4w9WgXcQ')).toBe('/video/dQw4w9WgXcQ.png');
  });

  it('gives two videos different files', () => {
    expect(thumbPath('a')).not.toBe(thumbPath('b'));
  });
});

describe('diffThumbs', () => {
  it('reports a video whose thumbnail does not exist', () => {
    const { missing, orphaned } = diffThumbs(requiredThumbs(['a', 'b']), ['/video/a.png']);
    expect(missing.map((t) => t.path)).toEqual(['/video/b.png']);
    expect(orphaned).toEqual([]);
  });

  it('reports art left behind by a video that is no longer embedded', () => {
    const { missing, orphaned } = diffThumbs(requiredThumbs([]), ['/video/gone.png']);
    expect(missing).toEqual([]);
    expect(orphaned).toEqual(['/video/gone.png']);
  });
});

describe('cardLines', () => {
  it('carries the channel, and the caption where the repository states one', () => {
    expect(cardLines('x', { x: { channel: 'Y Combinator', caption: 'A Talk' } })).toEqual({
      channel: 'Y Combinator',
      caption: 'A Talk',
    });
  });

  it('renders a channel-only card rather than inventing a caption', () => {
    expect(cardLines('x', { x: { channel: 'Anthropic' } })).toEqual({ channel: 'Anthropic', caption: '' });
  });

  it('refuses an entry with no channel instead of drawing a blank rectangle', () => {
    expect(() => cardLines('x', { x: {} })).toThrow(/no `channel` for x/);
  });
});

describe('diffManifest', () => {
  it('reports an embedded video with no entry', () => {
    expect(diffManifest(['a', 'b'], { a: { channel: 'c' } }).unlabelled).toEqual(['b']);
  });

  it('reports an entry for a video that is no longer embedded', () => {
    expect(diffManifest(['a'], { a: { channel: 'c' }, z: { channel: 'c' } }).unused).toEqual(['z']);
  });
});
