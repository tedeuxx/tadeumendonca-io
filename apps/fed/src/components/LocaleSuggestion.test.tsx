import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { LocaleSuggestion } from './LocaleSuggestion';
import { SUGGESTION_DISMISSED_KEY } from '../lib/localeSuggestion';
import { STORAGE_KEY } from '../i18n/config';
import { renderWithLocale } from '../test-utils';

// The visitor's own language is the input that decides everything here, and jsdom's navigator.language
// is read-only — so it is stubbed per test rather than assumed.
const withBrowserLanguage = (language: string) =>
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(language);

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('LocaleSuggestion', () => {
  it('offers the visitor language when the URL pins the other one', () => {
    withBrowserLanguage('pt-BR');
    renderWithLocale(<LocaleSuggestion />, { locale: 'en' });
    expect(screen.getByRole('region', { name: 'Sugestão de idioma' })).toBeInTheDocument();
    expect(screen.getByText(/Prefere ler em português/)).toBeInTheDocument();
  });

  // The copy is addressed to someone who may not read the page's language at all, so it is written in the
  // SUGGESTED one — and the region carries its own lang, or a screen reader uses the page's voice for it.
  it('renders the offer in the suggested language, with a matching lang attribute', () => {
    withBrowserLanguage('en-US');
    renderWithLocale(<LocaleSuggestion />, { locale: 'pt' });
    const region = screen.getByRole('region', { name: 'Language suggestion' });
    expect(region).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('button', { name: 'Read in English' })).toBeInTheDocument();
  });

  it('stays silent when the page is already in the visitor language', () => {
    withBrowserLanguage('pt-BR');
    renderWithLocale(<LocaleSuggestion />, { locale: 'pt' });
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('stays silent when the reader explicitly chose the locale the URL pins', () => {
    withBrowserLanguage('pt-BR');
    window.localStorage.setItem(STORAGE_KEY, 'en');
    renderWithLocale(<LocaleSuggestion />, { locale: 'en' });
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('stays silent when the offer was already dismissed', () => {
    withBrowserLanguage('pt-BR');
    window.localStorage.setItem(SUGGESTION_DISMISSED_KEY, '1');
    renderWithLocale(<LocaleSuggestion />, { locale: 'en' });
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('remembers a dismissal and hides immediately', () => {
    withBrowserLanguage('pt-BR');
    renderWithLocale(<LocaleSuggestion />, { locale: 'en' });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar em inglês' }));
    expect(screen.queryByRole('region')).toBeNull();
    expect(window.localStorage.getItem(SUGGESTION_DISMISSED_KEY)).toBe('1');
  });

  // Accepting persists through the SAME key the PT/EN toggle uses, so the choice overrides detection
  // from here on — and it also records the dismissal, or the offer would reappear on the new edition
  // suggesting the language the reader just left.
  it('persists the chosen locale and does not re-offer on the new edition', () => {
    withBrowserLanguage('pt-BR');
    renderWithLocale(<LocaleSuggestion />, { locale: 'en' });
    fireEvent.click(screen.getByRole('button', { name: 'Ler em português' }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('pt');
    expect(window.localStorage.getItem(SUGGESTION_DISMISSED_KEY)).toBe('1');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('is hidden in print', () => {
    withBrowserLanguage('pt-BR');
    renderWithLocale(<LocaleSuggestion />, { locale: 'en' });
    expect(screen.getByRole('region')).toHaveAttribute('data-print', 'hide');
  });
});
