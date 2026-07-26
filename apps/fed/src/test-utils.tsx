// Test helper: render a tree inside a router seeded at the locale's prefix (`/pt` | `/en`) plus the
// LocaleProvider, which reads the active locale straight off that path (ADR-0036). Component tests stay
// locale-explicit (pt by default — the historical baseline the assertions were written against). The
// router is provided here so components using RouterLink / the locale toggle work without each test
// wiring its own; `initialPath` overrides the seed for tests that assert on a specific sub-route.
import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider, localePath, type Locale } from './i18n';

export function renderWithLocale(
  ui: ReactElement,
  {
    locale = 'pt',
    initialPath,
    ...options
  }: { locale?: Locale; initialPath?: string } & Omit<RenderOptions, 'wrapper'> = {},
) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[initialPath ?? localePath(locale, '/')]}>
        <LocaleProvider>{children}</LocaleProvider>
      </MemoryRouter>
    ),
    ...options,
  });
}
