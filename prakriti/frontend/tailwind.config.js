/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── PRAKRITI Navy palette ──────────────────────────────
        eoc: {
          bg:       '#07111F',   // main background – deep navy
          surface:  '#0D1B2A',   // secondary background – navy slate
          card:     '#12263A',   // card / panel
          elevated: '#172F46',   // elevated card
          border:   '#243B53',   // border – blue-gray
        },
        // ── Primary accents ───────────────────────────────────
        cyan:  { DEFAULT: '#00D4FF', dim: '#00D4FF1A', border: '#00D4FF33' },
        teal:  { DEFAULT: '#00BFA6', dim: '#00BFA61A', border: '#00BFA633' },
        // ── Severity (exact spec) ─────────────────────────────
        severity: {
          critical: '#FF3B30',
          high:     '#FF9500',
          moderate: '#FFD60A',
          low:      '#30D158',
          unknown:  '#64748B',
        },
        // ── Special PRAKRITI feature colors ───────────────────
        prakriti: {
          fog:            '#A855F7',   // information fog – purple
          confidence:     '#00D4FF',   // evidence confidence – cyan
          contradiction:  '#FF375F',   // contradiction radar – red/pink
          comms:          '#FF9F0A',   // communication gap – amber
          ai:             '#8B5CF6',   // AI / intelligence – violet
          verified:       '#00BFA6',   // verified evidence – teal
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan':   '0 0 0 3px rgba(0,212,255,0.18)',
        'glow-red':    '0 0 0 3px rgba(255,59,48,0.18)',
        'panel':       '0 4px 32px rgba(0,0,0,0.45)',
        'panel-lg':    '0 8px 48px rgba(0,0,0,0.55)',
        'card':        '0 2px 16px rgba(0,0,0,0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink':      'blink 1.2s step-end infinite',
        'fade-in':    'fadeIn 0.2s ease',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.2 },
        },
        fadeIn: {
          '0%':   { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
