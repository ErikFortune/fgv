/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/hooks/**/*.{js,jsx,ts,tsx}',
    './src/utils/**/*.{js,jsx,ts,tsx}',
    // Include the ts-sudoku-ui library (both source and compiled)
    './node_modules/@fgv/ts-sudoku-ui/lib/**/*.{js,jsx}',
    '../../libraries/ts-sudoku-ui/lib/**/*.{js,jsx}',
    // CRITICAL: Include source files for custom Tailwind classes
    '../../libraries/ts-sudoku-ui/src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for the sudoku app
        'sudoku-primary': '#2563eb',
        'sudoku-secondary': '#1e40af',
        'sudoku-accent': '#3b82f6'
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
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out'
      }
    }
  },
  plugins: []
};
