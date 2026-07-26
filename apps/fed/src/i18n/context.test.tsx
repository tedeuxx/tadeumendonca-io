import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { LocaleProvider, useLocale, useLocalePath, useT } from './context';
import { STORAGE_KEY } from './config';

function Probe() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const lp = useLocalePath();
  const { pathname } = useLocation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="label">{t('nav.articles')}</span>
      <span data-testid="path">{pathname}</span>
      <span data-testid="lp">{lp('/me')}</span>
      <button onClick={() => setLocale('en')}>to-en</button>
      <button onClick={() => setLocale('pt')}>to-pt</button>
    </div>
  );
}

const renderAt = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocaleProvider>
        <Probe />
      </LocaleProvider>
    </MemoryRouter>,
  );

describe('LocaleProvider', () => {
  beforeEach(() => window.localStorage.removeItem(STORAGE_KEY));
  afterEach(() => vi.unstubAllGlobals());

  it('reads the active locale from the URL path and translates', () => {
    renderAt('/pt/me');
    expect(screen.getByTestId('locale')).toHaveTextContent('pt');
    expect(screen.getByTestId('label')).toHaveTextContent('Artigos');
    // A path localizer is bound to the active locale.
    expect(screen.getByTestId('lp')).toHaveTextContent('/pt/me');
  });

  it('reads en from an /en path', () => {
    renderAt('/en/portfolio');
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('label')).toHaveTextContent('Articles');
  });

  it('sets <html lang> from the path locale and updates it when the path changes on toggle', () => {
    renderAt('/pt');
    expect(document.documentElement.lang).toBe('pt-BR');
    fireEvent.click(screen.getByText('to-en'));
    expect(document.documentElement.lang).toBe('en');
  });

  // The toggle NAVIGATES to the other prefix preserving the sub-path, AND persists the choice.
  it('the toggle navigates to the other prefix (preserving the sub-path) and persists', () => {
    renderAt('/pt/me');
    fireEvent.click(screen.getByText('to-en'));
    expect(screen.getByTestId('path')).toHaveTextContent('/en/me');
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('label')).toHaveTextContent('Articles');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('the toggle maps the bare locale root to the other bare root', () => {
    renderAt('/en');
    fireEvent.click(screen.getByText('to-pt'));
    expect(screen.getByTestId('path')).toHaveTextContent('/pt');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('pt');
  });

  it('a consumer without a provider falls back to the en default and its setLocale is a no-op', () => {
    render(
      <MemoryRouter initialEntries={['/en']}>
        <Probe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('label')).toHaveTextContent('Articles');
    fireEvent.click(screen.getByText('to-pt')); // no provider to update — must not throw
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
  });
});
