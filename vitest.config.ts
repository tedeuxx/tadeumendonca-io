import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx', // bootstrap wiring
        'src/App.tsx', // provider/layout/router wiring (Cloudscape AppLayout) — exercised by e2e, not unit
        'src/auth/amplify.ts', // Amplify.configure wiring (no logic) — exercised by e2e
        'src/pages/CallbackPage.tsx', // OAuth redirect + Hub side-effects — exercised by e2e (Playwright)
        'src/env.ts', // build-time config accessor
        'src/test-setup.ts',
        'src/types/**',
        'src/vite-env.d.ts',
      ],
      thresholds: { lines: 85, functions: 85, branches: 85, statements: 85 },
    },
  },
});
