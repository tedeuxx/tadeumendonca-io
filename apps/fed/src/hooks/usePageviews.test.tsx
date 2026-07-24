import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { usePageviews } from './usePageviews';
import { loadAnalytics, resetAnalyticsForTest } from '../lib/analytics';

const ID = 'G-TEST12345';

function Nav() {
  usePageviews();
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate('/blog/x')}>
      go
    </button>
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

describe('usePageviews', () => {
  it('sends a page_view on route change once analytics has loaded', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', ID);
    loadAnalytics();
    const pushed: unknown[][] = [];
    window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Nav />
      </MemoryRouter>,
    );

    // Mount does not double-count (config already sent the initial page_view).
    expect(pushed).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'go' }));
    expect(pushed).toContainEqual(['event', 'page_view', { page_path: '/blog/x' }]);
  });

  it('does not send anything before consent has loaded analytics', () => {
    const pushed: unknown[][] = [];
    window.gtag = ((...args: unknown[]) => pushed.push(args)) as typeof window.gtag;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Nav />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'go' }));
    expect(pushed).toHaveLength(0);
  });
});
