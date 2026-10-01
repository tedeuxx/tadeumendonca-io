import { describe, expect, it } from 'vitest';
import { Markdown } from '../components/Markdown';
import { getPostBySlug } from '../lib/content';
import { renderWithLocale } from '../test-utils';

const VIDEO_ID = '5uGP97AmMHY';

describe('AI answers in seconds article', () => {
  it.each([
    ['en', 'ai-answers-in-seconds-you-dont-have-to'],
    ['pt', 'a-ia-responde-em-segundos-voce-nao-precisa'],
  ] as const)('renders exactly one Karnal video facade immediately after its source paragraph (%s)', (locale, slug) => {
    const article = getPostBySlug(slug, locale);
    expect(article, `${locale} article did not resolve`).toBeDefined();

    const { container } = renderWithLocale(<Markdown>{article!.body}</Markdown>, { locale });
    const linkedTitle = container.querySelector<HTMLAnchorElement>(
      `a[href="https://www.youtube.com/watch?v=${VIDEO_ID}"]`,
    );
    expect(linkedTitle, 'the accessible linked-title fallback is missing').not.toBeNull();

    const sourceParagraph = linkedTitle!.closest('p');
    expect(sourceParagraph, 'the linked title no longer sits in its source paragraph').not.toBeNull();

    const posters = container.querySelectorAll<HTMLImageElement>('img[src^="/video/"]');
    expect(posters).toHaveLength(1);
    expect(posters[0]).toHaveAttribute('src', `/video/${VIDEO_ID}.png`);

    const facade = posters[0].closest('div');
    expect(facade, 'the video poster no longer resolves to a facade').not.toBeNull();
    expect(sourceParagraph!.nextElementSibling).toBe(facade);
    expect(container.querySelector('iframe')).toBeNull();
  });
});
