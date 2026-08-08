// The share modal (#314) — the article's share options behind one behaviour.
//
// THE FIRST MODAL IN THIS DESIGN SYSTEM, which is why the styling is stated rather than inherited: the
// brutalist identity is radius 0, no shadow, no gradient (ADR-0008), and every modal library and every
// habit reaches for rounded corners and a drop shadow. There is a border and a flat backdrop; the
// elevation cue is the border, the way it is everywhere else on this site.
//
// ACCESSIBILITY IS THE HARD PART OF A MODAL, NOT THE STYLING, and the affordance it replaces was
// already keyboard-reachable — so anything less than the full set is a regression shipped as a feature:
// focus moves in on open, is trapped while open, returns to the trigger on close, `Escape` dismisses,
// the dialog carries an accessible name, and the backdrop click closes.
//
// FIVE OPTIONS SINCE #387, not four — three deeplinks plus two clipboard writes. The list is a vertical
// stack of full-width rows separated by a top border, so a row is added by adding a row; the panel is
// `max-w-sm` and bottom-anchored below `sm`, and the sweep in `responsive-overflow.spec.ts` covers the
// widths where that could bite. No layout change was needed and none was made — worth stating, because
// "the modal has four options" was load-bearing nowhere and looks like it should have been.
//
// `prefers-reduced-motion` is honoured by the GLOBAL reset in `styles/index.css`, which neuters
// `transition-duration` to 0.01ms under `reduce` — not, as an earlier version of this comment claimed,
// by this file having no transitions. It has three (`transition-colors` on the close control,
// `transition-[padding]` on each row). The behaviour was always right; the stated reason was not, and
// naming the wrong mechanism is how the next component "follows the pattern" by omitting a transition
// it could have had.
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { X as CloseIcon, Link2, Check, FileText, AlertTriangle, type LucideIcon } from 'lucide-react';
import { useT } from '../i18n';
import { SHARE_TARGETS, shareHref } from './shareTargets';

/**
 * What the last clipboard attempt on one control did.
 *
 * `failed` is the state that did not exist before #387, and its absence was the defect: a rejected
 * `writeText` left the label reading "Copy link" forever, which is indistinguishable from the reader
 * having not clicked yet. A button that appears to work and does not is worse than one that says it
 * could not.
 */
export type CopyStatus = 'idle' | 'copied' | 'failed';

/**
 * One clipboard row in the option list.
 *
 * Extracted because there are two of them now and they differ only in their idle icon, their idle label
 * and what they write — while the state machine (idle → copied | failed), the announcement and the
 * layout are identical. Two hand-written rows is how the copy option and the markdown option would come
 * to announce their failures differently.
 */
function CopyRow({
  status,
  label,
  Icon,
  onClick,
}: {
  status: CopyStatus;
  label: string;
  // `LucideIcon`, not a hand-written `ComponentType<{ size?: number }>` — lucide's own `size` is
  // `string | number`, so the narrower shape is not assignable and every icon in this file is one of
  // these. The suite never saw it: vitest does not typecheck, and `npm run typecheck` is the gate that
  // can.
  Icon: LucideIcon;
  onClick: () => void;
}) {
  const t = useT();
  const StateIcon = status === 'copied' ? Check : status === 'failed' ? AlertTriangle : Icon;
  const text = status === 'copied' ? t('share.copied') : status === 'failed' ? t('share.copyFailed') : label;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 border-t border-border py-3 text-left font-mono text-sm uppercase tracking-wider transition-[padding] duration-150 hover:pl-2"
      >
        <StateIcon size={18} className="shrink-0 text-primary" />
        {/* The label IS the feedback, so its changes have to be announced — a sighted reader sees the
            icon and the word swap, and without a live region a screen-reader user gets nothing at all
            for either outcome. Polite rather than assertive: it is a confirmation, not an interruption. */}
        <span aria-live="polite">{text}</span>
      </button>
    </li>
  );
}

export function ShareModal({
  title,
  path,
  onClose,
  onCopyLink,
  linkStatus,
  onCopyMarkdown,
  markdownStatus,
  returnFocusTo,
}: {
  title: string;
  path: string;
  onClose: () => void;
  onCopyLink: () => void;
  linkStatus: CopyStatus;
  /**
   * Absent when the caller has no body to offer — the markdown row is then not rendered at all (#387).
   * A page that adds the share affordance without a payload gets four working options rather than a
   * fifth that copies an empty document, and it gets that WITHOUT anyone maintaining a route list.
   */
  onCopyMarkdown?: () => void;
  markdownStatus: CopyStatus;
  /**
   * The control to hand focus back to on close. Passed in rather than inferred from
   * `document.activeElement` at mount — the first version did infer it, and it was a guess that
   * happened to be wrong: a click does not necessarily leave focus on the clicked button, so the
   * captured element was the document body and focus returned nowhere. The trigger knows which control
   * it is; nothing else does.
   */
  returnFocusTo: RefObject<HTMLElement>;
}) {
  const t = useT();
  const panel = useRef<HTMLDivElement>(null);

  // Focusable descendants, read at the moment they are needed rather than cached. The panel's content
  // changes while it is open — the copy button swaps its label to "Copied" — and a cached list is how a
  // focus trap starts pointing at detached nodes.
  const focusables = useCallback(
    () => Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []),
    [],
  );

  useEffect(() => {
    // Read once, here, rather than in the cleanup — `react-hooks/exhaustive-deps` is right that a ref
    // read at teardown may point somewhere else by then. Safe to capture at this moment because the
    // trigger stays mounted for the whole life of this dialog: the component that renders the button
    // is the component that renders us.
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
      // modal worse than the inline links it replaced.
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
      // Return focus on ANY unmount, not only on an explicit close. A route change while the modal is
      // open would otherwise leave focus on a removed node, which reads to a screen reader as the page
      // having no focus at all.
      trigger?.focus();
    };
  }, [focusables, onClose, returnFocusTo]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/70 p-4 sm:items-center"
      // The backdrop closes on click. `onMouseDown` rather than `onClick`: a click whose press started
      // INSIDE the panel and released on the backdrop (a drag while selecting the link text) fires
      // `click` on the backdrop and would close the dialog mid-selection.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        // LABELLED BY THE VISIBLE HEADING, not by a separate `aria-label`. The first version set both,
        // and `aria-label` wins — so a sighted reader saw "Compartilhar" while a screen-reader user
        // heard "Opções de compartilhamento": two names for one dialog, and the visible one was verbatim
        // the label of the button that had just opened it.
        aria-labelledby="share-modal-title"
        className="w-full max-w-sm border-2 border-border-strong bg-background p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="share-modal-title" className="label-mono text-foreground">
            {t('share.modalLabel')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('share.close')}
            className="p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <ul>
          {SHARE_TARGETS.map(({ key, label, nameKey, Icon, ...rest }) => (
            <li key={key}>
              <a
                href={shareHref({ key, label, nameKey, Icon, ...rest }, path, title)}
                target="_blank"
                rel="noreferrer"
                // The accessible name says WHAT is being shared and WHERE. "LinkedIn" alone, repeated on
                // every article, is three identical links to a screen reader moving by link list.
                aria-label={`${t(nameKey)}: ${title}`}
                onClick={onClose}
                className="flex items-center gap-3 border-t border-border py-3 font-mono text-sm uppercase tracking-wider transition-[padding] duration-150 hover:pl-2"
              >
                <Icon className="shrink-0 text-primary" />
                <span>{label}</span>
              </a>
            </li>
          ))}
          <CopyRow status={linkStatus} label={t('share.copyLink')} Icon={Link2} onClick={onCopyLink} />
          {onCopyMarkdown && (
            <CopyRow
              status={markdownStatus}
              label={t('share.copyMarkdown')}
              Icon={FileText}
              onClick={onCopyMarkdown}
            />
          )}
        </ul>
      </div>
    </div>
  );
}
