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

        // Accent: AI
        'accent-ai-bg': 'var(--color-accent-ai-bg)',
        'accent-ai-text': 'var(--color-accent-ai-text)',
        'accent-ai-text-strong': 'var(--color-accent-ai-text-strong)',
        'accent-ai-icon': 'var(--color-accent-ai-icon)',
        'accent-ai-border': 'var(--color-accent-ai-border)',
        'accent-ai-btn': 'var(--color-accent-ai-btn-bg)',
        'accent-ai-btn-hover': 'var(--color-accent-ai-btn-hover)',
        'accent-ai-surface': 'var(--color-accent-ai-surface)',
        'accent-ai-focus': 'var(--color-accent-ai-focus)',

        // Category badges
        'cat-chocolate-bg': 'var(--color-cat-chocolate-bg)',
        'cat-chocolate-text': 'var(--color-cat-chocolate-text)',
        'cat-dairy-bg': 'var(--color-cat-dairy-bg)',
        'cat-dairy-text': 'var(--color-cat-dairy-text)',
        'cat-sugar-bg': 'var(--color-cat-sugar-bg)',
        'cat-sugar-text': 'var(--color-cat-sugar-text)',
        'cat-fat-bg': 'var(--color-cat-fat-bg)',
        'cat-fat-text': 'var(--color-cat-fat-text)',
        'cat-alcohol-bg': 'var(--color-cat-alcohol-bg)',
        'cat-alcohol-text': 'var(--color-cat-alcohol-text)',
        'cat-liquid-bg': 'var(--color-cat-liquid-bg)',
        'cat-liquid-text': 'var(--color-cat-liquid-text)',
        'cat-flavor-bg': 'var(--color-cat-flavor-bg)',
        'cat-flavor-text': 'var(--color-cat-flavor-text)',
        'cat-ganache-bg': 'var(--color-cat-ganache-bg)',
        'cat-ganache-text': 'var(--color-cat-ganache-text)',
        'cat-caramel-bg': 'var(--color-cat-caramel-bg)',
        'cat-caramel-text': 'var(--color-cat-caramel-text)',
        'cat-gianduja-bg': 'var(--color-cat-gianduja-bg)',
        'cat-gianduja-text': 'var(--color-cat-gianduja-text)',

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
