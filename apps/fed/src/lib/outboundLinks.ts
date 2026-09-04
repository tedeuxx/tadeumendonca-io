// `outbound_click`'s classifier (#597) — the one place that decides whether a click leaves the site,
// and the one place that builds the bounded `href` value.
//
// TWO JOBS, ONE FUNCTION, DELIBERATELY. "Is this outbound" and "what may be reported about it" are the
// same question asked twice: a caller that could get an answer to the first without the second would be
// holding a raw href with a decision already made about it, which is exactly the moment a query string
// gets emitted "just this once". `outboundHref` returns the reportable value or nothing at all.
//
// THE BOUND IS `hostname + pathname`, BUILT BY RECONSTRUCTION RATHER THAN BY STRIPPING. The value is
// assembled from two fields of a parsed `URL`; nothing is removed from the original string. A stripping
// rule is a blocklist — `?`, `#`, `user:pass@`, `:port`, and whatever the next URL feature is — and a
// blocklist has to be kept complete by someone. Reading two fields cannot be incomplete. ADR-0051 set
// this rule for slice B by name, because `contact_click` discharged it with a closed union and this
// event has no closed union available: an article links wherever its author linked.
//
// NOTHING ELSE MAY DUPLICATE AN EXISTING SERIES, and that is enforced here rather than by ordering.
// `useContactClicks` and `useOutboundClicks` are two delegated listeners on the SAME shell node, so both
// see every click and the order they run in is the order the effects happened to register — a fact about
// React's effect ordering, which is not a thing to build a measurement on. Instead the exclusion is a
// LOOKUP against a set derived from the very lists the other two events classify against, so a contact
// channel and a share destination are refused here no matter which listener ran first. Verified by
// execution rather than reasoned about: see `outboundLinks.test.ts`, which asserts the refusal for every
// channel and every share target, and `useOutboundClicks.test.tsx`, which mounts both listeners together
// and asserts exactly one event comes out.
import { CONTACT_CHANNELS } from '../components/contactChannels';
import { SHARE_TARGETS } from '../components/shareTargets';
import { SITE_URL } from './site';

/**
 * `hostname + pathname`, with a bare or trailing slash trimmed so one destination is one value.
 *
 * Exported for the tests and for the exclusion set below — the set must be built with the SAME function
 * that builds the emitted value, or an exclusion that looks correct fails to match by one character.
 */
export function boundedHref(url: URL): string {
  return `${url.hostname}${url.pathname.replace(/\/+$/, '')}`;
}

/** Parse without throwing. A malformed href on a page is a defect in the page, not a reason to blow up
 *  inside a click handler on the way to a navigation the reader asked for. */
function parse(href: string, base: string): URL | null {
  try {
    return new URL(href, base);
  } catch {
    return null;
  }
}

/**
 * The share deeplink ENDPOINTS, derived by asking each target to build an href — the same `href` builder
 * both entry points call. The article URL sits in the QUERY of every one of them, so the endpoint's
 * `hostname + pathname` is constant and the probe values below never reach anything.
 *
 * Derived rather than restated for the reason `contactChannels` gives about its own map: a fourth share
 * destination added to `SHARE_TARGETS` is excluded here automatically, and the alternative is a second
 * list that is correct on the day it is written.
 */
const PROBE = 'https://probe.invalid/probe';
const SHARE_ENDPOINTS: ReadonlySet<string> = new Set(
  SHARE_TARGETS.map((target) => parse(target.href(PROBE, 'probe'), PROBE))
    .filter((url): url is URL => url !== null)
    .map(boundedHref),
);

/**
 * The contact channels' bounded forms.
 *
 * THIS IS DELIBERATELY WIDER THAN `contact_click`'s OWN RULE, and the asymmetry is the point.
 * `useContactClicks` classifies by EXACT href, so a contact link written with a differently-spelled href
 * emits nothing — ADR-0051 records that silence as the intended failure direction. Excluding by the
 * bounded form here means such a link is silent in BOTH series rather than silent in one and reported as
 * an outbound click in the other. Silence over a wrong attribution, in the same direction the record
 * already chose, and it makes double-counting impossible rather than merely unlikely: this set is a
 * strict superset of the hrefs `contact_click` fires on.
 *
 * `mailto:` yields no usable hostname and is refused a step earlier by the protocol check, so the e-mail
 * channel contributes nothing to this set and needs no special case.
 */
const CONTACT_ENDPOINTS: ReadonlySet<string> = new Set(
  CONTACT_CHANNELS.map((channel) => parse(channel.href, SITE_URL))
    .filter((url): url is URL => url !== null && (url.protocol === 'http:' || url.protocol === 'https:'))
    .map(boundedHref),
);

/**
 * The reportable `outbound_click` href for a raw anchor href, or `null` when the click is not an
 * outbound click this event may claim.
 *
 * `currentHref` is the document's own URL, passed in rather than read from `window` so the function is
 * pure and the tests can state the origin instead of stubbing a global.
 *
 * TWO ORIGINS COUNT AS "THIS SITE", and the second one is not defensive padding. `SITE_URL` is the
 * production origin the share and canonical URLs are built from; `currentHref`'s origin is whatever is
 * actually being served. In production they are the same string. In `vite preview`, in the E2E run and
 * in any local build they are not, and treating a link back to the production origin as outbound would
 * have manufactured an event class that cannot occur in production — the worst kind, because it only
 * exists where it is tested.
 */
export function outboundHref(rawHref: string, currentHref: string): string | null {
  const url = parse(rawHref, currentHref);
  if (!url) return null;
  // `http`/`https` only. This drops `mailto:` (the e-mail contact channel), `tel:`, `javascript:` and
  // anything else with no hostname to report — a link that opens a mail client did not take the reader
  // to another site, and `contact_click` already owns the one case that matters.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const here = parse(currentHref, currentHref);
  if (here && url.origin === here.origin) return null;
  const canonical = parse(SITE_URL, SITE_URL);
  if (canonical && url.origin === canonical.origin) return null;

  const bounded = boundedHref(url);
  if (CONTACT_ENDPOINTS.has(bounded)) return null;
  if (SHARE_ENDPOINTS.has(bounded)) return null;
  return bounded;
}
