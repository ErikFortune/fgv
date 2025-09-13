import { useState, useCallback } from 'react';
import { Tool } from '../types/app';

export interface NavigationWarningState {
  isWarningOpen: boolean;
  pendingTool: Tool | null;
  hasUnsavedChanges: boolean;
}

export interface NavigationWarningActions {
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  showWarning: (pendingTool: Tool) => void;
  hideWarning: () => void;
  confirmNavigation: () => Tool | null;
}

export const useNavigationWarning = (): {
  state: NavigationWarningState;
  actions: NavigationWarningActions;
} => {
  const [state, setState] = useState<NavigationWarningState>({
    isWarningOpen: false,
    pendingTool: null,
    hasUnsavedChanges: false
  });

  const setHasUnsavedChanges = useCallback((hasChanges: boolean) => {
    setState((prev) => ({ ...prev, hasUnsavedChanges: hasChanges }));
  }, []);

  const showWarning = useCallback((pendingTool: Tool) => {
    setState((prev) => ({
      ...prev,
      isWarningOpen: true,
      pendingTool
    }));
  }, []);

  const hideWarning = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isWarningOpen: false,
      pendingTool: null
    }));
  }, []);

  const confirmNavigation = useCallback(() => {
    const toolToNavigateTo = state.pendingTool;
    setState((prev) => ({
      ...prev,
      isWarningOpen: false,
      pendingTool: null,
      hasUnsavedChanges: false
    }));
    return toolToNavigateTo;
  }, [state.pendingTool]);

  return {
    state,
    actions: {
      setHasUnsavedChanges,
      showWarning,
      hideWarning,
      confirmNavigation
    }
  };
};
