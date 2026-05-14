/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mq: {
          navy: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          teal: '#0D9488',
          'teal-400': '#2DD4BF',
          'teal-600': '#0F766E',
          'teal-900': '#042F2E',
          slate: '#F8FAFC',
          s200: '#E2E8F0',
          s400: '#94A3B8',
          s600: '#475569',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite 1s',
        'float-fast': 'float 4s ease-in-out infinite 2s',
        ticker: 'ticker 25s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'fade-up-delay': 'fadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both',
        skeleton: 'skeleton 1.5s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'count-up': 'countUp 1s ease-out both',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.7)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        skeleton: {
          '0%,100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 20px rgba(13,148,136,0.3)' },
          '50%': { boxShadow: '0 0 50px rgba(13,148,136,0.7)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'teal-glow': '0 0 50px rgba(13,148,136,0.4)',
        'teal-glow-sm': '0 0 20px rgba(13,148,136,0.2)',
        'teal-glow-lg': '0 0 80px rgba(13,148,136,0.5)',
        glass: '0 8px 40px rgba(0,0,0,0.3)',
        card: '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.15)',
        navy: '0 8px 32px rgba(15,23,42,0.6)',
        'glow-purple': '0 0 30px rgba(124,58,237,0.3)',
      },
    },
  },
  plugins: [],
};
