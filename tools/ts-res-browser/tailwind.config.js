module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
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
