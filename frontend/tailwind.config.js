/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      // Los colores salen de los tokens de style.css (claro y oscuro), no de
      // valores fijos: así text-ink o bg-retro-panel cambian con el tema.
      // color-mix permite seguir usando opacidades (bg-retro-surface/60).
      colors: {
        retro: {
          amber:   'color-mix(in srgb, var(--amber) calc(<alpha-value> * 100%), transparent)',
          red:     'color-mix(in srgb, var(--red) calc(<alpha-value> * 100%), transparent)',
          dark:    '#0B0B0F',
          panel:   'color-mix(in srgb, var(--panel) calc(<alpha-value> * 100%), transparent)',
          surface: 'color-mix(in srgb, var(--surface) calc(<alpha-value> * 100%), transparent)',
          line:    'var(--line)',
        },
        ink: {
          DEFAULT: 'color-mix(in srgb, var(--ink) calc(<alpha-value> * 100%), transparent)',
          muted:   'color-mix(in srgb, var(--ink-muted) calc(<alpha-value> * 100%), transparent)',
          dim:     'color-mix(in srgb, var(--ink-dim) calc(<alpha-value> * 100%), transparent)',
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
