// #597 slice B. The `outbound_click` classifier, and the two properties that decide whether the event
// is worth having at all:
//
//   1. THE BOUND HOLDS. What comes out is `hostname + pathname` and nothing else — asserted on the exact
//      returned string, for an href carrying a query, a fragment, a port and credentials at once, rather
//      than by checking that the output "does not contain a question mark".
//   2. NOTHING ALREADY OWNED BY ANOTHER EVENT COMES OUT. Every contact channel and every share
//      destination is refused, driven off the same lists those events classify against — so a sixth
//      contact channel or a fourth share target is covered here the day it is added, instead of quietly
//      becoming an outbound click.
import { describe, expect, it } from 'vitest';
import { boundedHref, outboundHref } from './outboundLinks';
import { CONTACT_CHANNELS } from '../components/contactChannels';
import { SHARE_TARGETS, shareHref } from '../components/shareTargets';
import { SITE_URL } from './site';

/** The document URL every case is resolved against — a served origin that is deliberately NOT
 *  `SITE_URL`, because that is the shape a local build and the E2E run actually have. */
const HERE = 'http://localhost:4173/en/architecture';

describe('outboundHref — the bound', () => {
  it('returns hostname + pathname and nothing else', () => {
    expect(outboundHref('https://example.com/a/b', HERE)).toBe('example.com/a/b');
  });

  // The whole rule in one case. If the value were built by stripping rather than by reconstruction,
  // each of these would need its own removal step and one of them would be missed.
  it('drops the scheme, credentials, port, query and fragment together', () => {
    expect(
      outboundHref('https://user:pw@example.com:8443/path/x?utm_source=a&email=x%40y.com#frag', HERE),
    ).toBe('example.com/path/x');
  });

  it('trims a trailing slash so one destination is one value', () => {
    expect(outboundHref('https://example.com/a/', HERE)).toBe('example.com/a');
    expect(outboundHref('https://example.com/', HERE)).toBe('example.com');
  });

  it('keeps a percent-encoded path segment rather than decoding it into something else', () => {
    expect(outboundHref('https://example.com/a%2Fb', HERE)).toBe('example.com/a%2Fb');
  });
});

describe('outboundHref — what is not an outbound click', () => {
  it.each([
    ['/en/me', 'an internal route'],
    ['/en/#contato', 'an internal anchor'],
    ['#main', 'a bare fragment — the skip link'],
    ['mailto:me@example.com', 'a mailto'],
    ['tel:+551199999999', 'a tel'],
    ['not a url at all ::::', 'an unparseable href'],
  ])('refuses %s (%s)', (href) => {
    expect(outboundHref(href, HERE)).toBeNull();
  });

  it('refuses an absolute link back to the SERVED origin', () => {
    expect(outboundHref('http://localhost:4173/en/me', HERE)).toBeNull();
  });

  // The two-origin rule. In production these are the same string; in a local build and in the E2E run
  // they are not, and treating a link to the canonical origin as outbound would manufacture an event
  // class that can only exist where it is tested.
  it('refuses an absolute link to the CANONICAL origin even when it is not the served one', () => {
    expect(outboundHref(`${SITE_URL}/en/me`, HERE)).toBeNull();
  });
});

describe('outboundHref — no click lands in two series', () => {
  // Driven off the live channel list. The e-mail channel is a `mailto:` and is refused a step earlier by
  // the protocol check; it is included here rather than filtered out, because "refused" is the property
  // and which rule refused it is not.
  it.each(CONTACT_CHANNELS.map((channel) => [channel.label, channel.href]))(
    'refuses the %s contact channel',
    (_label, href) => {
      expect(outboundHref(href, HERE)).toBeNull();
    },
  );

  // Built exactly as both share entry points build them, article path and title included, so the
  // exclusion is tested against the strings a reader can actually click.
  it.each(SHARE_TARGETS.map((target) => [target.label, shareHref(target, '/en/blog/x', 'A Title')]))(
    'refuses a share to %s',
    (_label, href) => {
      expect(outboundHref(href, HERE)).toBeNull();
    },
  );

  // THE POSITIVE TWIN for both blocks above, and it is the assertion that stops them being a pair of
  // vacuous negatives: a link on the SAME HOSTNAME as a refused one, at a different path, is still an
  // outbound click. This is the real case — the shell footer's version link sits on `github.com`, the
  // same host as the GitHub contact channel — and it is what a hostname-based exclusion would have
  // silently swallowed.
  it('still reports a different path on a hostname that also hosts a refused destination', () => {
    expect(outboundHref('https://github.com/tedeuxx/tadeumendonca-io/releases/tag/v1.0.0', HERE)).toBe(
      'github.com/tedeuxx/tadeumendonca-io/releases/tag/v1.0.0',
    );
    expect(outboundHref('https://www.linkedin.com/company/example', HERE)).toBe(
      'www.linkedin.com/company/example',
    );
  });
});

describe('boundedHref', () => {
  // Exported and asserted separately because the exclusion sets are BUILT with it: if it and the emitted
  // value were produced by two code paths, an exclusion could look correct and fail to match by one
  // character.
  it('is the same function that produces an emitted value', () => {
    const url = new URL('https://example.com/a/?q=1#f');
    expect(boundedHref(url)).toBe('example.com/a');
    expect(outboundHref('https://example.com/a/?q=1#f', HERE)).toBe(boundedHref(url));
  });
});
