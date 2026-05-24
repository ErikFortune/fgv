# @fgv/ts-app-shell

Shared React UI primitives for application shells in the `@fgv` monorepo.

## Features

- **Column Cascade** — Master-detail drill-down with horizontal scrolling, breadcrumb navigation, and min-width columns
- **Compact Sidebar** — Filter rows with summary text and flyout selectors that overlay the main pane
- **Toast Notifications** — Ephemeral notifications with auto-dismiss and actionable links
- **Log Message Panel** — Collapsible bottom panel with severity-filtered message history
- **Command Palette** — Cmd+K quick navigation overlay
- **Keybinding Registry** — Infrastructure for registering and managing keyboard shortcuts
- **Default Theme** — CSS-variable tokens + Tailwind preset for all semantic colors (light + dark)

## Usage

```typescript
import { /* components */ } from '@fgv/ts-app-shell';
```

## Theming

All visual components use custom Tailwind semantic tokens (e.g. `bg-surface`, `text-primary`,
`bg-status-error-bg`). To make them render correctly in your application, add the Tailwind
preset and import the base CSS once.

### 1. Add the Tailwind preset

In your `tailwind.config.js` (or `tailwind.config.ts`):

```js
const appShellPreset = require('@fgv/ts-app-shell/tailwind-preset');

module.exports = {
  presets: [appShellPreset],
  // Make sure Tailwind scans the package's components for class names:
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@fgv/ts-app-shell/src/**/*.tsx',
  ],
  // ...rest of your config
};
```

### 2. Import the base CSS

In your application entry point (e.g. `main.tsx` or `index.css`):

```ts
import '@fgv/ts-app-shell/theme.css';
```

### 3. Toggle dark mode

The preset uses Tailwind's `darkMode: 'class'` strategy. Add the class `dark` to any ancestor
element (typically `<html>`) to activate dark mode. The `ThemeProvider` component does this
automatically when the user selects `'dark'` or `'system'` (if the OS prefers dark):

```tsx
import { ThemeProvider } from '@fgv/ts-app-shell';

<ThemeProvider initialTheme="system" onThemeChange={saveTheme}>
  <App />
</ThemeProvider>
```

### Overriding tokens

Every token is a CSS custom property under the `--fgv-` prefix. Override any subset in your
own CSS after importing `theme.css`:

```css
:root {
  --fgv-brand-primary: #7c3aed;   /* purple brand instead of blue */
  --fgv-brand-accent: #a78bfa;
}
.dark {
  --fgv-brand-primary: #8b5cf6;
  --fgv-brand-accent: #c4b5fd;
}
```

## Complete Token Reference

### Surfaces

| Token name | CSS variable | Light default | Dark default | Purpose |
|---|---|---|---|---|
| `surface` | `--fgv-surface` | `#ffffff` | `#1f2937` | Base page / panel background |
| `surface-raised` | `--fgv-surface-raised` | `#f3f4f6` | `#374151` | Elevated cards, filter toolbars |
| `surface-alt` | `--fgv-surface-alt` | `#f9fafb` | `#111827` | Alternate / zebra row background |
| `backdrop` | `--fgv-backdrop` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.65)` | Modal/dialog overlay |
| `hover` | `--fgv-hover` | `#f3f4f6` | `#374151` | Row hover highlight |
| `selected` | `--fgv-selected` | `#eff6ff` | `#1e3a5f` | Selected list item background |

### Text

| Token name | CSS variable | Light | Dark | Purpose |
|---|---|---|---|---|
| `primary` | `--fgv-text-primary` | `#111827` | `#f9fafb` | High-emphasis body text (WCAG AA+) |
| `secondary` | `--fgv-text-secondary` | `#374151` | `#d1d5db` | Medium-emphasis labels |
| `muted` | `--fgv-text-muted` | `#6b7280` | `#9ca3af` | Supporting / helper text |
| `faint` | `--fgv-text-faint` | `#9ca3af` | `#6b7280` | Ghost / ornamental text |
| `star` | `--fgv-text-star` | `#d97706` | `#fbbf24` | Star / favorite icon color |

### Borders & Focus

| Token name | CSS variable | Light | Dark | Purpose |
|---|---|---|---|---|
| `border` | `--fgv-border` | `#d1d5db` | `#4b5563` | Default input / divider border |
| `border-subtle` | `--fgv-border-subtle` | `#e5e7eb` | `#374151` | Subtle row separator |
| `focus-ring` | `--fgv-focus-ring` | `#3b82f6` | `#60a5fa` | Keyboard focus ring |
| `selected-border` | `--fgv-selected-border` | `#2563eb` | `#3b82f6` | Selected item left-border accent |

### Brand

| Token name | CSS variable | Light | Dark | Purpose |
|---|---|---|---|---|
| `brand-primary` | `--fgv-brand-primary` | `#2563eb` | `#3b82f6` | Primary action / active nav |
| `brand-secondary` | `--fgv-brand-secondary` | `#1d4ed8` | `#1e3a5f` | Pressed / dark top-bar variant |
| `brand-accent` | `--fgv-brand-accent` | `#3b82f6` | `#60a5fa` | Hover text, checkmarks, accents |

### Status: Error

| Token name | CSS variable | Purpose |
|---|---|---|
| `status-error-bg` | `--fgv-status-error-bg` | Error row / badge background |
| `status-error-surface` | `--fgv-status-error-surface` | Hover background on error items |
| `status-error-btn` | `--fgv-status-error-btn` | Danger action button fill |
| `status-error-btn-hover` | `--fgv-status-error-btn-hover` | Danger button hover fill |
| `status-error-icon` | `--fgv-status-error-icon` | Error icon / dot color |
| `status-error-border` | `--fgv-status-error-border` | Error section border |
| `status-error-accent` | `--fgv-status-error-accent` | Error focus ring |
| `status-error-text` | `--fgv-status-error-text` | Error message text |
| `status-error-strong` | `--fgv-status-error-strong` | High-emphasis error text |

### Status: Warning

| Token name | CSS variable | Purpose |
|---|---|---|
| `status-warning-bg` | `--fgv-status-warning-bg` | Warning row / badge background |
| `status-warning-surface` | `--fgv-status-warning-surface` | Hover background on warning items |
| `status-warning-btn` | `--fgv-status-warning-btn` | Warning action button fill |
| `status-warning-btn-hover` | `--fgv-status-warning-btn-hover` | Warning button hover fill |
| `status-warning-icon` | `--fgv-status-warning-icon` | Warning icon / dot color |
| `status-warning-border` | `--fgv-status-warning-border` | Warning section border |
| `status-warning-accent` | `--fgv-status-warning-accent` | Warning focus ring |
| `status-warning-text` | `--fgv-status-warning-text` | Warning message text |
| `status-warning-strong` | `--fgv-status-warning-strong` | High-emphasis warning text |

### Status: Info

| Token name | CSS variable | Purpose |
|---|---|---|
| `status-info-bg` | `--fgv-status-info-bg` | Info row / badge background |
| `status-info-surface` | `--fgv-status-info-surface` | Hover background on info items |
| `status-info-btn` | `--fgv-status-info-btn` | Info action button fill |
| `status-info-btn-hover` | `--fgv-status-info-btn-hover` | Info button hover fill |
| `status-info-icon` | `--fgv-status-info-icon` | Info icon / dot color |
| `status-info-border` | `--fgv-status-info-border` | Info section border |
| `status-info-accent` | `--fgv-status-info-accent` | Info focus ring |
| `status-info-text` | `--fgv-status-info-text` | Info message text |
| `status-info-strong` | `--fgv-status-info-strong` | High-emphasis info text |

### Status: Success

| Token name | CSS variable | Purpose |
|---|---|---|
| `status-success-bg` | `--fgv-status-success-bg` | Success row / badge background |
| `status-success-surface` | `--fgv-status-success-surface` | Hover background on success items |
| `status-success-btn` | `--fgv-status-success-btn` | Success action button fill |
| `status-success-btn-hover` | `--fgv-status-success-btn-hover` | Success button hover fill |
| `status-success-icon` | `--fgv-status-success-icon` | Success icon / dot color |
| `status-success-border` | `--fgv-status-success-border` | Success section border |
| `status-success-accent` | `--fgv-status-success-accent` | Success focus ring |
| `status-success-text` | `--fgv-status-success-text` | Success message text |
| `status-success-strong` | `--fgv-status-success-strong` | High-emphasis success text |

## Development

```bash
rushx build    # Build the library
rushx test     # Run tests
rushx coverage # Run tests with coverage
```
