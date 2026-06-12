import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInstallPrompt } from './useInstallPrompt';

function memoryStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => void (store[k] = String(v)),
    removeItem: (k: string) => void delete store[k],
    clear: () => void (store = {}),
  } as Storage;
}
const setStandalone = (v: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: v }) as unknown as typeof window.matchMedia;
};
const setUA = (ua: string) => Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
const setTouch = (n: number) => Object.defineProperty(navigator, 'maxTouchPoints', { value: n, configurable: true });

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
};

const fireBeforeInstall = () => {
  const evt = new Event('beforeinstallprompt') as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
  evt.prompt = vi.fn().mockResolvedValue(undefined);
  evt.userChoice = Promise.resolve({ outcome: 'accepted' });
  act(() => void window.dispatchEvent(evt));
  return evt;
};

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  setStandalone(false);
  setTouch(0);
  setUA(UA.chrome);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useInstallPrompt — detection per user-agent', () => {
  it('shows nothing when already installed (standalone)', () => {
    setStandalone(true);
    expect(renderHook(() => useInstallPrompt()).result.current.mode).toBeNull();
  });

  it('iPhone Safari → manual / ios', () => {
    setUA(UA.iphone);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('manual');
    expect(result.current.platform).toBe('ios');
  });

  it('iPadOS (reports as Macintosh but is touch) → ios', () => {
    setUA(UA.ipad);
    setTouch(5);
    expect(renderHook(() => useInstallPrompt()).result.current.platform).toBe('ios');
  });

  it('macOS Safari (no touch) → manual / macos-safari', () => {
    setUA(UA.macSafari);
    expect(renderHook(() => useInstallPrompt()).result.current.platform).toBe('macos-safari');
  });

  it('Firefox → manual / firefox', () => {
    setUA(UA.firefox);
    expect(renderHook(() => useInstallPrompt()).result.current.platform).toBe('firefox');
  });

  it('Chromium with no event yet → null (the button shows when eligible)', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBeNull();
  });

  it('shows the install button after beforeinstallprompt fires', () => {
    const { result } = renderHook(() => useInstallPrompt());
    fireBeforeInstall();
    expect(result.current.mode).toBe('button');
  });

  it('promptInstall triggers the stashed prompt and consumes it', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const evt = fireBeforeInstall();
    await act(async () => result.current.promptInstall());
    expect(evt.prompt).toHaveBeenCalled();
    expect(result.current.mode).toBeNull(); // one-shot; chrome UA → no manual fallback
  });

  it('dismiss hides it and remembers the choice', () => {
    setUA(UA.iphone);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('manual');
    act(() => result.current.dismiss());
    expect(result.current.mode).toBeNull();
    expect(localStorage.getItem('pwa-install-dismissed')).toBe('1');
  });

  it('stays hidden when previously dismissed', () => {
    setUA(UA.iphone);
    localStorage.setItem('pwa-install-dismissed', '1');
    expect(renderHook(() => useInstallPrompt()).result.current.mode).toBeNull();
  });
});
