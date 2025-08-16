# @fgv/ts-res-ui-components

React components for building user interfaces that work with the [ts-res](https://github.com/fgv/ts-res) multidimensional resource management library.

## Overview

This library provides a complete set of React components, hooks, and utilities for creating applications that visualize, manage, and interact with ts-res resource systems. It supports the full workflow from importing configurations to resolving resources with dynamic context.

## Warning
This packlet is largely AI written, and it shows.

## Features

- **🔄 Resource Management**: Import, process, and manage ts-res configurations and bundles
- **🔍 Advanced Filtering**: Filter resources by context with qualifier reduction
- **🎯 Resource Resolution**: Test resource resolution with dynamic context values
- **📊 Visualization**: Multiple views for exploring resource structures and compiled output
- **⚙️ Configuration**: Visual configuration management for qualifier types, qualifiers, and resource types
- **📁 File Handling**: Support for directory imports, ZIP files, and bundle loading
- **🎨 Modern UI**: Built with Tailwind CSS and Heroicons for a clean, responsive interface

## Installation

```bash
npm install @fgv/ts-res-ui-components
```

### Peer Dependencies

This library requires the following peer dependencies:

```json
{
  "@fgv/ts-res": "^5.0.0",
  "@fgv/ts-utils": "^5.0.0",
  "@fgv/ts-json-base": "^5.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

## Quick Start

### Basic Usage with ResourceOrchestrator

The `ResourceOrchestrator` component provides centralized state management for all ts-res UI functionality:

```tsx
import React from 'react';
import { ResourceOrchestrator, ImportView, SourceView } from '@fgv/ts-res-ui-components';

function App() {
  return (
    <ResourceOrchestrator>
      {({ state, actions }) => (
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Resource Manager</h1>
            
            {!state.processedResources ? (
              <ImportView
                onImport={actions.importDirectory}
                onBundleImport={actions.importBundle}
                onZipImport={actions.importZipWithConfig}
              />
            ) : (
              <SourceView
                resources={state.processedResources}
                onExport={actions.exportData}
              />
            )}
          </div>
        </div>
      )}
    </ResourceOrchestrator>
  );
}

export default App;
```

### Using Individual Hooks

For more granular control, you can use individual hooks:

```tsx
import React from 'react';
import { useResourceData, SourceView } from '@fgv/ts-res-ui-components';

function MyResourceViewer() {
  const { state, actions } = useResourceData();

  const handleFileImport = async (files: File[]) => {
    const importedFiles = await processFiles(files); // Your file processing logic
    await actions.processFiles(importedFiles);
  };

  return (
    <div>
      {state.isProcessing && <div>Processing...</div>}
      {state.error && <div className="error">{state.error}</div>}
      {state.processedResources && (
        <SourceView 
          resources={state.processedResources}
          onExport={(data) => console.log('Export:', data)}
        />
      )}
    </div>
  );
}
```

## Architecture

### Component Hierarchy

```
ResourceOrchestrator (state management)
├── ImportView (file/bundle import)
├── SourceView (resource collection display)
├── FilterView (context filtering)
├── CompiledView (compiled resource structure)
├── ResolutionView (resource resolution testing)
├── ConfigurationView (system configuration)
└── ZipLoaderView (ZIP file handling)
```

### Data Flow

1. **Import Phase**: Resources are imported via `ImportView` or programmatically
2. **Processing Phase**: Raw files are processed into a `ProcessedResources` object containing:
   - `ResourceManagerBuilder` for build-time operations
   - `CompiledResourceCollection` for runtime efficiency
   - `ResourceResolver` for resource resolution
3. **Interaction Phase**: Users can filter, explore, and test resource resolution
4. **Export Phase**: Processed resources can be exported as JSON or compiled bundles

### Key Concepts

- **ProcessedResources**: The main data structure containing both build-time and runtime representations
- **ResourceManagerBuilder**: Build-time resource manager for constructing and modifying resources
- **CompiledResourceCollection**: Runtime-optimized representation for efficient resolution
- **Filter Context**: Dynamic context values used to filter and resolve resources
- **Resolution State**: Testing environment for resource resolution with different contexts

## Core Components

### ResourceOrchestrator

The main orchestration component that manages all state and provides actions via render props.

```tsx
<ResourceOrchestrator
  initialConfiguration={myConfig}
  onStateChange={(state) => console.log('State changed:', state)}
>
  {({ state, actions }) => (
    // Your UI components
  )}
</ResourceOrchestrator>
```

### ImportView

Handles importing resource files, directories, bundles, and ZIP files.

```tsx
<ImportView
  onImport={actions.importDirectory}
  onBundleImport={actions.importBundle}
  onZipImport={actions.importZipWithConfig}
  acceptedFileTypes={['.json', '.ts', '.js']}
  onMessage={(type, message) => console.log(type, message)}
/>
```

### SourceView

Displays the source resource collection with search and navigation capabilities.

```tsx
<SourceView
  resources={state.processedResources}
  selectedResourceId={selectedId}
  onResourceSelect={setSelectedId}
  onExport={actions.exportData}
/>
```

### FilterView

Provides filtering capabilities with context value specification.

```tsx
<FilterView
  resources={state.processedResources}
  filterState={filterState}
  filterActions={filterActions}
  filterResult={filterResult}
  onFilterResult={setFilterResult}
/>
```

### CompiledView

Shows the compiled resource structure with detailed candidate information.

```tsx
<CompiledView
  resources={state.processedResources}
  filterResult={filterResult}
  useNormalization={true}
  onExport={(data, type) => exportData(data, type)}
/>
```

### ResolutionView

Interactive resource resolution testing with context management and support for custom resource editors.

```tsx
<ResolutionView
  resources={state.processedResources}
  resolutionState={resolutionState}
  resolutionActions={resolutionActions}
  availableQualifiers={availableQualifiers}
  resourceEditorFactory={myResourceEditorFactory}
/>
```

#### Custom Resource Editors

The ResolutionView supports custom editors for specific resource types through the `ResourceEditorFactory` interface:

```tsx
import { ResourceEditorFactory, ResourceEditorResult, ResourceEditorProps } from '@fgv/ts-res-ui-components';

// Custom editor component
const MarketInfoEditor: React.FC<ResourceEditorProps> = ({
  value,
  resourceId,
  isEdited,
  editedValue,
  onSave,
  onCancel,
  disabled,
  className
}) => {
  // Custom form-based editor implementation
  return (
    <div className={`market-info-editor ${className}`}>
      {/* Custom editing interface for market information */}
    </div>
  );
};

// Resource editor factory
class MyResourceEditorFactory implements ResourceEditorFactory {
  createEditor(resourceId: string, resourceType: string, value: any): ResourceEditorResult {
    if (resourceType === 'marketInfo') {
      return {
        success: true,
        editor: MarketInfoEditor
      };
    }
    
    return {
      success: false,
      message: `No custom editor available for resource type '${resourceType}'`
    };
  }
}

// Usage
const editorFactory = new MyResourceEditorFactory();

<ResolutionView
  resources={resources}
  resourceEditorFactory={editorFactory}
  // ... other props
/>
```

**Benefits of Custom Editors:**
- **Type-Specific UX**: Provide structured editing interfaces for different resource types
- **Graceful Fallback**: Unknown resource types automatically fall back to JSON editor
- **Extensible**: Easy to add new editors for new resource types
- **Error Handling**: Factory failures are caught and reported to users

### ConfigurationView

Visual configuration management for the ts-res system.

```tsx
<ConfigurationView
  configuration={state.activeConfiguration}
  onConfigurationChange={actions.applyConfiguration}
  onMessage={(type, msg) => showMessage(type, msg)}
/>
```

## Hooks API

### useResourceData

Main hook for resource processing and management.

```tsx
const { state, actions } = useResourceData();

// Process files
await actions.processFiles(importedFiles);

// Resolve a resource
const result = await actions.resolveResource('my.resource', {
  language: 'en-US',
  environment: 'production'
});

// Apply configuration
actions.applyConfiguration(newConfig);
```

### useFilterState

Manages resource filtering state and actions.

```tsx
const { filterState, filterActions } = useFilterState();

// Update filter values
filterActions.updateFilterValues({ 
  language: 'en-US',
  environment: 'prod' 
});

// Apply filters
filterActions.applyFilterValues();

// Check if there are pending changes
if (filterState.hasPendingChanges) {
  // Show save prompt
}
```

### useResolutionState

Manages resource resolution testing state.

```tsx
const { state, actions } = useResolutionState(processedResources);

// Set context for resolution testing
actions.setContextValues({ language: 'en-US' });

// Test resource resolution
const result = await actions.resolveResource('test.resource');
```

### useConfigurationState

Manages system configuration state.

```tsx
const { configuration, updateConfiguration, resetConfiguration } = useConfigurationState();

// Update qualifier types
updateConfiguration({
  ...configuration,
  qualifierTypes: [...newQualifierTypes]
});
```

## Styling

This library uses Tailwind CSS for styling. Make sure to include Tailwind CSS in your project:

```bash
npm install -D tailwindcss
```

### Tailwind Configuration

Add the library's source files to your Tailwind content configuration:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@fgv/ts-res-ui-components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Custom Styling

All components accept a `className` prop for custom styling:

```tsx
<SourceView 
  className="my-custom-class"
  resources={resources}
/>
```

## Advanced Usage

### Custom Resource Processing

```tsx
import { processImportedDirectory, createTsResSystemFromConfig } from '@fgv/ts-res-ui-components';

// Custom processing pipeline
const customProcessor = async (files: ImportedFile[]) => {
  // Pre-process files
  const processedFiles = files.map(transformFile);
  
  // Create configuration
  const config = await createConfigFromFiles(processedFiles);
  
  // Create ts-res system
  const system = await createTsResSystemFromConfig(config);
  
  return system;
};
```

### Resource Resolution with Custom Context

```tsx
const { state, actions } = useResourceData();

// Complex context resolution
const resolveWithComplexContext = async (resourceId: string) => {
  const context = {
    language: getUserLanguage(),
    region: getUserRegion(),
    theme: getThemePreference(),
    featureFlags: await getFeatureFlags()
  };
  
  return await actions.resolveResource(resourceId, context);
};
```

### Bundle Creation and Export

```tsx
const { state, actions } = useResourceData();

// Create and export bundle
const exportBundle = async () => {
  if (state.processedResources) {
    const bundleData = {
      ...state.processedResources.compiledCollection,
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        description: 'My resource bundle'
      }
    };
    
    actions.exportData(bundleData, 'bundle');
  }
};
```

## Error Handling

The library provides comprehensive error handling through the state management system:

```tsx
<ResourceOrchestrator>
  {({ state, actions }) => (
    <div>
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{state.error}</p>
          <button 
            onClick={actions.clearError}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Rest of your UI */}
    </div>
  )}
</ResourceOrchestrator>
```

## TypeScript Support

This library is written in TypeScript and provides comprehensive type definitions:

```tsx
import type {
  ProcessedResources,
  FilterState,
  ResolutionResult,
  Message,
  ImportedFile,
  ResourceEditorFactory,
  ResourceEditorResult,
  ResourceEditorProps
} from '@fgv/ts-res-ui-components';

// Type-safe component props
interface MyComponentProps {
  resources: ProcessedResources;
  onMessage: (type: Message['type'], message: string) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ resources, onMessage }) => {
  // Component implementation
};
```

## Performance Considerations

- **Lazy Loading**: Components are designed for lazy loading and code splitting
- **Memoization**: Internal state updates are optimized with React.memo and useMemo
- **Virtual Scrolling**: Large resource lists use virtual scrolling for performance
- **Compiled Resources**: Runtime resolution uses pre-compiled structures for efficiency

## Browser Support

- Chrome/Edge: >= 88
- Firefox: >= 85  
- Safari: >= 14
- Modern browsers with ES2020 support

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## API Documentation

Comprehensive API documentation is available in the [docs](./docs) directory:

- **[API Overview](./docs/index.md)** - Complete API reference
- **[Components](./docs/ts-res-ui-components.md)** - All available components and their props
- **[Hooks](./docs/ts-res-ui-components.md)** - State management hooks (useViewState, useResolutionState, etc.)
- **[Types](./docs/ts-res-ui-components.md)** - TypeScript interfaces and type definitions
- **[Utilities](./docs/ts-res-ui-components.md)** - Helper functions and utility types

The API documentation includes detailed examples, usage patterns, and type information for all public APIs.

## Support

For questions and support, please:

1. Check the [API documentation](./docs/index.md) for detailed component usage
2. Review the [ts-res documentation](https://docs.ts-res.dev) for core concepts
3. Search [existing issues](https://github.com/fgv/ts-res/issues)
4. Create a [new issue](https://github.com/fgv/ts-res/issues/new)