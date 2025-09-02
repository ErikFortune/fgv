/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/hooks/**/*.{js,jsx,ts,tsx}',
    './src/utils/**/*.{js,jsx,ts,tsx}',
    // Include the ts-res-ui-components library (compiled output)
    './node_modules/@fgv/ts-res-ui-components/lib/**/*.{js,jsx}',
    '../../libraries/ts-res-ui-components/lib/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for the ts-res browser
        'res-primary': '#2563eb',
        'res-secondary': '#1e40af',
        'res-accent': '#3b82f6'
      }
    }
  },
  plugins: []
};
