/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { IShellChocolateState, IShellChocolateActions } from './model';

/**
 * Props for the ShellChocolateSelector component
 * @public
 */
export interface IShellChocolateSelectorProps {
  /**
   * Shell chocolate state from useShellChocolateSelection hook
   */
  state: IShellChocolateState;
  /**
   * Shell chocolate actions from useShellChocolateSelection hook
   */
  actions: IShellChocolateActions;
  /**
   * Function to get the display name for a chocolate ID
   */
  getChocolateName: (id: string) => string;
  /**
   * Callback when user wants to add a new chocolate.
   * If not provided, the "Add chocolate" button is hidden.
   * The callback should open a picker and call actions.addChoice() with the selected ID.
   */
  onAddChocolate?: () => void;
  /**
   * Whether to show the remove button for each choice.
   * Only shown if there's more than one choice (can't remove the last one).
   * @defaultValue true
   */
  showRemove?: boolean;
  /**
   * Label for the selector
   * @defaultValue "Shell chocolate"
   */
  label?: string;
  /**
   * Whether the selector is disabled
   * @defaultValue false
   */
  disabled?: boolean;
}

/**
 * Shell chocolate selector component with full CRUD support.
 *
 * Provides selection from available chocolates, with optional ability to
 * add new chocolates and remove existing ones from the choices.
 *
 * @example
 * ```tsx
 * const { state, actions } = useShellChocolateSelection({...});
 *
 * <ShellChocolateSelector
 *   state={state}
 *   actions={actions}
 *   getChocolateName={(id) => runtime.getIngredient(id)?.name ?? id}
 *   onAddChocolate={() => setShowChocolatePicker(true)}
 * />
 * ```
 *
 * @param props - Component props
 * @returns Shell chocolate selector element
 * @public
 */
export function ShellChocolateSelector({
  state,
  actions,
  getChocolateName,
  onAddChocolate,
  showRemove = true,
  label = 'Shell chocolate',
  disabled = false
}: IShellChocolateSelectorProps): React.ReactElement | null {
  const canRemove = showRemove && state.availableChoices.length > 1;
  const hasChoices = state.availableChoices.length > 0;

  // If no choices and no way to add, don't render
  if (!hasChoices && !onAddChocolate) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-gray-600 dark:text-gray-400">{label}</label>
        {state.hasChanges && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Modified</span>
        )}
      </div>

      {hasChoices && (
        <div className="flex items-center gap-2">
          <select
            className="flex-1 px-2 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            value={state.effectivePreferredId ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) actions.select(value);
            }}
            disabled={disabled}
          >
            {state.availableChoices.map((id) => (
              <option key={id} value={id}>
                {getChocolateName(id)}
              </option>
            ))}
          </select>

          {canRemove && state.effectivePreferredId && (
            <button
              type="button"
              onClick={() => actions.removeChoice(state.effectivePreferredId!)}
              disabled={disabled}
              className="px-2 py-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove this chocolate from choices"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {!hasChoices && (
        <div className="text-xs text-gray-500 dark:text-gray-400 italic">No shell chocolates configured</div>
      )}

      {onAddChocolate && (
        <button
          type="button"
          onClick={onAddChocolate}
          disabled={disabled}
          className="text-xs text-chocolate-600 dark:text-chocolate-400 hover:text-chocolate-700 dark:hover:text-chocolate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add chocolate option
        </button>
      )}
    </div>
  );
}
