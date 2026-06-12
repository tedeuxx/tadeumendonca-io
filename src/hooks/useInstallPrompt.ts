// Add-to-home-screen helper (/frontend/state). Decides what install affordance to show, if any:
//   - 'button' — Chromium fired `beforeinstallprompt` (Android/desktop Chrome, Edge, …); one tap installs.
//   - 'manual' — a browser with no install API; show steps tailored to the detected platform (iOS Safari,
//                macOS Safari, Firefox), since each has a different manual flow.
//   - null     — already installed (standalone), dismissed, or a browser with no manual path worth showing
//                (a Chromium that simply hasn't fired the event yet — the button will appear when eligible).
// Dismissal is remembered in localStorage so the hint doesn't nag.
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'pwa-install-dismissed';

// Platforms with a distinct MANUAL install flow (no beforeinstallprompt).
export type InstallPlatform = 'ios' | 'macos-safari' | 'firefox';
export type InstallMode = 'button' | 'manual' | null;

const ua = (): string => navigator.userAgent || '';
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
// iPadOS Safari reports as "Macintosh" but is touch — treat it as iOS.
const isIOS = (): boolean => /iphone|ipad|ipod/i.test(ua()) || (/macintosh/i.test(ua()) && (navigator.maxTouchPoints ?? 0) > 1);
const isFirefox = (): boolean => /firefox|fxios/i.test(ua());
const isSafari = (): boolean => /safari/i.test(ua()) && !/chrome|crios|chromium|android|edg|fxios|opr/i.test(ua());
const isMac = (): boolean => /macintosh|mac os x/i.test(ua());

// The manual platform, or null when there's no tailored manual flow (e.g. a Chromium awaiting the event).
function detectManualPlatform(): InstallPlatform | null {
  if (isIOS()) return 'ios';
  if (isMac() && isSafari()) return 'macos-safari';
  if (isFirefox()) return 'firefox';
  return null;
}

const readDismissed = (): boolean => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

export function useInstallPrompt(): {
  mode: InstallMode;
  platform: InstallPlatform | null;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
} {
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

  const platform = detectManualPlatform();
  const mode: InstallMode = installed || dismissed ? null : deferred ? 'button' : platform ? 'manual' : null;
  return { mode, platform, promptInstall, dismiss };
}
