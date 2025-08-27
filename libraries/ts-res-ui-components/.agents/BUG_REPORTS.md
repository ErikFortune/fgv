# Bug Reports and Seams

## Pending/Existing Resource Edit Management Seams

The codebase has inconsistent handling between pending resources and existing resources due to being developed separately. Here are the identified seams:

### 1. clearEdits/discardEdits inconsistency with pending resources

**Issue**: The `clearEdits()` and `discardEdits()` methods only operate on `editedResourcesInternal` Map, but edits to pending resources are stored directly in the `pendingResources` Map.

**Behavior**: 
- Edits to existing resources can be cleared/discarded ✅
- Edits to pending resources cannot be cleared/discarded ❌

**Location**: `useResolutionState.ts` lines 793-829

**Test**: `resultPatternExtensions.test.ts` - demonstrates the bug

**Fix**: Track pending resource edits separately or unify edit management

### 2. Edit tracking inconsistency

**Issue**: Two different systems for tracking edits:
- Existing resources: `editedResourcesInternal` Map with `{ originalValue, editedValue, delta }`
- Pending resources: Direct updates to `pendingResources` Map

**Impact**: Different edit capabilities and metadata between resource types

### 3. hasEdit method only checks existing resource edits  

**Issue**: `hasEdit()` method only checks `editedResourcesInternal`, not pending resource modifications

```typescript
const hasEdit = useCallback((resourceId: string) => {
  if (pendingResources.has(resourceId)) {
    return false; // Always returns false for pending resources
  }
  return editedResourcesInternal.has(resourceId);
}, [editedResourcesInternal, pendingResources]);
```

**Impact**: UI edit indicators won't show for pending resource modifications

### 4. getEditedValue inconsistent behavior

**Issue**: `getEditedValue()` handles both resource types differently:
- Pending resources: Returns first candidate's JSON
- Existing resources: Returns editedValue from edit record

**Impact**: May not return consistent data structure or metadata

### 5. Delta computation only for existing resources

**Issue**: Pending resource edits don't get delta computation (space optimization), only existing resource edits do

**Impact**: Pending resource edits take more memory and network bandwidth

## Recommended Unified Solution

1. **Create unified edit tracking**: Single system that tracks both types
2. **Consistent edit metadata**: Delta computation, original values for both types  
3. **Update all edit operations**: clearEdits, discardEdits, hasEdit, getEditedValue
4. **Unified edit state**: Single source of truth for all edit-related state

## Priority

**High** - These seams create confusing UX and data inconsistencies that affect core editing functionality.