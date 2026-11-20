[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / UnifiedChangeControls

# Variable: UnifiedChangeControls

> `const` **UnifiedChangeControls**: `React.FC`\<`IUnifiedChangeControlsProps`\>

Unified change controls for ResolutionView.

## Example

```tsx
<UnifiedChangeControls
  editCount={state.editedResources.size}
  addCount={state.pendingResources.size}
  deleteCount={state.pendingResourceDeletions.size}
  isApplying={state.isApplyingEdits}
  disabled={!state.currentResolver}
  onApplyAll={actions.applyPendingResources}
  onDiscardAll={() => {
    actions.discardEdits();
    actions.discardPendingResources();
  }}
/>
```
