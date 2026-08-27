// The modal keyboard contract — focus in, focus trapped, `Escape` closes, focus back to the trigger.
//
// EXTRACTED FROM `ShareModal.tsx` (#473), NOT WRITTEN A SECOND TIME. That component shipped the whole
// contract inline, and its own header says why the contract is the hard part of a modal rather than the
// styling: "anything less than the full set is a regression shipped as a feature". A second dialog —
// the diagram overlay — needs the identical set, and the two ways of getting it were to copy thirty
// lines or to move them. Copied, the two dialogs drift the first time one of them fixes a bug; moved,
// `ShareButton.test.tsx`'s six existing focus assertions become the regression that says the behaviour
// did not change in the move.
//
// TWO THINGS GENERALISED IN THE MOVE, both stated because each widens what the trap can see:
//
//   1. `active`. `ShareModal` is mounted only while it is open, so its effect could assume "mounted
//      means open". The diagram overlay is the SAME element as the figure the reader was already
//      looking at — it is promoted to a dialog, not created as one — so its component is mounted the
//      whole time and the hook has to be told when the dialog exists. Defaulted to `true`, which is
//      exactly the mount-means-open case.
//   2. The focusable query gained `[tabindex]:not([tabindex="-1"])`. The overlay's scroller is a
//      keyboard-reachable pannable region (the `data-markdown-table` pattern), so it is a tab stop the
//      trap must include or Tab escapes the dialog into the page behind it. It adds nothing to
//      `ShareModal`, whose panel holds only links and buttons — asserted there rather than assumed.
import { useCallback, useEffect, type RefObject } from 'react';

/**
 * Every control a Tab press can reach inside `panel`, read in DOM order.
 *
 * Read at the moment it is needed rather than cached — `ShareModal`'s reason and it still holds: a
 * panel's contents change while it is open (a copy button swaps its label), and a cached list is how a
 * focus trap starts pointing at detached nodes.
 */
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus({
  panel,
  onClose,
  returnFocusTo,
  active = true,
}: {
  /** The dialog's own element. Focus is trapped inside it and nowhere else. */
  panel: RefObject<HTMLElement>;
  onClose: () => void;
  /**
   * The control to hand focus back to on close. Passed in rather than inferred from
   * `document.activeElement` — the first version of this in `ShareModal` did infer it and the guess
   * was wrong: a click does not necessarily leave focus on the clicked button, so the captured element
   * was the document body and focus returned nowhere.
   */
  returnFocusTo: RefObject<HTMLElement>;
  /** Whether the dialog is open. `false` is a complete no-op — no listener, no focus move. */
  active?: boolean;
}) {
  const focusables = useCallback(
    () => Array.from(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
    [panel],
  );

  useEffect(() => {
    if (!active) return;
    // Read once, here, rather than in the cleanup — a ref read at teardown may point somewhere else by
    // then. Safe to capture now because the trigger outlives the dialog in both call sites.
    const trigger = returnFocusTo.current;
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      // Wrap manually. Without this, Tab from the last control lands on the browser chrome and the
      // reader is outside a dialog that is still covering the page — the failure mode that makes a
      // modal worse than the inline affordance it replaced.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Return focus on ANY deactivation, not only on an explicit close — a route change while the
      // dialog is open would otherwise leave focus on a removed node, which reads to a screen reader as
      // the page having no focus at all.
      trigger?.focus();
    };
  }, [active, focusables, onClose, returnFocusTo]);
}
