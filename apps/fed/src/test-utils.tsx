// Test helper: render a tree inside the LocaleProvider at a chosen locale, so component tests are
// locale-explicit (pt by default — the historical baseline the assertions were written against).
import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { LocaleProvider, type Locale } from './i18n';

export function renderWithLocale(
  ui: ReactElement,
  { locale = 'pt', ...options }: { locale?: Locale } & Omit<RenderOptions, 'wrapper'> = {},
) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>,
    ...options,
  });
}
