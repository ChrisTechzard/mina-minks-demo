/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F5F1E8',
        ink: '#111111',
        accent: '#C8FF00',
        sand: '#B7A99A',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 24px 60px -30px rgba(17, 17, 17, 0.35)',
      },
      letterSpacing: {
        editorial: '0.18em',
      },
    },
  },
  plugins: [],
};
