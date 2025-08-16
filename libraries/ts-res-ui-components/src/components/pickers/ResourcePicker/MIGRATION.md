# Migration Guide: Upgrading to ResourcePicker

This guide helps you migrate from existing resource viewing components to the new ResourcePicker component.

## Overview

The ResourcePicker component consolidates and enhances functionality from multiple existing components:

- **ResourceListView** → ResourcePicker (list mode)
- **ResourceTreeView** → ResourcePicker (tree mode)
- Various custom resource selectors → ResourcePicker with annotations

## Migration Benefits

- ✅ **Unified API** - Single component for both list and tree views
- ✅ **Enhanced features** - Search, branch isolation, edit support
- ✅ **Better performance** - Optimized rendering and filtering
- ✅ **Flexible annotations** - Host-controlled resource decorations
- ✅ **Edit workflow support** - Pending resources and change tracking

## Migration Paths

### From ResourceListView

#### Before (ResourceListView)

```typescript
import { ResourceListView } from '@fgv/ts-res-ui-components';

function MyComponent({ resources, selectedId, onSelect }) {
  const resourceIds = resources?.summary?.resourceIds || [];
  
  return (
    <ResourceListView
      resourceIds={resourceIds}
      selectedResourceId={selectedId}
      onResourceSelect={onSelect}
      className="h-96 border"
    />
  );
}
```

#### After (ResourcePicker)

```typescript
import { ResourcePicker } from '@fgv/ts-res-ui-components';

function MyComponent({ resources, selectedId, onSelect }) {
  return (
    <ResourcePicker
      resources={resources}
      selectedResourceId={selectedId}
      onResourceSelect={onSelect}
      defaultView="list"
      showViewToggle={false}
      height="384px" // 96 * 4px = 384px
      className="border"
    />
  );
}
```

#### Key Changes

- **Props**: Pass `resources` object instead of `resourceIds` array
- **View mode**: Set `defaultView="list"` and `showViewToggle={false}`
- **Height**: Convert Tailwind classes to explicit values if needed
- **Filtering**: Remove manual filtering - ResourcePicker handles it internally

### From ResourceTreeView

#### Before (ResourceTreeView)

```typescript
import { ResourceTreeView } from '@fgv/ts-res-ui-components';

function MyComponent({ resources, selectedId, onSelect }) {
  return (
    <div className="h-96 border">
      <ResourceTreeView
        resources={resources}
        selectedResourceId={selectedId}
        onResourceSelect={onSelect}
      />
    </div>
  );
}
```

#### After (ResourcePicker)

```typescript
import { ResourcePicker } from '@fgv/ts-res-ui-components';

function MyComponent({ resources, selectedId, onSelect }) {
  return (
    <ResourcePicker
      resources={resources}
      selectedResourceId={selectedId}
      onResourceSelect={onSelect}
      defaultView="tree"
      showViewToggle={false}
      height="384px"
      className="border"
    />
  );
}
```

#### Key Changes

- **API**: Identical props, just different component name
- **View mode**: Set `defaultView="tree"` and `showViewToggle={false}`
- **Container**: Move styling from wrapper div to ResourcePicker props

### From Custom Resource Selectors

#### Before (Custom Implementation)

```typescript
function CustomResourceSelector({ resources, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  
  const filteredResources = useMemo(() => {
    const ids = resources?.summary?.resourceIds || [];
    return searchTerm 
      ? ids.filter(id => id.toLowerCase().includes(searchTerm.toLowerCase()))
      : ids;
  }, [resources, searchTerm]);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search resources..."
      />
      <div>
        <button onClick={() => setViewMode('list')}>List</button>
        <button onClick={() => setViewMode('tree')}>Tree</button>
      </div>
      {viewMode === 'list' ? (
        <ResourceListView
          resourceIds={filteredResources}
          onResourceSelect={onSelect}
        />
      ) : (
        <ResourceTreeView
          resources={resources}
          onResourceSelect={onSelect}
        />
      )}
    </div>
  );
}
```

#### After (ResourcePicker)

```typescript
function CustomResourceSelector({ resources, onSelect }) {
  return (
    <ResourcePicker
      resources={resources}
      selectedResourceId={null}
      onResourceSelect={onSelect}
      enableSearch={true}
      showViewToggle={true}
      searchPlaceholder="Search resources..."
    />
  );
}
```

#### Key Changes

- **Removed manual state management** - ResourcePicker handles search and view mode internally
- **Simplified props** - All functionality built-in
- **Eliminated custom filtering logic** - Handled internally with better performance

## Advanced Migration Scenarios

### Adding Branch Isolation

If you had manual filtering for specific resource branches:

#### Before (Manual Filtering)

```typescript
function StringResourceView({ resources, selectedId, onSelect }) {
  const stringResources = useMemo(() => {
    const ids = resources?.summary?.resourceIds || [];
    return ids.filter(id => id.startsWith('strings.'));
  }, [resources]);

  return (
    <ResourceListView
      resourceIds={stringResources}
      selectedResourceId={selectedId}
      onResourceSelect={onSelect}
    />
  );
}
```

#### After (Branch Isolation)

```typescript
function StringResourceView({ resources, selectedId, onSelect }) {
  return (
    <ResourcePicker
      resources={resources}
      selectedResourceId={selectedId}
      onResourceSelect={onSelect}
      rootPath="strings"
      hideRootNode={true}
      defaultView="list"
      showViewToggle={false}
    />
  );
}
```

### Adding Resource Annotations

If you had custom resource status indicators:

#### Before (Custom Status Display)

```typescript
function ResourceViewWithStatus({ resources, editedResources, selectedId, onSelect }) {
  return (
    <div>
      {resources?.summary?.resourceIds?.map(id => (
        <div
          key={id}
          onClick={() => onSelect(id)}
          className={`p-2 ${selectedId === id ? 'bg-blue-50' : ''}`}
        >
          {id}
          {editedResources.includes(id) && (
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              EDITED
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### After (Resource Annotations)

```typescript
function ResourceViewWithStatus({ resources, editedResources, selectedId, onSelect }) {
  const annotations = useMemo(() => {
    const annotations: ResourceAnnotations = {};
    editedResources.forEach(id => {
      annotations[id] = {
        badge: { text: 'EDITED', variant: 'edited' }
      };
    });
    return annotations;
  }, [editedResources]);

  return (
    <ResourcePicker
      resources={resources}
      selectedResourceId={selectedId}
      onResourceSelect={onSelect}
      resourceAnnotations={annotations}
      defaultView="list"
    />
  );
}
```

## Step-by-Step Migration Process

### 1. Identify Current Usage

First, audit your codebase to find all usages of resource viewing components:

```bash
# Find ResourceListView usage
grep -r "ResourceListView" src/

# Find ResourceTreeView usage  
grep -r "ResourceTreeView" src/

# Find custom resource selector patterns
grep -r "resourceIds.*filter\|resourceIds.*map" src/
```

### 2. Plan Migration Strategy

For each usage, determine:

- **View mode needed**: List, tree, or both?
- **Search requirements**: Global search or branch-specific?
- **Branch isolation**: Showing full tree or specific branches?
- **Annotations**: Any status indicators or metadata?
- **Edit support**: Need to show pending changes?

### 3. Create Migration Checklist

For each component to migrate:

- [ ] Replace component import
- [ ] Update props structure
- [ ] Convert manual filtering to branch isolation
- [ ] Move custom annotations to ResourceAnnotations
- [ ] Test functionality parity
- [ ] Update tests if needed

### 4. Migrate Components

Start with simplest migrations (direct replacements) and work toward complex ones.

### 5. Validate Migration

- [ ] All functionality works as before
- [ ] Performance is equal or better
- [ ] Visual appearance is acceptable
- [ ] Accessibility is maintained
- [ ] Tests pass

## Common Migration Issues

### Issue: Manual Height/Width Styling

**Problem**: ResourcePicker requires explicit height prop

```typescript
// ❌ This won't work - no height specified
<ResourcePicker resources={resources} />

// ✅ Specify height explicitly
<ResourcePicker resources={resources} height="400px" />
```

### Issue: Resource ID Array vs Resources Object

**Problem**: ResourceListView used resourceIds array, ResourcePicker uses resources object

```typescript
// ❌ Old way
<ResourceListView resourceIds={resourceIds} />

// ✅ New way
<ResourcePicker resources={processedResourcesObject} />
```

### Issue: Custom Filtering Logic

**Problem**: Manual filtering may not translate directly

```typescript
// ❌ Don't try to filter manually
const filtered = resources.summary.resourceIds.filter(customLogic);
<ResourcePicker resources={{ ...resources, summary: { resourceIds: filtered } }} />

// ✅ Use branch isolation or search instead
<ResourcePicker 
  resources={resources} 
  rootPath="specific.branch"
  enableSearch={true}
/>
```

### Issue: Selection Callback Differences

**Problem**: Different callback signatures

```typescript
// Old ResourceListView callback
onResourceSelect: (resourceId: string) => void

// New ResourcePicker callback  
onResourceSelect: (resourceId: string | null) => void
```

**Solution**: Handle null values in your callback:

```typescript
const handleSelect = (resourceId: string | null) => {
  if (resourceId) {
    // Handle selection
    setSelectedResource(resourceId);
  } else {
    // Handle deselection
    setSelectedResource(null);
  }
};
```

## Testing Migration

### Unit Tests

Update test imports and mock structures:

```typescript
// Before
import { ResourceListView } from '@fgv/ts-res-ui-components';

// After
import { ResourcePicker } from '@fgv/ts-res-ui-components';

// Update test props
const testProps = {
  resources: mockProcessedResources, // Not resourceIds array
  selectedResourceId: null,
  onResourceSelect: jest.fn(),
  defaultView: 'list' as const,
  showViewToggle: false
};
```

### Integration Tests

Verify end-to-end functionality:

1. **Resource loading and display**
2. **Search functionality**
3. **Selection handling**
4. **Branch isolation (if used)**
5. **Annotations (if used)**

### Visual Testing

Compare before/after screenshots to ensure visual parity:

1. **Empty state**
2. **Loaded state**
3. **Selected state**
4. **Search results**
5. **Different screen sizes**

## Performance Considerations

### Before Migration

- Multiple components managing separate state
- Manual filtering logic in each component
- Duplicate search implementations

### After Migration

- Single component with optimized state management
- Built-in memoization for expensive operations
- Unified search and filtering logic

### Expected Improvements

- **Memory usage**: Reduced component instances
- **Render performance**: Better change detection
- **Bundle size**: Eliminated duplicate code
- **Developer experience**: Consistent API across usage

## Rollback Plan

If migration causes issues:

1. **Keep old components** during migration period
2. **Feature flag** new ResourcePicker usage
3. **Gradual rollout** component by component
4. **Monitor performance** and user feedback
5. **Quick revert** capability if needed

## Migration Timeline

### Phase 1: Preparation (1-2 days)
- Audit existing usage
- Plan migration strategy
- Set up ResourcePicker in design system

### Phase 2: Simple Migrations (2-3 days)
- Direct ResourceListView/ResourceTreeView replacements
- Update imports and basic props
- Test basic functionality

### Phase 3: Complex Migrations (3-5 days)
- Components with custom filtering
- Add branch isolation and annotations
- Update related components

### Phase 4: Testing & Refinement (2-3 days)
- Comprehensive testing
- Performance validation
- Visual design refinements
- Documentation updates

### Phase 5: Cleanup (1-2 days)
- Remove old component usage
- Update documentation
- Clean up unused code

## Support and Resources

### Documentation
- [ResourcePicker README](./README.md) - Complete usage guide
- [API Reference](./API.md) - Detailed prop documentation
- [Integration Examples](./EXAMPLES.md) - Real-world usage patterns

### Migration Help
- Check existing unit tests for usage patterns
- Refer to playground implementation for complex scenarios
- Review TypeScript types for prop requirements

### Common Questions

**Q: Can I use ResourcePicker alongside existing components?**
A: Yes, ResourcePicker is designed to work alongside existing components during migration.

**Q: What if I need features not available in ResourcePicker?**
A: File an issue with your requirements - ResourcePicker is designed to be extensible.

**Q: Are there performance benefits to migrating?**
A: Yes, ResourcePicker includes optimizations not present in older components.

**Q: How do I handle custom styling?**
A: Use the className prop and CSS inheritance, or ResourceAnnotations for resource-specific styling.