# Sudoku Puzzle App

A React-based Sudoku puzzle application that demonstrates integration with the `@fgv/ts-sudoku-ui` library components.

## Features

- **Multiple Game Types**: Support for Classic Sudoku, Sudoku X, and Killer Sudoku variants
- **Game Selection**: Interactive game type selection with descriptions
- **Export Functionality**: Export puzzle states to JSON files
- **Responsive Design**: Works on both desktop and mobile devices
- **TypeScript**: Full TypeScript support with strict type checking

## Development

```bash
# Start development server
rushx dev

# Build for production
rushx build

# Preview production build
rushx preview

# Clean build artifacts
rushx clean
```

## Architecture

This app follows the Library + App architecture pattern:
- **Library**: `@fgv/ts-sudoku-ui` provides React components
- **App**: This application consumes library components and provides the user interface

### Project Structure

```
apps/sudoku/
├── src/
│   ├── components/     # Shared UI components
│   │   └── Navigation.tsx
│   ├── pages/          # Route components
│   │   ├── HomePage.tsx
│   │   ├── GameSelectionPage.tsx
│   │   └── PuzzlePage.tsx
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # App entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Integration Status

✅ **Completed**:
- App structure and routing
- Game type selection interface
- Puzzle data loading from library format
- Export functionality
- Build system integration with Rush monorepo

⚠️ **Pending**:
- Full interactive grid integration (requires resolving ES module compatibility between libraries)

## Next Steps

1. Resolve ES module compatibility issues between `@fgv/ts-sudoku-lib` and `@fgv/ts-sudoku-ui`
2. Implement full `SudokuGridEntry` component integration
3. Add puzzle validation and solving feedback
4. Implement puzzle generation for different difficulty levels
5. Add user preferences and settings persistence

## Dependencies

- **React 19**: Modern React with hooks
- **React Router**: Client-side routing
- **Vite**: Fast build tool and dev server
- **@fgv/ts-sudoku-ui**: Sudoku UI components library
- **@fgv/ts-sudoku-lib**: Core Sudoku puzzle logic
- **@fgv/ts-utils**: Utility functions and Result pattern

## Browser Support

Supports all modern browsers that support ES2020 and React 19.