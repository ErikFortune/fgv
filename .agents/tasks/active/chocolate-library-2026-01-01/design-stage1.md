# Stage 1 Design: Rush Package Setup

**Task ID**: chocolate-library-2026-01-01
**Stage**: 1 of N (Incremental Development)
**Date**: 2026-01-01

## Stage 1 Objective

Set up three Rush packages with proper structure and configuration:

1. **@fgv/ts-chocolate** - Core library (libraries/)
2. **@fgv/chocolate-cli** - CLI tool (tools/)
3. **chocolate-web** - Web application (apps/)

## Package Specifications

### Library: @fgv/ts-chocolate

**Location**: `libraries/ts-chocolate/`

**Structure**:
```
libraries/ts-chocolate/
├── src/
│   ├── index.ts                 # Main exports (initially empty/placeholder)
│   └── packlets/                # Packlet organization
│       └── .gitkeep             # Placeholder
├── package.json                 # Rush-managed
├── tsconfig.json                # TypeScript config
├── .eslintrc.js                 # Linting config
└── README.md                    # Package documentation
```

**Dependencies**:
- `@fgv/ts-utils` (workspace:*)
- `@fgv/ts-json` (workspace:*)

**Dev Dependencies**:
- `@fgv/ts-utils-jest` (workspace:*)
- Standard monorepo tooling (Heft, etc.)

### CLI: @fgv/chocolate-cli

**Location**: `tools/chocolate-cli/`

**Structure**:
```
tools/chocolate-cli/
├── src/
│   ├── cli.ts                   # Main CLI entry
│   └── commands/                # Command modules
│       └── .gitkeep
├── package.json
├── tsconfig.json
├── .eslintrc.js
└── README.md
```

**Dependencies**:
- `@fgv/ts-chocolate` (workspace:*)
- `@fgv/ts-utils` (workspace:*)
- `commander` - CLI framework
- `chalk` - Terminal colors

### Web App: chocolate-web

**Location**: `apps/chocolate-web/`

**Structure**:
```
apps/chocolate-web/
├── src/
│   ├── index.tsx                # Entry point
│   ├── App.tsx                  # Root component
│   └── components/              # React components
│       └── .gitkeep
├── public/
│   └── index.html               # HTML template
├── package.json
├── tsconfig.json
├── webpack.config.js            # Webpack (required, not Vite)
├── tailwind.config.js           # Tailwind CSS
└── README.md
```

**Technology Stack**:
- **React** (like other apps in repo)
- **Tailwind CSS** (like other apps in repo)
- **Heroicons** (like other apps in repo)
- **Webpack** (required due to Vite limitations)

**Dependencies**:
- `@fgv/ts-chocolate` (workspace:*)
- `react`
- `react-dom`
- `@heroicons/react`
- `tailwindcss`

**Dev Dependencies**:
- `webpack`
- `webpack-dev-server`
- `webpack-cli`
- TypeScript loaders
- CSS loaders

## Rush Configuration Updates

### Add to rush.json

Add three new project entries:

```json
{
  "packageName": "@fgv/ts-chocolate",
  "projectFolder": "libraries/ts-chocolate",
  "reviewCategory": "libraries"
},
{
  "packageName": "@fgv/chocolate-cli",
  "projectFolder": "tools/chocolate-cli",
  "reviewCategory": "tools"
},
{
  "packageName": "chocolate-web",
  "projectFolder": "apps/chocolate-web",
  "reviewCategory": "apps"
}
```

## Configuration Templates

### Library package.json
```json
{
  "name": "@fgv/ts-chocolate",
  "version": "0.1.0",
  "description": "Chocolate recipe helpers and calculations",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "scripts": {
    "build": "heft build --clean",
    "test": "heft test",
    "clean": "heft clean"
  },
  "dependencies": {
    "@fgv/ts-utils": "workspace:*",
    "@fgv/ts-json": "workspace:*"
  },
  "devDependencies": {
    "@fgv/ts-utils-jest": "workspace:*"
  }
}
```

### CLI package.json
```json
{
  "name": "@fgv/chocolate-cli",
  "version": "0.1.0",
  "description": "Chocolate recipe management CLI",
  "bin": {
    "choco": "lib/cli.js"
  },
  "main": "lib/cli.js",
  "types": "lib/cli.d.ts",
  "scripts": {
    "build": "heft build --clean",
    "test": "heft test",
    "clean": "heft clean"
  },
  "dependencies": {
    "@fgv/ts-chocolate": "workspace:*",
    "@fgv/ts-utils": "workspace:*",
    "commander": "^11.0.0",
    "chalk": "^5.3.0"
  }
}
```

### Web package.json (basic structure, webpack details TBD)
```json
{
  "name": "chocolate-web",
  "version": "0.1.0",
  "description": "Chocolate recipe web application",
  "scripts": {
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@fgv/ts-chocolate": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@heroicons/react": "^2.0.0"
  },
  "devDependencies": {
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^4.15.1",
    "typescript": "~5.7.3",
    "tailwindcss": "^3.4.0"
  }
}
```

## Validation Checklist (Stage 1)

After package setup, verify:

- [ ] All three packages added to `rush.json`
- [ ] `rush update` completes successfully
- [ ] `rush build` completes for all three packages
- [ ] Library exports a placeholder
- [ ] CLI has basic structure (main entry point)
- [ ] Web app has React + Tailwind + Heroicons setup
- [ ] Web app uses Webpack (not Vite)
- [ ] All packages follow monorepo conventions
- [ ] TypeScript configurations are correct
- [ ] ESLint configurations are correct

## Implementation Notes

1. **Follow existing patterns**: Look at other libraries, tools, and apps in the repo for configuration templates
2. **Minimal initial content**: Just get packages building, no functionality yet
3. **Use workspace dependencies**: All inter-package deps use `workspace:*`
4. **Match repo versions**: Use same TypeScript version (5.7.3), React version, etc.

## Next Stage Preview

**Stage 2** will define core abstractions:
- Ingredient interface and basic implementation
- Recipe interface and basic implementation
- Collection patterns for managing ingredients and recipes
- Focus on interfaces and types, minimal implementation

---

**Ready for Stage 1 Implementation**
