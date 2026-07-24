import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from '../lib/analytics';

// GA4 pageviews for an SPA. `loadAnalytics`'s gtag('config') already sends the page_view for the page
// present when the script loads, so this skips its own first run (the mount, same page) and sends only
// on subsequent route changes. trackPageview is a no-op until consent has loaded gtag, so mounting this
// before consent is harmless — the first tracked change after Accept is the reader's next navigation.
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
