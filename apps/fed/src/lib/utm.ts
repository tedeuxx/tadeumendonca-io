// Campaign tagging for the article share affordances (#272).
//
// These three values are effectively IMMUTABLE once a link is shared. A tagged URL lives on in someone
// else's chat history and timeline, so a later rename does not migrate anything — it splits the series
// in two, silently. That is why the campaign names a MECHANISM ("a reader sent this") rather than a
// moment or an article: a value that never needs renaming cannot be renamed wrongly. ADR-0039 carries
// the reasoning; this module is the single place the strings exist.

/** GA4's default channel grouping puts a session in *Organic Social* when the medium matches its social
 *  regex. `social` matches; `social-share` and `share` do NOT — they fall to *Unassigned*. This matters
 *  more than it looks: `x` is not in GA4's built-in source-category list (it still knows `twitter`), so
 *  the medium is the only thing keeping X in the same bucket as WhatsApp and LinkedIn. Do not "improve"
 *  this string. */
export const SHARE_MEDIUM = 'social';

/** The campaign is the ONLY slot that separates a link a READER sent from a link the AUTHOR posted, and
 *  that separation is the whole measurement. `author-post` is reserved for the site author's own
 *  distribution drafts (ADR-0038) should they ever be tagged; today they emit a clean URL, so the
 *  separation holds — by accident rather than by construction, which is why the reservation is written
 *  down.
 *
 *  `author-`, not `owner-`: `reader` is a role toward the CONTENT, and its matched counterpart is the
 *  person who wrote it. `owner` is a role toward the PROPERTY, and a recipient glancing at the URL under
 *  a personal essay would read a proprietor rather than an author — the one register the positioning
 *  keeps off every surface. Chosen now because the value is still reserved: the day it is first used it
 *  joins the immutable set with everything else here. */
export const SHARE_CAMPAIGN = 'reader-share';
export const AUTHOR_CAMPAIGN = 'author-post';

/**
 * Where a share came FROM, as GA4 will read it.
 *
 * `share-sheet` is not a platform, and that is deliberate: the OS share sheet genuinely does not tell
 * the page where the reader sent the link. Guessing one would be a fabricated dimension. Leaving the
 * sheet untagged was the alternative, and it is worse — the sheet is the PHONE affordance, phone is
 * where WhatsApp sharing actually happens, so an untagged sheet biases the count against exactly the
 * channel the pt-BR audience uses most (#272).
 *
 * `copy-link` exists because the same rule turned on this module's first version. `ShareButton` builds
 * ONE url and then branches: the Web Share API when it exists, the clipboard when it does not. Tagging
 * before the branch stamped `share-sheet` on a desktop copy-paste — a value naming a mechanism the code
 * had just established did not happen, which is precisely the fabricated dimension the paragraph above
 * refuses. Two branches, two truthful sources.
 */
export type ShareSource = 'whatsapp' | 'x' | 'linkedin' | 'share-sheet' | 'copy-link';

/**
 * Append the campaign parameters to an absolute article URL.
 *
 * Returns the RAW url — callers that embed it in another URL's query string must encode it themselves,
 * and must do so AFTER this call. Encoding first and appending after produces a raw `&` inside
 * WhatsApp's single `text=` field, which WhatsApp reads as its own parameter and silently truncates the
 * message at that point. The link still opens, still looks right in a test that greps for a substring,
 * and delivers half a message.
 */
export function withShareUtm(url: string, source: ShareSource, campaign: string = SHARE_CAMPAIGN): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', SHARE_MEDIUM);
  u.searchParams.set('utm_campaign', campaign);
  return u.toString();
}
