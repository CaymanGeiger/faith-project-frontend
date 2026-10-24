const tokens = require('./src/lib/theme/designTokens.cjs');
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hercules: tokens.colors,
      },
      borderRadius: {
        app: `${tokens.radius.card}px`,
        pill: `${tokens.radius.pill}px`,
      },
      fontFamily: {
        sans: tokens.fontFamily,
      },
    },
  },
  plugins: [],
};
