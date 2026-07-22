// The site used to ship an offline-first PWA. The service worker was retired with the PWA, but a
// registration already installed in a returning visitor's browser outlives the deploy and would keep
// serving the precached (old) app shell. This shim unregisters any leftover worker and drops its
// caches on the next visit. Safe to delete once the retired SW can no longer be in the wild.
export async function unregisterServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    if ('caches' in globalThis) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // Best-effort cleanup: a browser that refuses either API just keeps the stale worker.
  }
}
