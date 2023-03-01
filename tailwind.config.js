const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          100: '#F8F8F8',
          200: '#EEEEEE',
          300: '#D9D9D9',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#404040',
          900: '#333333',
          1000: '#282828',
        },
        root: {
          light: '#BDBDBD',
          dark: '#181818',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
