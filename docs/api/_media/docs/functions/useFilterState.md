[Home](../README.md) > useFilterState

# Function: useFilterState

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

## Signature

```typescript
function useFilterState(initialState: Partial<IFilterState>): IUseFilterStateReturn
```
