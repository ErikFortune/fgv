/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { IMoldState, IMoldActions } from './model';

/**
 * Props for the MoldSelector component
 * @public
 */
export interface IMoldSelectorProps {
  /**
   * Mold state from useMoldSelection hook
   */
  state: IMoldState;
  /**
   * Mold actions from useMoldSelection hook
   */
  actions: IMoldActions;
  /**
   * Function to get the display name for a mold ID
   */
  getMoldName: (id: string) => string;
  /**
   * Callback when user wants to add a new mold.
   * If not provided, the "Add mold" button is hidden.
   * The callback should open a picker and call actions.addOption() with the selected mold.
   */
  onAddMold?: () => void;
  /**
   * Whether to show the remove button for each option.
   * Only shown if there's more than one option (can't remove the last one).
   * @defaultValue true
   */
  showRemove?: boolean;
  /**
   * Label for the selector
   * @defaultValue "Mold"
   */
  label?: string;
  /**
   * Whether the selector is disabled
   * @defaultValue false
   */
  disabled?: boolean;
}

/**
 * Mold selector component with full CRUD support.
 *
 * Provides selection from available molds, with optional ability to
 * add new molds and remove existing ones from the options.
 *
 * @example
 * ```tsx
 * const { state, actions } = useMoldSelection({...});
 *
 * <MoldSelector
 *   state={state}
 *   actions={actions}
 *   getMoldName={(id) => runtime.getMold(id)?.name ?? id}
 *   onAddMold={() => setShowMoldPicker(true)}
 * />
 * ```
 *
 * @param props - Component props
 * @returns Mold selector element
 * @public
 */
export function MoldSelector({
  state,
  actions,
  getMoldName,
  onAddMold,
  showRemove = true,
  label = 'Mold',
  disabled = false
}: IMoldSelectorProps): React.ReactElement | null {
  const canRemove = showRemove && state.options.length > 1;
  const hasOptions = state.options.length > 0;

  // If no options and no way to add, don't render
  if (!hasOptions && !onAddMold) {
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

      {hasOptions && (
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
            {state.options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {getMoldName(opt.id)}
              </option>
            ))}
          </select>

          {canRemove && state.effectivePreferredId && (
            <button
              type="button"
              onClick={() => actions.removeOption(state.effectivePreferredId!)}
              disabled={disabled}
              className="px-2 py-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove this mold from options"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {!hasOptions && (
        <div className="text-xs text-gray-500 dark:text-gray-400 italic">No molds configured</div>
      )}

      {onAddMold && (
        <button
          type="button"
          onClick={onAddMold}
          disabled={disabled}
          className="text-xs text-chocolate-600 dark:text-chocolate-400 hover:text-chocolate-700 dark:hover:text-chocolate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add mold option
        </button>
      )}
    </div>
  );
}
