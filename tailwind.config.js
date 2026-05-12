/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'mq-navy': '#0F172A',
        'mq-navy-800': '#1E293B',
        'mq-navy-700': '#334155',
        'mq-teal': '#0D9488',
        'mq-teal-400': '#2DD4BF',
        'mq-teal-900': '#042F2E',
        'mq-slate': '#F8FAFC',
        'mq-slate-200': '#E2E8F0',
        'mq-slate-600': '#475569'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'teal-glow': '0 20px 60px rgba(13, 148, 136, 0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'ticker': 'ticker 20s linear infinite',
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'reveal': 'reveal 600ms cubic-bezier(0.4,0,0.2,1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'rotate(-3deg) translateY(0px)' },
          '50%': { transform: 'rotate(-3deg) translateY(-12px)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
