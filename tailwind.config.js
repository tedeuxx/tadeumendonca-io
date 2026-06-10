/** Tailwind config (/frontend/design-system). Dark-first, brand = slate + cyan, Inter.
 * preflight is OFF during the Cloudscape→Tailwind migration so Tailwind's CSS reset doesn't fight
 * Cloudscape's global styles on not-yet-migrated pages. Re-enable it (and drop Cloudscape) at the end. */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        ring: 'hsl(var(--ring))',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      maxWidth: { feed: '600px', sidebar: '320px' },
    },
  },
  plugins: [],
};
