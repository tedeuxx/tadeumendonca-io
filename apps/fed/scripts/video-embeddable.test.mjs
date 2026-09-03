import { describe, it, expect } from 'vitest';
import { oembedUrl, verdictForStatus, claimedFor, classify, exitCodeFor, formatRow } from './video-embeddable.mjs';

describe('oembedUrl', () => {
  // The inner watch URL is percent-encoded. Unencoded, its own `?v=` terminates our `url=` parameter
  // and the endpoint receives a truncated URL — which answers 404 for every video, i.e. `unverified`
  // for the whole manifest. A check that reports "could not verify anything" looks like an outage.
  it('encodes the inner URL so its query does not terminate ours', () => {
    const url = oembedUrl('pqlWNihgdjI');
    expect(url).toContain('url=https%3A//www.youtube.com/watch%3Fv%3DpqlWNihgdjI');
    expect(url.split('?')[1].split('&').length, 'the endpoint must receive exactly url= and format=').toBe(2);
  });
});

describe('verdictForStatus', () => {
  it('reads 200 as embeddable and 401 as disabled', () => {
    expect(verdictForStatus(200)).toBe('embeddable');
    expect(verdictForStatus(401)).toBe('disabled');
  });

  // THE ASSERTION THAT MATTERS. Everything else must land on `unverified`, never on either answer —
  // a 404, a rate limit, a redirect and a gateway error are all "we do not know", and mapping any of
  // them to `embeddable` is precisely the fail-open this script exists not to be.
  it('reads every other status as unverified, never as an answer', () => {
    for (const status of [0, 204, 301, 302, 400, 403, 404, 429, 500, 502, 503]) {
      expect(verdictForStatus(status), `HTTP ${status}`).toBe('unverified');
    }
  });
});

describe('claimedFor', () => {
  it('reads only an explicit false as a claim; everything else is unknown', () => {
    expect(claimedFor({ channel: 'c', embeddable: false })).toBe('disabled');
    expect(claimedFor({ channel: 'c' })).toBe('unknown');
    expect(claimedFor(undefined)).toBe('unknown');
    // There is no `true` in the vocabulary, and a value that somehow slipped past the schema gate must
    // still read as UNKNOWN here rather than as a claim in either direction.
    expect(claimedFor({ channel: 'c', embeddable: true })).toBe('unknown');
    expect(claimedFor({ channel: 'c', embeddable: 'false' })).toBe('unknown');
  });
});

describe('classify', () => {
  const rows = [
    { id: 'ok', claimed: 'unknown', verdict: 'embeddable' },
    { id: 'flagged', claimed: 'disabled', verdict: 'disabled' },
    { id: 'stale', claimed: 'disabled', verdict: 'embeddable' },
    { id: 'undeclared', claimed: 'unknown', verdict: 'disabled' },
    { id: 'unreached', claimed: 'unknown', verdict: 'unverified' },
  ];

  it('names each finding for the failure it is, and leaves the healthy rows out of all three', () => {
    const { stale, undeclared, unverified } = classify(rows);
    expect(stale.map((r) => r.id)).toEqual(['stale']);
    expect(undeclared.map((r) => r.id)).toEqual(['undeclared']);
    expect(unverified.map((r) => r.id)).toEqual(['unreached']);
  });

  it('reports nothing for a manifest that agrees with YouTube throughout', () => {
    const { stale, undeclared, unverified } = classify(rows.slice(0, 2));
    expect([stale, undeclared, unverified].map((l) => l.length)).toEqual([0, 0, 0]);
  });
});

describe('exitCodeFor', () => {
  const none = { stale: [], undeclared: [], unverified: [] };

  it('exits 0 only when every video was reached and every answer agrees', () => {
    expect(exitCodeFor(none)).toBe(0);
  });

  it('exits 1 on a contradiction, in either direction', () => {
    expect(exitCodeFor({ ...none, undeclared: [{ id: 'x' }] })).toBe(1);
    expect(exitCodeFor({ ...none, stale: [{ id: 'x' }] })).toBe(1);
  });

  // THE ORDERING ASSERTION, and it is the one this file exists for. A partial run does not know what
  // it did not see, so `unverified` must outrank a real finding — otherwise a run that reached one
  // bad video and failed to reach five others reports 1, which reads as a complete result.
  it('exits 2 when anything was unreachable, even alongside a real finding', () => {
    expect(exitCodeFor({ stale: [{ id: 'a' }], undeclared: [{ id: 'b' }], unverified: [{ id: 'c' }] })).toBe(2);
  });

  // The failure this whole design is written against: an unreachable third party must never be
  // spelled the same way as a clean run.
  it('never returns 0 when something could not be checked', () => {
    expect(exitCodeFor({ ...none, unverified: [{ id: 'x' }] })).not.toBe(0);
  });
});

describe('formatRow', () => {
  it('pads to a stable width so a long id does not shift the columns', () => {
    const line = formatRow({ id: 'ab', claimed: 'unknown', verdict: 'embeddable', detail: '200' }, 11);
    expect(line).toBe('ab           manifest=unknown   youtube=embeddable  (200)');
  });
});
