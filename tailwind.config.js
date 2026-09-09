/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          forest: '#1a4d2e',
          leaf: '#2d6a4f',
          sage: '#40916c',
          mint: '#74c69d',
          cream: '#faf8f3',
          sand: '#f0ebe3',
          gold: '#c9a227',
          goldLight: '#e8c547',
        },
        primary: {
          50: '#f1f8f4',
          100: '#dceee3',
          200: '#b8ddc6',
          300: '#86c49e',
          400: '#52a874',
          500: '#2d6a4f',
          600: '#245a42',
          700: '#1a4d2e',
          800: '#153d25',
          900: '#0f2e1c',
        },
        accent: {
          50: '#fdfaf0',
          100: '#f9f0d5',
          200: '#f0dfa8',
          300: '#e8c547',
          400: '#d4af37',
          500: '#c9a227',
          600: '#a8841f',
          700: '#876719',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
