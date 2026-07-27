import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // `.scratch` is the gitignored home for throwaway diagnostic probes (#193). ESLint v9 flat config does
  // NOT read .gitignore, so without this a disposable probe reddens `npm run lint` locally — defeating
  // the point of giving probes a home. CI never sees the directory; this is purely local ergonomics.
  { ignores: ['dist', 'node_modules', 'coverage', '.scratch'] },
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
    languageOptions: { globals: { console: 'readonly', process: 'readonly', Buffer: 'readonly' } },
  },
);
