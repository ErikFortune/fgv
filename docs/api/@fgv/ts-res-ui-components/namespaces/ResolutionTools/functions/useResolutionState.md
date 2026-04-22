[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / useResolutionState

# Function: useResolutionState()

> **useResolutionState**(`processedResources`, `onSystemUpdate?`): `IUseResolutionStateReturn`

Hook for managing resource resolution state and editing operations.

This hook provides comprehensive state management for resource resolution,
including context management, resource editing, and conflict detection.
It integrates with the ts-res library to provide real-time resolution
results and supports editing resources with validation and preview functionality.

Key features:
- **Context Management**: Set and update resolution context (qualifiers)
- **Resource Resolution**: Real-time resolution with detailed results
- **Resource Editing**: Edit resources with validation and conflict detection
- **Preview Mode**: See how edits affect resolution without committing
- **Change Tracking**: Track pending changes and detect conflicts

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `processedResources` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) \| `null` | The processed resources to work with |
| `onSystemUpdate?` | (`updatedResources`) => `void` | Optional callback when the resource system is updated with edits |

## Returns

`IUseResolutionStateReturn`

Object containing resolution state, actions, and available qualifiers

## Example

```tsx
function ResourceResolutionView({ processedResources }: { processedResources: ProcessedResources }) {
  const { state, actions, availableQualifiers } = useResolutionState(
    processedResources,
    (updatedResources) => {
      // Handle system updates when edits are applied
      setProcessedResources(updatedResources);
    }
  );

  return (
    <div>
      <QualifierSelector
        availableQualifiers={availableQualifiers}
        context={state.context}
        onChange={actions.updateContext}
      />

      <ResourcePicker
        selectedResourceId={state.selectedResourceId}
        onResourceSelect={(selection) => {
          actions.selectResource(selection.resourceId);
        }}
      />

      {state.resolutionResult && (
        <ResolutionDisplay
          result={state.resolutionResult}
          isEditing={state.isEditing}
          editedValue={state.editedValue}
          onEdit={actions.startEditing}
          onSave={actions.saveEdit}
          onCancel={actions.cancelEdit}
        />
      )}
    </div>
  );
}
```
