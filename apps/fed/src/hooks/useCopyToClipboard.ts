// One clipboard write, one visible outcome — the state machine every copy affordance on this site shares.
//
// EXTRACTED FROM `ShareButton`, NOT WRITTEN FRESH (#506). The article-text copy the draft review bar
// offers is the THIRD clipboard write in this codebase, and the second one already had to learn — twice,
// in review — what the first one got wrong: a rejected `writeText` must be visible, and a browser with
// no `navigator.clipboard` at all is a DIFFERENT code path from a rejected promise. Writing a third copy
// of that would have been the shape #314 and #387 both had to unpick: two affordances that do the same
// thing and announce their failures differently.
//
// SO THE MOVE IS BEHAVIOUR-PRESERVING BY CONSTRUCTION and is asserted as such: `ShareButton.test.tsx`'s
// clipboard cases — the rejected write, the absent API, the per-control independence, the two timeouts —
// are unchanged by this slice and are what says the extraction changed nothing. Nothing new is added
// here; the only new thing is a second consumer.
//
// WHY THE TIMEOUTS ARE ASYMMETRIC, carried over verbatim from where this lived: a failure stays up
// longer than a confirmation. The success message is a nicety — the reader already has the text — while
// the failure is the only signal that their paste will be empty, and 1.5s is short enough to miss while
// looking at the app they were about to paste into.
import { useState } from 'react';

/**
 * What the last clipboard attempt on ONE control did.
 *
 * `failed` is the state that did not exist before #387, and its absence was the defect: a rejected
 * `writeText` left the label reading "Copy link" forever, which is indistinguishable from the reader
 * having not clicked yet. A button that appears to work and does not is worse than one that says it
 * could not.
 *
 * DEFINED HERE rather than in `ShareModal`, where it used to live, because the type belongs to the
 * mechanism and not to the one dialog that first rendered it — the review bar (#506) renders no dialog
 * and needs the same three states.
 */
export type CopyStatus = 'idle' | 'copied' | 'failed';

/**
 * One control's clipboard state and its writer.
 *
 * ONE HOOK CALL PER CONTROL, deliberately — `ShareButton` calls it twice, and the independence of the
 * two states is a property its suite already asserts ("the state is per control, and both were silent
 * before"). A single hook returning a keyed map would have made that independence a thing to maintain
 * rather than a thing that cannot break.
 *
 * THE CALLER BUILDS THE TEXT BEFORE CALLING, and synchronously. WebKit rejects with `NotAllowedError`
 * when an unrelated `await` intervenes between the user gesture and `writeText`, so anything that awaits
 * a dynamic import or a fetch first works everywhere except Safari. Passing a string rather than a
 * `() => Promise<string>` is what makes that impossible to get wrong at a call site.
 */
export function useCopyToClipboard(): { status: CopyStatus; copy: (text: string) => Promise<void> } {
  const [status, setStatus] = useState<CopyStatus>('idle');

  const copy = async (text: string) => {
    let outcome: CopyStatus;
    try {
      // `navigator.clipboard` is UNDEFINED on a non-secure origin, so this line throws a synchronous
      // TypeError there rather than returning a rejected promise. Both shapes land in the same `catch`,
      // which is the whole reason the call sits inside the `try` rather than being awaited outside it.
      await navigator.clipboard.writeText(text);
      outcome = 'copied';
    } catch {
      outcome = 'failed';
    }
    setStatus(outcome);
    setTimeout(() => setStatus('idle'), outcome === 'copied' ? 1500 : 5000);
  };

  return { status, copy };
}
