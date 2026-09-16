/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, modern terracotta — refined version of the original orange.
        brand: {
          50: '#FFF4EE',
          100: '#FFE7DB',
          200: '#FFD2BC',
          300: '#FFB996',
          400: '#FA8B5C',
          500: '#EE6A2F',
          600: '#D95329',
          700: '#B6431E',
          800: '#8F3316',
          900: '#6C270F',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 6px 14px -2px rgb(0 0 0 / 0.07)',
        lift: '0 2px 4px -2px rgb(0 0 0 / 0.06), 0 14px 22px -6px rgb(0 0 0 / 0.12)',
        'brand-glow': '0 0 0 1px rgb(238 106 47 / 0.2), 0 10px 24px -8px rgb(238 106 47 / 0.35)',
      },
    },
  },
  plugins: [],
};