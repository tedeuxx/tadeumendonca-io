import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConsentProvider, useConsent } from './consent';
import { CONSENT_KEY, resetAnalyticsForTest } from './analytics';

const ID = 'G-TEST12345';

function Harness() {
  const { status, accept, reject, reopen } = useConsent();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <button type="button" onClick={accept}>
        accept
      </button>
      <button type="button" onClick={reject}>
        reject
      </button>
      <button type="button" onClick={reopen}>
        reopen
      </button>
    </div>
  );
}

function renderHarness() {
  return render(
    <ConsentProvider>
      <Harness />
    </ConsentProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.head.querySelectorAll('script').forEach((s) => s.remove());
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTest();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('ConsentProvider', () => {
  it('starts undecided with no stored choice', () => {
    renderHarness();
    expect(screen.getByTestId('status')).toHaveTextContent('undecided');
  });

  it('accept records granted', () => {
    renderHarness();
    fireEvent.click(screen.getByRole('button', { name: 'accept' }));
    expect(screen.getByTestId('status')).toHaveTextContent('granted');
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('granted');
  });

  it('reject records denied', () => {
    renderHarness();
    fireEvent.click(screen.getByRole('button', { name: 'reject' }));
    expect(screen.getByTestId('status')).toHaveTextContent('denied');
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('denied');
  });

  it('reopen clears the stored choice and returns to undecided (withdrawal)', () => {
    window.localStorage.setItem(CONSENT_KEY, 'granted');
    renderHarness();
    fireEvent.click(screen.getByRole('button', { name: 'reopen' }));
    expect(screen.getByTestId('status')).toHaveTextContent('undecided');
    expect(window.localStorage.getItem(CONSENT_KEY)).toBeNull();
  });

  it('hydrates status from a stored choice', () => {
    window.localStorage.setItem(CONSENT_KEY, 'denied');
    renderHarness();
    expect(screen.getByTestId('status')).toHaveTextContent('denied');
  });
});
