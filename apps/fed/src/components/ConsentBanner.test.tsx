import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ConsentBanner } from './ConsentBanner';
import { ConsentProvider } from '../lib/consent';
import { CONSENT_KEY, resetAnalyticsForTest } from '../lib/analytics';
import { renderWithLocale } from '../test-utils';

const ID = 'G-TEST12345';

function gaScripts() {
  return Array.from(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]'));
}

function renderBanner() {
  return renderWithLocale(
    <ConsentProvider>
      <ConsentBanner />
    </ConsentProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.head.querySelectorAll('script').forEach((s) => s.remove());
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTest();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('ConsentBanner', () => {
  it('does not render when analytics is unconfigured', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    renderBanner();
    expect(screen.queryByText(/Google Analytics/)).not.toBeInTheDocument();
  });

  it('shows the notice with equal-weight Accept and Decline when undecided', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    renderBanner();
    expect(screen.getByText(/Google Analytics/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceitar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recusar' })).toBeInTheDocument();
  });

  it('loads nothing before a choice is made', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    renderBanner();
    expect(gaScripts()).toHaveLength(0);
  });

  it('on Decline: hides the banner, records the refusal, injects no script', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(screen.queryByText(/Google Analytics/)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('denied');
    expect(gaScripts()).toHaveLength(0);
  });

  it('on Accept: hides the banner, records consent, injects gtag.js', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
    expect(screen.queryByText(/Google Analytics/)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('granted');
    expect(gaScripts()).toHaveLength(1);
  });

  it('does not show again once a choice is stored', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    window.localStorage.setItem(CONSENT_KEY, 'denied');
    renderBanner();
    expect(screen.queryByText(/Google Analytics/)).not.toBeInTheDocument();
  });

  it('loads analytics on mount for a returning reader who already granted', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    window.localStorage.setItem(CONSENT_KEY, 'granted');
    renderBanner();
    expect(gaScripts()).toHaveLength(1);
  });
});
