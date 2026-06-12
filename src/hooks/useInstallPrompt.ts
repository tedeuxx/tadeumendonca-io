// Add-to-home-screen helper (/frontend/state). Decides what install affordance to show, if any:
//   - 'button' — Chromium fired `beforeinstallprompt` (Android/desktop); we can trigger a real prompt.
//   - 'ios'    — iOS Safari has no install API, so show the manual Share → "Add to Home Screen" hint.
//   - null     — already installed (standalone), dismissed, or a browser with no install path.
// Dismissal is remembered in localStorage so the hint doesn't nag.
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'pwa-install-dismissed';

const isStandalone = (): boolean => {
  try {
    return (
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
};
const isIOS = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent);
const readDismissed = (): boolean => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

export type InstallMode = 'button' | 'ios' | null;

export function useInstallPrompt(): { mode: InstallMode; promptInstall: () => Promise<void>; dismiss: () => void } {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // stash it so we can trigger the prompt from our own button
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode / disabled storage — best-effort */
    }
  };

  const promptInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null); // a prompt can only be used once
  };

  const mode: InstallMode = installed || dismissed ? null : deferred ? 'button' : isIOS() ? 'ios' : null;
  return { mode, promptInstall, dismiss };
}
