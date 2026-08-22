import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useScrollToTop } from './useScrollToTop';

// jsdom has no layout, so `window.scrollTo` is a "not implemented" stub and `scrollIntoView` is
// undefined on the element prototype. Both are spied rather than driven: what this hook decides is
// WHICH call to make, and that decision is the whole of its behaviour.
let scrollTo: ReturnType<typeof vi.fn>;
let scrollIntoView: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scrollTo = vi.fn();
  scrollIntoView = vi.fn();
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  Element.prototype.scrollIntoView = scrollIntoView as unknown as typeof Element.prototype.scrollIntoView;
  document.body.innerHTML = '';
});

// A harness that both mounts the hook and exposes the navigations the journeys need. `renders`
// counts commits so the "does not fire on a re-render" case can prove the component really
// re-rendered without navigating.
function Harness({ onRender }: { onRender?: () => void } = {}) {
  useScrollToTop();
  const navigate = useNavigate();
  onRender?.();
  return (
    <>
      <button type="button" onClick={() => navigate('/pt/blog/some-article')}>
        push
      </button>
      <button type="button" onClick={() => navigate('/pt/', { replace: true })}>
        replace
      </button>
      <button type="button" onClick={() => navigate('/pt/#artigos')}>
        push-hash
      </button>
      <button type="button" onClick={() => navigate('/pt/#nothing-here')}>
        push-missing-hash
      </button>
      <button type="button" onClick={() => navigate('/pt/#se%C3%A7%C3%A3o')}>
        push-encoded-hash
      </button>
      <button type="button" onClick={() => navigate('/pt/#%zz')}>
        push-malformed-hash
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        back
      </button>
    </>
  );
}

function mount(initialEntries: string[] = ['/pt/'], onRender?: () => void) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Harness onRender={onRender} />
    </MemoryRouter>,
  );
}

describe('useScrollToTop', () => {
  it('scrolls to the top on a PUSH navigation — the reported defect', () => {
    mount();
    // The initial entry is a POP, so mounting must not scroll: this is the hydration case, where a
    // reader arriving straight at an article URL would otherwise see a jump on first paint.
    expect(scrollTo).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'push' }));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  // `behavior: 'instant'` is not decorative. styles/index.css sets `html { scroll-behavior: smooth }`
  // for the landing anchors, and the default 'auto' RESOLVES to that — so dropping the option makes
  // every route change animate the page upward instead of arriving at the top.
  it('scrolls instantly, overriding the smooth CSS scroll-behavior', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'push' }));
    expect(scrollTo.mock.calls[0][0]).toMatchObject({ behavior: 'instant' });
  });

  it('scrolls to the top on a REPLACE navigation', () => {
    mount(['/pt/blog/x']);
    fireEvent.click(screen.getByRole('button', { name: 'replace' }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('leaves a POP navigation alone so the back button restores the reader position', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'push' }));
    expect(scrollTo).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'back' }));
    });

    // Still one — the back navigation added no scroll of its own. If this hook scrolled on POP, a
    // reader returning from an article would be thrown to the top of the list they had scrolled.
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('scrolls to the hash target instead of the top, so /blog → /#artigos still lands on the section', () => {
    const section = document.createElement('section');
    section.id = 'artigos';
    document.body.appendChild(section);

    mount();
    fireEvent.click(screen.getByRole('button', { name: 'push-hash' }));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(section);
    // And crucially NOT to the top — that is the regression a blanket scroll-to-top would introduce.
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('falls through to the top when the hash names nothing on the page', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'push-missing-hash' }));

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('decodes a percent-encoded hash before looking the element up', () => {
    const section = document.createElement('section');
    section.id = 'seção'; // the id is literal; the URL spells it %C3%A7 / %C3%A3
    document.body.appendChild(section);

    mount();
    fireEvent.click(screen.getByRole('button', { name: 'push-encoded-hash' }));

    expect(scrollIntoView.mock.instances[0]).toBe(section);
  });

  // `decodeURIComponent` throws a URIError on a malformed sequence, and an exception raised inside an
  // effect unmounts the tree — the whole app, not just the scroll. Reachable because `RootRedirect`
  // copies the address bar's hash verbatim onto its <Navigate>.
  it('survives a malformed percent-sequence in the hash instead of taking the app down', () => {
    mount();

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'push-malformed-hash' }))).not.toThrow();
    // And it still does the sensible thing: no element by that name, so show the page from the top.
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('does not scroll on a re-render that navigated nowhere', () => {
    let renders = 0;
    const { rerender } = mount(['/pt/'], () => {
      renders += 1;
    });
    fireEvent.click(screen.getByRole('button', { name: 'push' }));
    expect(scrollTo).toHaveBeenCalledTimes(1);

    const before = renders;
    rerender(
      <MemoryRouter initialEntries={['/pt/']}>
        <Harness
          onRender={() => {
            renders += 1;
          }}
        />
      </MemoryRouter>,
    );
    // The component really did commit again — otherwise the assertion below passes for the wrong
    // reason, which is the failure mode this repo keeps finding.
    expect(renders).toBeGreaterThan(before);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
