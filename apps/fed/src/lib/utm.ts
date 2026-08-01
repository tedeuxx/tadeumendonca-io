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
 * `share-sheet` NO LONGER HAS AN EMITTER (#314). `ShareButton` used to invoke the Web Share API,
 * falling back to a clipboard copy; it now opens a modal rendering the same target list the footer
 * block renders, and the OS sheet — being an OS surface the footer cannot offer — could not survive
 * that unification. The value stays defined rather than removed: it is stamped on links already shared,
 * and ADR-0039 treats a campaign literal as immutable once out, so deleting it would orphan rows that
 * still arrive.
 *
 * The REASON it was tagged is kept, in the past tense, because it is still true of those rows and it is
 * the argument a future emitter would have to answer: the sheet does not tell the page where the reader
 * sent the link, so guessing a platform would have been a fabricated dimension — but leaving it
 * untagged was worse, since the sheet was the PHONE affordance and phone is where WhatsApp sharing
 * happens, so an untagged sheet would have biased the count against the channel the pt-BR audience uses
 * most (#272).
 *
 * `copy-link` exists because the same rule turned on this module's first version. `ShareButton` then
 * built ONE url and branched — the Web Share API when it existed, the clipboard when it did not — and
 * tagging before the branch stamped `share-sheet` on a desktop copy-paste: a value naming a mechanism
 * the code had just established did not happen. The branch is gone; `copy-link` is now the modal's
 * copy option and the footer's, and it is still the truthful name for what happened.
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
