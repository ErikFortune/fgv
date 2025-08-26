# Resource Orchestrator Guide

## Overview
The Resource Orchestrator provides comprehensive state management for creating, editing, and managing resources in ts-res-ui-components. This guide covers the improved APIs that make resource management simpler and more robust.

## Table of Contents
- [Quick Start](#quick-start)
- [Atomic Resource Creation](#atomic-resource-creation)
- [Multi-Step Resource Flow](#multi-step-resource-flow)
- [Pending Resource Management](#pending-resource-management)
- [Helper Utilities](#helper-utilities)
- [TypeScript API](#typescript-api)
- [Migration Guide](#migration-guide)

## Quick Start

### Preferred: Atomic Resource Creation
The simplest and most reliable way to create a new resource:

```typescript
import { ResolutionTools } from '@fgv/ts-res-ui-components';

const { state, actions } = ResolutionTools.useResolutionState(
  processedResources,
  onMessage,
  onSystemUpdate
);

// Create a resource in one atomic call
await actions.createPendingResource({
  id: 'platform.languages.en-US',
  resourceTypeName: 'languageConfig',
  json: { 
    displayName: 'English (US)',
    locale: 'en-US',
    isDefault: true
  }
});
```

### Alternative: Multi-Step Flow
For cases where you need user interaction at each step:

```typescript
// Step 1: Start new resource with optional pre-seeding
const result = actions.startNewResource({
  resourceTypeName: 'languageConfig',
  id: 'platform.languages.en-US',  // Optional
  json: { displayName: 'English' }   // Optional
});

// Step 2: Update ID if not pre-seeded
if (result.isSuccess()) {
  actions.updateNewResourceId('platform.languages.en-US');
}

// Step 3: Select resource type if needed
actions.selectResourceType('languageConfig');

// Step 4: Update JSON content
actions.updateNewResourceJson({
  displayName: 'English (US)',
  locale: 'en-US'
});

// Step 5: Save to pending
const saveResult = actions.saveNewResourceAsPending();
if (saveResult.isSuccess()) {
  console.log('Resource added to pending');
}
```

## Atomic Resource Creation

### createPendingResource API

The `createPendingResource` API is the recommended way to create resources. It validates and stores a resource in a single atomic operation.

```typescript
interface CreatePendingResourceParams {
  /** Full resource ID (e.g., 'platform.languages.en-US') */
  id: string;
  /** Resource type name (e.g., 'languageConfig') */
  resourceTypeName: string;
  /** JSON value for the resource */
  json: JsonValue;
}

// Usage
const result = await actions.createPendingResource({
  id: 'format.outputs.json',
  resourceTypeName: 'formatConfig',
  json: {
    extension: '.json',
    mimeType: 'application/json',
    formatter: 'json'
  }
});

if (result.isSuccess()) {
  console.log('Resource created successfully');
} else {
  console.error('Failed:', result.message);
}
```

### Validation Rules

The API enforces these validations:
- **ID must be permanent**: Cannot start with `new-resource-`
- **ID must be unique**: Cannot already exist in the system or pending resources
- **Resource type must exist**: Must match a registered resource type
- **JSON must be valid**: Must be a valid JSON value

### Error Messages

Clear, actionable error messages:
- `"Cannot create resource with temporary ID 'new-resource-123'. Please provide a permanent resource ID."`
- `"Resource ID 'platform.languages.en-US' already exists"`
- `"Resource type 'invalidType' not found. Available types: languageConfig, formatConfig, ..."`

## Multi-Step Resource Flow

### Complete Flow Example

```typescript
// With lifecycle callbacks for UI updates
const { state, actions } = ResolutionTools.useResolutionState(
  processedResources,
  onMessage,
  onSystemUpdate,
  {
    onDraftUpdate: (draft) => {
      console.log('Draft updated:', draft);
      updateUI(draft);
    },
    enableDebugLogging: true
  }
);

// Start with pre-seeded values
const startResult = actions.startNewResource({
  resourceTypeName: 'languageConfig',
  id: 'platform.languages.fr-FR',
  json: { displayName: 'French' }
});

if (!startResult.isSuccess()) {
  console.error('Failed to start:', startResult.message);
  return;
}

// Update as needed
actions.updateNewResourceId('platform.languages.fr-CA');
actions.updateNewResourceJson({
  displayName: 'French (Canada)',
  locale: 'fr-CA',
  region: 'CA'
});

// Save when ready
const saveResult = actions.saveNewResourceAsPending();
if (saveResult.isSuccess()) {
  // Access the updated state
  const { pendingResources } = saveResult.value;
  console.log('Pending resources:', pendingResources.size);
}
```

### Action Return Values

All mutating actions now return `Result<OrchestratorActionResult>`:

```typescript
interface OrchestratorActionResult {
  success: boolean;
  draft?: NewResourceDraft;
  pendingResources?: Map<string, ILooseResourceDecl>;
}
```

This eliminates the need for polling or timeouts to get updated state.

## Pending Resource Management

### Key Guarantees

1. **Full Resource IDs**: All pending resource keys are guaranteed to be full resource IDs (e.g., `platform.languages.en-US`), never leaf IDs.

2. **Resource Type Included**: All pending resources include `resourceTypeName` in their structure.

3. **Atomic Operations**: Resources are validated before being added to pending state.

### Managing Pending Resources

```typescript
// Get all pending additions by type
const languageAdditions = ResolutionTools.getPendingAdditionsByType(
  state.pendingResources,
  'languageConfig'
);

// Check if a resource is pending
const isPending = ResolutionTools.isPendingAddition(
  'platform.languages.en-US',
  state
);

// Count pending changes
const counts = ResolutionTools.countPendingChanges(state);
console.log(`${counts.additions} additions, ${counts.deletions} deletions`);

// Apply all pending changes
const applyResult = await actions.applyPendingResources();
if (applyResult.isSuccess()) {
  console.log('All changes applied successfully');
}
```

## Helper Utilities

### Resource ID Utilities

```typescript
// Derive leaf ID from full ID
const leafId = ResolutionTools.deriveLeafId('platform.languages.en-US');
// Result: 'en-US'

// Build full ID from parts
const fullId = ResolutionTools.deriveFullId(['platform', 'languages'], 'en-US');
// Result: 'platform.languages.en-US'

// Get parent path
const parent = ResolutionTools.getParentPath('platform.languages.en-US');
// Result: 'platform.languages'

// Check if ID is valid (not temporary)
const isValid = ResolutionTools.isValidResourceId('new-resource-123');
// Result: false
```

### UI Integration Helpers

```typescript
// Merge pending resources with existing list for display
const allResourceIds = ResolutionTools.mergeResourceListWithPending(
  existingIds,
  state
);

// Get sorted pending IDs
const sortedPending = ResolutionTools.getSortedPendingResourceIds(state);

// Get display name for pending resource
const displayName = ResolutionTools.getPendingResourceDisplayName(
  'platform.languages.en-US'
);
// Result: 'en-US'
```

## TypeScript API

### Exported Types

```typescript
import { 
  OrchestratorState,      // Full orchestrator state
  OrchestratorActions,    // All available actions
  CreatePendingResourceParams,
  StartNewResourceParams,
  OrchestratorActionResult,
  DraftLifecycleOptions
} from '@fgv/ts-res-ui-components';
```

### ILooseResourceDecl Structure

```typescript
interface ILooseResourceDecl {
  id: string;
  resourceTypeName?: string;  // Now always included
  candidates: Array<{
    json: JsonObject;
    conditions?: ILooseConditionDecl[];
    isPartial?: boolean;
    mergeMethod?: 'replace' | 'merge';
  }>;
}
```

## Migration Guide

### From Multi-Step to Atomic

**Before:**
```typescript
// Old multi-step approach
actions.startNewResource('languageConfig');
actions.updateNewResourceId('platform.languages.en-US');
actions.selectResourceType('languageConfig');
// ... manually update JSON somehow
actions.saveNewResourceAsPending();
```

**After:**
```typescript
// New atomic approach
await actions.createPendingResource({
  id: 'platform.languages.en-US',
  resourceTypeName: 'languageConfig',
  json: { displayName: 'English (US)', locale: 'en-US' }
});
```

### Handling Return Values

**Before:**
```typescript
// No return values, had to poll state
actions.saveNewResourceAsPending();
setTimeout(() => {
  if (state.pendingResources.has(resourceId)) {
    // Success
  }
}, 100);
```

**After:**
```typescript
// Immediate Result with state snapshot
const result = actions.saveNewResourceAsPending();
if (result.isSuccess()) {
  const { pendingResources } = result.value;
  // Use the snapshot immediately
}
```

### Using Full Resource IDs

**Before:**
```typescript
// Might use leaf ID or full ID inconsistently
pendingResources.set('en-US', resource);  // Wrong!
```

**After:**
```typescript
// Always use full resource IDs
pendingResources.set('platform.languages.en-US', resource);  // Correct
```

## Development Mode

Enable debug logging for troubleshooting:

```typescript
const { state, actions } = ResolutionTools.useResolutionState(
  processedResources,
  onMessage,
  onSystemUpdate,
  {
    enableDebugLogging: true,
    onDraftUpdate: (draft) => {
      console.log('[Draft]', JSON.stringify(draft, null, 2));
    }
  }
);
```

This logs:
- Draft creation and updates
- State transitions
- Validation results
- Action outcomes

## Best Practices

1. **Prefer Atomic API**: Use `createPendingResource` for simple resource creation
2. **Validate Early**: Check IDs before attempting to create resources
3. **Handle Results**: Always check `Result.isSuccess()` and handle failures
4. **Use Full IDs**: Always work with full resource IDs, not leaf IDs
5. **Leverage Helpers**: Use the provided utilities for ID manipulation and UI integration

## Common Patterns

### Grid Integration
```typescript
// Get all resources including pending
const allResources = ResolutionTools.mergeResourceListWithPending(
  gridData.resourceIds,
  state
);

// Filter by type
const languages = ResolutionTools.getPendingAdditionsByType(
  state.pendingResources,
  'languageConfig'
);

// Update grid immediately after adding
const result = await actions.createPendingResource(params);
if (result.isSuccess()) {
  gridComponent.refresh();
}
```

### Form Validation
```typescript
// Validate before creating
const id = formData.resourceId;
if (!ResolutionTools.isValidResourceId(id)) {
  showError('Please enter a permanent resource ID');
  return;
}

if (ResolutionTools.isPendingAddition(id, state)) {
  showError('This resource is already pending');
  return;
}
```

## Error Recovery

```typescript
// Robust error handling
async function createResourceSafely(params: CreatePendingResourceParams) {
  try {
    const result = await actions.createPendingResource(params);
    
    if (result.isFailure()) {
      // Check specific error types
      if (result.message.includes('already exists')) {
        // Handle duplicate
        const proceed = await confirmDialog('Resource exists. Overwrite?');
        if (proceed) {
          actions.removePendingResource(params.id);
          return actions.createPendingResource(params);
        }
      } else if (result.message.includes('temporary ID')) {
        // Handle temporary ID
        const newId = await promptForId();
        return actions.createPendingResource({ ...params, id: newId });
      } else {
        // Generic error
        showError(result.message);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Unexpected error:', error);
    return fail(`Unexpected error: ${error.message}`);
  }
}
```

## Summary

The improved orchestrator APIs provide:
- **Atomic Operations**: Single-call resource creation
- **Clear Validation**: Actionable error messages
- **Consistent State**: Full resource IDs everywhere
- **Return Values**: No more polling or timeouts
- **Helper Utilities**: Common operations simplified
- **TypeScript Support**: Fully typed APIs
- **Debug Support**: Optional logging and callbacks

Use `createPendingResource` for simple cases, the multi-step flow for complex UI interactions, and the helper utilities for common operations.