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
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Legacy choco-* colors (kept during migration, remove when done)
        'choco-primary': '#78350f',
        'choco-secondary': '#92400e',
        'choco-accent': '#b45309',
        'choco-warm': '#fef3c7',
        'choco-surface': '#fffbeb',

        // Semantic surface tokens
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        'surface-raised': 'var(--color-surface-raised)',
        'surface-sunken': 'var(--color-surface-sunken)',

        // Semantic brand tokens
        'brand-primary': 'var(--color-brand-primary)',
        'brand-secondary': 'var(--color-brand-secondary)',
        'brand-accent': 'var(--color-brand-accent)',
        'brand-warm': 'var(--color-brand-warm)',
        'brand-surface': 'var(--color-brand-surface)',

        // Semantic interactive tokens
        hover: 'var(--color-hover)',
        active: 'var(--color-active)',
        'focus-ring': 'var(--color-focus-ring)',
        selected: 'var(--color-selected)',
        'selected-border': 'var(--color-selected-border)',
        backdrop: 'var(--color-backdrop)',

        // Status: Info
        'status-info-bg': 'var(--color-status-info-bg)',
        'status-info-text': 'var(--color-status-info-text)',
        'status-info-icon': 'var(--color-status-info-icon)',
        'status-info-border': 'var(--color-status-info-border)',
        'status-info-btn': 'var(--color-status-info-btn-bg)',
        'status-info-btn-hover': 'var(--color-status-info-btn-hover)',
        'status-info-surface': 'var(--color-status-info-surface)',

        // Status: Success
        'status-success-bg': 'var(--color-status-success-bg)',
        'status-success-text': 'var(--color-status-success-text)',
        'status-success-icon': 'var(--color-status-success-icon)',
        'status-success-border': 'var(--color-status-success-border)',
        'status-success-surface': 'var(--color-status-success-surface)',
        'status-success-accent': 'var(--color-status-success-accent)',

        // Status: Warning
        'status-warning-bg': 'var(--color-status-warning-bg)',
        'status-warning-text': 'var(--color-status-warning-text)',
        'status-warning-icon': 'var(--color-status-warning-icon)',
        'status-warning-border': 'var(--color-status-warning-border)',
        'status-warning-btn': 'var(--color-status-warning-btn-bg)',
        'status-warning-btn-hover': 'var(--color-status-warning-btn-hover)',
        'status-warning-surface': 'var(--color-status-warning-surface)',
        'status-warning-strong': 'var(--color-status-warning-strong)',
        'status-warning-border-strong': 'var(--color-status-warning-border-strong)',

        // Status: Error/Danger
        'status-error-bg': 'var(--color-status-error-bg)',
        'status-error-text': 'var(--color-status-error-text)',
        'status-error-icon': 'var(--color-status-error-icon)',
        'status-error-border': 'var(--color-status-error-border)',
        'status-error-btn': 'var(--color-status-error-btn-bg)',
        'status-error-btn-hover': 'var(--color-status-error-btn-hover)',
        'status-error-accent': 'var(--color-status-error-accent)',
        'status-error-strong': 'var(--color-status-error-strong)',
        'status-error-border-strong': 'var(--color-status-error-border-strong)',
        'status-error-surface': 'var(--color-status-error-surface)',

        // Misc
        star: 'var(--color-star)'
      },
      textColor: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
        muted: 'var(--color-text-muted)',
        faint: 'var(--color-text-faint)',
        inverted: 'var(--color-text-inverted)'
      },
      borderColor: {
        border: 'var(--color-border)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-strong': 'var(--color-border-strong)'
      }
    }
  },
  plugins: []
};
