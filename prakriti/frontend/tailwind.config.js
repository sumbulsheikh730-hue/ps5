/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        eoc: {
          bg: '#0a0e1a',
          surface: '#111827',
          border: '#1f2937',
          card: '#141c2e',
          panel: '#0d1526',
        },
        severity: {
          critical: '#ef4444',
          high: '#f97316',
          moderate: '#eab308',
          low: '#22c55e',
          unknown: '#6b7280',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1.2s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.2 },
        }
      }
    },
  },
  plugins: [],
}
