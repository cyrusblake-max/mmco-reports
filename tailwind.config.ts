import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          black:    '#1E1F19',
          charcoal: '#2A2B23',
          dark:     '#3A3B2F',
          taupe:    '#8B7D6B',
          gold:     '#C4A882',
          sand:     '#D4C4AE',
          cream:    '#E8E2D9',
          beige:    '#F0EDE8',
          off:      '#F8F6F2',
          white:    '#FAFAF9',
        },
        success: '#4A7C59',
        danger:  '#9B4A3A',
      },
      fontFamily: {
        serif:   ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.25em',
        widest3: '0.35em',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
