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
