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
│   │   │   ├── ResolutionViewer.tsx
│   │   │   └── ConfigurationTool.tsx
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
- [x] Implement file/folder selection using File System Access API
- [x] Integrate ts-res ImportManager for resource loading
- [x] Build resources with ResourceManagerBuilder
- [x] Generate compiled resources with getCompiledResourceCollection
- [x] Initialize ResourceResolver with compiled collection

### Phase 3: Core Application Layout
- [x] Create main app layout with sidebar and content areas
- [x] Fix icon sizing and improve visual hierarchy  
- [x] Resolve Tailwind CSS v4 configuration issues
- [x] Implement tool navigation and state management
- [x] Add messages window for status and error display

### Phase 4: Tool Implementation

#### Source Browser Tool
- [x] Display built resources as alphabetically sorted list
- [x] Implement resource selector pane
- [x] Create resource viewer pane with detailed information
- [x] Show fully qualified resource IDs

#### Compiled Resource Browser Tool
- [x] Create tree view with 4 main sections: Resources, Decisions, Condition Sets, Conditions
- [x] Display compiled resources with proper type safety and structure
- [x] Implement flat array displays for Decisions, Condition Sets, and Conditions
- [x] Create left browser panel for tree navigation and right details panel
- [x] Display comprehensive details when items are selected
- [x] Show counts in section headers and full details on selection
- [x] Integrate with existing message system for status updates
- [x] Fix React object rendering issues for robust candidate display

#### Resource Resolution Viewer Tool
- [x] Create context panel for qualifier input with table format (one entry per qualifier)
- [x] Implement qualifier validation and dynamic context loading
- [x] Add resource browser for selection with search capability
- [x] Create candidate display with view selector (best/all/raw modes)
- [x] Support "best candidate" and "all candidates" views with condition set keys
- [x] Separate matching and non-matching candidates with subtle visual distinction
- [x] Add comprehensive default context values (homeTerritory=US, currentTerritory=US, language=en-US, platform=web, environment=production, role=user, density=standard)
- [x] Implement metadata-first approach with graceful fallbacks for condition set keys
- [x] Add visual badges for condition set keys with color coding

#### Configuration Tool
*This tool enables users to define and manage the fundamental building blocks of the ts-res system - the qualifiers and types that drive resource resolution.*

- [ ] Create three-panel vertical layout for system configuration
- [ ] **Qualifier Types Panel**: Display and edit qualifier type configurations
  - [ ] Support editing existing built-in types (language, territory, literal)
  - [ ] Allow adding new qualifier types by configuring one of the three base types
  - [ ] Handle complex literal qualifier type configuration with validation patterns
  - [ ] Support configuration options like `allowContextList` for territory types
  - [ ] Example: Create "territory-list" from TerritoryQualifierType with allowContextList=true
- [ ] **Qualifiers Panel**: Display and edit qualifier configurations
  - [ ] Support adding new qualifiers freely with validation
  - [ ] Allow editing or removing existing qualifier configurations
  - [ ] Link qualifiers to their corresponding qualifier types
- [ ] **Resource Types Panel**: Display resource types (read-only for now)
  - [ ] Show built-in resource types (json, text, etc.)
  - [ ] Display resource type properties and configurations
- [ ] **Integration**: Ensure Resolution Viewer context panel reflects actual configuration
  - [ ] Dynamic context loading based on configured qualifiers
  - [ ] Update default values based on qualifier configurations
  - [ ] Real-time updates when configuration changes. changing configuration should clear the any loaded resources or files, as the configuration changes how the loader works.

### Phase 5: Polish & Optimization
- [ ] Implement responsive design for mobile and desktop
- [ ] Add comprehensive error handling
- [ ] Implement performance optimizations for large datasets
- [ ] Add loading states and progress indicators
- [ ] Create comprehensive documentation

### Phase 5: Advanced Features & Bug Fixes
- [ ] Infer ID of loose candidate or resource during import
- [ ] Add filtering of resources by context 
- [ ] Add composition support
- [ ] Complete support for resolution of default values

### Phase 6: Extended Configuration Support
- [ ] Support for custom resource type definitions
- [ ] Advanced qualifier type configuration options
- [ ] Import/export of system configurations
- [ ] Configuration validation and error handling

## Technical Specifications

### Configuration Tool Architecture

The Configuration Tool provides a comprehensive interface for managing the ts-res system configuration:

**Qualifier Types Configuration**:
- **Built-in Base Types**: Three fundamental types that cannot be created/deleted:
  - `LanguageQualifierType`: Handles language-related qualifiers (e.g., "en-US", "fr-CA")
  - `TerritoryQualifierType`: Handles territory/region qualifiers (e.g., "US", "CA", "GB")
  - `LiteralQualifierType`: Complex type for literal string matching with various options
- **Configuration Options**: Each type has configurable properties:
  - `allowContextList`: Controls if qualifier can accept list contexts (e.g., 0=false, 1=true, 2=multiple)
  - `defaultPriority`: Sets default priority for conditions using this type
  - Type-specific options (e.g., validation patterns for literals)
- **New Types**: Can be created by configuring one of the three base types with different settings

**Qualifiers Configuration**:
- **Full CRUD Operations**: Create, read, update, delete qualifiers freely
- **Type Association**: Each qualifier must be linked to a qualifier type
- **Properties**: Configure name, type, default priority, validation rules
- **Usage Tracking**: Show where qualifiers are used in resources

**Resource Types Display**:
- **Read-Only**: Built-in resource types cannot be edited (future enhancement)
- **Properties**: Show name, validation rules, supported operations
- **Usage Statistics**: Display how many resources use each type

**Integration Requirements**:
- **Dynamic Context Loading**: Resolution Viewer must reflect actual configured qualifiers
- **Validation**: Ensure configuration changes don't break existing resources
- **Real-time Updates**: Changes should be immediately reflected in other tools

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

### Phase 7: Enhanced UX
- [ ] Keyboard shortcuts
- [ ] Drag & drop file import
- [ ] Search and filtering capabilities
- [ ] Resource comparison views
- [ ] Custom theme support

### Phase 8: Advanced Resource Features
- [ ] Filtered resource views
- [ ] Flattened resource displays
- [ ] Composed candidate resolution
- [ ] Attribution and debugging metadata
- [ ] Export/import functionality for configurations

### Phase 9: Developer Tools
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