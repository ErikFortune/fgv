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

export function useFilterState(initialState?: Partial<FilterState>): UseFilterStateReturn {
  const [state, setState] = useState<FilterState>({
    ...initialFilterState,
    ...initialState
  });

  const updateFilterEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      enabled,
      hasPendingChanges: enabled !== prev.enabled
    }));
  }, []);

  const updateFilterValues = useCallback((values: Record<string, string | undefined>) => {
    setState((prev) => {
      const hasChanges = JSON.stringify(values) !== JSON.stringify(prev.appliedValues);
      return {
        ...prev,
        values,
        hasPendingChanges: hasChanges
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
