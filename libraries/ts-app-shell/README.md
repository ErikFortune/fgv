# @fgv/ts-app-shell

Shared React UI primitives for application shells in the `@fgv` monorepo.

## Features

- **Column Cascade** — Master-detail drill-down with horizontal scrolling, breadcrumb navigation, and min-width columns
- **Compact Sidebar** — Filter rows with summary text and flyout selectors that overlay the main pane
- **Toast Notifications** — Ephemeral notifications with auto-dismiss and actionable links
- **Log Message Panel** — Collapsible bottom panel with severity-filtered message history
- **Command Palette** — Cmd+K quick navigation overlay
- **Keybinding Registry** — Infrastructure for registering and managing keyboard shortcuts

## Usage

```typescript
import { /* components */ } from '@fgv/ts-app-shell';
```

## Development

```bash
rushx build    # Build the library
rushx test     # Run tests
rushx coverage # Run tests with coverage
```
