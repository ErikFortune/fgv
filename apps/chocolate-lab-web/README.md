# Chocolate Lab Web

A full-featured chocolate kitchen web application built with React, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js >= 20
- Rush.js (install with `npm install -g @microsoft/rush`)
- All monorepo dependencies installed: `rush install` from the repo root
- All libraries built: `rush build` from the repo root

## Development

### Frontend only

Starts the webpack dev server on [http://localhost:3001](http://localhost:3001) with hot reload:

```bash
rushx dev
```

### Frontend + API backend

Starts both the webpack dev server and the `chocolate-lab-api` backend concurrently:

```bash
rushx dev:full
```

The API backend runs on port 3002 by default. Configure it via environment variables in `services/chocolate-lab-api/.env` (see `services/chocolate-lab-api/.env.example`).

### Build for production

```bash
rushx build
```

Output is written to `dist/`.

### Clean

```bash
rushx clean
```

## API Backend

The app can operate in browser-only mode (data in localStorage) or connect to the `chocolate-lab-api` service for persistent cloud storage backed by either the filesystem or MongoDB.

Configure the storage endpoint in the app's **Settings > Startup Configuration > Cloud Storage** section. Key settings:

| Setting | Description |
|---------|-------------|
| **Storage API base URL** | e.g. `http://localhost:3002/api/storage` |
| **Namespace** | Scopes storage requests (optional) |
| **User ID** | Temporary per-user identifier sent as `X-User-Id` header (will be replaced by a real identity system) |

See [services/chocolate-lab-api/.env.example](../../services/chocolate-lab-api/.env.example) for backend configuration.

## Docker

A Docker Compose setup is available at the repo root for running the full stack (frontend + API + MongoDB):

```bash
rush start-lab:stack   # Build and start
rush stop-lab:stack    # Stop and remove containers
```

See the root `docker-compose.yml` and `services/chocolate-lab-api/Dockerfile` for details.

## E2E Tests

End-to-end tests use [Playwright](https://playwright.dev/) with Chromium. The test suite automatically starts the dev server if it isn't already running.

```bash
# Install Chromium (first time only)
rushx playwright:install

# Run tests headless
rushx test:e2e

# Run tests with interactive UI
rushx test:e2e:ui

# Run tests in a visible browser
rushx test:e2e:headed
```

Test files are in `e2e/`. Results and traces are written to `test-results/`.

## Project Structure

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component
├── tabs/                 # Top-level tab components
│   ├── ConfectionsTab.tsx
│   ├── IngredientsTab.tsx
│   ├── FillingsTab.tsx
│   └── ...
└── ...
e2e/                      # Playwright E2E tests
public/
└── index.html            # HTML template
dist/                     # Production build output
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@fgv/ts-chocolate` | Core chocolate data model and runtime entities |
| `@fgv/chocolate-lab-ui` | Shared React UI components |
| `@fgv/ts-app-shell` | App shell primitives (workspace, settings, state) |
| `@fgv/ts-web-extras` | HTTP-backed file trees, browser crypto, localStorage persistence |
| `@fgv/ts-utils` | Result pattern, converters, validators |

## Troubleshooting

- **Webpack doesn't pick up library changes**: Kill the dev server and restart. Webpack can lose track of monorepo symlink dependencies.
- **API connection failures**: Make sure the backend is running (`rushx dev:full`) and that cloud storage is enabled in Settings.
- **Playwright can't find Chromium**: Run `rushx playwright:install` first.
