/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    // Include the ts-app-shell library (compiled output)
    './node_modules/@fgv/ts-app-shell/lib/**/*.{js,jsx}',
    '../../libraries/ts-app-shell/lib/**/*.{js,jsx}',
    // Include the chocolate-lab-ui library (compiled output)
    './node_modules/@fgv/chocolate-lab-ui/lib/**/*.{js,jsx}',
    '../../libraries/chocolate-lab-ui/lib/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for Chocolate Lab
        'choco-primary': '#78350f',
        'choco-secondary': '#92400e',
        'choco-accent': '#b45309',
        'choco-warm': '#fef3c7',
        'choco-surface': '#fffbeb'
      }
    }
  },
  plugins: []
};
