import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ShareButton, articleShareUrl } from './ShareButton';
import { ShareLinks } from './ShareLinks';
import { renderWithLocale } from '../test-utils';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// The two clipboard labels, owner-ratified verbatim (#387). Held as constants because they are asserted
// from a dozen places and because the property under test is that the DESTINATION is named — a test that
// re-typed 'Copiar link' would keep passing against the old, published label.
const COPY_LINK_PT = 'Copiar link para a área de transferência';
const COPY_MD_PT = 'Copiar markdown para a área de transferência';
const COPY_MD_EN = 'Copy markdown to clipboard';

// The three native-share-sheet tests that lived here are GONE, not broken and re-stubbed. The header
// button no longer calls `navigator.share`: #314 unified the two entry points behind one target list,
// and the sheet could not be part of it because it is an OS surface the footer block cannot offer. That
// is a real capability loss and it is argued in the component; a test asserting the removed behaviour
// would be asserting the defect.
//
// What replaced them asserts the property #314 actually bought: the two entry points offer the SAME
// destinations. That is the last test in this file and it is the reason the slice exists.
describe('ShareButton', () => {
  // Opened WITH a body, so the dialog under test is the five-option one every shipped route renders. The
  // four-option shape (no body) has its own test below — it is a real configuration, not the default.
  const open = (locale: 'pt' | 'en' = 'pt') => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/meu-compromisso" body="Corpo." />, { locale });
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

  // THE ASSERTION IS IDENTITY, NOT CONTAINMENT, and the first version got this wrong in a way that
  // made it impossible to fail. It asserted `dialog.contains(document.activeElement)` — but jsdom does
  // not implement sequential focus navigation, so a Tab keydown moves focus nowhere on its own. With
  // the wrap, focus lands on the first item (inside). WITHOUT the wrap, focus stays where it was
  // (also inside). True in both worlds, green against a deleted trap, and it was the assertion this
  // slice argued hardest for.
  //
  // Naming the expected element is what makes it a test. Both directions, because they are separate
  // branches and the reverse one had no assertion at all.
  // DOM ORDER, which is the order focus actually moves in. The first version of this helper did
  // `getAllByRole('link').concat(getAllByRole('button'))` — all links, then all buttons — while the
  // dialog renders close · WhatsApp · X · LinkedIn · copy. So it compared against an invented order and
  // both assertions failed for a reason that had nothing to do with the trap. Caught only because the
  // assertion had just been made capable of failing.
  const focusablesIn = (dialog: HTMLElement) =>
    Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));

  it('wraps Tab from the last control back to the first', () => {
    const dialog = open();
    const items = focusablesIn(dialog);
    items[items.length - 1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(items[0]);
  });

  it('wraps Shift+Tab from the first control back to the last', () => {
    const dialog = open();
    const items = focusablesIn(dialog);
    items[0].focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it('copies the tagged link and confirms in the active locale', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/meu-compromisso" />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    fireEvent.click(screen.getByRole('button', { name: COPY_LINK_PT }));
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
    expect(within(dialog).getByRole('button', { name: 'Copy link to clipboard' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: COPY_MD_EN })).toBeInTheDocument();
  });
});

// #387 — the fifth option. These are separate from the four-option suite above because they fail for
// different reasons: the payload can be right while the control is unreachable, and the control can be
// present while the failure path is silent.
describe('copy as markdown', () => {
  const RAMPUP_BODY = 'Sao {{years}} anos.\n\nEstão na [Biblioteca](/library).';

  const openWith = (props: { body?: string }, locale: 'pt' | 'en' = 'pt') => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/meu-compromisso" {...props} />, { locale });
    fireEvent.click(screen.getByRole('button', { name: locale === 'pt' ? 'Compartilhar' : 'Share' }));
    return writeText;
  };

  it('offers a fifth control beside the four that already existed', () => {
    openWith({ body: 'Corpo.' });
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('link')).toHaveLength(3);
    expect(within(dialog).getByRole('button', { name: COPY_LINK_PT })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: COPY_MD_PT })).toBeInTheDocument();
  });

  // The scope mechanism, asserted as behaviour rather than trusted as a prop signature. A route list
  // would rot; "no body, no option" cannot.
  it('offers NO markdown control when the caller passes no body', () => {
    openWith({});
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: COPY_MD_PT })).toBeNull();
    expect(within(dialog).getByRole('button', { name: COPY_LINK_PT })).toBeInTheDocument();
  });

  it('writes the assembled document — title, clean canonical URL, absolute links', async () => {
    const writeText = openWith({ body: RAMPUP_BODY });
    fireEvent.click(screen.getByRole('button', { name: COPY_MD_PT }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const payload = writeText.mock.calls[0][0] as string;
    expect(payload).toMatch(/^# Hello\n/);
    expect(payload).toContain('https://tadeumendonca.io/pt/blog/meu-compromisso');
    expect(payload).toContain('[Biblioteca](https://tadeumendonca.io/pt/library)');
    // The decision the owner made, and the one an "improvement" toward consistency would undo.
    expect(payload).not.toContain('utm_');
  });

  it('confirms in the active locale, on the markdown control and not on the link one', async () => {
    openWith({ body: 'Corpo.' });
    fireEvent.click(screen.getByRole('button', { name: COPY_MD_PT }));
    expect(await screen.findByText('Copiado')).toBeInTheDocument();
    // The link row is untouched — two controls, two independent states. A single shared `copied` flag
    // would light both up and this is the assertion that sees it.
    expect(screen.getByRole('button', { name: COPY_LINK_PT })).toBeInTheDocument();
  });

  // THE FAILURE STATE IS THE POINT OF CHANGING SHIPPED CODE. A silent `catch {}` leaves the label reading
  // "Copiar markdown…" forever, which is indistinguishable from not having clicked — and the reader
  // pastes nothing and blames their notes app.
  it('says so, visibly, when the clipboard write is rejected', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/x" body="Corpo." />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    fireEvent.click(screen.getByRole('button', { name: COPY_MD_PT }));
    expect(await screen.findByText('Não foi possível copiar')).toBeInTheDocument();
    expect(screen.queryByText('Copiado')).toBeNull();
  });

  // The other rejection shape, and it is not the same code path: on a non-secure origin `navigator.clipboard`
  // is UNDEFINED, so the call throws a synchronous TypeError rather than returning a rejected promise. A
  // `catch` that only handles the async form leaves this one as an unhandled throw in the click handler.
  it('survives a browser with no clipboard API at all, and still says so', async () => {
    vi.stubGlobal('navigator', {});
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/x" body="Corpo." />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    fireEvent.click(screen.getByRole('button', { name: COPY_MD_PT }));
    expect(await screen.findByText('Não foi possível copiar')).toBeInTheDocument();
  });

  it('reports a failed LINK copy too — the state is per control, and both were silent before', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('blocked'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderWithLocale(<ShareButton title="Hello" url="/pt/blog/x" body="Corpo." />, { locale: 'pt' });
    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    fireEvent.click(screen.getByRole('button', { name: COPY_LINK_PT }));
    expect(await screen.findByText('Não foi possível copiar')).toBeInTheDocument();
  });

  // The focus trap enumerates its controls live rather than caching them (see ShareModal), so a fifth row
  // is picked up for free — "for free" being a claim, which is why it is checked.
  it('keeps the focus trap enumerating every control, the fifth included', () => {
    openWith({ body: 'Corpo.' });
    const dialog = screen.getByRole('dialog');
    const items = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
    // close · WhatsApp · X · LinkedIn · copy link · copy markdown
    expect(items).toHaveLength(6);
    expect(items[items.length - 1]).toHaveAccessibleName(COPY_MD_PT);
    items[items.length - 1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(items[0]);
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
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: COPY_LINK_PT })).toBeInTheDocument();
    modal.unmount();

    renderWithLocale(<ShareLinks title="Hello" path="/pt/blog/x" />, { locale: 'pt' });
    expect(within(screen.getByRole('navigation')).getByRole('button', { name: COPY_LINK_PT })).toBeInTheDocument();
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
