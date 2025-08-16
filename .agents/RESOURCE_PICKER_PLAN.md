# Resource Picker Component Plan

## Component Overview
A reusable resource selection component that provides search, list/tree views, and selection notification. The host component handles what happens after selection. Supports displaying isolated branches of the resource tree.

## Core Requirements

### Stage 1: Basic Resource Picker
1. **Resource Display**
   - Switchable list/tree views (reuse existing components)
   - Search/filter capability
   - Single resource selection with callback
   - Support for displaying isolated tree branches

2. **Host Annotations**
   - Support for badges/indicators per resource (edited, count, status)
   - Host provides annotation data via props
   - Flexible rendering of annotations

3. **Selection Management**
   - Clear selection state
   - Notify host on selection change
   - Support for programmatic selection

### Stage 2: Edit Support
1. **Pending Resources**
   - Display placeholder entries for newly created resources (not yet applied)
   - Visual distinction for pending vs. existing resources
   - Host provides pending resource list

2. **Edit Indicators**
   - Show which resources have pending edits
   - Different states: new, modified, deleted
   - Host manages edit state, picker just displays

## Component API Design

```typescript
interface ResourcePickerProps extends ViewBaseProps {
  // Core data
  resources: ProcessedResources | ExtendedProcessedResources | null;
  
  // Selection
  selectedResourceId: string | null;
  onResourceSelect: (resourceId: string | null) => void;
  
  // View options
  defaultView?: 'list' | 'tree';
  showViewToggle?: boolean;
  
  // Tree branch isolation
  rootPath?: string; // Path to treat as root (e.g., "platform/territories")
  hideRootNode?: boolean; // Hide the root node itself, show only children
  
  // Search
  enableSearch?: boolean;
  searchPlaceholder?: string;
  searchScope?: 'all' | 'current-branch'; // Search entire tree or just visible branch
  
  // Annotations from host
  resourceAnnotations?: ResourceAnnotations;
  
  // Pending resources (for editors)
  pendingResources?: PendingResource[];
  
  // Optional customization
  emptyMessage?: string;
  className?: string;
  height?: string | number;
}

interface ResourceAnnotations {
  [resourceId: string]: {
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
  };
}

interface PendingResource {
  id: string;
  type: 'new' | 'deleted';
  resourceType?: string;
  parentPath?: string; // For tree placement
  // Placeholder data for display
  displayName?: string;
}
```

## Usage Examples

### Basic Usage
```typescript
// Basic usage in a resolution tool
<ResourcePicker
  resources={processedResources}
  selectedResourceId={selectedId}
  onResourceSelect={handleResourceSelect}
/>
```

### With Tree Branch Isolation
```typescript
// Show only the "territories" branch
<ResourcePicker
  resources={processedResources}
  selectedResourceId={selectedId}
  onResourceSelect={handleResourceSelect}
  rootPath="platform/territories"
  hideRootNode={true} // Show children of territories, not territories itself
/>

// Multiple pickers for different branches
<div className="grid grid-cols-3">
  <ResourcePicker
    resources={processedResources}
    rootPath="platform/territories"
    onResourceSelect={(id) => handleSelect('territories', id)}
  />
  <ResourcePicker
    resources={processedResources}
    rootPath="platform/languages"
    onResourceSelect={(id) => handleSelect('languages', id)}
  />
  <ResourcePicker
    resources={processedResources}
    rootPath="platform/formats"
    onResourceSelect={(id) => handleSelect('formats', id)}
  />
</div>
```

### With Edit Indicators
```typescript
<ResourcePicker
  resources={processedResources}
  selectedResourceId={selectedId}
  onResourceSelect={handleResourceSelect}
  resourceAnnotations={{
    'resource1': { badge: { text: 'edited', variant: 'edited' } },
    'resource2': { suffix: '(5 candidates)' },
    'resource3': { indicator: { type: 'dot', value: '●', tooltip: 'Has conflicts' } }
  }}
/>
```

### With Pending Resources (Editor Scenario)
```typescript
<ResourcePicker
  resources={processedResources}
  selectedResourceId={selectedId}
  onResourceSelect={handleResourceSelect}
  pendingResources={[
    { 
      id: 'new-resource-1', 
      type: 'new', 
      parentPath: 'platform/territories',
      displayName: 'NewTerritory (unsaved)' 
    }
  ]}
  resourceAnnotations={{
    'new-resource-1': { badge: { text: 'new', variant: 'new' } }
  }}
  rootPath="platform/territories"
/>
```

## Implementation Details

### Component Structure
```
components/pickers/ResourcePicker/
├── index.tsx                    # Main component with search and view toggle
├── ResourceItem.tsx             # Individual resource item with annotations
├── ResourcePickerTree.tsx       # Tree view with branch isolation support
├── ResourcePickerList.tsx       # List view with filtering
├── utils/treeNavigation.ts     # Tree filtering and branch isolation logic
└── types.ts                     # Type definitions
```

### Key Implementation Points

#### Tree Branch Isolation
1. **Path Filtering**: Filter resources to show only those under the specified path
2. **Root Adjustment**: Optionally hide the specified root node
3. **ID Mapping**: Maintain correct resource IDs even when showing partial tree
4. **Search Scope**: Allow searching within branch or across all resources

```typescript
// Example tree filtering logic
function filterTreeBranch(
  resources: string[],
  rootPath?: string,
  hideRootNode?: boolean
): string[] {
  if (!rootPath) return resources;
  
  const filtered = resources.filter(id => {
    if (hideRootNode) {
      return id.startsWith(rootPath + '/') && id !== rootPath;
    }
    return id === rootPath || id.startsWith(rootPath + '/');
  });
  
  return filtered;
}
```

#### Merged Resource List
- Combine real resources with pending resources
- Maintain proper tree structure for pending resources
- Handle selection of pending resources

#### Annotation Rendering
- Flexible system for host-provided decorations
- Consistent visual treatment across list and tree views
- Support for multiple annotation types per resource

### Visual Design

#### Full Tree View
```
┌─────────────────────────────┐
│ [🔍 Search resources...]    │
│ [List] [Tree]               │
├─────────────────────────────┤
│ ▼ platform                  │
│   ▼ territories             │
│     ▶ US [edited] (3)      │
│     ▶ UK                   │
│   ▶ languages              │
│   ▶ formats                │
└─────────────────────────────┘
```

#### Isolated Branch View (territories only)
```
┌─────────────────────────────┐
│ [🔍 Search territories...]  │
│ [List] [Tree]               │
├─────────────────────────────┤
│ ▶ US [edited] (3)          │
│ ▶ UK                       │
│ ▶ CA ● [new]              │
│ ▶ MX                       │
└─────────────────────────────┘
```

## Implementation Phases

### Phase 1: Core Picker ✅ COMPLETED
- ✅ Create base `ResourcePicker` component
- ✅ Integrate existing `ResourceListView` and enhance `ResourceTreeView`
- ✅ Implement search functionality
- ✅ Add tree branch isolation support (rootPath, hideRootNode)
- ✅ Basic annotation rendering (badges, indicators, suffixes)
- ✅ Create comprehensive playground for testing
- ✅ Fix tree view to use proper ts-res API (`getBuiltResourceTree()`)
- ✅ Implement simplified branch isolation approach

### Phase 2: Edit Support (CURRENT PHASE)
- Add pending resource support
- Implement edit state indicators
- Handle selection of pending resources
- Test with various edit scenarios

### Phase 3: Polish & Testing
- Refine visual design and animations
- Add comprehensive unit tests
- Create usage documentation
- Build example implementations

## Benefits
1. **Focused Responsibility**: Just selection, not actions
2. **Flexible Annotations**: Host controls what's displayed
3. **Edit-Aware**: Supports pending changes workflow
4. **Branch Isolation**: Can show specific parts of the resource tree
5. **Reusable**: Same picker for viewers, editors, and other tools
6. **Scalable**: Can be used to create multi-pane interfaces with different resource branches

## Migration Path
- Existing SourceView implementations can gradually adopt ResourcePicker
- ResourcePicker can be used alongside existing components
- Provide clear examples for common use cases

## Future Enhancements (Not in Initial Scope)
- Multi-select support
- Drag and drop for reorganization
- Resource preview on hover
- Keyboard navigation shortcuts
- Virtual scrolling for very large trees