/** Tailwind config (/frontend/design-system). Single fixed theme: modern brutalism —
 * near-black / off-white + one accent (safety orange #FF5A00). Space Grotesk (display/sans)
 * + JetBrains Mono (labels/data). Radius 0 and shadow none are enforced in the scale itself,
 * so any leftover `rounded-*` / `shadow-*` renders square and flat. Preflight is on. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Helvetica Neue', 'Arial', 'sans-serif'],
        // `display` stays as an alias of `sans` so existing `font-display` call sites keep working.
        display: ['Space Grotesk', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Radius 0 across the whole scale (including `full`): a leftover `rounded-*` is square.
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '0',
      },
      boxShadow: {
        none: 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
      },
      maxWidth: { screen: '1440px', prose: '72ch', feed: '600px', sidebar: '320px' },
      // The single moving element (Marquee). The duplicated track makes -50% a seamless loop;
      // prefers-reduced-motion freezes it via the global reset in index.css.
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: { marquee: 'marquee 32s linear infinite' },
      fontSize: {
        hero: ['clamp(3rem, 10vw, 12rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-2': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
    },
  },
  plugins: [],
};
