/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@fgv/ts-app-shell/tailwind-preset')],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './node_modules/@fgv/ts-app-shell/lib/**/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
