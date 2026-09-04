import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // `.scratch` is NOT ignored here any more, and that is the point (#155). It moved to the REPO ROOT,
  // which is outside this project and therefore outside this lint run — so the entry protected nothing
  // real, and what it did protect was the wrong location. Left un-ignored, a probe written to
  // `apps/fed/.scratch/` reddens `npm run lint` immediately instead of accumulating unseen, which is
  // how the previous instance reached seven files and ten days without anyone noticing.
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // #597. `lib/analytics.ts` is the ONE emission point for GA4, and this is what makes that a rule
    // rather than a habit. `window.gtag` is a global: it is reachable from any component by typing its
    // name, with no import to review and nothing in a diff that looks unusual. An event emitted around
    // the module would miss the consent gate — the property this slice exists to repair — and would
    // carry whatever parameter spine its author remembered, which is how one event acquires two shapes.
    //
    // TESTS ARE EXEMPT because three of them assign `window.gtag` to capture what was emitted, and the
    // e2e assertions read `window.dataLayer` in the browser. Neither ships, and a rule that reddened on
    // the suite verifying the rule would be turned off within the week.
    //
    // WHAT IT DOES NOT CATCH, said so nobody reads the green as a proof: `no-restricted-properties`
    // matches the member expression, so `window['gtag']` or a destructured `const { gtag } = window`
    // walks straight past it. It stops the spelling anyone would actually write, and that is the whole
    // claim.
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    ignores: ['src/lib/analytics.ts', 'src/**/*.test.{ts,tsx}', 'e2e/**/*.spec.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'gtag',
          message:
            'Emit through lib/analytics `trackEvent` (or a named emitter) — it carries the consent gate and the event schema. Direct gtag access belongs only in lib/analytics.ts.',
        },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    // `fetch`/`AbortSignal` are Node 22 globals (this app's `engines` floor) and arrive with
    // scripts/check-video-embeddable.mjs, the only script here that talks to the network.
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
      },
    },
  },
);
