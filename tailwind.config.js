export default {
  content: ['./**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF9F6',
        surface: '#FFFFFF',
        ink: '#15181E',
        muted: '#5B6373',
        faint: '#8A91A0',
        line: '#E5E3DD',
        brand: {
          DEFAULT: '#2549C7',
          dark: '#1B379B',
          soft: '#ECEFFC',
          edge: '#C9D2F5',
        },
        accent: {
          DEFAULT: '#C4661C',
          soft: '#FBEFE3',
        },
        success: {
          DEFAULT: '#1F7A54',
          soft: '#E7F2EC',
        },
        warn: {
          DEFAULT: '#9A6B0C',
          soft: '#FAF1DE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      maxWidth: {
        content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21, 24, 30, 0.04)',
        pop: '0 8px 24px rgba(21, 24, 30, 0.08)',
      },
    },
  },
  plugins: [],
}
