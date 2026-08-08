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

/** Whether an authored markdown href is a site-internal, root-relative path. */
export const isInternalHref = (href: string | undefined): href is string =>
  href !== undefined && href.startsWith('/') && !href.startsWith('//');
