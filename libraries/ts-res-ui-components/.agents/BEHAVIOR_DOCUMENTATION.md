# ResolutionState Behavior Documentation

This document describes behaviors in the ResolutionState system that are correct but may not be immediately obvious to users.

## Context Management Behaviors

### Context Reset with `undefined` Values

**Behavior**: Setting context values to `undefined` and applying them properly clears those values from the effective context.

```typescript
// ✅ Correct way to clear/reset context values:
actions.updateContextValue('language', undefined);
actions.updateContextValue('currentTerritory', undefined); 
actions.applyContext();

// Result: Both values become undefined in the effective context
```

**Why this works**: 
- `undefined` is a valid context value that means "no value set"
- The system distinguishes between `undefined` (not set) and `""` (empty string)
- Setting to `undefined` effectively removes the qualifier from context evaluation

**Alternative approaches considered**:
- A dedicated `clearContext()` method (not implemented - use undefined instead)
- Automatic reset to defaults (not implemented - explicit is better)

### Pending Changes State Management

**Behavior**: The `hasPendingChanges` state reflects whether there are unapplied context changes, independent of the actual values.

```typescript
// These create pending changes even if values are undefined:
actions.updateContextValue('language', undefined); 
// hasPendingChanges = true until applyContext() is called

actions.applyContext();
// hasPendingChanges = false (changes have been applied)
```

**Why this works**:
- Pending state tracks the act of making changes, not the content of changes
- This allows users to see they have pending operations before applying them
- Helps prevent accidental loss of intended changes

## Resource Selection Behaviors

### Selection with Non-Existent Resources

**Behavior**: `selectResource()` will set the `selectedResourceId` even for non-existent resources, but creates an error `ResolutionResult`.

```typescript
// This will:
// 1. Set selectedResourceId = 'nonexistent.resource'  
// 2. Create ResolutionResult with success=false and error message
// 3. Return fail() Result with diagnostic message
const result = actions.selectResource('nonexistent.resource');
```

**Why this works**:
- Allows UI to maintain selection state for error display
- Users can see which resource they tried to select
- Error state is clearly communicated through ResolutionResult
- UI can show "Resource 'xyz' not found" with the actual resource ID

**Alternative approaches considered**:
- Clear selection on error (not implemented - loses context for user)
- Throw exceptions (not implemented - Result pattern is better)
- Silent failure (not implemented - no user feedback)

### UI State Consistency During Errors

**Behavior**: When operations fail, the UI state is often updated to reflect the attempted operation, while the error is communicated separately.

```typescript
// Failed selection still updates selectedResourceId for UI consistency
actions.selectResource('bad.resource'); 
// selectedResourceId = 'bad.resource'
// resolutionResult.success = false
// resolutionResult.error = "Resource not found"
```

**Why this works**:
- Users can see what they tried to do
- Error messages can reference the specific resource/qualifier they used
- UI can provide better error recovery options
- Maintains user mental model of their actions

## Resource Editing Behaviors

### Pending Resource vs Existing Resource Handling

**Behavior**: The system handles editing of pending resources (newly created) differently from existing resources.

```typescript
// Pending resources:
// - Direct template modification
// - Context conditions automatically stamped
// - Immediate ResolutionResult update

// Existing resources: 
// - Delta computation for efficient storage
// - Separate edit tracking
// - Validation against original system resources
```

**Why this works**:
- Pending resources are "owned" by the editor, can be freely modified
- Existing resources need careful change tracking for system integration
- Different storage strategies optimize for different use cases

## Context Condition Stamping

**Behavior**: When creating or editing resources, the current effective context is automatically "stamped" as conditions on the resource.

```typescript
// If effective context is { language: 'en-US', platform: 'web' }
// Creating/editing a resource automatically adds:
// conditions: [
//   { qualifierName: 'language', operator: 'matches', value: 'en-US' },
//   { qualifierName: 'platform', operator: 'matches', value: 'web' }
// ]
```

**Why this works**:
- Ensures resources are associated with the context they were created in
- Prevents accidental creation of "universal" resources
- Provides proper context-aware resolution later
- Makes the user's intent explicit in the resource definition

## Error Handling Philosophy

### Result Pattern Usage

**Behavior**: Methods return `Result<T>` objects instead of throwing exceptions, with detailed error messages.

```typescript
// All operations use Result pattern:
const updateResult = actions.updateContextValue('', 'value'); // fail("Qualifier name cannot be empty")
const selectResult = actions.selectResource('bad.id'); // fail("Resource 'bad.id' not found in system") 
const editResult = actions.saveEdit('bad.id', {}); // fail("Resource 'bad.id' not found in system")
```

**Why this works**:
- Errors are explicit in the type system
- Callers must handle errors deliberately  
- Detailed error messages aid debugging
- Consistent error handling across all operations
- Better testability with Result matchers

### Warning vs Error Classification

**Behavior**: Some validation issues generate warnings instead of errors, allowing operations to continue.

```typescript
// Unknown qualifiers generate warnings but don't fail:
actions.updateContextValue('unknownQualifier', 'value'); // succeeds with warning
// Still allows flexibility for dynamic/custom qualifiers
```

**Why this works**:
- Balances validation with flexibility
- Allows for extending system with new qualifiers
- Users get feedback but aren't blocked
- Clear distinction between critical vs advisory issues

## Performance Optimizations

### Resource Resolution Caching

**Behavior**: The system caches resolution results and only re-resolves when context changes.

```typescript
// First resolution: computed and cached
// Subsequent calls with same context: returned from cache  
// Context change: cache cleared, fresh resolution
```

### Delta-Based Edit Storage

**Behavior**: For existing resources, only the differences (deltas) are stored, not full values.

**Why this works**:
- Reduces memory usage for large resources with small changes
- Faster serialization/deserialization
- Better diff visualization for users
- More efficient network transfer if integrated with backend

---

## Summary

These behaviors prioritize:
1. **Explicit over implicit**: Users control when changes are applied
2. **Recoverable errors**: UI maintains state for better error recovery  
3. **Performance**: Caching and delta storage optimize for common operations
4. **Flexibility**: Warnings instead of errors where appropriate
5. **Type safety**: Result pattern makes error handling explicit and testable

When in doubt about these behaviors, refer to the test cases in the `workflows/` directory for concrete examples.