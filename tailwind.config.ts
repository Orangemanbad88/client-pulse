import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        burgundy: '#7c2d36',
        navy: {
          DEFAULT: '#1e293b',
          dark: '#0f172a',
          light: '#334155',
        },
        walnut: '#475569',
        gold: {
          DEFAULT: '#CC7A18',
          light: '#DA8E24',
          muted: '#9A6010',
        },
        cream: '#faf8f5',
        charcoal: '#1a1a2e',
      },
    },
  },
  plugins: [],
};

export default config;
