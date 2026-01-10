# Chocolate Lab Web Application

Interactive web application for chocolate recipe management and calculation.

## Overview

This web application provides:
- Ingredient database browsing with search and filtering
- Recipe browsing and scaling (planned)
- Mold/form management (planned)
- Confection recipe composition (planned)
- Light/dark theme support
- Persistent settings

## Current Status

The application foundation is complete with:
- **Ingredients Tool**: Browse, search, and filter ingredients by category, collection, and tags. View detailed ingredient information including ganache characteristics and temperature curves.
- **Core Infrastructure**: Theme context (light/dark/system), settings context with localStorage persistence, observability context for messaging.
- **Layout**: AppShell with header, top navigation tabs, collapsible sidebar, and message pane.

### Architecture

```
src/
├── contexts/           # React contexts for global state
│   ├── ThemeContext    # Light/dark/system theme
│   ├── SettingsContext # Persistent app settings
│   ├── ChocolateContext# RuntimeContext integration
│   └── ObservabilityContext # Logging and messages
├── components/
│   ├── layout/         # AppShell, Header, TopNavTabs, MessagesPane
│   └── common/         # LoadingSpinner, SearchInput
├── tools/
│   ├── ingredients/    # Ingredient browse and detail views
│   ├── recipes/        # Placeholder
│   ├── molds/          # Placeholder
│   ├── confections/    # Placeholder
│   └── settings/       # Settings panel
└── types/              # TypeScript type definitions
```

### Dependencies

Uses the `@fgv/ts-chocolate-ui` library for reusable domain components:
- `CategoryBadge`, `CollectionBadge`, `TagBadge` - Visual badges
- `GanacheCharacteristicsDisplay` - Percentage bar visualization
- `TemperatureCurveDisplay` - Temperature curve visualization
- `IngredientCard` - Summary card for browse views
- `DetailSection` - Collapsible sections for detail views

## Roadmap

### Next Up
- Recipes tool with browse, detail, and scaling views
- Molds tool for form management
- Confections tool for composed recipes
- Collection management in settings (enable/disable, unlock encrypted)

### Future Considerations
- Cooking sessions
- Journal for tracking work
- Recipe editing with version control
- Procedure editing
- Attribution tracking for derived recipes

## Technology Stack

- **React** 19.2
- **TypeScript** 5.9
- **Tailwind CSS** 3.4
- **Heroicons** 2.2
- **Webpack** 5.104

## Development

```bash
# Install dependencies (from repo root)
rush install

# Start development server
rushx dev

# Build for production
rushx build

# Clean build artifacts
rushx clean
```

The app will be available at `http://localhost:3002` when running in development mode.

## Notes

- The `@fgv/ts-chocolate` library uses browser-specific exports to avoid Node.js crypto dependencies in the web build.
- Tailwind CSS requires `postcss.config.js` for proper processing.
- The webpack config includes module resolution settings for Rush monorepo symlinks.

## License

MIT
