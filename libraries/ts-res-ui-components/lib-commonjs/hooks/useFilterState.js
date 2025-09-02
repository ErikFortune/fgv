'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.useFilterState = useFilterState;
const react_1 = require('react');
const initialFilterState = {
  enabled: false,
  values: {},
  appliedValues: {},
  hasPendingChanges: false,
  reduceQualifiers: false
};
// Normalize values by filtering out undefined and empty strings for consistent comparison
const normalizeValues = (vals) => {
  const normalized = {};
  Object.entries(vals).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      normalized[key] = value;
    }
  });
  return normalized;
};
/**
 * Hook for managing resource filtering state.
 *
 * This hook provides state management for resource filtering operations,
 * including filter values, pending changes tracking, and apply/reset operations.
 * It's designed to work with the FilterView component to provide a complete
 * filtering experience with change tracking and validation.
 *
 * Key features:
 * - **Filter Management**: Enable/disable filtering and manage filter values
 * - **Change Tracking**: Track pending changes before applying filters
 * - **Validation**: Prevent invalid filter states and provide user feedback
 * - **Qualifier Reduction**: Option to reduce qualifier scope when filtering
 *
 * @example
 * ```tsx
 * function ResourceFilterView() {
 *   const { state, actions } = useFilterState({
 *     enabled: true,
 *     values: { platform: 'web', locale: 'en' }
 *   });
 *
 *   return (
 *     <div>
 *       <FilterControls
 *         enabled={state.enabled}
 *         values={state.values}
 *         hasPendingChanges={state.hasPendingChanges}
 *         onEnabledChange={actions.updateFilterEnabled}
 *         onValueChange={actions.updateFilterValue}
 *         onApply={actions.applyFilters}
 *         onReset={actions.resetFilters}
 *       />
 *
 *       {state.enabled && (
 *         <FilteredResourceView filterValues={state.appliedValues} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @param initialState - Optional initial filter state
 * @returns Object containing filter state and actions
 * @public
 */
function useFilterState(initialState) {
  const [state, setState] = (0, react_1.useState)({
    ...initialFilterState,
    ...initialState
  });
  const updateFilterEnabled = (0, react_1.useCallback)((enabled) => {
    setState((prev) => {
      const normalizedValues = normalizeValues(prev.values);
      const normalizedApplied = normalizeValues(prev.appliedValues);
      const hasChanges = JSON.stringify(normalizedValues) !== JSON.stringify(normalizedApplied);
      return {
        ...prev,
        enabled,
        // Only consider filter values when determining pending changes, not the enabled state itself
        hasPendingChanges: enabled && hasChanges
      };
    });
  }, []);
  const updateFilterValues = (0, react_1.useCallback)((values) => {
    setState((prev) => {
      const normalizedValues = normalizeValues(values);
      const normalizedApplied = normalizeValues(prev.appliedValues);
      const hasChanges = JSON.stringify(normalizedValues) !== JSON.stringify(normalizedApplied);
      return {
        ...prev,
        values,
        hasPendingChanges: prev.enabled && hasChanges
      };
    });
  }, []);
  const applyFilterValues = (0, react_1.useCallback)(() => {
    setState((prev) => ({
      ...prev,
      appliedValues: { ...prev.values },
      hasPendingChanges: false
    }));
  }, []);
  const resetFilterValues = (0, react_1.useCallback)(() => {
    setState((prev) => ({
      ...prev,
      values: {},
      appliedValues: {},
      hasPendingChanges: false,
      enabled: false
    }));
  }, []);
  const updateReduceQualifiers = (0, react_1.useCallback)((reduceQualifiers) => {
    setState((prev) => ({
      ...prev,
      reduceQualifiers
    }));
  }, []);
  const actions = {
    updateFilterEnabled,
    updateFilterValues,
    applyFilterValues,
    resetFilterValues,
    updateReduceQualifiers
  };
  return { state, actions };
}
//# sourceMappingURL=useFilterState.js.map
