# ResourcePicker Component

A comprehensive resource selection component that provides search, list/tree views, branch isolation, and edit support. The component focuses on resource selection and leaves action handling to the host application.

## Features

- 🔍 **Search and filtering** across resources
- 📋 **Dual view modes** - List and tree views with seamless switching
- 🌳 **Branch isolation** - Display specific subtrees of the resource hierarchy
- ✏️ **Edit support** - Display pending resources (new, modified, deleted)
- 🏷️ **Flexible annotations** - Host-provided badges, indicators, and metadata
- 🎯 **Single selection** with callback notification
- ⚡ **Performance optimized** with virtual tree abstraction

## Quick Start

```typescript
import { ResourcePicker, ResourceSelection, ObservabilityProvider } from '@fgv/ts-res-ui-components';

function MyComponent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleResourceSelect = (selection: ResourceSelection) => {
    setSelectedId(selection.resourceId);
    
    // Access resource data directly
    if (selection.resourceData) {
      console.log('Resource data:', selection.resourceData);
    }
  };

  return (
    <ObservabilityProvider>
      <ResourcePicker
        resources={processedResources}
        selectedResourceId={selectedId}
        onResourceSelect={handleResourceSelect}
      />
    </ObservabilityProvider>
  );
}
```

## Props API

### Core Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `resources` | `ProcessedResources \| ExtendedProcessedResources \| null` | ✅ | The resource data to display |
| `selectedResourceId` | `string \| null` | ✅ | Currently selected resource ID |
| `onResourceSelect` | `(selection: ResourceSelection<T>) => void` | ✅ | Enhanced callback with resource data when selection changes |

### View Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultView` | `'list' \| 'tree'` | `'list'` | Initial view mode |
| `showViewToggle` | `boolean` | `true` | Show list/tree toggle buttons |
| `height` | `string \| number` | `'600px'` | Container height |
| `className` | `string` | `''` | Additional CSS classes |
| `emptyMessage` | `string` | `'No resources available'` | Message when no resources |

### Search Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableSearch` | `boolean` | `true` | Enable search functionality |
| `searchPlaceholder` | `string` | Auto-generated | Custom search placeholder |
| `searchScope` | `'all' \| 'current-branch'` | `'current-branch'` | Search within branch or all resources |

### Branch Isolation

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rootPath` | `string` | `undefined` | Root path for branch isolation (e.g., `"strings"`) |
| `hideRootNode` | `boolean` | `false` | Hide the root node, show only children |

### Annotations and Edit Support

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `resourceAnnotations` | `ResourceAnnotations` | `{}` | Host-provided resource decorations |
| `pendingResources` | `PendingResource[]` | `[]` | Resources with pending changes |

### Observability

For handling component messages and notifications, use the ObservabilityProvider to wrap your application:

```typescript
import { ObservabilityProvider, useObservabilityContext } from '@fgv/ts-res-ui-components';

function App() {
  return (
    <ObservabilityProvider>
      <MyResourceComponent />
    </ObservabilityProvider>
  );
}

function MyResourceComponent() {
  const { addMessage } = useObservabilityContext();
  
  const handleResourceSelect = (selection: ResourceSelection) => {
    if (selection.resourceId) {
      addMessage('info', `Selected resource: ${selection.resourceId}`);
    }
  };

  return (
    <ResourcePicker
      resources={processedResources}
      selectedResourceId={selectedId}
      onResourceSelect={handleResourceSelect}
    />
  );
}
```

## Enhanced Resource Selection

The `onResourceSelect` callback now returns a `ResourceSelection<T>` object that provides comprehensive information about the selected resource:

```typescript
interface ResourceSelection<T = unknown> {
  resourceId: string | null;     // The resource ID (same as before)
  resourceData?: T;              // The actual resource data if available
  isPending?: boolean;           // Whether this is a pending resource
  pendingType?: 'new' | 'modified' | 'deleted'; // Type of pending operation
}
```

### Benefits of Enhanced Callback

1. **Immediate Access to Resource Data**: No need to separately fetch resource data by ID
2. **Pending Resource Information**: Easily distinguish between existing and pending resources
3. **Type Safety**: Generic `T` parameter allows type-safe resource data handling
4. **Reduced Bookkeeping**: Consumer applications need less state management logic

### Example Usage

```typescript
const handleResourceSelect = (selection: ResourceSelection<MyResourceType>) => {
  if (selection.resourceId) {
    // Resource selected
    if (selection.isPending) {
      console.log(`Pending ${selection.pendingType} resource:`, selection.resourceData);
    } else {
      console.log('Existing resource selected:', selection.resourceId);
    }
    
    // Use the resource data directly
    if (selection.resourceData) {
      processResourceData(selection.resourceData);
    }
  } else {
    // No resource selected
    console.log('Resource deselected');
  }
};
```

## Type Definitions

### ResourceAnnotations

```typescript
interface ResourceAnnotations {
  [resourceId: string]: ResourceAnnotation;
}

interface ResourceAnnotation {
  badge?: {
    text: string;
    variant: 'info' | 'warning' | 'success' | 'error' | 'edited' | 'new';
  };
  indicator?: {
    type: 'dot' | 'icon' | 'text';
    value: string | React.ReactNode;
    tooltip?: string;
  };
  suffix?: React.ReactNode; // e.g., "(3 candidates)"
  className?: string; // Additional styling
}
```

### PendingResource

```typescript
interface PendingResource<T = unknown> {
  id: string;
  type: 'new' | 'modified' | 'deleted';
  resourceType?: string;
  displayName?: string; // Custom display name
  resourceData?: T; // The actual resource data
}
```

**Enhanced Features:**
- **Generic Type Support**: Use `PendingResource<MyType>` for type-safe resource data
- **Resource Data**: Include actual resource content for immediate access
- **Backward Compatible**: All existing code continues to work unchanged

## Usage Examples

### Basic Resource Selection

```typescript
import { ResourcePicker } from '@fgv/ts-res-ui-components';

function ResourceSelector({ resources }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="w-full h-96">
      <ResourcePicker
        resources={resources}
        selectedResourceId={selected}
        onResourceSelect={setSelected}
        defaultView="tree"
        enableSearch={true}
      />
    </div>
  );
}
```

### Branch Isolation

Perfect for focusing on specific parts of the resource tree:

```typescript
// Show only the "strings" branch
<ResourcePicker
  resources={resources}
  selectedResourceId={selectedId}
  onResourceSelect={setSelectedId}
  rootPath="strings"
  hideRootNode={true} // Show children of "strings", not "strings" itself
  searchPlaceholder="Search strings..."
/>

// Multiple isolated views
<div className="grid grid-cols-3 gap-4">
  <ResourcePicker
    resources={resources}
    rootPath="strings"
    onResourceSelect={(id) => handleSelect('strings', id)}
  />
  <ResourcePicker
    resources={resources}
    rootPath="images"
    onResourceSelect={(id) => handleSelect('images', id)}
  />
  <ResourcePicker
    resources={resources}
    rootPath="app.ui"
    onResourceSelect={(id) => handleSelect('ui', id)}
  />
</div>
```

### With Annotations

Add visual indicators and metadata to resources:

```typescript
const annotations: ResourceAnnotations = {
  'strings.errors.validation': {
    badge: { text: 'EDITED', variant: 'edited' },
    suffix: '(3 candidates)'
  },
  'strings.common.ok': {
    indicator: { 
      type: 'dot', 
      value: '●', 
      tooltip: 'Has conflicts' 
    }
  },
  'app.ui.buttons': {
    badge: { text: 'NEW', variant: 'new' }
  }
};

<ResourcePicker
  resources={resources}
  selectedResourceId={selectedId}
  onResourceSelect={setSelectedId}
  resourceAnnotations={annotations}
/>
```

### Editor with Pending Resources

For resource editors that show unsaved changes:

```typescript
const pendingResources: PendingResource[] = [
  {
    id: 'strings.new-feature',
    type: 'new',
    displayName: 'new-feature (unsaved)'
  },
  {
    id: 'strings.common.updated',
    type: 'modified',
    displayName: 'updated (pending)'
  },
  {
    id: 'strings.old-feature',
    type: 'deleted'
  }
];

const annotations: ResourceAnnotations = {
  'strings.new-feature': {
    badge: { text: 'NEW', variant: 'new' }
  },
  'strings.common.updated': {
    badge: { text: 'MODIFIED', variant: 'edited' }
  }
};

<ResourcePicker
  resources={resources}
  selectedResourceId={selectedId}
  onResourceSelect={setSelectedId}
  pendingResources={pendingResources}
  resourceAnnotations={annotations}
  rootPath="strings"
/>
```

### Custom Styling

```typescript
<ResourcePicker
  resources={resources}
  selectedResourceId={selectedId}
  onResourceSelect={setSelectedId}
  className="border border-gray-300 rounded-lg shadow-sm"
  height={400}
  emptyMessage="No resources found. Import some resources to get started."
/>
```

## Branch Isolation Details

Branch isolation allows you to show only a specific subtree of the resource hierarchy. This is useful for:

- **Multi-panel interfaces** - Show different resource categories in separate panels
- **Context-focused editing** - Limit scope to relevant resources
- **Simplified navigation** - Reduce cognitive load by hiding irrelevant resources

### Behavior Examples

Given resources: `["string.common", "strings.errors", "strings.errors.validation", "app.dialog", "app.ui"]`

**No isolation:**
- Shows: All resources in full hierarchy

**`rootPath="strings"`:**
- Shows: `["strings.common", "strings.errors", "strings.errors.validation"]`
- List view displays: `["common", "errors", "errors.validation"]` (prefix truncated)

**`rootPath="strings"` + `hideRootNode=true`:**
- Shows: `["strings.errors", "strings.errors.validation", "strings.common"]`
- List view displays: `["errors", "errors.validation", "common"]` (prefix truncated)

## Pending Resources

Pending resources represent changes that haven't been applied yet. They integrate seamlessly with the existing resource tree:

### Types
- **`new`** - Resources being created (shown in emerald)
- **`deleted`** - Resources marked for deletion (hidden from display)

### Integration
- Pending resources are merged into the virtual tree structure
- They follow the same filtering and search rules as real resources
- Selection works identically for pending and real resources
- Visual styling distinguishes them from existing resources

## Performance Considerations

- **Virtual tree abstraction** efficiently merges real and pending resources
- **Memoized filtering** prevents unnecessary recalculations
- **Optimized search** works on filtered result sets
- **Lazy expansion** in tree view for large hierarchies

## Accessibility

- **Keyboard navigation** supported in both list and tree views
- **Screen reader friendly** with proper ARIA labels
- **Focus management** maintains logical tab order
- **High contrast** support with semantic color variants

## Migration from Existing Components

### From ResourceListView

```typescript
// Before
<ResourceListView
  resourceIds={resourceIds}
  selectedResourceId={selectedId}
  onResourceSelect={setSelectedId}
/>

// After
<ResourcePicker
  resources={processedResources}
  selectedResourceId={selectedId}
  onResourceSelect={setSelectedId}
  defaultView="list"
  showViewToggle={false}
/>
```

### From ResourceTreeView

```typescript
// Before
<ResourceTreeView
  resources={processedResources}
  selectedResourceId={selectedId}
  onResourceSelect={setSelectedId}
/>

// After
<ResourcePicker
  resources={processedResources}
  selectedResourceId={selectedId}
  onResourceSelect={setSelectedId}
  defaultView="tree"
  showViewToggle={false}
/>
```

## Best Practices

### Do's
- ✅ Use branch isolation to focus user attention
- ✅ Provide meaningful annotations for resource status
- ✅ Handle the `onResourceSelect` callback appropriately
- ✅ Use pending resources to show unsaved changes
- ✅ Provide clear empty states with helpful messages

### Don'ts
- ❌ Don't put action buttons inside the picker (use external controls)
- ❌ Don't modify resources directly (use pending resources for changes)
- ❌ Don't forget to handle null selection (when nothing is selected)
- ❌ Don't use overly deep branch isolation (can confuse users)

## Troubleshooting

### Common Issues

**Resources not appearing:**
- Ensure `resources` prop is not null and contains `summary.resourceIds`
- Check branch isolation settings (`rootPath`, `hideRootNode`)
- Verify search term isn't filtering out resources

**Selection not working:**
- Ensure `onResourceSelect` callback is provided
- Check that `selectedResourceId` is being updated in parent state
- Verify resource IDs match exactly (including pending resources)

**Pending resources not showing:**
- Ensure `pendingResources` array contains valid resource objects
- Check that pending resource IDs don't conflict with existing resources
- Verify pending resources aren't being filtered out by branch isolation

**Styling issues:**
- Check that required CSS is imported
- Verify Tailwind CSS classes are available
- Use browser dev tools to inspect component structure

### Debug Tips

Enable debug logging to understand resource processing:

```typescript
// Add this to see what resources are being processed
React.useEffect(() => {
  if (resources) {
    console.log('ResourcePicker resources:', {
      total: resources.summary?.resourceIds?.length || 0,
      resourceIds: resources.summary?.resourceIds?.slice(0, 10),
      pendingCount: pendingResources?.length || 0
    });
  }
}, [resources, pendingResources]);
```

## ResourcePickerOptionsControl

A debugging and design tool for interactively configuring ResourcePicker behavior. This component is hidden by default for production use but can be enabled during development to easily adjust picker settings.

### Basic Usage

```typescript
import { PickerTools } from '@fgv/ts-res-ui-components';

function MyComponent() {
  const [pickerOptions, setPickerOptions] = useState({
    defaultView: 'list',
    enableSearch: true,
    height: '400px'
  });

  return (
    <div>
      {/* Enable the options control for debugging */}
      <PickerTools.ResourcePickerOptionsControl
        options={pickerOptions}
        onOptionsChange={setPickerOptions}
        presentation="collapsible"
        title="Picker Settings"
        showAdvanced={true}
      />
      
      {/* ResourcePicker uses the options */}
      <PickerTools.ResourcePicker
        resources={resources}
        selectedResourceId={selectedId}
        onResourceSelect={setSelectedId}
        options={pickerOptions}
      />
    </div>
  );
}
```

### Presentation Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `'hidden'` | Not displayed (default) | Production builds |
| `'inline'` | Always visible with expanded controls | Development with lots of space |
| `'collapsible'` | Expandable/collapsible section | Development with limited space |
| `'popup'` | Full modal dialog overlay | Quick access without space constraints |
| `'popover'` | Small dropdown overlay | Minimal space usage |

### Integration with Views

All view components support the `pickerOptionsPresentation` prop:

```typescript
// Enable in SourceView for debugging
<ObservabilityProvider>
  <SourceView
    resources={processedResources}
    pickerOptionsPresentation="collapsible"
  />
</ObservabilityProvider>

// Quick popup access in FilterView
<ObservabilityProvider>
  <FilterView
    resources={processedResources}
    filterState={filterState}
    filterActions={filterActions}
    pickerOptionsPresentation="popup"
  />
</ObservabilityProvider>
```

### Features

The options control provides interactive configuration for:

- **View Settings**: Toggle between list/tree views, show/hide view switcher
- **Search Configuration**: Enable/disable search, set placeholder text, choose search scope
- **Branch Isolation**: Set root path, hide root node, enable branch isolation
- **Display Options**: Configure height, empty message, visual settings
- **Quick Paths**: One-click branch isolation for common paths (strings, app, images, etc.)

### Development Workflow

```typescript
// During development
const isDevelopment = process.env.NODE_ENV === 'development';

<ObservabilityProvider>
  <SourceView
    resources={resources}
    pickerOptionsPresentation={isDevelopment ? 'collapsible' : 'hidden'}
  />
</ObservabilityProvider>
```

## Related Components

- **ResourceItem** - Individual resource display component
- **ResourceTreeView** - Standalone tree view (legacy)
- **ResourceListView** - Standalone list view (legacy)

## Version History

- **v1.0.0** - Initial release with basic selection
- **v1.1.0** - Added branch isolation support
- **v1.2.0** - Added pending resources and edit support
- **v1.3.0** - Enhanced list view with prefix truncation