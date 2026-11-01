// CloudFront Function (viewer-response). Exposes ONE fact to the client: whether the viewer's country,
// as CloudFront geolocates it, is a Portuguese-speaking (CPLP) member state. It sets a short,
// script-readable cookie on every HTML response:
//   locale_hint=pt     the CloudFront-Viewer-Country header names a CPLP member state
//   locale_hint=other  any other country, or the header is absent
//
// WHAT IT DOES NOT DO (#669): it never routes, never redirects and never rewrites the body. The cached
// HTML stays byte-identical for every viewer, so a client without JavaScript, a crawler and a social
// scraper receive exactly what they received before. Locale resolution stays client-side; the client
// step that reads this cookie is a separate slice.
//
// WHY VIEWER-RESPONSE: it runs after the cache, so every viewer gets their own value on a shared cached
// object. The header itself only exists because the default behavior's origin request policy names it
// (iac/frontend.tf); whether a function can read it on that route is the spike this function ships with,
// and the post-deploy smoke (apps/fed/e2e/edge-locale-hint.spec.ts) is its verdict.
//
// The value is a hint, not the country: one bit leaves the edge, not a location.
//
// Runtime: cloudfront-js-2.0. Kept to `var` and plain functions, like spa-rewrite.js, because the unit
// test evaluates these exact bytes under Node and a construct Node accepts can still be rejected at the
// edge at apply time.

// The CPLP member states, per the owner's ruling «Países lusófonos» (#669).
var LUSOPHONE = {
  AO: true, // Angola
  BR: true, // Brazil
  CV: true, // Cabo Verde
  GQ: true, // Equatorial Guinea
  GW: true, // Guinea-Bissau
  MZ: true, // Mozambique
  PT: true, // Portugal
  ST: true, // São Tomé and Príncipe
  TL: true, // Timor-Leste
};

var COOKIE_NAME = 'locale_hint';
// Path=/ so every route reads it; Secure and SameSite=Lax; NOT HttpOnly, because the client script must
// read it; a short Max-Age, because every HTML response sets it again.
var COOKIE_ATTRIBUTES = 'Path=/; Secure; SameSite=Lax; Max-Age=3600';

function localeHint(headers) {
  var header = headers ? headers['cloudfront-viewer-country'] : undefined;
  var country = header && typeof header.value === 'string' ? header.value.toUpperCase() : '';
  return LUSOPHONE[country] === true ? 'pt' : 'other';
}

function isHtml(response) {
  var type = response.headers ? response.headers['content-type'] : undefined;
  return !!type && typeof type.value === 'string' && type.value.toLowerCase().indexOf('text/html') === 0;
}

function handler(event) {
  var response = event.response;
  if (!isHtml(response)) {
    return response;
  }
  if (!response.cookies) {
    response.cookies = {};
  }
  response.cookies[COOKIE_NAME] = {
    value: localeHint(event.request.headers),
    attributes: COOKIE_ATTRIBUTES,
  };
  return response;
}
