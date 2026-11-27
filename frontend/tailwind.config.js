/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1D1714',
          soft: '#4B413A',
          muted: '#6E625A',
          faint: '#665B53',
        },
        cream: '#F8F4EC',
        ivory: '#FFFDF8',
        blush: '#F1DDD4',
        sand: '#E3D5C2',
        champagne: '#C7A97C',
        accent: {
          DEFAULT: '#E2AFA6',
          deep: '#7E4038',
        },
        success: {
          light: '#E5F0DA',
          DEFAULT: '#3E6B2B',
        },
        warning: {
          light: '#F7E8C4',
          DEFAULT: '#775416',
        },
        danger: {
          light: '#F6DDD8',
          DEFAULT: '#8C3B31',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 24px 60px -34px rgba(29, 23, 20, 0.32)',
        lift: '0 18px 40px -28px rgba(29, 23, 20, 0.45)',
      },
      letterSpacing: {
        editorial: '0.2em',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-up': 'fade-up 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'soft-pulse': 'soft-pulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
