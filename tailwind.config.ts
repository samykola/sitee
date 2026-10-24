import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0a0a0a', soft: '#111111', card: '#161616', border: '#242424' },
        accent: { DEFAULT: '#8b5cf6', hover: '#7c3aed' }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'heart-burst':  'heartBurst 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'pop':          'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'shimmer':      'shimmer 1.6s infinite linear',
        'fade-in':      'fadeIn 0.3s ease-out both',
        'fade-in-up':   'fadeInUp 0.35s ease-out both',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'scale-in':     'scaleIn 0.2s ease-out',
      },
      keyframes: {
        heartBurst: {
          '0%':   { transform: 'scale(1)' },
          '25%':  { transform: 'scale(1.35)' },
          '50%':  { transform: 'scale(0.9)' },
          '75%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        pop: {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
