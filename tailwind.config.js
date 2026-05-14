/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      spacing: {
        'safe-area-bottom': 'env(safe-area-inset-bottom)',
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
};