/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        retro: {
          amber:   '#F5A524',
          red:     '#E5484D',
          dark:    '#0B0B0F',
          panel:   '#14141B',
          surface: '#1F1F2A',
          line:    'rgba(255,255,255,.08)',
        },
        ink: {
          DEFAULT: '#F5F5F7',
          muted:   '#8A8A95',
          dim:     '#5C5C68',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', '"Anton"', 'system-ui', 'sans-serif'],
        sans:    ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.4), 0 8px 24px -12px rgba(0,0,0,.6)',
        glow: '0 0 0 1px rgba(245,165,36,.4), 0 0 24px -6px rgba(245,165,36,.5)',
      },
      backgroundImage: {
        'radial-spot':
          'radial-gradient(900px 600px at 12% -10%, rgba(245,165,36,.10), transparent 60%), ' +
          'radial-gradient(800px 500px at 100% 0%, rgba(229,72,77,.08), transparent 55%)',
      },
    },
  },
  plugins: [],
}
