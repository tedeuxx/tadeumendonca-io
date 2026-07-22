import { describe, it, expect, vi, afterEach } from 'vitest';
import { unregisterServiceWorkers } from './serviceWorker';

const setNavigator = (value: unknown) => {
  if (value === undefined) {
    // @ts-expect-error — deleting an optional browser API for the no-support path.
    delete navigator.serviceWorker;
  } else {
    Object.defineProperty(navigator, 'serviceWorker', { value, configurable: true, writable: true });
  }
};

afterEach(() => {
  setNavigator(undefined);
  // @ts-expect-error — caches is not part of jsdom; the tests install it per case.
  delete globalThis.caches;
});

describe('unregisterServiceWorkers', () => {
  it('does nothing when the browser has no service worker support', async () => {
    await expect(unregisterServiceWorkers()).resolves.toBeUndefined();
  });

  it('unregisters every leftover registration and drops its caches', async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    setNavigator({ getRegistrations: vi.fn().mockResolvedValue([{ unregister }, { unregister }]) });
    const cacheDelete = vi.fn().mockResolvedValue(true);
    Object.defineProperty(globalThis, 'caches', {
      value: { keys: vi.fn().mockResolvedValue(['workbox-precache', 'assets']), delete: cacheDelete },
      configurable: true,
    });

    await unregisterServiceWorkers();

    expect(unregister).toHaveBeenCalledTimes(2);
    expect(cacheDelete).toHaveBeenCalledWith('workbox-precache');
    expect(cacheDelete).toHaveBeenCalledWith('assets');
  });

  it('swallows a browser that refuses the API', async () => {
    setNavigator({ getRegistrations: vi.fn().mockRejectedValue(new Error('denied')) });
    await expect(unregisterServiceWorkers()).resolves.toBeUndefined();
  });
});
