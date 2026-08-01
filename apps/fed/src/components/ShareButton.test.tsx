import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ShareButton, articleShareUrl } from './ShareButton';
import { ShareLinks } from './ShareLinks';
import { renderWithLocale } from '../test-utils';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// The three native-share-sheet tests that lived here are GONE, not broken and re-stubbed. The header
// button no longer calls `navigator.share`: #314 unified the two entry points behind one target list,
// and the sheet could not be part of it because it is an OS surface the footer block cannot offer. That
// is a real capability loss and it is argued in the component; a test asserting the removed behaviour
// would be asserting the defect.
//
// What replaced them asserts the property #314 actually bought: the two entry points offer the SAME
// destinations. That is the last test in this file and it is the reason the slice exists.
describe('ShareButton', () => {
  const open = (locale: 'pt' | 'en' = 'pt') => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/meu-compromisso" />, { locale });
    fireEvent.click(screen.getByRole('button', { name: locale === 'pt' ? 'Compartilhar' : 'Share' }));
    return screen.getByRole('dialog');
  };

  it('opens a dialog rather than sharing directly', () => {
    const dialog = open();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Named, and named DIFFERENTLY from the footer nav — see the note on the last test in this file.
    expect(dialog).toHaveAccessibleName('Opções de compartilhamento');
  });

  it('advertises the dialog on the trigger, so a screen reader knows what the button does', () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/x" />, { locale: 'pt' });
    const trigger = screen.getByRole('button', { name: 'Compartilhar' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toHaveAttribute('aria-expanded', 'true');
  });

  // ACCESSIBILITY IS THE HARD PART OF A MODAL, and the affordance this replaced was already
  // keyboard-reachable — so each of these guards a REGRESSION, not a nice-to-have. They are separate
  // tests because they fail independently: a focus trap can be right while focus never returns.
  it('moves focus into the dialog on open', () => {
    const dialog = open();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('closes on Escape and returns focus to the trigger', () => {
    open();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Compartilhar' }));
  });

  it('returns focus to the trigger when closed by the close control', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Compartilhar' }));
  });

  // Tab from the LAST control must wrap to the first. Without it the reader tabs into the browser
  // chrome while a dialog still covers the page — which is the failure that makes a modal worse than
  // the inline links it replaced, and it is invisible to every other assertion here.
  it('traps Tab inside the dialog', () => {
    const dialog = open();
    const items = within(dialog).getAllByRole('link').concat(within(dialog).getAllByRole('button'));
    const last = items[items.length - 1];
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('copies the tagged link and confirms in the active locale', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/meu-compromisso" />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copiar link' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain('/pt/blog/meu-compromisso');
    // #272: the source names what actually happened. `copy-link`, never `share-sheet` — nothing emits
    // that value any more, and a copy tagged as a sheet share is the fabricated dimension ADR-0039
    // refuses.
    expect(new URL(writeText.mock.calls[0][0]).searchParams.get('utm_source')).toBe('copy-link');
    expect(await screen.findByText('Copiado')).toBeInTheDocument();
  });

  it('renders the dialog in English when the locale is en', () => {
    const dialog = open('en');
    expect(dialog).toHaveAccessibleName('Share options');
    expect(within(dialog).getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });
});

// THE POINT OF #314, asserted as an EQUALITY between the two entry points rather than as two literal
// lists. Two independent lists is exactly how they drifted: each was correct, each was tested, and
// neither test could see the other — so the header offered the OS sheet plus a copy while the footer
// offered three deeplinks, both green, for as long as they existed.
//
// Compared on the tagged href set with the `utm_source` stripped, because that parameter is the one
// thing that legitimately differs per entry point... except it does not: both build from the same
// `SHARE_TARGETS`, so the sources match too and the comparison is on the whole URL.
describe('the two share entry points', () => {
  const hrefsFrom = (root: HTMLElement) =>
    within(root)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .sort();

  it('offer the same destinations', () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } });

    const modal = renderWithLocale(<ShareButton title="Hello" url="/pt/blog/meu-compromisso" />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    const fromModal = hrefsFrom(screen.getByRole('dialog'));
    modal.unmount();

    renderWithLocale(<ShareLinks title="Hello" path="/pt/blog/meu-compromisso" />, { locale: 'pt' });
    const fromFooter = hrefsFrom(screen.getByRole('navigation'));

    expect(fromModal).toEqual(fromFooter);
    expect(fromModal).toHaveLength(3); // WhatsApp, X, LinkedIn — a change here must be deliberate
  });

  it('both offer the copy-link destination the header used to have alone', () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } });
    const modal = renderWithLocale(<ShareButton title="Hello" url="/pt/blog/x" />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
    modal.unmount();

    renderWithLocale(<ShareLinks title="Hello" path="/pt/blog/x" />, { locale: 'pt' });
    expect(within(screen.getByRole('navigation')).getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
  });
});

describe('share URL helpers', () => {
  // The share path is the canonical route and nothing else (#268). The previous test asserted a
  // `/p/<short_code>` form — green, and about a route that has never existed on the static site: it
  // would have fallen through to the `*` catch-all and redirected the reader to the home page, which
  // is the worst outcome for a shared link because the sender sees a working URL.
  it('is the canonical article route — there is no short-code form to prefer', () => {
    expect(articleShareUrl({ slug: 'my-slug' })).toBe('/blog/my-slug');
  });
});
