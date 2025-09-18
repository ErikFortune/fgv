/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { useState, useCallback } from 'react';

/**
 * @public
 */
export interface INavigationWarningState<T = unknown> {
  isWarningOpen: boolean;
  pendingTool: T | null;
  hasUnsavedChanges: boolean;
}

/**
 * @public
 */
export interface INavigationWarningActions<T = unknown> {
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  showWarning: (pendingTool: T) => void;
  hideWarning: () => void;
  confirmNavigation: () => T | null;
}

/**
 * @public
 */
export const useNavigationWarning = <T = unknown>(): {
  state: INavigationWarningState<T>;
  actions: INavigationWarningActions<T>;
} => {
  const [state, setState] = useState<INavigationWarningState<T>>({
    isWarningOpen: false,
    pendingTool: null,
    hasUnsavedChanges: false
  });

  const setHasUnsavedChanges = useCallback((hasChanges: boolean) => {
    setState((prev: INavigationWarningState<T>) => ({ ...prev, hasUnsavedChanges: hasChanges }));
  }, []);

  const showWarning = useCallback((pendingTool: T) => {
    setState((prev: INavigationWarningState<T>) => ({
      ...prev,
      isWarningOpen: true,
      pendingTool
    }));
  }, []);

  const hideWarning = useCallback(() => {
    setState((prev: INavigationWarningState<T>) => ({
      ...prev,
      isWarningOpen: false,
      pendingTool: null
    }));
  }, []);

  const confirmNavigation = useCallback(() => {
    const toolToNavigateTo = state.pendingTool;
    setState((prev: INavigationWarningState<T>) => ({
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

// Backward compatibility type aliases
/**
 * @deprecated Use INavigationWarningState instead
 * @public
 */
export type NavigationWarningState<T = unknown> = INavigationWarningState<T>;

/**
 * @deprecated Use INavigationWarningActions instead
 * @public
 */
export type NavigationWarningActions<T = unknown> = INavigationWarningActions<T>;
