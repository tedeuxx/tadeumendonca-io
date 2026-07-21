// CloudFront Function (viewer-request). Rewrites directory-style routes to their prerendered
// index.html so the per-route static HTML (from `build:static`) is served:
//   '/'          -> '/index.html'
//   '/blog'      -> '/blog/index.html'
//   '/blog/slug' -> '/blog/slug/index.html'
// Requests for a file (the last path segment contains a dot, e.g. /sw.js, /og-default.png) pass
// through unchanged. The /assets/* and /og/* paths are handled by their own cache behaviors, so this
// function (attached to the default behavior only) never sees them.
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
