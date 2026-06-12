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
  setUA('Mozilla/5.0 (Windows NT 10.0) Chrome/120');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useInstallPrompt', () => {
  it('shows nothing when already installed (standalone)', () => {
    setStandalone(true);
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBeNull();
  });

  it('shows the iOS hint on iOS when not installed', () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Safari');
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('ios');
  });

  it('shows the install button after beforeinstallprompt fires (Chromium)', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBeNull(); // non-iOS, no event yet
    fireBeforeInstall();
    expect(result.current.mode).toBe('button');
  });

  it('promptInstall triggers the stashed prompt and consumes it', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const evt = fireBeforeInstall();
    await act(async () => result.current.promptInstall());
    expect(evt.prompt).toHaveBeenCalled();
    expect(result.current.mode).toBeNull(); // one-shot: deferred cleared, non-iOS → null
  });

  it('dismiss hides it and remembers the choice', () => {
    setUA('iPhone');
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBe('ios');
    act(() => result.current.dismiss());
    expect(result.current.mode).toBeNull();
    expect(localStorage.getItem('pwa-install-dismissed')).toBe('1');
  });

  it('stays hidden when previously dismissed', () => {
    setUA('iPhone');
    localStorage.setItem('pwa-install-dismissed', '1');
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.mode).toBeNull();
  });
});
