/**
 * @fgv/ts-app-shell — Tailwind CSS preset
 *
 * Maps the package's semantic design tokens to the CSS custom properties
 * defined in theme.css. Add this preset to your tailwind.config.js and
 * import theme.css once at your application entry point.
 *
 * Usage:
 *
 *   // tailwind.config.js
 *   const appShellPreset = require('@fgv/ts-app-shell/tailwind-preset');
 *   module.exports = {
 *     presets: [appShellPreset],
 *     content: ['./src/**\/*.{ts,tsx}', './node_modules/@fgv/ts-app-shell/src/**\/*.tsx'],
 *     // ...your config
 *   };
 *
 *   // application entry (e.g. main.tsx or index.css)
 *   import '@fgv/ts-app-shell/theme.css';
 *
 *   // dark mode: add class="dark" to <html> (ThemeProvider does this automatically)
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ----- Surfaces ----- */
        surface: 'var(--fgv-surface)',
        'surface-raised': 'var(--fgv-surface-raised)',
        'surface-alt': 'var(--fgv-surface-alt)',
        backdrop: 'var(--fgv-backdrop)',
        hover: 'var(--fgv-hover)',
        selected: 'var(--fgv-selected)',

        /* ----- Text ----- */
        primary: 'var(--fgv-text-primary)',
        secondary: 'var(--fgv-text-secondary)',
        muted: 'var(--fgv-text-muted)',
        faint: 'var(--fgv-text-faint)',
        star: 'var(--fgv-text-star)',

        /* ----- Borders ----- */
        border: 'var(--fgv-border)',
        'border-subtle': 'var(--fgv-border-subtle)',
        'focus-ring': 'var(--fgv-focus-ring)',
        'selected-border': 'var(--fgv-selected-border)',

        /* ----- Brand ----- */
        'brand-primary': 'var(--fgv-brand-primary)',
        'brand-secondary': 'var(--fgv-brand-secondary)',
        'brand-accent': 'var(--fgv-brand-accent)',

        /* ----- Status: error / danger ----- */
        'status-error-bg': 'var(--fgv-status-error-bg)',
        'status-error-surface': 'var(--fgv-status-error-surface)',
        'status-error-btn': 'var(--fgv-status-error-btn)',
        'status-error-btn-hover': 'var(--fgv-status-error-btn-hover)',
        'status-error-icon': 'var(--fgv-status-error-icon)',
        'status-error-border': 'var(--fgv-status-error-border)',
        'status-error-accent': 'var(--fgv-status-error-accent)',
        'status-error-text': 'var(--fgv-status-error-text)',
        'status-error-strong': 'var(--fgv-status-error-strong)',

        /* ----- Status: warning ----- */
        'status-warning-bg': 'var(--fgv-status-warning-bg)',
        'status-warning-surface': 'var(--fgv-status-warning-surface)',
        'status-warning-btn': 'var(--fgv-status-warning-btn)',
        'status-warning-btn-hover': 'var(--fgv-status-warning-btn-hover)',
        'status-warning-icon': 'var(--fgv-status-warning-icon)',
        'status-warning-border': 'var(--fgv-status-warning-border)',
        'status-warning-accent': 'var(--fgv-status-warning-accent)',
        'status-warning-text': 'var(--fgv-status-warning-text)',
        'status-warning-strong': 'var(--fgv-status-warning-strong)',

        /* ----- Status: info ----- */
        'status-info-bg': 'var(--fgv-status-info-bg)',
        'status-info-surface': 'var(--fgv-status-info-surface)',
        'status-info-btn': 'var(--fgv-status-info-btn)',
        'status-info-btn-hover': 'var(--fgv-status-info-btn-hover)',
        'status-info-icon': 'var(--fgv-status-info-icon)',
        'status-info-border': 'var(--fgv-status-info-border)',
        'status-info-accent': 'var(--fgv-status-info-accent)',
        'status-info-text': 'var(--fgv-status-info-text)',
        'status-info-strong': 'var(--fgv-status-info-strong)',

        /* ----- Status: success ----- */
        'status-success-bg': 'var(--fgv-status-success-bg)',
        'status-success-surface': 'var(--fgv-status-success-surface)',
        'status-success-btn': 'var(--fgv-status-success-btn)',
        'status-success-btn-hover': 'var(--fgv-status-success-btn-hover)',
        'status-success-icon': 'var(--fgv-status-success-icon)',
        'status-success-border': 'var(--fgv-status-success-border)',
        'status-success-accent': 'var(--fgv-status-success-accent)',
        'status-success-text': 'var(--fgv-status-success-text)',
        'status-success-strong': 'var(--fgv-status-success-strong)'
      }
    }
  }
};
