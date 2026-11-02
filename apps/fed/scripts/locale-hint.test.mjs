import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// #669 — the CloudFront viewer-response function that exposes the locale hint.
//
// Evaluated, not imported, for the same reason as spa-rewrite.test.mjs: CloudFront Functions run a JS
// 2.0 runtime with no module system, so `handler` is a bare declaration and this tests the exact bytes
// that ship. What this cannot prove is that the edge runs the function or that CloudFront delivers the
// country header to it; that is the post-deploy smoke's job (e2e/edge-locale-hint.spec.ts).
const SOURCE = resolve(import.meta.dirname, '../../../iac/cloudfront-functions/locale-hint.js');

function loadHandler() {
  const src = readFileSync(SOURCE, 'utf8');
  return new Function(`${src}; return handler;`)();
}

const HTML = { 'content-type': { value: 'text/html; charset=utf-8' } };

function run({ country, headers = HTML, cookies = {} } = {}) {
  const requestHeaders = country === undefined ? {} : { 'cloudfront-viewer-country': { value: country } };
  return loadHandler()({
    request: { uri: '/index.html', headers: requestHeaders },
    response: { statusCode: 200, headers, cookies },
  });
}

const hint = (country) => run({ country }).cookies.locale_hint.value;

describe('locale-hint (CloudFront viewer-response)', () => {
  // The owner's ruling «Países lusófonos»: the nine CPLP member states, each asserted on its own so a
  // dropped or misspelled code reddens exactly one row.
  describe('each CPLP member state gives pt', () => {
    for (const code of ['AO', 'BR', 'CV', 'GQ', 'GW', 'MZ', 'PT', 'ST', 'TL']) {
      it(`${code} → pt`, () => expect(hint(code)).toBe('pt'));
    }
  });

  describe('every other viewer gives other', () => {
    // ES and AR are neighbours of CPLP members that a hand extending the map could add by mistake;
    // US, GB, DE and FR are where a CI runner or a typical reader sits.
    for (const code of ['US', 'ES', 'FR', 'GB', 'DE', 'AR']) {
      it(`${code} → other`, () => expect(hint(code)).toBe('other'));
    }
  });

  // `unknown` is the spike's NO-GO signal: the header never reached the function. It must never collapse
  // into `other`, or the post-deploy smoke cannot tell a non-CPLP runner from a missing header.
  describe('no readable country gives unknown', () => {
    it('a missing header gives unknown and does not throw', () => {
      expect(() => run()).not.toThrow();
      expect(run().cookies.locale_hint.value).toBe('unknown');
    });

    it('a request with no headers object at all gives unknown and does not throw', () => {
      const out = loadHandler()({
        request: { uri: '/index.html' },
        response: { statusCode: 200, headers: HTML, cookies: {} },
      });
      expect(out.cookies.locale_hint.value).toBe('unknown');
    });

    it('an empty header value gives unknown', () => expect(hint('')).toBe('unknown'));

    it('a non-string header value gives unknown', () => expect(hint(42)).toBe('unknown'));

    it('a header entry with no value gives unknown', () => {
      const out = loadHandler()({
        request: { uri: '/index.html', headers: { 'cloudfront-viewer-country': {} } },
        response: { statusCode: 200, headers: HTML, cookies: {} },
      });
      expect(out.cookies.locale_hint.value).toBe('unknown');
    });
  });

  it('the country code is matched case-insensitively', () => {
    expect(hint('br')).toBe('pt');
    expect(hint('Pt')).toBe('pt');
  });

  describe('the cookie attributes are fixed', () => {
    const cookie = () => run({ country: 'BR' }).cookies.locale_hint;
    const attrs = () =>
      cookie()
        .attributes.split(';')
        .map((a) => a.trim())
        .filter(Boolean);

    it('is exactly the published attribute set', () => {
      expect(cookie().attributes).toBe('Path=/; Secure; SameSite=Lax; Max-Age=3600');
    });

    it('Path=/', () => expect(attrs()).toContain('Path=/'));
    it('Secure', () => expect(attrs()).toContain('Secure'));
    it('SameSite=Lax', () => expect(attrs()).toContain('SameSite=Lax'));

    it('is NOT HttpOnly, because the client script must read it', () => {
      expect(attrs().map((a) => a.toLowerCase())).not.toContain('httponly');
    });

    it('carries no long Max-Age (at most one day) and no Expires', () => {
      const maxAge = attrs().find((a) => /^max-age=/i.test(a));
      expect(maxAge, 'a Max-Age keeps the hint short-lived').toBeDefined();
      expect(Number(maxAge.split('=')[1])).toBeLessThanOrEqual(86400);
      expect(attrs().some((a) => /^expires=/i.test(a))).toBe(false);
    });
  });

  describe('only HTML responses get the cookie', () => {
    it('an HTML response without a cookies object gets one', () => {
      const out = loadHandler()({
        request: { uri: '/index.html', headers: { 'cloudfront-viewer-country': { value: 'BR' } } },
        response: { statusCode: 200, headers: HTML },
      });
      expect(out.cookies.locale_hint.value).toBe('pt');
    });

    it('an uppercase content type still counts as HTML', () => {
      const out = run({ country: 'BR', headers: { 'content-type': { value: 'TEXT/HTML' } } });
      expect(out.cookies.locale_hint.value).toBe('pt');
    });

    for (const type of ['image/png', 'application/xml', 'application/pdf', 'text/plain']) {
      it(`a ${type} response is passed through without the cookie`, () => {
        const out = run({ country: 'BR', headers: { 'content-type': { value: type } } });
        expect(out.cookies.locale_hint).toBeUndefined();
      });
    }

    it('a response with no content type is passed through without the cookie', () => {
      expect(run({ country: 'BR', headers: {} }).cookies.locale_hint).toBeUndefined();
    });

    it('cookies the origin already set are kept', () => {
      const out = run({ country: 'BR', cookies: { other_cookie: { value: 'x' } } });
      expect(out.cookies.other_cookie).toEqual({ value: 'x' });
      expect(out.cookies.locale_hint.value).toBe('pt');
    });
  });

  it('never touches the status or the headers it was given', () => {
    const out = run({ country: 'BR' });
    expect(out.statusCode).toBe(200);
    expect(out.headers).toEqual(HTML);
  });
});
