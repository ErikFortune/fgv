# Monorepo Guide

This repository uses Rush.js with pnpm for monorepo management. Follow these guidelines for all package and dependency operations.

## Quick Reference

### Common Commands

```bash
# Monorepo-wide operations
rush install          # Install all dependencies
rush build            # Build all projects in dependency order
rush test             # Run tests for all projects
rush update           # Update dependencies and shrinkwrap
rush prettier         # Run prettier on staged files

# Individual project (from project directory)
rushx build           # Build current project
rushx test            # Run tests
rushx coverage        # Run with coverage
rushx lint            # Check linting
rushx fixlint         # Auto-fix lint issues
rushx clean           # Clean build artifacts
```

---

## Package Management

### Critical Rules

**NEVER use npm directly:**
```bash
# ❌ NEVER DO THIS
npm install some-package
npm uninstall some-package

# ✅ ALWAYS USE RUSH
rush add -p some-package
rush remove -p some-package
```

**NEVER edit package.json directly for dependencies** - always use Rush commands.

### Adding Dependencies

```bash
# Runtime dependency (note: -p flag is required)
rush add -p package-name
rush add -p package-name@version

# Multiple packages
rush add -p package1 package2 package3

# Development dependency
rush add --dev -p package-name

# Peer dependency
rush add --peer -p package-name
```

### Removing Dependencies

```bash
rush remove -p package-name
```

### Updating Dependencies

```bash
rush update           # Update shrinkwrap file
rush install          # Install from shrinkwrap
```

### Dependency Warnings

- Rush automatically uses consistent versions across the monorepo
- New packages get 'latest' version unless specified
- **Dependency conflicts are difficult to resolve** due to version synchronization
- **Always work in a separate branch** when adding/updating dependencies
- **Ask for confirmation** at every step when dealing with dependency issues

---

## Project Structure

### Repository Layout

```
/
├── libraries/                 # Library packages
│   ├── ts-utils/             # @fgv/ts-utils
│   ├── ts-res/               # @fgv/ts-res
│   ├── ts-bcp47/             # @fgv/ts-bcp47
│   ├── ts-json/              # @fgv/ts-json
│   ├── ts-json-base/         # @fgv/ts-json-base
│   ├── ts-sudoku-lib/        # @fgv/ts-sudoku-lib
│   ├── ts-extras/            # @fgv/ts-extras
│   └── ts-utils-jest/        # @fgv/ts-utils-jest
│
├── tools/                    # CLI tools
│   └── ts-res-cli/           # @fgv/ts-res-cli
│
├── common/                   # Rush configuration
│   ├── config/rush/          # Rush config files
│   └── temp/                 # pnpm lockfile
│
└── rush.json                 # Central Rush configuration
```

### Individual Project Layout

```
my-package/
├── src/
│   ├── index.ts              # Main entry point
│   ├── packlets/             # Feature modules
│   └── test/
│       └── unit/             # Test files (mirror src structure)
├── lib/                      # Compiled output
├── docs/                     # Generated documentation
├── package.json              # Managed by Rush
├── tsconfig.json             # TypeScript configuration
├── jest.config.json          # Jest configuration
└── README.md                 # Package documentation
```

### Packlet Organization

Libraries organize code into "packlets" - cohesive modules under `src/packlets/`:

```
src/
├── index.ts                  # Re-exports from packlets
└── packlets/
    ├── feature-a/
    │   ├── index.ts          # Public API
    │   ├── types.ts          # Types and interfaces
    │   └── implementation.ts # Internal implementation
    └── feature-b/
        └── ...
```

---

## Workspace Dependencies

Use `workspace:*` for inter-project dependencies:

```json
{
  "dependencies": {
    "@fgv/ts-utils": "workspace:*",
    "@fgv/ts-json-base": "workspace:*"
  }
}
```

### Monorepo Library Dependencies

| Library | Purpose |
|---------|---------|
| `@fgv/ts-utils` | Result pattern, collections, validation, conversion |
| `@fgv/ts-json-base` | Basic JSON handling and validation |
| `@fgv/ts-json` | Intensive JSON work (templating, merging) |
| `@fgv/ts-utils-jest` | Testing utilities with Result matchers |
| `@fgv/ts-bcp47` | Language tags and localization |

---

## Build System

### Build Tools

- **Rush.js** - Monorepo orchestration with pnpm
- **Heft** - Build toolchain (TypeScript, testing, linting)
- **API Extractor** - Generates API docs and type definitions
- **Jest** - Testing framework with ts-jest

### Build Order

Rush builds projects in dependency order automatically:

```bash
rush build            # Builds all in correct order
rushx build           # Builds only current project
```

### Webpack and Dev Mode

**Important**: Webpack may not pick up library changes in a separate application. If a web app fails to load with a missing edited library:

1. Kill the dev server
2. Restart the application
3. Webpack can lose track of monorepo dependencies

---

## Configuration Files

| File | Purpose |
|------|---------|
| `rush.json` | Central Rush config, defines all projects |
| `common/config/rush/` | Rush configuration files |
| `common/config/rush/command-line.json` | Custom Rush commands |
| `common/temp/pnpm-lock.yaml` | Shared lockfile |
| Individual `package.json` | Project scripts and dependencies |

---

## Runtime Requirements

- **Node.js**: v20 LTS or later
- **pnpm**: 8.15.9 (managed by Rush)

---

## Troubleshooting

### Rush install fails
- Check for manual package.json modifications
- Run `rush update` first
- Delete `common/temp/` and retry

### Build errors
- Verify TypeScript configuration
- Check for circular dependencies
- Ensure dependencies are built first: `rush build`

### Test failures
- Check for missing dependencies
- Verify test configuration
- Run `rushx build` before `rushx test`

### Webpack loses dependencies
- Kill and restart the dev server
- Webpack can lose track of monorepo dependencies
- This is a known issue with complex dependency graphs
