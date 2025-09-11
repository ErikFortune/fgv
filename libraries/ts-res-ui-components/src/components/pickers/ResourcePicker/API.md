# ResourcePicker API Reference

Complete API documentation for the ResourcePicker component and related types.

## Components

### ResourcePicker

The main component that provides resource selection functionality.

#### Props

```typescript
interface ResourcePickerProps extends ViewBaseProps {
  // Core data
  resources: ProcessedResources | ExtendedProcessedResources | null;
  selectedResourceId: string | null;
  onResourceSelect: (resourceId: string | null) => void;

  // View options
  defaultView?: 'list' | 'tree';
  showViewToggle?: boolean;

  // Tree branch isolation
  rootPath?: string;
  hideRootNode?: boolean;

  // Search
  enableSearch?: boolean;
  searchPlaceholder?: string;
  searchScope?: 'all' | 'current-branch';

  // Annotations from host
  resourceAnnotations?: ResourceAnnotations;

  // Pending resources (for editors)
  pendingResources?: PendingResource[];

  // Optional customization
  emptyMessage?: string;
  height?: string | number;
}
```

**Note**: Component messages are handled through the ObservabilityProvider context rather than callback props.

#### Detailed Prop Documentation

##### Core Props

**`resources`** *`ProcessedResources | ExtendedProcessedResources | null`* **required**
- The resource data to display
- Must contain a `summary.resourceIds` array
- Can be null during loading states
- Should be the result of resource processing from `@fgv/ts-res`

**`selectedResourceId`** *`string | null`* **required**
- Currently selected resource ID
- Use `null` for no selection
- Must match exact resource ID including pending resources

**`onResourceSelect`** *`(resourceId: string | null) => void`* **required**
- Callback invoked when selection changes
- Receives the selected resource ID or `null` for deselection
- Called for both real and pending resources

##### View Configuration

**`defaultView`** *`'list' | 'tree'`* *default: `'list'`*
- Initial view mode when component mounts
- User can switch between modes if `showViewToggle` is enabled

**`showViewToggle`** *`boolean`* *default: `true`*
- Whether to show the list/tree toggle buttons
- When `false`, component stays in `defaultView` mode

**`height`** *`string | number`* *default: `'600px'`*
- Height of the component container
- Accepts CSS units as string or pixel values as number
- Example: `"400px"`, `"50vh"`, `400`

**`className`** *`string`* *default: `''`*
- Additional CSS classes to apply to the root container
- Useful for custom styling and layout integration

**`emptyMessage`** *`string`* *default: `'No resources available'`*
- Message displayed when no resources match current filters
- Shown in both search results and general empty states

##### Search Configuration

**`enableSearch`** *`boolean`* *default: `true`*
- Whether to show the search input field
- When disabled, all matching resources are shown

**`searchPlaceholder`** *`string`* *auto-generated*
- Custom placeholder text for search input
- Auto-generates contextual placeholders based on branch isolation
- Example: `"Search strings..."` when `rootPath="strings"`

**`searchScope`** *`'all' | 'current-branch'`* *default: `'current-branch'`*
- Scope of search operation
- `'current-branch'`: Search within filtered branch (respects `rootPath`)
- `'all'`: Search across all resources regardless of branch isolation

##### Branch Isolation

**`rootPath`** *`string`* *optional*
- Resource path to treat as the root of the displayed tree
- Only resources under this path will be shown
- Example: `"strings"` shows only string resources
- Works with dot notation: `"app.ui.components"`

**`hideRootNode`** *`boolean`* *default: `false`*
- Whether to hide the root node specified by `rootPath`
- When `true`, shows only children of the root path
- Only effective when `rootPath` is specified
- Useful for creating focused sub-tree views

##### Annotations and Edit Support

**`resourceAnnotations`** *`ResourceAnnotations`* *default: `{}`*
- Host-provided decorations for resources
- Supports badges, indicators, and suffix content
- Applied to both real and pending resources
- See `ResourceAnnotations` interface below

**`pendingResources`** *`PendingResource[]`* *default: `[]`*
- Array of resources with pending changes
- Merged seamlessly with existing resources
- Supports new, modified, and deleted states
- See `PendingResource` interface below

##### Observability

Component messages and notifications are handled through the ObservabilityProvider context. Wrap your application with `<ObservabilityProvider>` to receive component messages:

```typescript
import { ObservabilityProvider, useObservabilityContext } from '@fgv/ts-res-ui-components';

function App() {
  return (
    <ObservabilityProvider>
      <YourComponents />
    </ObservabilityProvider>
  );
}
```

Messages include:
- `'info'` - General information (e.g., resource selection)
- `'warning'` - Non-critical issues (e.g., empty results)
- `'error'` - Error conditions (e.g., loading failures)
- `'success'` - Successful operations

## Type Definitions

### ResourceAnnotations

```typescript
interface ResourceAnnotations {
  [resourceId: string]: ResourceAnnotation;
}
```

Object mapping resource IDs to their annotation configuration.

### ResourceAnnotation

```typescript
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
  suffix?: React.ReactNode;
  className?: string;
}
```

Configuration for individual resource annotations.

#### Badge

Visual badge displayed next to resource name.

- **`text`** *`string`* - Text content of the badge
- **`variant`** *`BadgeVariant`* - Visual style variant

Badge variants and their default colors:
- `info`: Blue (`bg-blue-100 text-blue-800`)
- `warning`: Yellow (`bg-yellow-100 text-yellow-800`)
- `success`: Green (`bg-green-100 text-green-800`)
- `error`: Red (`bg-red-100 text-red-800`)
- `edited`: Purple (`bg-purple-100 text-purple-800`)
- `new`: Emerald (`bg-emerald-100 text-emerald-800`)

#### Indicator

Small visual indicator (dot, icon, or text).

- **`type`** *`'dot' | 'icon' | 'text'`* - Type of indicator
- **`value`** *`string | React.ReactNode`* - Content to display
- **`tooltip`** *`string`* *optional* - Tooltip text on hover

#### Suffix

Additional content displayed after the resource name.

- **`suffix`** *`React.ReactNode`* - Any React content
- Common use: Resource counts, status text, etc.
- Example: `"(3 candidates)"`, `<Icon />`

#### ClassName

Additional CSS classes for custom styling.

- **`className`** *`string`* - CSS classes to apply
- Applied to the resource item container

### PendingResource

```typescript
interface PendingResource {
  id: string;
  type: 'new' | 'modified' | 'deleted';
  resourceType?: string;
  displayName?: string;
}
```

Represents a resource with pending changes.

#### Properties

**`id`** *`string`* **required**
- Unique identifier for the resource
- Must be globally unique (not conflict with existing resources)
- Determines placement in tree structure
- Example: `"strings.new-feature"`

**`type`** *`PendingResourceType`* **required**
- Type of pending change
- `'new'`: Resource being created (emerald styling)
- `'modified'`: Existing resource with changes (amber styling)
- `'deleted'`: Resource marked for deletion (hidden from display)

**`resourceType`** *`string`* *optional*
- Type/category of the resource
- Used for semantic grouping and validation
- Not currently used for display

**`displayName`** *`string`* *optional*
- Custom display name for the resource
- When provided, used instead of deriving name from ID
- Subject to prefix truncation in list view
- Example: `"new-feature (unsaved)"`

## Sub-Components

### ResourceItem

Individual resource item component used in list view.

```typescript
interface ResourceItemProps {
  resourceId: string;
  displayName?: string;
  isSelected: boolean;
  isPending?: boolean;
  annotation?: ResourceAnnotation;
  onClick: (resourceId: string) => void;
  searchTerm?: string;
  className?: string;
}
```

### ResourcePickerList

List view implementation.

```typescript
interface ResourcePickerListProps {
  resourceIds: string[];
  pendingResources?: PendingResource[];
  selectedResourceId: string | null;
  onResourceSelect: (resourceId: string) => void;
  resourceAnnotations?: ResourceAnnotations;
  searchTerm?: string;
  rootPath?: string;
  hideRootNode?: boolean;
  className?: string;
  emptyMessage?: string;
}
```

### ResourcePickerTree

Tree view implementation with virtual tree abstraction.

```typescript
interface ResourcePickerTreeProps {
  resources: ProcessedResources | ExtendedProcessedResources;
  pendingResources?: PendingResource[];
  selectedResourceId: string | null;
  onResourceSelect: (resourceId: string) => void;
  resourceAnnotations?: ResourceAnnotations;
  searchTerm?: string;
  rootPath?: string;
  hideRootNode?: boolean;
  className?: string;
  emptyMessage?: string;
}
```

## Utility Functions

### Tree Navigation

Located in `utils/treeNavigation.ts`:

#### filterTreeBranch

```typescript
function filterTreeBranch(
  resourceIds: string[], 
  rootPath?: string, 
  hideRootNode?: boolean
): string[]
```

Filters resource IDs to show only those under a specific path.

#### mergeWithPendingResources

```typescript
function mergeWithPendingResources(
  existingIds: string[],
  pendingResources?: PendingResource[]
): string[]
```

Merges existing resource IDs with pending resources, handling deletions.

#### searchResources

```typescript
function searchResources(
  resourceIds: string[],
  searchTerm: string,
  searchScope?: 'all' | 'current-branch',
  rootPath?: string
): string[]
```

Filters resources based on search term and scope.

### Virtual Tree

#### VirtualTreeNode

```typescript
interface VirtualTreeNode {
  id: string;
  name: string;
  isLeaf: boolean;
  isPending: boolean;
  pendingResource?: PendingResource;
  realNode?: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>;
  children: Map<string, VirtualTreeNode>;
}
```

Internal representation that merges real and pending resources.

#### createVirtualTree

```typescript
function createVirtualTree(
  realTree: Runtime.ResourceTree.IReadOnlyResourceTreeRoot<any> | null,
  pendingResources: PendingResource[]
): VirtualTreeNode | null
```

Creates a virtual tree structure merging real and pending resources.

## Constants and Enums

### Message Types

```typescript
type MessageType = 'info' | 'warning' | 'error' | 'success';
```

### Badge Variants

```typescript
type BadgeVariant = 'info' | 'warning' | 'success' | 'error' | 'edited' | 'new';
```

### Pending Resource Types

```typescript
type PendingResourceType = 'new' | 'modified' | 'deleted';
```

### View Modes

```typescript
type ViewMode = 'list' | 'tree';
```

### Search Scopes

```typescript
type SearchScope = 'all' | 'current-branch';
```

## CSS Classes and Styling

### Default Classes

The component uses Tailwind CSS classes. Key styling classes:

#### Container Classes
- `.flex .flex-col` - Main container layout
- `.overflow-y-auto` - Scrollable content area
- `.border .border-gray-200 .rounded-lg .bg-gray-50` - Content area styling

#### Resource Item Classes
- `.hover:bg-gray-100` - Hover state
- `.bg-purple-50 .border-l-2 .border-purple-500` - Selected state
- `.bg-emerald-25 .border-l-2 .border-emerald-300` - New resource
- `.bg-amber-25 .border-l-2 .border-amber-300` - Modified resource

#### Search Classes
- `.focus:ring-2 .focus:ring-blue-500` - Search input focus

### Customization

Override default styling using:

1. **className prop** - Add custom classes to root container
2. **annotation.className** - Add classes to specific resources
3. **CSS inheritance** - Override component styles in parent containers

### Theme Variables

For consistent theming, the component respects these color scales:
- Primary: Blue (selection, focus states)
- Success: Green (success badges)
- Warning: Yellow (warning badges)
- Error: Red (error badges)
- Edit: Purple (edited resources)
- New: Emerald (new resources)
- Modified: Amber (modified resources)

## Performance Notes

- **Memoization**: Component uses React.useMemo for expensive operations
- **Virtual scrolling**: Not implemented - consider for very large datasets
- **Tree expansion**: Lazy expansion prevents rendering all nodes at once
- **Search debouncing**: Not implemented - consider for large datasets
- **Memory usage**: Virtual tree creates temporary structures - monitor for large pending resource sets