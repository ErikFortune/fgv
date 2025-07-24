import { useState, useCallback } from 'react';
import { AppState, AppActions, Tool, Message, FilterState } from '../types/app';

export const useAppState = (): { state: AppState; actions: AppActions } => {
  const [state, setState] = useState<AppState>({
    selectedTool: 'import',
    messages: [],
    filterState: {
      enabled: false,
      values: {},
      appliedValues: {},
      hasPendingChanges: false,
      reduceQualifiers: false
    }
  });

  const setSelectedTool = useCallback((tool: Tool, force?: boolean) => {
    setState((prev) => ({ ...prev, selectedTool: tool }));
  }, []);

  // Alias for setSelectedTool to match the interface
  const setActiveTool = setSelectedTool;

  const addMessage = useCallback((type: Message['type'], message: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  const updateFilterEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      filterState: {
        ...prev.filterState,
        enabled,
        // Reset applied values when disabling
        appliedValues: enabled ? prev.filterState.appliedValues : {},
        hasPendingChanges: false
      }
    }));
  }, []);

  const updateFilterValues = useCallback((values: Record<string, string>) => {
    setState((prev) => ({
      ...prev,
      filterState: {
        ...prev.filterState,
        values,
        hasPendingChanges: JSON.stringify(values) !== JSON.stringify(prev.filterState.appliedValues)
      }
    }));
  }, []);

  const applyFilterValues = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filterState: {
        ...prev.filterState,
        appliedValues: { ...prev.filterState.values },
        hasPendingChanges: false
      }
    }));
  }, []);

  const resetFilterValues = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filterState: {
        ...prev.filterState,
        values: {},
        appliedValues: {},
        hasPendingChanges: false
      }
    }));
  }, []);

  const updateReduceQualifiers = useCallback((reduceQualifiers: boolean) => {
    setState((prev) => ({
      ...prev,
      filterState: {
        ...prev.filterState,
        reduceQualifiers
      }
    }));
  }, []);

  const actions: AppActions = {
    setSelectedTool,
    setActiveTool,
    addMessage,
    clearMessages,
    updateFilterEnabled,
    updateFilterValues,
    applyFilterValues,
    resetFilterValues,
    updateReduceQualifiers
  };

  return { state, actions };
};
