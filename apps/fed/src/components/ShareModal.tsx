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
// the dialog carries an accessible name, and the backdrop click closes. `prefers-reduced-motion` is
// respected by having no transition at all, which is the cheapest way to be correct.
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { X as CloseIcon, Link2, Check } from 'lucide-react';
import { useT } from '../i18n';
import { SHARE_TARGETS, shareHref } from './shareTargets';

export function ShareModal({
  title,
  path,
  onClose,
  onCopy,
  copied,
  returnFocusTo,
}: {
  title: string;
  path: string;
  onClose: () => void;
  onCopy: () => void;
  copied: boolean;
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
          <li>
            <button
              type="button"
              onClick={onCopy}
              className="flex w-full items-center gap-3 border-t border-border py-3 text-left font-mono text-sm uppercase tracking-wider transition-[padding] duration-150 hover:pl-2"
            >
              {copied ? (
                <Check size={18} className="shrink-0 text-primary" />
              ) : (
                <Link2 size={18} className="shrink-0 text-primary" />
              )}
              <span>{copied ? t('share.copied') : t('share.copyLink')}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
