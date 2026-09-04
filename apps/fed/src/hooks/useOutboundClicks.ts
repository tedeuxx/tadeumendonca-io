// `outbound_click` — where the reader leaves to (#597).
//
// A SECOND DELEGATED LISTENER ON THE SAME SHELL NODE, beside `useContactClicks`, rather than one
// listener that classifies both. That is a decision and it was close, so the reasoning is here:
//
//   ONE listener would make mutual exclusion structural — the classifier returns contact, outbound or
//   neither, and nothing downstream can double-count. It would also mean editing a shipped, gated hook
//   and its regression suite to add an unrelated event, and it would put two funnels' terminals in one
//   function whose name could then only be generic.
//
//   TWO listeners keep each event's classification beside its own reasoning, and buy the exclusion a
//   different way: `outboundHref` refuses every contact channel and every share destination by LOOKUP,
//   against sets derived from the same lists the other two events classify against. That is
//   order-independent, so it does not matter which effect registered first — which is the property that
//   actually matters, because React effect ordering is not something a measurement may depend on.
//
// MEASURED RATHER THAN ASSUMED, because "both listeners see the click" is the premise the whole choice
// rests on: `useOutboundClicks.test.tsx` mounts BOTH hooks on one root and clicks a contact anchor, and
// asserts exactly one event is emitted. Delete the exclusion in `outboundLinks.ts` and that test reddens
// — the double count is not hypothetical, it is one line away.
//
// IT INTRODUCES NO DOM NODE, for the reason `useContactClicks` states: `scripts/prerender.mjs`
// serialises the DOM via `page.content()`, so listeners never reach the snapshot while a sentinel
// element would change served bytes and can move `page-heading-measure.spec.ts` and
// `responsive-overflow.spec.ts`.
import { useEffect, type RefObject } from 'react';
import { useLocale } from '../i18n';
import { trackOutboundClick } from '../lib/analytics';
import { outboundHref } from '../lib/outboundLinks';

export function useOutboundClicks(root: RefObject<HTMLElement>): void {
  const { locale } = useLocale();

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const onClick = (event: MouseEvent) => {
      // `closest`, not `event.target`: an outbound link may wrap an icon, a `<span>` or a code fence, so
      // the actual target is usually not the anchor. Same walk `useContactClicks` does, same reason.
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor) return;
      // `getAttribute`, not the `.href` PROPERTY, and here the difference is load-bearing rather than
      // merely safe — which is the opposite of the situation `useContactClicks` records for itself.
      // `.href` resolves a relative href against the document base, so EVERY internal link would arrive
      // already absolute and the origin comparison would still be correct — but percent-encoding
      // normalisation would silently rewrite the reported value for a link whose path carries encoded
      // characters, and the reported value is the whole event. The attribute is the string the page
      // actually published; `outboundHref` resolves it explicitly against the document URL.
      const href = anchor.getAttribute('href');
      if (!href) return;
      const bounded = outboundHref(href, window.location.href);
      // Not outbound, or outbound and already owned by another event. `outboundHref` is the only place
      // that decides; nothing is re-checked here, so there is one rule rather than two that must agree.
      if (bounded === null) return;
      trackOutboundClick({ locale, href: bounded });
    };

    node.addEventListener('click', onClick);
    return () => node.removeEventListener('click', onClick);
  }, [root, locale]);
}
