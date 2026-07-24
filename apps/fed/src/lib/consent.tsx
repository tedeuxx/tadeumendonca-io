// Consent state shared by the banner (which asks) and the footer control (which lets the reader change
// their mind). Kept in one provider so "withdraw" is as reachable as "grant" — a requirement of a
// consent model meant to hold in every geography, not only where a banner is legally forced.
//
// The gate is hard: analytics loads ONLY on an explicit grant (see lib/analytics). A returning reader
// who already granted has gtag loaded on mount; anyone else has nothing third-party until they Accept.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadAnalytics, readConsent, storeConsent, clearConsent, type ConsentChoice } from './analytics';

type ConsentStatus = 'undecided' | ConsentChoice;

interface ConsentContextValue {
  /** 'undecided' → the banner is shown; 'granted'/'denied' → a choice is recorded. */
  status: ConsentStatus;
  /** Grant: persist, load GA, hide the banner. */
  accept: () => void;
  /** Decline: persist the refusal, hide the banner, load nothing. */
  reject: () => void;
  /** Re-open the banner to change a prior choice (the footer "cookies" control). */
  reopen: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  status: 'denied',
  accept: () => {},
  reject: () => {},
  reopen: () => {},
});

export function ConsentProvider({ children }: { children: ReactNode }) {
  // Initialise from storage: a prior choice skips the banner; no choice shows it.
  const [status, setStatus] = useState<ConsentStatus>(() => readConsent() ?? 'undecided');

  // A returning reader who already granted gets analytics on mount — no second click needed.
  useEffect(() => {
    if (readConsent() === 'granted') loadAnalytics();
  }, []);

  const accept = useCallback(() => {
    storeConsent('granted');
    loadAnalytics();
    setStatus('granted');
  }, []);

  const reject = useCallback(() => {
    storeConsent('denied');
    setStatus('denied');
  }, []);

  // Forget the stored choice and show the banner again. Analytics already loaded this session stays
  // loaded until the next full load (gtag cannot be un-injected); the reader's NEW choice is what
  // persists and governs the next visit.
  const reopen = useCallback(() => {
    clearConsent();
    setStatus('undecided');
  }, []);

  const value = useMemo<ConsentContextValue>(() => ({ status, accept, reject, reopen }), [status, accept, reject, reopen]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  return useContext(ConsentContext);
}
