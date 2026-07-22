/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hercules: {
          red: '#CE2127',
          white: '#FFFFFF',
          blue: '#0A2D7F',
          ink: '#0A2D7F',
          muted: '#0A2D7F',
        },
      },
      borderRadius: {
        app: '22px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
