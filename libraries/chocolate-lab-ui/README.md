# @fgv/chocolate-lab-ui

Chocolate-specific React components for the Chocolate Lab Web application.

## Features

- **Entity Views** — Presentation and editing components for ingredients, fillings, confections, molds, procedures, and tasks
- **Variation Management** — Variation selector, save dialog with contextual options, compact change summary
- **Workspace Reactivity** — ReactiveWorkspace wrapper with event-based change notification and `useWorkspace` hook
- **AI Interactor** — Optional AI interactor slot in entity presentation containers
- **Production** — Session list, procedure checklist, lifecycle management

## Dependencies

- `@fgv/ts-app-shell` — Shared UI primitives (column cascade, sidebar, messages, etc.)
- `@fgv/ts-chocolate` — Domain library (entities, workspace, produced wrappers)
- `@fgv/ts-utils` — Result pattern and utilities
- `zustand` — UI state management

## Development

```bash
rushx build    # Build the library
rushx test     # Run tests
rushx coverage # Run tests with coverage
```
