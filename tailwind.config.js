/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        stadi: {
          green:  '#1A6B4A',
          orange: '#F4A22C',
          dark:   '#2D2D2D',
          gray:   '#555555',
          light:  '#F5F5F5',
          'green-light': '#EAF4EE',
          'orange-light': '#FEF3E0',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from:{ opacity:0 }, to:{ opacity:1 } },
        slideUp: { from:{ opacity:0, transform:'translateY(12px)' }, to:{ opacity:1, transform:'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
