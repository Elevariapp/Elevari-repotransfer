import type { Config } from 'tailwindcss';

/**
 * Tailwind v4 reads design tokens from the @theme block in app/globals.css.
 * This file only registers content sources; keep visual values in CSS tokens.
 * Docs: docs/design/TOKEN_SYSTEM.md
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './actions/**/*.{js,ts,jsx,tsx}',
  ],
};

export default config;

