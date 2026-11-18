/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dce5f1',
          200: '#bccfe5',
          300: '#91b1d3',
          400: '#618ebd',
          500: '#3f70a5',
          600: '#2f5787',
          700: '#26466e',
          800: '#1b3352',
          900: '#0f2a4f', // Brand primary navy
          950: '#0a1a33',
        },
        lebak: {
          gold: '#d97706',
          amber: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
