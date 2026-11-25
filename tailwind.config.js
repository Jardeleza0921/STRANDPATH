export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        surface2: 'rgb(var(--surface2) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft) / <alpha-value>)',
          edge: 'rgb(var(--brand-edge) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)'
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          soft: 'rgb(var(--success-soft) / <alpha-value>)'
        },
        warn: {
          DEFAULT: 'rgb(var(--warn) / <alpha-value>)',
          soft: 'rgb(var(--warn-soft) / <alpha-value>)'
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          soft: 'rgb(var(--danger-soft) / <alpha-value>)'
        },
        panel: {
          DEFAULT: 'rgb(var(--panel) / <alpha-value>)',
          2: 'rgb(var(--panel2) / <alpha-value>)',
          ink: 'rgb(var(--panel-ink) / <alpha-value>)',
          muted: 'rgb(var(--panel-muted) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        sm: '7px',
        DEFAULT: '11px',
        md: '13px',
        lg: '17px',
        xl: '22px'
      },
      maxWidth: {
        content: '1200px'
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,.85) inset, 0 2px 4px rgba(20,30,25,.04), 0 18px 36px -28px rgba(20,30,25,.35)',
        raised: '0 1px 0 rgba(255,255,255,.3) inset, 0 2px 3px rgba(20,30,25,.12), 0 12px 22px -14px rgba(20,30,25,.4)',
        pressed: 'inset 0 2px 5px rgba(20,30,25,.18), 0 1px 0 rgba(255,255,255,.6)',
        pop: '0 24px 48px -24px rgba(20,30,25,.35), 0 2px 6px rgba(20,30,25,.08)'
      }
    }
  },
  plugins: []
};
