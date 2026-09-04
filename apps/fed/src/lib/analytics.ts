// Google Analytics 4, loaded ONLY after explicit consent — the same "nothing third-party until the
// reader asks" property the VideoEmbed facade preserves (ADR-0002). This is deliberately NOT Google
// Consent Mode v2: that loads gtag.js immediately and pings Google with a denied signal before the
// reader has chosen. Here nothing reaches Google until Accept. On Reject (or before a choice) the
// script is never injected, no cookie is ever set, and no request is ever made.
//
// Inert when VITE_GA_MEASUREMENT_ID is unset: loadAnalytics() no-ops, so `vite preview`, the build-time
// prerender and the E2E run never emit a hit. Production sets the id in the deploy workflow.

import type { ShareSource } from './utm';

export type ConsentChoice = 'granted' | 'denied';

// The URL the reader ARRIVED on, captured at module load — before any navigation, and long before
// consent. Read `loadAnalytics` for why this cannot be read at consent time instead; in short, by then
// a reader who arrived from a shared link may already have navigated away from the tagged URL, and the
// campaign attribution is gone with it. Captured as a plain string, never stored, never sent unless
// the reader accepts.
const landingLocation = typeof window === 'undefined' ? '' : window.location.href;

/** localStorage key holding the reader's consent choice ('granted' | 'denied'), or absent if undecided. */
export const CONSENT_KEY = 'analytics-consent';

// Read per-call (not a load-time const) so it stays inlined by Vite in production yet remains stubbable
// in tests. Empty string → analytics is fully inert.
function measurementId(): string {
  return import.meta.env.VITE_GA_MEASUREMENT_ID ?? '';
}

/** True when a measurement id is configured — analytics is otherwise fully inert. */
export function analyticsConfigured(): boolean {
  return measurementId().length > 0;
}

/** The reader's stored choice, or null when they have not decided yet. Never throws (private-mode safe). */
export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

/** Persist the reader's choice so the banner does not reappear on the next visit. */
export function storeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* private mode / storage disabled — the choice simply won't persist across loads. */
  }
}

/** Forget the stored choice — used by the footer "manage" control so consent can be withdrawn/redecided. */
export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* nothing to clear if storage is unavailable. */
  }
}

let injected = false;

/**
 * Inject gtag.js and start GA4. Idempotent, and a no-op when analytics is unconfigured or there is no
 * document (SSR/prerender). Call ONLY after consent is granted. `config` sends the initial page_view for
 * the page present at load; SPA route changes are sent by trackPageview via usePageviews.
 */
export function loadAnalytics(): void {
  if (injected || !analyticsConfigured() || typeof document === 'undefined') return;
  injected = true;

  const id = measurementId();
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  // MUST push the `arguments` object, not a rest-parameter array (#190). gtag.js only interprets a
  // dataLayer entry as a gtag COMMAND when it is an `[object Arguments]`; a genuine Array is ignored.
  // The tempting TypeScript spelling — `(...args) => dataLayer.push(args)` — is type-correct, callable,
  // and grows the queue, so everything downstream looks healthy while `config` never runs and GA4
  // receives nothing at all. That is why Google's canonical snippet uses a non-arrow function.
  const gtag = function (): void {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  } as GtagFn;
  window.gtag = gtag;
  gtag('js', new Date());
  // `page_location` is sent EXPLICITLY, from the URL captured at module load, and without it the
  // campaign measurement (#272) silently under-counts exactly the population it exists to count.
  //
  // GA4 reads utm_* from `page_location` on the FIRST hit of a session. Here that hit is this `config`
  // call, which by ADR-0033 fires only after the reader accepts. A RETURNING reader who already
  // granted is fine — consent runs in the mount effect while the URL still carries the parameters. A
  // NEW reader arriving from a shared link is not: they see the banner, read, navigate within the SPA,
  // and accept later, by which point `document.location` is a different, untagged URL and the session
  // is attributed `(direct)`. That reader is the entire point of the tagging.
  //
  // Nothing is stored and nothing is transmitted before consent — the value sits in a module variable
  // and is discarded if consent never arrives, so ADR-0033's hard gate is preserved exactly.
  gtag('config', id, { page_location: landingLocation });
}

/**
 * The ONE gate every emission passes, and it is deliberately TWO conditions rather than one (#597).
 *
 * `injected` alone was the whole guard until this slice, and it answers a question about the SCRIPT
 * ("is gtag loaded") when the question that matters is about the READER ("does this person currently
 * consent"). The two came apart the moment withdrawal became reachable: `reopen()` calls
 * `clearConsent()` and returns the status to `undecided` while `injected` stays true — gtag cannot be
 * un-injected, which `consent.tsx` says correctly of the INJECTION and which was silently read as
 * being true of the EMISSION too.
 *
 * Until #597 that cost page_views from a reader who had withdrawn. With interaction events it would
 * cost `contact_click`: a reader who withdraws consent and then clicks through to LinkedIn would still
 * be reported, which is the one thing this site's consent copy promises does not happen. Reading the
 * stored choice per call moves the property from "cannot be un-injected" to "loaded but SILENT", which
 * is what ADR-0033's hard gate implies and did not deliver.
 *
 * Read per call rather than cached: the withdrawal happens in another component, in the same session,
 * with no event this module subscribes to. A cache here would be the same staleness one layer down.
 */
function mayEmit(): boolean {
  return injected && typeof window.gtag === 'function' && readConsent() === 'granted';
}

/**
 * Parameters carried by every custom event.
 *
 * `locale` IS MANDATORY, at the type level, and that is a mechanism rather than a convention — a
 * dimension present on four events out of five cannot segment anything, and nothing else in this
 * repository would notice its absence.
 *
 * `path` IS DELIBERATELY ABSENT AND MUST NOT BE ADDED. GA4 attaches `page_location` to every hit and
 * derives `page_path` from it for free; a custom `path` would duplicate a dimension the property
 * already has AND spend one of its registration slots on the duplicate. That is the exact trade
 * ADR-0039 refused when it dropped `utm_content`.
 *
 * `locale` is typed `string` and not the i18n `Locale` union on purpose: this module has no imports
 * from the application layer, and the consent gate above is the last thing that should acquire a
 * dependency it does not need. Every caller passes a `Locale`, so the narrow value arrives anyway.
 */
export interface EventParams {
  locale: string;
  [key: string]: unknown;
}

/**
 * The single emission point for every custom event. Nothing else in `src/` may touch `window.gtag` —
 * that is an ESLint `no-restricted-properties` rule (`eslint.config.mjs`), not a habit, because
 * `window.gtag` is a global and a global is reachable from anywhere by typing its name.
 *
 * Exported for the named emitters below and for tests. Prefer a named emitter at a call site: a free
 * string argument is how one event comes to be spelled two ways, and GA4 cannot merge two names after
 * the fact.
 *
 * RETURNS WHETHER THE HIT WAS ACTUALLY SENT, and that is load-bearing rather than informational. The
 * once-per-session guards (`lib/sessionOnce`) must mark ONLY what shipped: a reader who withdrew
 * consent between the observer's creation and its first callback gets a silent no-op here, and marking
 * that as "fired" would spend the session's one shot on an event GA4 never received — so re-granting
 * consent could never produce it. The suppressed case and the emitted case are indistinguishable from
 * the caller without this return value.
 */
export function trackEvent(name: string, params: EventParams): boolean {
  if (!mayEmit()) return false;
  window.gtag!('event', name, params);
  return true;
}

/** Send a page_view for an SPA route change. No-op before consent, and silent after a withdrawal. */
export function trackPageview(path: string): void {
  if (!mayEmit()) return;
  window.gtag!('event', 'page_view', { page_path: path });
}

// ---------------------------------------------------------------------------------------------------
// THE EVENT SCHEMA (#597)
//
// EVERY NAME BELOW IS IMMUTABLE ONCE IT HAS SHIPPED, on exactly the reasoning `utm.ts` records for the
// campaign literals: GA4 does not migrate history when a name changes — it starts a second series and
// leaves the first one sitting there looking complete. So a name is chosen for what the browser can
// actually OBSERVE, never for what we would like it to mean.
//
// Three names here are the result of applying that rule, and they are worth reading before a fourth is
// added:
//
//   `article_end_reached`, NOT `read`. Nothing a browser can see proves a read. What the observer
//   establishes is that the last block of the prose entered the viewport, that at least one
//   intermediate block did too, and that enough time passed for the words to have been possible to
//   read. That is a strong proxy and it is not a read, and the name outlives everyone present for the
//   decision.
//
//   `share_complete`, which CANNOT SEE A COMPLETED SHARE. Both entry points open the destination in a
//   new tab, so what the page observes is that a composer was opened — never that anything was posted.
//   The only evidence a share actually happened is an inbound `reader-share` session (see `utm.ts`),
//   which measures a different population and does not substitute for this one. The name is kept
//   because it names the ACT the reader performed on this page; the ceiling is recorded here and in
//   the record rather than encoded into a longer name nobody would read.
//
//   `article_progress`, and NOT `scroll`. `scroll` is GA4's own enhanced-measurement event name (it
//   carries `percent_scrolled` and fires at 90%). A custom `scroll` would put two differently-shaped
//   populations under one name, and whether the built-in is enabled is a property setting nothing in
//   this loop holds a credential to check.
// ---------------------------------------------------------------------------------------------------

/**
 * Where a `share_complete` went. `ShareSource` is imported rather than restated so this schema and the
 * UTM literals cannot drift into two spellings of one destination — a share to LinkedIn tagging
 * `linkedin` on the URL and reporting `LinkedIn` on the event is two series for one act.
 *
 * `copy-markdown` is additive here: it is a destination a reader can choose in the modal (#387) and it
 * has no UTM form, because the clipboard payload carries a citation rather than a tagged link.
 */
export type ShareCompleteTarget = ShareSource | 'copy-markdown';

/** Where a `contact_click` went. Defined HERE, in the schema module, and imported by the channel list —
 *  the reverse direction would make the schema depend on a component module and would put a registered
 *  dimension's vocabulary in a file nobody opens when reading the events. */
export type ContactTarget = 'github' | 'linkedin' | 'x' | 'whatsapp' | 'email';

/**
 * The `from` and `to` vocabulary of `nav_click` (slice B, #597) — ONE closed union serving BOTH
 * dimensions, and it is the mechanism that discharges the intake's bound-the-value rule rather than a
 * convenience.
 *
 * `from`/`to` are PATH-SHAPED VALUES FROM A BOUNDED SET, never a URL and never free text. Both are typed
 * as this union, so a query string cannot be emitted here by any spelling — not because a caller is
 * careful, but because there is no member of the type that could carry one. `to` is read from a literal
 * written into the nav table itself (`AppShell`'s `NAV`), never derived from an href at runtime; `from`
 * is produced by `navArea()` (`lib/navArea.ts`), a TOTAL function whose residual is `other`. That is the
 * same argument ADR-0051 records for `contact_click`'s closed `target` — the type forecloses the query
 * string rather than a convention discouraging it — and it is why `path` staying off the spine is not
 * quietly reintroduced here under two new names.
 *
 * TWO MEMBERS ARE DESTINATION-ONLY AND ONE IS ORIGIN-ONLY, which is a property of the site rather than a
 * gap. `articles` and `contact` are the landing's `#artigos` / `#contato` anchors: reachable as a nav
 * destination, never distinguishable as an origin (a reader sitting on either is on `home`). `article` is
 * the reverse — every `/blog/<slug>` is an origin and the nav has no entry pointing at one. A value that
 * only ever appears in one of the two dimensions is not a bug to be reported later.
 *
 * NO SLUG, DELIBERATELY. `article` collapses every piece into one value; which article the reader left is
 * already in that page's own `page_view`, and spending a registered dimension's cardinality on a value
 * GA4 can already join is the trade ADR-0051 refused for `path`.
 */
export type NavArea =
  | 'home'
  | 'articles'
  | 'contact'
  | 'portfolio'
  | 'ramp-up'
  | 'architecture'
  | 'library'
  | 'me'
  | 'article'
  | 'other';

/**
 * The reader reached the end of an article's prose. The CONTENT funnel's denominator — without it
 * `share_complete` is a count with nothing to divide by.
 */
export function trackArticleEndReached(params: EventParams & { slug: string }): boolean {
  return trackEvent('article_end_reached', params);
}

/** An intermediate scroll milestone inside an article. Its own value is modest; its real job is to be
 *  the precondition that separates a scroll-through from a leap to the bottom. */
export function trackArticleProgress(params: EventParams & { slug: string; percent: number }): boolean {
  return trackEvent('article_progress', params);
}

/** The reader chose a share destination. The CONTENT funnel's terminal event — mark it as a key event
 *  in the GA4 property, which is a console action and is not in this diff. */
export function trackShareComplete(params: EventParams & { target: ShareCompleteTarget }): void {
  trackEvent('share_complete', params);
}

/**
 * The reader clicked through to one of the owner's contact channels. The CAREER funnel's terminal
 * event, and the platform's stated purpose — mark it as a key event alongside `share_complete`.
 *
 * NO `href` IS CARRIED, and that is deliberate rather than an omission: `target` is a closed vocabulary
 * resolved from the channel list, so nothing here can grow a query string, and a query string is where
 * PII eventually appears. The same rule binds slice B's `outbound_click`, which cannot use a closed
 * vocabulary and must therefore bound the href to hostname + path.
 */
export function trackContactClick(params: EventParams & { target: ContactTarget }): void {
  trackEvent('contact_click', params);
}

// ---------------------------------------------------------------------------------------------------
// SLICE B (#597) — the four events that measure the MIDDLE of both funnels. Same spine, same gate, same
// immutability rule: every name below is fixed from the moment it collects, and the reasoning that
// produced each one is written beside it rather than in a pull request nobody will open again.
// ---------------------------------------------------------------------------------------------------

/**
 * The reader OPENED the share affordance — the denominator `share_complete` never had.
 *
 * `share_open`, not `share_intent`: what the page observes is a dialog opening, and "intent" is a claim
 * about a mind. The same rule that refused `read` refuses it here, and this one is cheaper to get right
 * because the observation is unambiguous — a control was pressed and a dialog mounted.
 *
 * WHAT THE RATIO IT ENABLES CAN AND CANNOT SAY, and this is the sharpest limit in slice B rather than a
 * caveat. It is emitted by `ShareButton` — the trigger that opens `ShareModal` — and by nothing else,
 * because nothing else on this site OPENS. The article footer's `ShareLinks` block is always visible, so
 * a reader can reach `share_complete` from it having opened nothing, and slice A shipped
 * `share_complete` WITHOUT a parameter naming which entry point it came from. That name is immutable, so
 * it cannot be added retroactively and the historical rows would not carry it anyway.
 *
 * Therefore: `share_open → share_complete` is an EXACT funnel for the modal and an OVER-COUNTED
 * numerator at the site level, because footer shares land in `share_complete` with no `share_open` ahead
 * of them. The ratio can exceed 1 and a ratio above 1 is not a defect. Read it as a floor on modal
 * abandonment, never as a completion rate for the site.
 */
export function trackShareOpen(params: EventParams & { slug: string }): void {
  trackEvent('share_open', params);
}

/**
 * The landing's contact section entered the viewport. The CAREER funnel's middle — the stage between
 * "arrived" and `contact_click`, which is exactly where the funnel leaks and where nothing looked.
 *
 * `contact_reach`, and the observation is narrow on purpose: the section INTERSECTED the viewport. Not
 * that it was read, not that it was dwelt on. There is no dwell floor here, unlike
 * `article_end_reached`, and that is a decision rather than an omission — the floor there exists to
 * separate a scroll-past from a read of PROSE, and this section is a heading and five chips whose whole
 * content is legible at a glance. A time condition would have measured hesitation, which is a different
 * event.
 *
 * ONE-SHOT PER SESSION, not per mount, and the guard is UPSTREAM of this emitter in `useContactReach`
 * (`lib/sessionOnce`). ~~ONE-SHOT PER MOUNT~~ — struck, and struck rather than reworded because that
 * was the shipped behaviour and it is what ADR-0051's amendment described as *once per visit*: a
 * dependency change rebuilt the observer and re-armed the shot, so a PT/EN toggle or a consent
 * re-grant emitted a second, indistinguishable row. Owner's ruling, 2026-09-04: «Uma vez por sessão».
 *
 * The consent half is unchanged and is a different guard: slice A's first defect was an observer
 * started before consent that silently consumed a one-shot milestone, and that is closed by creating
 * the observer at the grant.
 *
 * CARRIES ONLY `locale`. Which page the reader was on is not a question this event can answer — the
 * section exists on the landing alone — and that is precisely why `nav_click` carries `from`.
 */
export function trackContactReach(params: EventParams): boolean {
  return trackEvent('contact_reach', params);
}

/**
 * A link took the reader OFF this site, by a route that is neither a contact channel nor a share
 * destination.
 *
 * `href` IS BOUNDED TO `hostname + pathname` AND CAN CARRY NOTHING ELSE — no scheme, no query, no
 * fragment, no credentials, no port. That is ADR-0051's rule, which `contact_click` satisfied by using a
 * closed union and explicitly deferred to this event, which cannot: the set of outbound destinations is
 * open by construction (an article links wherever its author linked). So the bound is enforced in the
 * ONE function that builds the value (`outboundHref`, `lib/outboundLinks.ts`) by reconstructing the
 * string from a parsed `URL`'s two fields rather than by stripping characters off the original. A
 * blocklist of things to remove is a list someone has to keep complete; reading two fields is a list
 * that cannot be incomplete.
 *
 * A query string is where PII eventually appears, and on this site it would appear by accident rather
 * than by design — a reader clicking a link an article quoted verbatim, complete with whatever tracking
 * parameters its author had attached.
 *
 * TWO CLASSES ARE EXCLUDED BEFORE THIS IS EVER CALLED, and both exclusions exist for the same reason:
 * one act must not land in two series that a reader of either would take as complete. The five contact
 * channels are `contact_click`'s, the three share deeplinks are `share_complete`'s. See
 * `lib/outboundLinks.ts` for how each set is derived — from the same single sources those events
 * classify against, never restated.
 */
export function trackOutboundClick(params: EventParams & { href: string }): void {
  trackEvent('outbound_click', params);
}

/**
 * A nav control was clicked. EMITTED AT THE CLICK, while the origin page is still known — and that is
 * the whole event, not an implementation preference.
 *
 * `AppShell`'s `/#contato` and `/#artigos` entries are plain `<a href>` elements rather than `NavLink`s,
 * so reaching contact from `/architecture` is a FULL DOCUMENT LOAD. By the time anything on the landing
 * runs, the origin is gone and `window.dataLayer` has been discarded with it. An implementation that
 * emitted after navigation would report `from: 'home'` for every one of those journeys — a wrong answer
 * that reads as a right one, which is the class of defect ADR-0051 exists to prevent — and it would do
 * it silently, because the event would still fire and still look well-formed.
 *
 * The owner ruled on this directly (#597, 2026-09-04) with the disputed fact measured rather than
 * argued: `contact_reach` alone cannot say which page sent the reader, and the session-scoped path
 * exploration that would reconstruct it needs traffic this site does not have. `from`/`to` answers the
 * same question at n≈1.
 *
 * Both dimensions are `NavArea` — see that type for why a query string cannot be emitted here.
 */
export function trackNavClick(params: EventParams & { from: NavArea; to: NavArea }): void {
  trackEvent('nav_click', params);
}

/** Test seam: reset the module's injected flag so a fresh test starts from a clean state. */
export function resetAnalyticsForTest(): void {
  injected = false;
}
