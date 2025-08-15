import { useState, useCallback } from 'react';
import { FilterState, FilterActions } from '../types';

export interface UseFilterStateReturn {
  state: FilterState;
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
