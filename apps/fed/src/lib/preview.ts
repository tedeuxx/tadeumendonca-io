// The preview gate for a HELD article (#510, ADR-0047).
//
// One value, read from `location.search`, deciding whether a held article renders or the visitor is sent
// to the locale home. It is the affordance that lets the owner read a finished article at its real URL,
// with the real components, the real CSS and the real chrome, before it is public.
//
// WHAT THIS IS NOT, said first because the word "preview" invites the opposite reading: it is
// CONCEALMENT, not enforcement, and it is not a secret. Three facts make that true and none of them is a
// defect to fix here:
//  - the article's full body ships in `dist/assets/index-*.js` regardless, so anyone who knows to look
//    can read it with no parameter at all (ADR-0047 records this with the command that measures it);
//  - the check runs in the browser, on code the visitor already has, so it is trivially bypassed;
//  - a per-article secret token cannot exist in this architecture anyway — the CloudFront Function that
//    would validate it is committed to a public repo, and a Terraform variable leaks through the plan
//    posted on the PR.
//
// So the parameter buys ISOLATION — the article is out of the index, the sitemap, the navigation and the
// OG cards, and a reader who lands on the URL without it does not read it. That is the problem the owner
// actually named ("o problema é isolar trafego organico"). Making it PRIVATE is a strictly larger change
// and is deliberately not attempted here; the upgrade path is in ADR-0047.

/**
 * The query parameter that opens a held article.
 *
 * PRESENCE, not a value. A value would read as a credential, and a credential this mechanism cannot keep
 * is worse than none: it would invite the owner to share the URL believing the token protects it. `?preview`
 * says exactly what it does — it is a switch, not a key.
 *
 * Exported so the tests, and any future affordance that has to BUILD such a URL (#506's review buttons),
 * spell it once rather than re-typing a string that is a URL contract the moment it is used.
 */
export const PREVIEW_PARAM = 'preview';

/**
 * Whether a location's query string asks for the preview.
 *
 * Takes the search string rather than reading `location` itself, so it is pure and testable, and so the
 * caller inside the router uses the value React Router already gives it — reading `window.location`
 * inside a route component would be a second source of truth that disagrees during a client-side
 * navigation, which is the one moment this gate has to be right.
 *
 * `has`, not a truthiness check on the value: `?preview` and `?preview=` and `?preview=1` must all work,
 * because all three are what a person actually types or a link actually carries.
 */
export function isPreviewRequested(search: string): boolean {
  return new URLSearchParams(search).has(PREVIEW_PARAM);
}
