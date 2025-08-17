import { useState, useCallback } from 'react';
import { FilterState, FilterActions } from '../types';

/**
 * Return type for the useFilterState hook.
 *
 * @public
 */
export interface UseFilterStateReturn {
  /** Current filter state including enabled status and filter values */
  state: FilterState;
  /** Available actions for managing filter state */
  actions: FilterActions;
}

const initialFilterState: FilterState = {
  enabled: false,
  values: {},
  appliedValues: {},
  hasPendingChanges: false,
  reduceQualifiers: false
};

// Normalize values by filtering out undefined and empty strings for consistent comparison
const normalizeValues = (vals: Record<string, string | undefined>): Record<string, string> => {
  const normalized: Record<string, string> = {};
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
export function useFilterState(initialState?: Partial<FilterState>): UseFilterStateReturn {
  const [state, setState] = useState<FilterState>({
    ...initialFilterState,
    ...initialState
  });

  const updateFilterEnabled = useCallback((enabled: boolean) => {
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

  const updateFilterValues = useCallback((values: Record<string, string | undefined>) => {
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

  const applyFilterValues = useCallback(() => {
    setState((prev) => ({
      ...prev,
      appliedValues: { ...prev.values },
      hasPendingChanges: false
    }));
  }, []);

  const resetFilterValues = useCallback(() => {
    setState((prev) => ({
      ...prev,
      values: {},
      appliedValues: {},
      hasPendingChanges: false,
      enabled: false
    }));
  }, []);

  const updateReduceQualifiers = useCallback((reduceQualifiers: boolean) => {
    setState((prev) => ({
      ...prev,
      reduceQualifiers
    }));
  }, []);

  const actions: FilterActions = {
    updateFilterEnabled,
    updateFilterValues,
    applyFilterValues,
    resetFilterValues,
    updateReduceQualifiers
  };

  return { state, actions };
}
