# Bug Reports and Seams

## Pending/Existing Resource Edit Management Seams

The codebase has inconsistent handling between pending resources and existing resources due to being developed separately. Here are the identified seams:

### 1. clearEdits/discardEdits inconsistency with pending resources - ✅ FIXED

**Issue**: The `clearEdits()` and `discardEdits()` methods only operate on `editedResourcesInternal` Map, but edits to pending resources are stored directly in the `pendingResources` Map.

**Behavior**: 
- Edits to existing resources can be cleared/discarded ✅
- Edits to pending resources can now be cleared/discarded ✅

**Location**: `useResolutionState.ts` - implemented unified edit management

**Test**: `resultPatternExtensions.test.ts` - now tests the fixed behavior

**Fix**: ✅ **COMPLETED** - Implemented unified edit management with separate `pendingResourceEdits` Map that tracks edits to pending resources separately from the original resource templates. Both `clearEdits()` and `discardEdits()` now handle both types consistently.

### 2. Edit tracking inconsistency - ✅ FIXED

**Issue**: Two different systems for tracking edits:
- Existing resources: `editedResourcesInternal` Map with `{ originalValue, editedValue, delta }`
- Pending resources: Direct updates to `pendingResources` Map

**Fix**: ✅ **COMPLETED** - Implemented separate `pendingResourceEdits` Map with consistent `{ originalValue, editedValue }` structure. Both edit types now use similar tracking mechanisms while respecting their architectural differences.

### 3. hasEdit method only checks existing resource edits - ✅ FIXED

**Issue**: `hasEdit()` method only checks `editedResourcesInternal`, not pending resource modifications

**Fix**: ✅ **COMPLETED** - Updated `hasEdit()` to check both `pendingResourceEdits` and `editedResourcesInternal` Maps:

```typescript
const hasEdit = useCallback((resourceId: string) => {
  // Check if there are pending resource edits
  if (pendingResourceEdits.has(resourceId)) {
    return true;
  }
  // Check if there are existing resource edits
  if (editedResourcesInternal.has(resourceId)) {
    return true;
  }
  return false;
}, [pendingResourceEdits, editedResourcesInternal]);
```

### 4. getEditedValue inconsistent behavior - ✅ FIXED

**Issue**: `getEditedValue()` handles both resource types differently:
- Pending resources: Returns first candidate's JSON
- Existing resources: Returns editedValue from edit record

**Fix**: ✅ **COMPLETED** - Unified `getEditedValue()` to handle both types consistently:

```typescript
const getEditedValue = useCallback((resourceId: string) => {
  // Check pending resource edits first
  const pendingEdit = pendingResourceEdits.get(resourceId);
  if (pendingEdit) {
    return pendingEdit.editedValue;
  }
  // Check existing resource edits
  const existingEdit = editedResourcesInternal.get(resourceId);
  if (existingEdit) {
    return existingEdit.editedValue;
  }
  // Fall back to original pending resource value if no edits
  const pendingResource = pendingResources.get(resourceId);
  if (pendingResource) {
    return pendingResource.candidates?.[0]?.json;
  }
  return undefined;
}, [pendingResourceEdits, editedResourcesInternal, pendingResources]);
```

### 5. Delta computation only for existing resources - ✅ RESOLVED (By Design)

**Issue**: Pending resource edits don't get delta computation (space optimization), only existing resource edits do

**Resolution**: ✅ **ARCHITECTURAL DECISION** - This difference is appropriate by design:
- **Existing resources**: Delta represents changes to system state, needed for optimization
- **Pending resources**: No existing system state to delta against - they store template vs. edited values
- The architectural difference correctly reflects that pending resources are not yet part of the system state

## ✅ COMPLETED: Unified Solution Implementation

1. **✅ Create unified edit tracking**: Implemented with separate but consistent Maps for each resource type
2. **✅ Consistent edit metadata**: Both types now store originalValue/editedValue pairs appropriately  
3. **✅ Update all edit operations**: All methods (clearEdits, discardEdits, hasEdit, getEditedValue) now handle both types uniformly
4. **✅ Unified edit state**: Single coherent system with appropriate architectural distinctions

## Additional Improvements Completed

**✅ Result Pattern Extension**: Extended Result pattern to remaining methods including `applyPendingResources`, providing:
- Enhanced diagnostic information with detailed operation counts
- Consistent error handling across all methods
- Better debugging and system monitoring capabilities

## Status

**✅ COMPLETED** - All architectural seams resolved. The system now provides consistent, unified edit management while respecting the appropriate differences between existing and pending resources.