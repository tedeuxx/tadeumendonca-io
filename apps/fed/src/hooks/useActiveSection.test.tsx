import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveSection } from './useActiveSection';

type Cb = (entries: { isIntersecting: boolean; target: { id: string }; boundingClientRect: { top: number } }[]) => void;

const observed: string[] = [];
let fire: Cb;
const disconnect = vi.fn();

class FakeObserver {
  constructor(cb: Cb) {
    fire = cb;
  }
  observe(el: HTMLElement) {
    observed.push(el.id);
  }
  disconnect = disconnect;
}

const entry = (id: string, top: number, isIntersecting = true) => ({
  isIntersecting,
  target: { id },
  boundingClientRect: { top },
});

beforeEach(() => {
  observed.length = 0;
  disconnect.mockClear();
  document.body.innerHTML = '<section id="artigos"></section><section id="portfolio"></section>';
  vi.stubGlobal('IntersectionObserver', FakeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('useActiveSection', () => {
  it('observes every section that exists in the document', () => {
    renderHook(() => useActiveSection(['artigos', 'portfolio', 'missing']));
    expect(observed).toEqual(['artigos', 'portfolio']);
  });

  it('marks the topmost visible section', () => {
    const { result } = renderHook(() => useActiveSection(['artigos', 'portfolio']));
    expect(result.current).toBeNull();

    act(() => fire([entry('portfolio', 300), entry('artigos', 40)]));
    expect(result.current).toBe('artigos');

    act(() => fire([entry('portfolio', 10)]));
    expect(result.current).toBe('portfolio');
  });

  it('keeps the last section while nothing is intersecting', () => {
    const { result } = renderHook(() => useActiveSection(['artigos', 'portfolio']));
    act(() => fire([entry('artigos', 40)]));
    act(() => fire([entry('artigos', -900, false)]));
    expect(result.current).toBe('artigos');
  });

  it('stays inert when disabled, and disconnects on unmount', () => {
    const { result, unmount } = renderHook(() => useActiveSection(['artigos'], false));
    expect(result.current).toBeNull();
    expect(observed).toEqual([]);
    unmount();

    const live = renderHook(() => useActiveSection(['artigos']));
    live.unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('degrades to null when the browser has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { result } = renderHook(() => useActiveSection(['artigos']));
    expect(result.current).toBeNull();
  });
});
