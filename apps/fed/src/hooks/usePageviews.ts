import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from '../lib/analytics';

// GA4 pageviews for an SPA. `loadAnalytics`'s gtag('config') sends the first page_view, so this skips
// its own first run and sends only on subsequent route changes. trackPageview is a no-op until consent
// has loaded gtag, so mounting this before consent is harmless.
//
// SINCE #272 that first page_view is the page the reader ARRIVED on, not the page they were on when the
// script loaded — `config` is passed an explicit `page_location` captured at module load, so the
// campaign survives the consent gate (ADR-0039). The two differ for exactly one reader: the one who
// lands on A, navigates to B, and only then accepts. Their first recorded hit is A; B is skipped here
// as the mount, so B is never counted at all.
//
// That is the accepted trade and not an oversight — A is the shared article whose reach is being
// measured, and attributing the session to B would lose the campaign entirely. Recorded because a
// pageview count is read months later by someone who was not here: a late-consenting reader's landing
// page is over-counted relative to the page they were actually reading at the moment they accepted.
export function usePageviews(): void {
  const location = useLocation();
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search]);
}
