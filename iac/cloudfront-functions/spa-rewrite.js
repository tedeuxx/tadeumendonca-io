// CloudFront Function (viewer-request). Rewrites directory-style routes to their prerendered
// index.html so the per-route static HTML (from `build:static`) is served:
//   '/'          -> '/index.html'
//   '/blog'      -> '/blog/index.html'
//   '/blog/slug' -> '/blog/slug/index.html'
// Requests for a file (the last path segment contains a dot, e.g. /sw.js, /og-default.png) pass
// through unchanged.
//
// WHAT THIS FUNCTION SEES: it is attached to the DEFAULT behavior only, so the /assets/* and
// /assets/avatars/* paths — which have their own cache behaviors — never reach it. /og/* DOES reach
// it: its behavior was removed (iac/frontend.tf) because it pointed at the retired og-images bucket
// and made every per-article og:image serve the SPA's HTML. The cards are ordinary static objects in
// the fed bucket now, and they pass through here untouched via the extension check above.
// Read "has its own cache behavior" as "routes to a DIFFERENT origin", never as "is handled
// correctly" — that reading is what let the /og/* misroute survive review.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
    // no extension in the last segment -> a route, not a file
    request.uri = uri + '/index.html';
  }
  return request;
}
