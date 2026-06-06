[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / IOrchestratorState

# Interface: IOrchestratorState

Complete state object for the resource orchestrator system.

This interface represents the central state management for ts-res resources, encompassing
all aspects of resource processing, configuration, filtering, and resolution. It serves as
the primary state container for applications using the resource orchestrator.

## Examples

```typescript
// Basic usage with the orchestrator hook
import { ResourceTools } from '@fgv/ts-res-ui-components';

function MyResourceApp() {
  const { state, actions } = ResourceTools.useResourceData();

  // Check if resources are loaded
  if (!state.resources) {
    return <div>No resources loaded</div>;
  }

  // Display current state information
  return (
    <div>
      <p>Resources: {state.resources.summary?.resourceCount || 0}</p>
      <p>Configuration: {state.configuration ? 'Loaded' : 'Default'}</p>
      <p>Processing: {state.isProcessing ? 'Yes' : 'No'}</p>
      <p>Selected: {state.selectedResourceId || 'None'}</p>
    </div>
  );
}
```

```typescript
// Working with filter state
const { state } = ResourceTools.useResourceData();

// Check if filters are applied
const hasActiveFilters = Object.keys(state.filterState.appliedValues).length > 0;
const filteredResourceCount = state.filterResult?.resources?.summary?.resourceCount || 0;

console.log(`Filters active: ${hasActiveFilters}`);
console.log(`Filtered resources: ${filteredResourceCount}`);
```

```typescript
// Working with resolution state
const { state } = ResourceTools.useResourceData();

// Check resolution context
const hasResolutionContext = Object.keys(state.resolutionState.context).length > 0;
const currentMode = state.resolutionState.viewMode;
const hasEdits = Object.keys(state.resolutionState.editedResources).length > 0;

console.log(`Resolution mode: ${currentMode}`);
console.log(`Has context: ${hasResolutionContext}`);
console.log(`Has edits: ${hasEdits}`);
```

## Properties

| Property | Type |
| ------ | ------ |
| <a id="configuration"></a> `configuration` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) \| `null` |
| <a id="error"></a> `error` | `string` \| `null` |
| <a id="filterresult"></a> `filterResult` | [`IFilterResult`](../namespaces/FilterTools/interfaces/IFilterResult.md) \| `null` |
| <a id="filterstate"></a> `filterState` | [`IFilterState`](../namespaces/FilterTools/interfaces/IFilterState.md) |
| <a id="isprocessing"></a> `isProcessing` | `boolean` |
| <a id="messages"></a> `messages` | `IMessage`[] |
| <a id="resolutionstate"></a> `resolutionState` | [`IResolutionState`](../namespaces/ResolutionTools/interfaces/IResolutionState.md) |
| <a id="resourceeditorfactory"></a> `resourceEditorFactory?` | [`IResourceEditorFactory`](../namespaces/ResourceTools/interfaces/IResourceEditorFactory.md)\<`unknown`, [`JsonValue`](../type-aliases/JsonValue.md)\> |
| <a id="resources"></a> `resources` | [`IExtendedProcessedResources`](../namespaces/ResourceTools/interfaces/IExtendedProcessedResources.md) \| `null` |
| <a id="selectedresourceid"></a> `selectedResourceId` | `string` \| `null` |
