/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/hooks/**/*.{js,jsx,ts,tsx}',
    './src/utils/**/*.{js,jsx,ts,tsx}',
    // Include the ts-chocolate-ui library (both source and compiled)
    './node_modules/@fgv/ts-chocolate-ui/lib/**/*.{js,jsx}',
    '../../libraries/ts-chocolate-ui/lib/**/*.{js,jsx}',
    // CRITICAL: Include source files for custom Tailwind classes
    '../../libraries/ts-chocolate-ui/src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Chocolate color palette
        chocolate: {
          50: '#faf5f0',
          100: '#f3e8dc',
          200: '#e6d0b8',
          300: '#d4b08a',
          400: '#c08b5c',
          500: '#a86f3d',
          600: '#8b5a2b',
          700: '#6f4724',
          800: '#5a3a1f',
          900: '#4a2f1a',
          950: '#2d1c0f'
        },
        // Accent colors for different ingredient categories
        cacao: '#5a3a1f',
        dairy: '#f5f5dc',
        sugar: '#fef3c7',
        fat: '#fef9c3',
        flavor: '#e0e7ff',
        other: '#e5e7eb'
      },
      keyframes: {
        slideIn: {
          from: {
            opacity: '0',
            transform: 'translateX(100%)'
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out'
      }
    }
  },
  plugins: []
};
