/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'background': '#F7F8FC',
        'surface': '#FFFFFF',
        'primary': {
          DEFAULT: '#6D55FF',
          'light': '#A597FF',
        },
        'accent': {
          DEFAULT: '#00D09B',
          'light': '#74EBD5',
        },
        'text-primary': '#1A1053',
        'text-secondary': '#8A87AD',
      }
    },
  },
  plugins: [],
};