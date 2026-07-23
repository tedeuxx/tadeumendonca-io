import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocaleProvider, useLocale, useT } from './context';
import { STORAGE_KEY } from './config';

function Probe() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="label">{t('nav.articles')}</span>
      <button onClick={() => setLocale('en')}>to-en</button>
      <button onClick={() => setLocale('pt')}>to-pt</button>
    </div>
  );
}

describe('LocaleProvider', () => {
  beforeEach(() => window.localStorage.removeItem(STORAGE_KEY));
  afterEach(() => vi.unstubAllGlobals());

  it('renders in the initial locale and translates', () => {
    render(
      <LocaleProvider initialLocale="pt">
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('pt');
    expect(screen.getByTestId('label')).toHaveTextContent('Artigos');
  });

  it('sets <html lang> from the active locale and updates it on switch', () => {
    render(
      <LocaleProvider initialLocale="pt">
        <Probe />
      </LocaleProvider>,
    );
    expect(document.documentElement.lang).toBe('pt-BR');
    fireEvent.click(screen.getByText('to-en'));
    expect(document.documentElement.lang).toBe('en');
  });

  it('setLocale switches the tree and persists the override', () => {
    render(
      <LocaleProvider initialLocale="pt">
        <Probe />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByText('to-en'));
    expect(screen.getByTestId('label')).toHaveTextContent('Articles');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('defaults to browser detection when no initialLocale is given', () => {
    vi.stubGlobal('navigator', { language: 'pt-BR' });
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('pt');
  });

  it('a consumer without a provider falls back to the en default and its setLocale is a no-op', () => {
    render(<Probe />);
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('label')).toHaveTextContent('Articles');
    fireEvent.click(screen.getByText('to-pt')); // no provider to update — must not throw
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
  });
});
