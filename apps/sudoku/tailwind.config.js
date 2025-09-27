/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/hooks/**/*.{js,jsx,ts,tsx}',
    './src/utils/**/*.{js,jsx,ts,tsx}',
    // Include the ts-sudoku-ui library (compiled output)
    './node_modules/@fgv/ts-sudoku-ui/lib/**/*.{js,jsx}',
    '../../libraries/ts-sudoku-ui/lib/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for the sudoku app
        'sudoku-primary': '#2563eb',
        'sudoku-secondary': '#1e40af',
        'sudoku-accent': '#3b82f6'
      }
    }
  },
  plugins: []
};
