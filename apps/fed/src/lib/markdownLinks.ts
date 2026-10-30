// THE ONE RULE for "is this markdown link a site-internal path?" (#387).
//
// It lived inline in `Markdown.tsx`'s link handler, which was correct while exactly one place asked the
// question. Two now do — the renderer resolves such a link through `useLocalePath` so a pt page links the
// pt shelf (#166), and the copy-as-markdown payload has to make the SAME set of links absolute, because a
// root-relative path pasted into someone's notes is a dead link everywhere except this origin.
//
// Extracted rather than restated. Two places deciding one rule is precisely the drift `shareTargets.ts`
// exists to end, and it would not announce itself: the renderer and the payload would each be internally
// consistent and disagree only about a link nobody looked at.
//
// SCOPE IS NARROW ON PURPOSE and is unchanged from the inline version: `/`-rooted only, and NOT `//host`
// (protocol-relative — an external URL wearing a leading slash). Absolute URLs, `mailto:` and in-page
// `#anchor` links are all left alone.
//
// "THE SAME SET" IS LOAD-BEARING AND NARROWER THAN IT SOUNDS: both callers apply this to ANCHORS ONLY.
// `Markdown.tsx` registers no `img` handler — grep its `components` for an `img` key, there is none — so
// the renderer never asks this question about an image, and it does not need to: the browser resolves
// `/og-default.png` against the origin and it works. `shareMarkdown.ts`'s `LINK_TARGET` therefore rejects
// `!`-prefixed targets on purpose, and the argument for that lives there.
//
// An earlier revision of this comment claimed the same set while the payload silently included images.
// Nothing published was wrong — no body authors a root-relative image — but the day one was, every
// reader's copy would have carried a locale-prefixed asset path that exists nowhere, produced by this
// fix rather than left by it.
import { SITE_URL } from './site';

/** Whether an authored markdown href is a site-internal, root-relative path. */
export const isInternalHref = (href: string | undefined): href is string =>
  href !== undefined && href.startsWith('/') && !href.startsWith('//');

/**
 * Whether an authored markdown href leaves this site: an ABSOLUTE `http(s)` URL on another origin (#712).
 *
 * The renderer opens these in a new tab, so a reader following an article's example link does not lose
 * the article. The owner hit it reading a held preview: the link to a worked example replaced the page.
 *
 * ABSOLUTE ONLY, parsed with NO base, so the answer never depends on where the page is served: the same
 * at prerender time and in the browser, which keeps the attribute from becoming a hydration mismatch.
 * A root-relative path, an in-page `#anchor`, `mailto:` and a protocol-relative `//host` either fail to
 * parse without a base or fail the protocol check, and keep the same-tab default. A link back to
 * `SITE_URL` itself is the site, not an external destination, and stays in the same tab too.
 *
 * Only the RENDERER asks this. `shareMarkdown.ts` copies markdown source, which carries no `target`, so
 * the copy-as-markdown payload is untouched by this rule.
 */
export const isExternalHref = (href: string | undefined): href is string => {
  if (href === undefined) return false;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return url.origin !== new URL(SITE_URL).origin;
};
