// ONCE PER SESSION — the marker store behind every one-shot analytics event (#597, PR #602 round 2).
//
// WHY IT EXISTS, and it is a defect this repository paid for twice before it was named. A React effect
// that both creates an observer AND holds the "already emitted" flag in a local closure is one-shot per
// OBSERVER, not per anything a reader would recognise. Any dependency change — a PT/EN toggle, a
// consent re-grant — tears the effect down, builds a fresh `IntersectionObserver`, and a fresh
// observer delivers an initial callback for whatever is already on screen. The one-shot is re-armed
// and the event fires again, with nothing in the emitted rows to distinguish the duplicate from a
// genuine second reach.
//
// Measured on the built site: a locale toggle with `#contato` on screen emitted `contact_reach` twice
// (`locale: en`, then `locale: pt`, `scrollY` unchanged at 2967) and a consent re-grant emitted it
// twice with IDENTICAL parameters.
//
// THE SCOPE IS THE SESSION, and that is the owner's ruling («Uma vez por sessão»), not a convenience.
// A funnel's numerator must have the same denominator its stages are counted against: the question
// `contact_reach` answers is *how many sessions reached contact*, so a per-mount or per-page-view
// guard would answer a different question under a name that cannot be changed once it collects
// (ADR-0051).
//
// WHAT IT COSTS, stated because it is real: a reader who returns to the same page later in the SAME
// session does not re-count. That is the correct trade for a funnel stage and the wrong one for a
// volume metric — do not reach for this module for an event that is supposed to count occurrences.
//
// WHY `sessionStorage` AND NOT A MODULE-LEVEL `Set`: a `Set` dies with the document, and this site
// navigates between surfaces by full document load in at least one journey that matters (the nav's
// `#contato` anchor from `/architecture`). A module-scoped guard would be re-armed by exactly the
// navigation the event is meant to survive. `sessionStorage` is per tab and per origin and is cleared
// when the tab closes, which is the closest thing a browser offers to "this visit".
//
// IT IS NOT CONSENT STORAGE AND CARRIES NO READER DATA — the values are the literal string `'1'`, and
// the keys are event names the reader's own browser already knows it fired.

/** Namespace for every marker this module writes, so the keys are recognisable in a devtools pane and
 *  cannot collide with the locale/consent keys that live in `localStorage`. */
export const SESSION_ONCE_PREFIX = 'analytics-once:';

/** Build a marker key from its parts. A helper rather than template literals at four call sites,
 *  because a key spelled two ways is a guard that silently does not guard. */
export function onceKey(...parts: (string | number)[]): string {
  return `${SESSION_ONCE_PREFIX}${parts.join(':')}`;
}

/**
 * Has this marker already been set in this session?
 *
 * NEVER THROWS, and the failure direction is deliberate: private mode and blocked storage make
 * `sessionStorage` throw rather than return null, and the answer there is `false` — the event emits.
 * A guard that fails CLOSED would silently drop a funnel stage for every reader with storage disabled,
 * which is a worse error than the double count it exists to prevent, because it is invisible in the
 * data rather than visible as a duplicate row.
 */
export function firedThisSession(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

/** Record that the marker fired. Never throws — see `firedThisSession` for the failure direction. */
export function markFiredThisSession(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    /* private mode / storage disabled — the guard degrades to per-observer, which is today's behaviour. */
  }
}
