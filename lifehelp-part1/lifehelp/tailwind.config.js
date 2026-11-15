/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans Tamil', 'sans-serif'],
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'toast-in': { '0%': { opacity: 0, transform: 'translateY(-12px) scale(.97)' }, '100%': { opacity: 1, transform: 'translateY(0) scale(1)' } },
        'pulse-ring': { '0%': { transform: 'scale(.8)', opacity: 0.7 }, '100%': { transform: 'scale(1.9)', opacity: 0 } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'bar-load': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(250%)' } },
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
        'fade-in': 'fade-in .4s ease-out both',
        'toast-in': 'toast-in .25s ease-out both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        float: 'float 3s ease-in-out infinite',
        'bar-load': 'bar-load 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
