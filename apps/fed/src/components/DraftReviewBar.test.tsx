import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { DraftReviewBar, contentIssueUrl } from './DraftReviewBar';
import { renderWithLocale } from '../test-utils';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// #506 — the two review affordances.
//
// WHAT EACH TEST HERE CAN AND CANNOT SEE, said once rather than per case. jsdom has no clipboard: the
// stub below is what `writeText` was CALLED WITH, which is the payload under test and not the clipboard.
// A permissions failure, a non-secure origin or a lost user activation is invisible to this file — the
// first two are covered by the failure cases at the bottom (which stub the failure rather than provoke
// it), and the Safari user-activation rule is argued in `useCopyToClipboard` and covered by NO test in
// this repo, because the project matrix is Chromium-only. Stated rather than implied.
//
// The labels are held as constants and asserted through `getByRole({ name })`, which matches the WHOLE
// accessible name here — so the short visible label and the long accessible one genuinely exclude each
// other, and a test that re-typed a string would keep passing against the label it replaced.
const OPEN_ISSUE_PT = 'Abrir a issue deste artigo no GitHub';
const OPEN_ISSUE_EN = 'Open the issue for this article on GitHub';
const COPY_PT = 'Copiar o texto do artigo';
const COPY_EN = 'Copy the article text';

const BODY = 'Um parágrafo.\n\nE um link para a [Biblioteca](/library).';

const renderBar = (
  props: Partial<Parameters<typeof DraftReviewBar>[0]> = {},
  locale: 'pt' | 'en' = 'pt',
) => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  renderWithLocale(
    <DraftReviewBar
      title="Hello"
      path={`/${locale}/blog/meu-compromisso`}
      body={BODY}
      contentIssue={506}
      {...props}
    />,
    { locale },
  );
  return writeText;
};

describe('the issue button', () => {
  it('points at the article’s own content Issue, on GitHub, in a new tab', () => {
    renderBar();
    const link = screen.getByRole('link', { name: OPEN_ISSUE_PT });
    // Built rather than re-typed: the assertion is that the component uses THE builder, so a change to
    // the URL shape fails in one place instead of leaving a test pinning the old shape.
    expect(link).toHaveAttribute('href', contentIssueUrl(506));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  // The builder itself, asserted literally ONCE — otherwise every assertion above is `f(x) === f(x)`,
  // which is true for a builder that returns the empty string.
  //
  // 4242 AND NOT 506, and the difference is the whole value of this line. Written with 506 — the number
  // every other case here uses — it stayed GREEN under a builder mutated to ignore its argument and
  // return `/issues/506`, because the literal and the hardcode were the same string. Caught by running
  // that mutation rather than by reading the test. A literal assertion has to use a value the rest of
  // the suite does not, or it pins the shape and not the substitution.
  it('builds the tracker URL from the number', () => {
    expect(contentIssueUrl(4242)).toBe('https://github.com/tedeuxx/tadeumendonca-io/issues/4242');
  });

  // THE DEGRADATION, and it is the half worth testing hardest: a button that opened the wrong Issue —
  // or the tracker's front page — is worse than no button, because it looks like it worked. Every
  // article authored before #506 hits this branch.
  it('is ABSENT entirely when the article names no Issue', () => {
    renderBar({ contentIssue: undefined });
    expect(screen.queryByRole('link')).toBeNull();
    // The control: the OTHER affordance is unaffected, so "absent" here is about the Issue button and
    // not about the bar having failed to render at all.
    expect(screen.getByRole('button', { name: COPY_PT })).toBeInTheDocument();
  });

  it('names itself in English when the locale is en, and keeps the short label inside the long one', () => {
    renderBar({}, 'en');
    const link = screen.getByRole('link', { name: OPEN_ISSUE_EN });
    // WCAG 2.5.3 (Label in Name): the accessible name must CONTAIN the visible label. Asserted as the
    // containment rather than as two remembered strings, so a reword of either that breaks it goes red.
    expect(OPEN_ISSUE_EN).toContain(link.textContent!.trim());
  });

  it('keeps the pt containment too — the locale that gets the label wrong is the one nobody rereads', () => {
    renderBar();
    const link = screen.getByRole('link', { name: OPEN_ISSUE_PT });
    expect(OPEN_ISSUE_PT).toContain(link.textContent!.trim());
  });
});

describe('the copy button', () => {
  it('writes the whole article — title, citation, absolutized links', async () => {
    const writeText = renderBar();
    fireEvent.click(screen.getByRole('button', { name: COPY_PT }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const payload = writeText.mock.calls[0][0] as string;
    expect(payload).toMatch(/^# Hello\n/);
    expect(payload).toContain('Um parágrafo.');
    // The payload builder is `markdownPayload`, shared with the share modal — this is what says so.
    expect(payload).toContain('[Biblioteca](https://tadeumendonca.io/pt/library)');
  });

  // THE CITATION CARRIES `?preview`, and this is the seam `preview.ts` documented itself for. Without it
  // the link in the pasted text redirects the reviewer to the locale home — the article reading as
  // having disappeared, from inside the review he is writing about it.
  it('cites the article at a URL that still opens it while it is held', async () => {
    const writeText = renderBar();
    fireEvent.click(screen.getByRole('button', { name: COPY_PT }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain(
      'https://tadeumendonca.io/pt/blog/meu-compromisso?preview',
    );
  });

  // Copy, NEVER a prefilled URL — the decision constraint 2 of the Issue exists for. A `?body=` would
  // become a URL, browsers and servers cut around 8 KB, and his articles run 6–12 KB: it would work on
  // the short pieces and truncate the long ones silently. This asserts the whole body reaches the
  // clipboard for a payload comfortably past that ceiling.
  it('copies a 12 KB body whole — the ceiling a prefilled URL would have hit', async () => {
    const long = 'a'.repeat(12_000);
    const writeText = renderBar({ body: long });
    fireEvent.click(screen.getByRole('button', { name: COPY_PT }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const payload = writeText.mock.calls[0][0] as string;
    expect(payload).toContain(long);
    expect(payload.length).toBeGreaterThan(12_000);
  });

  it('confirms in the active locale', async () => {
    renderBar({}, 'en');
    fireEvent.click(screen.getByRole('button', { name: COPY_EN }));
    expect(await screen.findByText('Copied')).toBeInTheDocument();
  });

  // THE FAILURE MUST BE VISIBLE. A copy that silently does nothing on a tablet is the same class of
  // defect as the truncating URL the clipboard was chosen to avoid — the reviewer pastes nothing and
  // blames his notes app. Two rejection shapes, two tests, because they are NOT the same code path.
  it('says so when the clipboard write is rejected', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderWithLocale(<DraftReviewBar title="Hello" path="/pt/blog/x" body={BODY} contentIssue={506} />, {
      locale: 'pt',
    });
    fireEvent.click(screen.getByRole('button', { name: COPY_PT }));
    expect(await screen.findByText('Não foi possível copiar')).toBeInTheDocument();
    expect(screen.queryByText('Copiado')).toBeNull();
  });

  // On a non-secure origin `navigator.clipboard` is UNDEFINED, so the call throws a synchronous
  // TypeError rather than returning a rejected promise. A `catch` handling only the async form leaves
  // this as an unhandled throw in the click handler and the label never changes.
  it('survives a browser with no clipboard API at all, and still says so', async () => {
    vi.stubGlobal('navigator', {});
    renderWithLocale(<DraftReviewBar title="Hello" path="/pt/blog/x" body={BODY} contentIssue={506} />, {
      locale: 'pt',
    });
    fireEvent.click(screen.getByRole('button', { name: COPY_PT }));
    expect(await screen.findByText('Não foi possível copiar')).toBeInTheDocument();
  });
});

describe('the bar itself', () => {
  it('is a named group holding exactly the two affordances and nothing else', () => {
    renderBar();
    const group = screen.getByRole('group', { name: 'Revisão do artigo' });
    expect(within(group).getAllByRole('link')).toHaveLength(1);
    expect(within(group).getAllByRole('button')).toHaveLength(1);
  });
});
