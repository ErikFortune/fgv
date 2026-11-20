[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [FilterTools](../README.md) / useFilterState

# Function: useFilterState()

> **useFilterState**(`initialState?`): `IUseFilterStateReturn`

Hook for managing resource filtering state.

This hook provides state management for resource filtering operations,
including filter values, pending changes tracking, and apply/reset operations.
It's designed to work with the FilterView component to provide a complete
filtering experience with change tracking and validation.

Key features:
- **Filter Management**: Enable/disable filtering and manage filter values
- **Change Tracking**: Track pending changes before applying filters
- **Validation**: Prevent invalid filter states and provide user feedback
- **Qualifier Reduction**: Option to reduce qualifier scope when filtering

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initialState?` | `Partial`\<[`IFilterState`](../interfaces/IFilterState.md)\> | Optional initial filter state |

## Returns

`IUseFilterStateReturn`

Object containing filter state and actions

## Example

```tsx
function ResourceFilterView() {
  const { state, actions } = useFilterState({
    enabled: true,
    values: { platform: 'web', locale: 'en' }
  });

  return (
    <div>
      <FilterControls
        enabled={state.enabled}
        values={state.values}
        hasPendingChanges={state.hasPendingChanges}
        onEnabledChange={actions.updateFilterEnabled}
        onValueChange={actions.updateFilterValue}
        onApply={actions.applyFilters}
        onReset={actions.resetFilters}
      />

      {state.enabled && (
        <FilteredResourceView filterValues={state.appliedValues} />
      )}
    </div>
  );
}
```
