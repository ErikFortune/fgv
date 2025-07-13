# TS-RES Browser Tool - Project Plan

## Overview
A visual tool for loading, browsing, and experimenting with ts-res resources. Built as a React web application for optimal performance and modern browser capabilities.

## Architecture Decision: React Web App vs Electron

**Decision: React Web App**

Based on 2024 best practices research:
- **Performance**: Web apps are significantly faster than Electron apps
- **Security**: Fewer attack vectors than Electron's native access
- **Development**: Simpler tooling and deployment
- **User Experience**: Modern browsers provide excellent file system access
- **Maintenance**: No native OS compatibility issues

**Technology Stack**:
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Webpack 
- **File Access**: File System Access API with fallback to file input
- **Styling**: Tailwind CSS for utility-first styling
- **Icons**: Heroicons for consistent iconography
- **State Management**: React Context + useReducer for complex state

## Rush Monorepo Requirements

**Package Management**:
- **Never** use `npm install` or edit `package.json` directly
- Use `rush add -p <package>` for runtime dependencies (note: `-p` flag required)
- Use `rush add --dev -p <package>` for dev dependencies
- Use `rush add --peer -p <package>` for peer dependencies
- Can install multiple packages at once: `rush add -p package1 package2 package3`
- Rush automatically uses consistent versions across monorepo or 'latest' for new packages
- **Work in a branch and ask for help when dealing with dependency conflicts**

**Git Workflow**:
- **NEVER commit changes without user review** - staging files is fine
- Always confirm commit message and timing with user before executing `git commit`
- Work in feature branches and get approval before merging

**Runtime Requirements**:
- **Node Version**: v20 (monorepo standard)
- **Monorepo Consistency**: Follow existing patterns and style

**Required Dependencies**:
- `@fgv/ts-utils`: Result pattern, collections, validation, conversion
- `@fgv/ts-json-base`: Basic JSON handling
- `@fgv/ts-json`: Intensive JSON work (templating, merging, transformation)
- `@fgv/ts-utils-jest`: Testing with result-specific jest matchers
- `@fgv/ts-bcp47`: Structured language tags (if needed)
- `@fgv/ts-res`: Core resource management (runtime dependency)

**Development Patterns**:
- **Result Pattern**: Use `Result<T>` for all operations that can fail
- **Error Handling**: Prefer `.onSuccess()`, `.onFailure()`, `.orThrow()` patterns
- **Validation**: Use converters and validators from ts-utils
- **Testing**: Use result-specific matchers like `.toSucceedWith()`, `.toFailWith()`

## Project Structure

```
tools/ts-res-browser/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MessagesWindow.tsx
│   │   ├── tools/
│   │   │   ├── SourceBrowser.tsx
│   │   │   ├── CompiledBrowser.tsx
│   │   │   └── ResolutionViewer.tsx
│   │   └── common/
│   │       ├── FileImporter.tsx
│   │       ├── ResourceTree.tsx
│   │       ├── ResourceViewer.tsx
│   │       └── QualifierInput.tsx
│   ├── hooks/
│   │   ├── useResourceManager.ts
│   │   ├── useFileImport.ts
│   │   └── useResourceResolver.ts
│   ├── types/
│   │   └── app.ts
│   ├── utils/
│   │   ├── import.ts
│   │   └── formatting.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Implementation Phases

### Phase 1: Project Setup & Core Infrastructure
- [x] Research architecture decision
- [x] Create new branch: `ts-res-browser` off `alpha`
- [x] Initialize project structure with Rush integration
- [x] Configure Webpack + React + TypeScript
- [x] Add dependencies using `rush add`
- [x] Set up Tailwind CSS and Heroicons
- [x] Create comprehensive test data for manual verification
- [x] Set up build tooling for npx execution

### Phase 2: File Import & Resource Loading
- [ ] Implement file/folder selection using File System Access API
- [ ] Integrate ts-res ImportManager for resource loading
- [ ] Build resources with ResourceManagerBuilder
- [ ] Generate compiled resources with getCompiledResourceCollection
- [ ] Initialize ResourceResolver with compiled collection

### Phase 3: Core Application Layout
- [ ] Create main app layout with sidebar and content areas
- [ ] Implement tool navigation and state management
- [ ] Add messages window for status and error display
- [ ] Create responsive design for various screen sizes

### Phase 4: Tool Implementation

#### Source Browser Tool
- [ ] Display built resources as alphabetically sorted list
- [ ] Implement resource selector pane
- [ ] Create resource viewer pane with detailed information
- [ ] Show fully qualified resource IDs

#### Compiled Resource Browser Tool
- [ ] Create tree view for compiled resources
- [ ] Implement tree navigation and selection
- [ ] Display resource details in viewer pane
- [ ] Show full ID in viewer, short name in tree

#### Resource Resolution Viewer Tool
- [ ] Create context panel for qualifier input
- [ ] Implement qualifier validation
- [ ] Add resource browser for selection
- [ ] Create candidate display with view selector
- [ ] Support "best candidate" and "all candidates" views

### Phase 5: Polish & Optimization
- [ ] Add comprehensive error handling
- [ ] Implement performance optimizations for large datasets
- [ ] Add loading states and progress indicators
- [ ] Create comprehensive documentation

## Technical Specifications

### Rush Integration
```bash
# Initialize new project
rush init

# Add dependencies (NOTE: -p flag required, can add multiple at once)
rush add -p @fgv/ts-utils @fgv/ts-json-base @fgv/ts-json @fgv/ts-res
rush add -p react react-dom
rush add --dev -p @fgv/ts-utils-jest @types/react @types/react-dom
rush add --dev -p webpack webpack-cli webpack-dev-server
rush add --dev -p @babel/core @babel/preset-react @babel/preset-typescript
rush add --dev -p babel-loader css-loader style-loader html-webpack-plugin
rush add --dev -p tailwindcss postcss postcss-loader autoprefixer
rush add -p @heroicons/react

# Polyfills for browser compatibility
rush add -p core-js whatwg-fetch

# Alternative: Rspack for better performance (webpack-compatible)
rush add --dev -p @rspack/core @rspack/cli @rspack/dev-server

# Build and test
rushx build
rushx test
rushx dev
```

**⚠️ Build Tool Selection**:
- **Webpack**: Mature, excellent CommonJS support, extensive ecosystem
- **Rspack**: Rust-based webpack-compatible alternative, significantly faster
- Both work well with CommonJS monorepos without requiring infrastructure upgrades

### ⚠️ Dependency Management Warning
- Rush automatically uses consistent versions across the monorepo or 'latest' for new packages
- Dependency conflicts can be very tricky to resolve due to version synchronization
- **Always work in a branch when adding/updating dependencies**
- **Ask for help or confirmation at every step when dealing with dependency issues**

### File System Access
```typescript
// Modern browsers support File System Access API
// Fallback to traditional file input for older browsers
interface FileImportOptions {
  types: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  multiple: boolean;
  excludeAcceptAllOption: boolean;
}
```

**⚠️ Browser Compatibility Note**:
- Will need to polyfill `File` API and potentially other modern web APIs
- Consider polyfills for older browsers or environments lacking full ES6+ support
- May need polyfills for: File System Access API, FileReader, Blob, etc.

### Resource Management Integration
```typescript
// Integration with ts-res components using Result pattern
import { Result } from '@fgv/ts-utils';
import { ImportManager } from '@fgv/ts-res/src/import';
import { ResourceManagerBuilder } from '@fgv/ts-res/src/resources';
import { ResourceResolver } from '@fgv/ts-res/src/runtime';

// Workflow: File → Import → Build → Compile → Resolve
const importResult: Result<ImportManager> = importManager.importFromFileSystem(filePath);
const buildResult: Result<ResourceManagerBuilder> = resourceManager.build();
const compileResult: Result<CompiledResourceCollection> = resourceManager.getCompiledResourceCollection();
```

### Application State (using Result pattern)
```typescript
interface AppState {
  importedResources: Result<ResourceManagerBuilder>;
  compiledResources: Result<CompiledResourceCollection>;
  resolver: Result<ResourceResolver>;
  selectedTool: 'source' | 'compiled' | 'resolution';
  messages: Message[];
  loading: boolean;
  error: Result<string>;
}
```

### NPX Execution Setup

### package.json Configuration
```json
{
  "name": "@fgv/ts-res-browser",
  "bin": {
    "ts-res-browser": "./dist/cli.js"
  },
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack serve --mode development",
    "test": "jest"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### Webpack Configuration
```javascript
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
};
```

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {}
  },
  plugins: []
};
```

### CLI Entry Point
```typescript
#!/usr/bin/env node
// Launch development server or built application
// Support for different modes: dev, build, serve
```

## Future Phases (Post-MVP)

### Phase 6: Advanced Features
- [ ] Filtered resource views
- [ ] Flattened resource displays
- [ ] Composed candidate resolution
- [ ] Attribution and debugging metadata
- [ ] Export/import functionality for configurations

### Phase 7: Enhanced UX
- [ ] Keyboard shortcuts
- [ ] Drag & drop file import
- [ ] Search and filtering capabilities
- [ ] Resource comparison views
- [ ] Custom theme support

### Phase 8: Developer Tools
- [ ] Resource validation tools
- [ ] Performance profiling
- [ ] Resource optimization suggestions
- [ ] Integration with IDE extensions

## Success Metrics

1. **Functionality**: Successfully import, build, and resolve ts-res resources
2. **Performance**: Handle large resource collections (1000+ resources) smoothly
3. **Usability**: Intuitive interface for exploring resource hierarchies
4. **Reliability**: Robust error handling and recovery using Result pattern
5. **Maintainability**: Clean, well-documented codebase following monorepo patterns

## Development Workflow

1. **Branch Strategy**: Work in `ts-res-browser` branch off `alpha`
2. **Package Management**: Use `rush add` for all dependencies
3. **Git Workflow**: **NEVER commit without user review** - staging is fine
4. **Incremental Development**: Complete each phase before moving to next
5. **Testing**: Test with real ts-res projects throughout development
6. **Documentation**: Update README and inline docs as features are added
7. **Integration**: Ensure compatibility with existing ts-res ecosystem

## Risk Mitigation

### Technical Risks
- **File System Access**: Implement robust fallbacks for browser compatibility
- **Browser Compatibility**: Need polyfills for File API and other modern web APIs
- **Large Resource Collections**: Use virtualization and lazy loading
- **Complex Resource Hierarchies**: Implement efficient tree rendering
- **Rush Integration**: Follow monorepo patterns to avoid dependency conflicts

### User Experience Risks
- **Learning Curve**: Provide clear documentation and examples
- **Performance**: Optimize for common use cases first
- **Browser Compatibility**: Target modern browsers, document requirements

## Getting Started

Once the project is initialized:

1. **Development**: `rushx dev`
2. **Building**: `rushx build`
3. **Testing**: `rushx test`
4. **Global Install**: `npm install -g .` (after rush build)

This plan provides a structured approach to building the ts-res browser tool while maintaining consistency with the Rush monorepo patterns and leveraging the existing ts-utils ecosystem. 