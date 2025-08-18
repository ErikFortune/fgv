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
- **🔒 View Mode Locking**: Lock to single view mode for simplified interfaces
- **📊 Visualization**: Multiple views for exploring resource structures and compiled output
- **⚙️ Configuration**: Visual configuration management for qualifier types, qualifiers, and resource types
- **📁 File Handling**: Support for directory imports, ZIP files via ts-res zip-archive packlet, and bundle loading
- **🎨 Modern UI**: Built with Tailwind CSS and Heroicons for a clean, responsive interface

### ZIP Archive Integration

This library now uses the **ts-res zip-archive packlet** as the single source of truth for all ZIP operations, providing:

- **Universal compatibility**: Works in both browser and Node.js environments using fflate
- **Standardized format**: Common ZIP bundle format across all ts-res tools  
- **Simplified API**: Direct integration with ts-res ZIP archive functionality
- **Processing helpers**: Utilities to integrate ZIP data with ts-res-ui-components workflows

The `ImportView` component handles ZIP files automatically, and the `ZipTools` namespace provides processing helpers for custom ZIP workflows.

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
├── ImportView (file/bundle/ZIP import)
├── SourceView (resource collection display)
├── FilterView (context filtering)
├── CompiledView (compiled resource structure)
├── ResolutionView (resource resolution testing)
└── ConfigurationView (system configuration)
```

### Data Flow

1. **Configuration Phase**: System configuration is created or managed via `ConfigurationView`
   - Define qualifier types (language, territory, platform, etc.)
   - Configure qualifiers and their default values
   - Set up resource types and validation rules
2. **Import Phase**: Resources are imported via `ImportView` or programmatically
   - Individual JSON files, directories, ZIP bundles, or pre-compiled collections
   - Configuration can be imported alongside resources or applied separately
3. **Processing Phase**: Raw files are processed into a `ProcessedResources` object containing:
   - `ResourceManagerBuilder` for build-time operations
   - `CompiledResourceCollection` for runtime efficiency
   - `ResourceResolver` for resource resolution
4. **Interaction Phase**: Users can filter, explore, and test resource resolution
   - Filter resources with context values using `FilterView`
   - Browse source and compiled structures with `SourceView` and `CompiledView`
   - Test resolution with different contexts using `ResolutionView`
5. **Export Phase**: Processed resources can be exported as JSON or compiled bundles

### Key Concepts

- **ProcessedResources**: The main data structure containing both build-time and runtime representations
- **ResourceManagerBuilder**: Build-time resource manager for constructing and modifying resources
- **CompiledResourceCollection**: Runtime-optimized representation for efficient resolution
- **Filter Context**: Dynamic context values used to filter and resolve resources
- **Resolution State**: Testing environment for resource resolution with different contexts

## Core Components

### ResourceOrchestrator

The main orchestration component that manages all state and provides actions via render props.

> 📚 **[See ResourceOrchestrator documentation →](./docs/ts-res-ui-components.resourceorchestrator.md)**

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

### ConfigurationView

Visual configuration management for ts-res system settings including qualifier types, qualifiers, and resource types.

> 📚 **[See ConfigurationView documentation →](./docs/ts-res-ui-components.configurationview.md)**

```tsx
<ConfigurationView
  configuration={state.activeConfiguration}
  onConfigurationChange={actions.applyConfiguration}
  onSave={actions.saveConfiguration}
  hasUnsavedChanges={state.hasConfigurationChanges}
  onMessage={(type, message) => console.log(type, message)}
/>
```

**Key features:**
- **Qualifier type management**: Define language, territory, platform, and custom qualifier types
- **Qualifier configuration**: Set up specific qualifiers with default values and validation
- **Resource type management**: Configure resource types and their validation rules
- **Import/export**: Load configurations from files or export current settings
- **Real-time validation**: Validate configuration changes as you edit
- **Change tracking**: Visual indicators for unsaved changes

### ImportView

Handles importing resource files, directories, bundles, and ZIP files. Uses the ts-res zip-archive packlet for all ZIP operations.

> 📚 **[See ImportView documentation →](./docs/ts-res-ui-components.importview.md)**

```tsx
<ImportView
  onImport={actions.importDirectory}
  onBundleImport={actions.importBundle}
  onZipImport={(zipData, config) => {
    // zipData contains files and directory structure from ZIP
    // config contains any configuration found in the ZIP
    actions.importDirectory(zipData, config);
  }}
  acceptedFileTypes={['.json', '.ts', '.js']}
  onMessage={(type, message) => console.log(type, message)}
/>
```

### ResourcePicker

Core component for browsing and selecting resources with advanced features like search, annotations, and pending resource support.  The resource picker
is a generic component used by all of the views, which can also be used to power other application-specific views.

> 📚 **[See complete ResourcePicker documentation →](./docs/ts-res-ui-components.resourcepicker.md)**

```tsx
<ResourcePicker
  resources={state.processedResources}
  selectedResourceId={selectedId}
  onResourceSelect={(selection) => {
    setSelectedId(selection.resourceId);
    // Access resource data directly without additional lookups
    if (selection.resourceData) {
      handleResourceData(selection.resourceData);
    }
    // Handle pending resources
    if (selection.isPending) {
      console.log(`Pending ${selection.pendingType} operation`);
    }
  }}
  options={{
    defaultView: "tree",
    enableSearch: true,
    searchPlaceholder: "Search resources...",
    height: "500px"
  }}
  resourceAnnotations={{
    'user.welcome': { 
      badge: { text: '3', variant: 'info' },
      suffix: '(3 candidates)'
    }
  }}
  pendingResources={pendingChanges}
/>
```

**Key features:**
- **Enhanced callbacks**: Get resource data and metadata in selection callback
- **Multiple view modes**: List and tree views with search
- **Visual annotations**: Badges, indicators, and suffixes
- **Pending resources**: Show unsaved changes with visual distinction
- **Branch isolation**: Focus on specific parts of large resource trees
- **Type safety**: Full TypeScript support with generic resource types
- **Debug controls**: Optional ResourcePickerOptionsControl for development and debugging

#### ResourcePickerOptionsControl

A debugging/design tool for interactively configuring ResourcePicker behavior. Hidden by default for production use, but can be enabled in development:

```tsx
// All view components support pickerOptionsPresentation
<SourceView
  resources={state.processedResources}
  pickerOptionsPresentation="collapsible"  // Enable picker options UI
  onMessage={(type, message) => console.log(`${type}: ${message}`)}
/>

// Direct usage in custom components
<PickerTools.ResourcePickerOptionsControl
  options={pickerOptions}
  onOptionsChange={setPickerOptions}
  presentation="popup"  // 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover'
  title="Picker Configuration"
  showAdvanced={true}
/>
```

**Presentation modes:**
- `'hidden'`: Not displayed (default for production)
- `'inline'`: Always visible with expanded controls
- `'collapsible'`: Expandable/collapsible section
- `'popup'`: Full modal dialog overlay
- `'popover'`: Small dropdown overlay

### SourceView

Displays the source resource collection with search and navigation capabilities using the enhanced ResourcePicker.

> 📚 **[See SourceView documentation →](./docs/ts-res-ui-components.sourceview.md)**

```tsx
<SourceView
  resources={state.processedResources}
  onExport={actions.exportData}
  onMessage={(type, message) => console.log(`${type}: ${message}`)}
  pickerOptions={{
    defaultView: "list",
    enableSearch: true,
    searchPlaceholder: "Search resources..."
  }}
/>
```

### FilterView

Provides filtering capabilities with context value specification and dual-resource comparison.

> 📚 **[See FilterView documentation →](./docs/ts-res-ui-components.filterview.md)**

```tsx
<FilterView
  resources={state.processedResources}
  filterState={filterState}
  filterActions={filterActions}
  filterResult={filterResult}
  onFilterResult={setFilterResult}
  onMessage={(type, message) => console.log(`${type}: ${message}`)}
  pickerOptions={{
    enableSearch: true,
    searchPlaceholder: "Search resources..."
  }}
/>
```

### CompiledView

Shows the compiled resource structure with detailed candidate information using the enhanced ResourcePicker.

> 📚 **[See CompiledView documentation →](./docs/ts-res-ui-components.compiledview.md)**

```tsx
<CompiledView
  resources={state.processedResources}
  filterResult={filterResult}
  useNormalization={true}
  onExport={(data, type) => exportData(data, type)}
  onMessage={(type, message) => console.log(`${type}: ${message}`)}
  pickerOptions={{
    defaultView: "tree",
    enableSearch: true
  }}
/>
```

### ResolutionView

Interactive resource resolution testing with context management and support for custom resource editors via the ResourceEditorFactory pattern. Supports locking to a single view mode to simplify the interface for specific use cases.

> 📚 **[See ResolutionView documentation →](./docs/ts-res-ui-components.resolutionview.md)**

```tsx
<ResolutionView
  resources={state.processedResources}
  resolutionState={resolutionState}
  resolutionActions={resolutionActions}
  availableQualifiers={availableQualifiers}
  resourceEditorFactory={myResourceEditorFactory}
  onMessage={(type, message) => console.log(`${type}: ${message}`)}
  pickerOptions={{
    defaultView: "list",
    enableSearch: true,
    searchPlaceholder: "Search resources for resolution testing..."
  }}
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

#### Context Control Extensibility

ResolutionView provides comprehensive control over the context configuration UI, allowing hosts to customize which qualifiers are editable, provide external values, and control the presentation. This is especially useful for applications that need to drive context externally or provide selective user control.

**Hide Context UI Entirely (Host-Driven Context):**
```tsx
<ResolutionView
  resources={processedResources}
  resolutionState={resolutionState}
  resolutionActions={resolutionActions}
  contextOptions={{
    showContextControls: false  // Hide all context UI
  }}
/>
```

**Lock to Single View Mode:**
```tsx
<ResolutionView
  resources={processedResources}
  resolutionState={resolutionState}
  resolutionActions={resolutionActions}
  lockedViewMode="composed"  // Lock to composed view, hide view selector
/>
```

**Lock to Best View Mode:**
```tsx
<ResolutionView
  resources={processedResources}
  resolutionState={resolutionState}
  resolutionActions={resolutionActions}
  lockedViewMode="best"  // Lock to best view, hide view selector
/>
```

**Fine-Grained Qualifier Control:**
```tsx
<ResolutionView
  resources={processedResources}
  resolutionState={resolutionState}
  resolutionActions={resolutionActions}
  contextOptions={{
    // Panel visibility control
    showContextControls: true,
    showCurrentContext: true,
    showContextActions: true,
    
    // Per-qualifier configuration
    qualifierOptions: {
      language: { 
        editable: true, 
        placeholder: "Select language..." 
      },
      platform: { 
        editable: false, 
        hostValue: "web", 
        showHostValue: true 
      },
      environment: { 
        visible: false  // Hidden from UI entirely
      }
    },
    
    // Host-managed values (invisible but active in context)
    hostManagedValues: { 
      environment: "production",
      deployment: "us-east-1"
    },
    
    // Appearance customization
    contextPanelTitle: "Resolution Context",
    globalPlaceholder: "Enter {qualifierName}..."
  }}
/>
```

**Visual Indicators:**
- **🔵 Blue border + light blue background** - Host-managed qualifiers have subtle visual styling
- **🖱️ Hover tooltip** - "Host-managed value - controlled externally" appears on hover
- **🎯 Actual values displayed** - Shows real host values instead of generic "Disabled" text
- **📋 Current context** - Displays combined user + host-managed values

**Development & Debug Controls:**
Enable the context options gear icon during development for interactive configuration:

```tsx
<ResolutionView
  resources={processedResources}
  pickerOptionsPresentation="collapsible"  // Shows both picker & context gear icons
  resolutionState={resolutionState}
  resolutionActions={resolutionActions}
/>
```

The gear icon provides a live configuration interface for:
- **Context Panel Visibility** - Show/hide controls, current context display, action buttons
- **Global Defaults** - Set default visibility and editability for all qualifiers
- **Per-Qualifier Settings** - Configure visibility, editability, host values, and custom placeholders
- **Host-Managed Values** - Set external values that override user input

This extensibility is perfect for:
- **Embedded applications** where the host drives context from sidebar controls
- **Guided workflows** where only specific qualifiers should be user-editable
- **Multi-tenant applications** where some context is determined by tenant configuration
- **Progressive disclosure** where advanced qualifiers are hidden from basic users

### MessagesWindow

Displays and manages application messages with filtering, search, and copy functionality. Perfect for debugging interfaces and development tools where message visibility is critical.

> 📚 **[See MessagesWindow documentation →](./docs/ts-res-ui-components.messageswindow.md)**

```tsx
import { MessagesWindow, ViewTools } from '@fgv/ts-res-ui-components';

function MyApplication() {
  const [messages, setMessages] = useState<ViewTools.Message[]>([]);

  const addMessage = (type: ViewTools.Message['type'], text: string) => {
    const newMessage: ViewTools.Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      message: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1">
        {/* Main application content */}
        <button onClick={() => addMessage('info', 'Processing started')}>
          Add Info Message
        </button>
        <button onClick={() => addMessage('success', 'Operation completed')}>
          Add Success Message  
        </button>
        <button onClick={() => addMessage('error', 'Something went wrong')}>
          Add Error Message
        </button>
      </div>
      
      {/* Messages window at bottom */}
      <MessagesWindow 
        messages={messages}
        onClearMessages={clearMessages}
      />
    </div>
  );
}
```

**Key features:**
- **Message filtering**: Filter by type (info, warning, error, success) with count indicators
- **Search functionality**: Full-text search across message content
- **Copy functionality**: Copy all filtered messages to clipboard with timestamps
- **Collapsible interface**: Minimize/maximize to save screen space
- **Auto-hide when empty**: Component automatically hides when no messages exist
- **Visual indicators**: Color-coded message types with appropriate icons
- **Timestamp formatting**: Human-readable timestamp display

#### Adding Messages to Your Application

To integrate MessagesWindow into your application and provide user feedback during operations:

```tsx
import { ViewTools } from '@fgv/ts-res-ui-components';

function useMessages() {
  const [messages, setMessages] = useState<ViewTools.Message[]>([]);

  const addMessage = useCallback((type: ViewTools.Message['type'], message: string) => {
    const newMessage: ViewTools.Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, addMessage, clearMessages };
}

function MyResourceTool() {
  const { messages, addMessage, clearMessages } = useMessages();
  const [resources, setResources] = useState(null);

  const handleFileImport = async (files) => {
    try {
      addMessage('info', 'Starting file import...');
      const processed = await processFiles(files);
      setResources(processed);
      addMessage('success', `Successfully imported ${files.length} files`);
    } catch (error) {
      addMessage('error', `Import failed: ${error.message}`);
    }
  };

  const handleResourceFilter = (filterValues) => {
    if (Object.keys(filterValues).length === 0) {
      addMessage('warning', 'No filter values provided');
      return;
    }
    
    try {
      const filtered = applyFilters(resources, filterValues);
      addMessage('success', `Filtered to ${filtered.length} resources`);
    } catch (error) {
      addMessage('error', `Filter failed: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1">
        <ImportView onImport={handleFileImport} onMessage={addMessage} />
        <FilterView onFilter={handleResourceFilter} onMessage={addMessage} />
        {/* Other components that use onMessage callback */}
      </div>
      
      <ViewTools.MessagesWindow 
        messages={messages}
        onClearMessages={clearMessages}
      />
    </div>
  );
}
```

**Common patterns for adding messages:**
- **info**: Operation started, processing steps, configuration loaded
- **success**: Operations completed successfully, files imported, resources processed
- **warning**: Non-critical issues, fallback behaviors, deprecated features used
- **error**: Operation failures, validation errors, unexpected conditions

**Message callback integration:**
Most components in this library accept an `onMessage` callback prop that you can connect to your message system. This provides consistent feedback across all operations.

## Hooks API

> 📚 **[See complete hooks documentation →](./docs/ts-res-ui-components.md)** for detailed examples and patterns

All hooks are organized within their respective namespaces alongside their related components and utilities for better discoverability and logical grouping.

### Core Data Management

#### ResourceTools.useResourceData

Main orchestrator hook for resource processing, configuration, and resolution.

> 📚 **[useResourceData documentation →](./docs/ts-res-ui-components.resourcetools.useresourcedata.md)**

```tsx
import { ResourceTools } from '@fgv/ts-res-ui-components';

const { state, actions } = ResourceTools.useResourceData();

// Process files
await actions.processFiles(importedFiles);

// Resolve a resource
const result = await actions.resolveResource('my.resource', {
  language: 'en-US',
  environment: 'production'
});

// Apply configuration
actions.applyConfiguration(newConfig);

// Check processing state
if (state.isProcessing) {
  console.log('Processing resources...');
} else if (state.error) {
  console.error('Processing failed:', state.error);
} else if (state.processedResources) {
  console.log('Resources ready!');
}
```

### View State Management

#### ViewTools.useViewState

Manages view state including messages and resource selection.

> 📚 **[useViewState documentation →](./docs/ts-res-ui-components.viewtools.useviewstate.md)**

```tsx
import { ViewTools } from '@fgv/ts-res-ui-components';

const { messages, selectedResourceId, addMessage, clearMessages, selectResource } = ViewTools.useViewState();

// Display operation feedback
const handleOperation = async () => {
  try {
    await someAsyncOperation();
    addMessage('success', 'Operation completed successfully');
  } catch (error) {
    addMessage('error', `Operation failed: ${error.message}`);
  }
};

// Use with MessagesWindow component
return (
  <div>
    <button onClick={handleOperation}>Run Operation</button>
    <ViewTools.MessagesWindow 
      messages={messages}
      onClearMessages={clearMessages}
    />
  </div>
);
```

### Domain-Specific Hooks

#### FilterTools.useFilterState

Manages resource filtering state with change tracking and validation.

> 📚 **[useFilterState documentation →](./docs/ts-res-ui-components.filtertools.usefilterstate.md)**

```tsx
import { FilterTools } from '@fgv/ts-res-ui-components';

const { state, actions } = FilterTools.useFilterState({
  enabled: true,
  values: { platform: 'web', locale: 'en' }
});

// Update filter values with change tracking
actions.updateFilterValue('language', 'en-US');
actions.updateFilterValue('environment', 'prod');

// Apply filters when ready
if (state.hasPendingChanges) {
  actions.applyFilters();
}
```

#### ResolutionTools.useResolutionState

Comprehensive state management for resource resolution and editing.

> 📚 **[useResolutionState documentation →](./docs/ts-res-ui-components.resolutiontools.useresolutionstate.md)**

```tsx
import { ResolutionTools } from '@fgv/ts-res-ui-components';

const { state, actions, availableQualifiers } = ResolutionTools.useResolutionState(
  processedResources,
  (type, message) => addMessage(type, message),
  (updatedResources) => setProcessedResources(updatedResources)
);

// Set context for resolution testing
actions.updateContext({ language: 'en-US', platform: 'web' });

// Start editing a resource
actions.selectResource('user.welcome');
actions.startEditing();

// Save edits with validation
actions.saveEdit(editedValue);
```

#### ConfigurationTools.useConfigurationState

Manages system configuration state with change tracking and import/export capabilities.

> 📚 **[useConfigurationState documentation →](./docs/ts-res-ui-components.configurationtools.useconfigurationstate.md)**

```tsx
import { ConfigurationTools } from '@fgv/ts-res-ui-components';

const { state, actions, templates } = ConfigurationTools.useConfigurationState(
  undefined,
  (config) => console.log('Configuration changed:', config),
  (hasChanges) => setHasUnsavedChanges(hasChanges)
);

// Load a template
const loadResult = actions.loadTemplate('minimal');

// Add a new qualifier with validation
actions.addQualifier({
  name: 'language',
  typeName: 'language',
  defaultPriority: 100
});

// Check for unsaved changes
if (state.hasUnsavedChanges) {
  actions.applyConfiguration();
}

// Export configuration
const exportResult = actions.exportToJson({ pretty: true });
if (exportResult.isSuccess()) {
  downloadFile(exportResult.value, 'configuration.json');
}
```

### Hook Organization

All hooks are organized within logical namespaces alongside their related components and utilities:

- **`ResourceTools.useResourceData`** - Core data orchestration (import, processing, configuration, resolution)
- **`ViewTools.useViewState`** - View state management (messages, resource selection)
- **`FilterTools.useFilterState`** - Resource filtering with change tracking
- **`ResolutionTools.useResolutionState`** - Resource resolution and editing
- **`ConfigurationTools.useConfigurationState`** - System configuration management

This organization provides:
- **Better discoverability** - Related functionality grouped together
- **Logical imports** - `FilterTools.useFilterState` is self-documenting
- **Namespace consistency** - Matches the existing component organization pattern
- **Clear separation of concerns** - Each namespace has a specific domain focus

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
import { TsResTools } from '@fgv/ts-res-ui-components';

// Custom processing pipeline
const customProcessor = async (files: ImportedFile[]) => {
  // Pre-process files
  const processedFiles = files.map(transformFile);
  
  // Create configuration
  const config = await createConfigFromFiles(processedFiles);
  
  // Create ts-res system
  const system = await TsResTools.createTsResSystemFromConfig(config);
  
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

## Organized Tool Namespaces

For better organization and discoverability, utility functions are organized into logical namespaces alongside their related view components:

```tsx
import { 
  FilterTools,     // FilterView + filtering utilities
  ResolutionTools, // ResolutionView + resolution utilities  
  ConfigurationTools, // ConfigurationView + configuration utilities
  TsResTools,      // SourceView, CompiledView + ts-res utilities
  ViewTools,       // MessagesWindow + view state utilities
  ZipTools,        // ImportView + ZIP processing helpers
  FileTools        // File processing utilities
} from '@fgv/ts-res-ui-components';

// Use view components from namespaces
<FilterTools.FilterView {...filterProps} />
<ResolutionTools.ResolutionView {...resolutionProps} />
<ViewTools.MessagesWindow {...messageProps} />
<TsResTools.SourceView {...sourceProps} />
<ZipTools.ImportView {...importProps} />

// Use utility functions from namespaces  
const hasFilters = FilterTools.hasFilterValues(filterState.values);
const resolver = ResolutionTools.createResolverWithContext(resources, context);
const system = await TsResTools.createTsResSystemFromConfig(config);

// ZIP processing helpers for ts-res-ui-components integration
const processResult = await ZipTools.processZipLoadResult(zipData, config);
```

### Namespace Contents

- **[FilterTools](./docs/ts-res-ui-components.filtertools.md)**: FilterView, filter analysis, filtered resource creation
- **[ResolutionTools](./docs/ts-res-ui-components.resolutiontools.md)**: ResolutionView, resolution testing, context management
- **[ConfigurationTools](./docs/ts-res-ui-components.configurationtools.md)**: ConfigurationView, configuration validation, import/export
- **[TsResTools](./docs/ts-res-ui-components.tsrestools.md)**: SourceView, CompiledView, ts-res system integration
- **[ViewTools](./docs/ts-res-ui-components.viewtools.md)**: MessagesWindow, message management, view state utilities
- **[ZipTools](./docs/ts-res-ui-components.ziptools.md)**: ImportView, ZIP processing helpers, uses ts-res zip-archive packlet
- **[FileTools](./docs/ts-res-ui-components.filetools.md)**: File processing, import/export utilities

All components are also available at the top level for backward compatibility.

## TypeScript Support

This library is written in TypeScript and provides comprehensive type definitions with enhanced support for resource selection and generic resource data.

> 📚 **[See complete type documentation →](./docs/ts-res-ui-components.md)**

```tsx
import type {
  ProcessedResources,
  FilterState,
  ResolutionResult,
  Message,
  ImportedFile,
  // Enhanced ResourcePicker types
  ResourceSelection,
  ResourcePickerProps,
  ResourceAnnotation,
  ResourceAnnotations,
  PendingResource,
  // Custom editor factory types
  ResourceEditorFactory,
  ResourceEditorResult,
  ResourceEditorProps,
  // Hook return types
  UseViewStateReturn,
  UseFilterStateReturn,
  UseResolutionStateReturn
} from '@fgv/ts-res-ui-components';

// Import organized namespaces for components and utilities
import {
  FilterTools,
  ResolutionTools,
  TsResTools,
  ZipTools
} from '@fgv/ts-res-ui-components';

// Type-safe component with enhanced resource selection
interface MyResourceViewProps<T = unknown> {
  resources: ProcessedResources;
  onMessage: (type: Message['type'], message: string) => void;
  onResourceSelect: (selection: ResourceSelection<T>) => void;
}

const MyResourceView = <T = unknown>({ resources, onMessage, onResourceSelect }: MyResourceViewProps<T>) => {
  return (
    <ResourcePicker<T>
      resources={resources}
      onResourceSelect={(selection) => {
        // TypeScript knows selection has resourceId, resourceData, isPending, etc.
        onResourceSelect(selection);
      }}
      resourceAnnotations={{
        'user.welcome': {
          badge: { text: 'NEW', variant: 'new' },
          suffix: '(3 candidates)'
        }
      }}
    />
  );
};

// Type-safe custom editor factory
class TypedResourceEditorFactory implements ResourceEditorFactory {
  createEditor(resourceId: string, resourceType: string, value: any): ResourceEditorResult {
    // Full type safety for factory pattern
    if (resourceType === 'marketInfo') {
      return { success: true, editor: MarketInfoEditor };
    }
    return { success: false, message: `No editor for ${resourceType}` };
  }
}
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

This library is part of a [Rush.js](https://rushjs.io/) monorepo. Rush is a build orchestrator for JavaScript monorepos that provides scalable build performance and consistent package management.

### Rush Monorepo Setup

If you're new to this monorepo, follow these steps to get started:

1. **Install Rush globally** (if not already installed):
   ```bash
   npm install -g @microsoft/rush
   ```

2. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/ErikFortune/fgv.git
   cd fgv
   rush install
   ```

3. **Build all projects** (including dependencies):
   ```bash
   rush build
   ```

> 📚 **Learn more about Rush**: [Official Rush Documentation](https://rushjs.io/pages/intro/get_started/)

### Development Commands

All development commands use Rush's `rushx` tool to run scripts within this specific project:

#### Building

```bash
# Build this project only
rushx build

# Build all projects in the monorepo (from root)
rush build
```

#### Testing

```bash
# Test this project (includes coverage by default)
rushx test

# Test all projects in the monorepo (from root)
rush test

# Test specific projects with dependencies
rush test --to ts-res-ui-components

# Test only this project without dependencies
rush test --only ts-res-ui-components
```

#### Linting

```bash
# Lint this project
rushx lint

# Fix lint issues automatically
rushx fixlint

# Lint all projects in the monorepo (from root)  
rush prettier
```

#### Other Useful Commands

```bash
# Clean build artifacts
rushx clean

# Update dependencies (from repository root)
rush update

# Add a new dependency to this project (from repository root)
rush add -p <package-name>

# Check for security vulnerabilities (from repository root)
rush audit
```

### Monorepo Structure

This library is located at `libraries/ts-res-ui-components/` within the monorepo and depends on several other libraries in the workspace:

- `@fgv/ts-res` - Core resource management library
- `@fgv/ts-utils` - Utility functions and Result pattern
- `@fgv/ts-json-base` - JSON validation and processing
- `@fgv/ts-bcp47` - BCP47 language tag processing

All workspace dependencies use `workspace:*` version ranges for automatic version resolution.

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
- **[Tool Namespaces](./docs/ts-res-ui-components.md)** - Organized tool namespaces with view components and utility functions

The API documentation includes detailed examples, usage patterns, and type information for all public APIs.

## Support

For questions and support, please:

1. Check the [API documentation](./docs/index.md) for detailed component usage
2. Review the [ts-res documentation](https://docs.ts-res.dev) for core concepts
3. Search [existing issues](https://github.com/fgv/ts-res/issues)
4. Create a [new issue](https://github.com/fgv/ts-res/issues/new)