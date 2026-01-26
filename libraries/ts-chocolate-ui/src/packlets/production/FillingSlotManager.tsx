/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import type { SlotId, IFillingSlotState, IFillingSlotActions, IFillingOption } from './model';

/**
 * Props for rendering a single filling option
 * @public
 */
export interface IFillingOptionDisplayProps {
  /** The filling option */
  option: IFillingOption;
  /** Whether this option is currently selected */
  isSelected: boolean;
}

/**
 * Props for the FillingSlotManager component
 * @public
 */
export interface IFillingSlotManagerProps {
  /**
   * Filling slots from useFillingSlotManagement hook
   */
  slots: readonly IFillingSlotState[];
  /**
   * Filling slot actions from useFillingSlotManagement hook
   */
  actions: IFillingSlotActions;
  /**
   * Whether there are any changes from base (from hook result)
   */
  hasChanges: boolean;
  /**
   * Function to get the display name for a filling option
   */
  getFillingName: (option: IFillingOption) => string;
  /**
   * Callback when user wants to add a new filling option to a slot.
   * If not provided, the "Add filling option" button is hidden.
   * The callback should open a picker and call actions.addFillingOption() with the selected option.
   */
  onAddFillingOption?: (slotId: SlotId) => void;
  /**
   * Callback when user wants to add a new slot.
   * If not provided, the "Add slot" button shows an inline name input.
   * If provided, the callback handles showing the name input UI.
   */
  onAddSlot?: () => void;
  /**
   * Whether to show remove buttons for slots
   * @defaultValue true
   */
  showRemoveSlot?: boolean;
  /**
   * Whether to show remove buttons for filling options (only shown if more than one option)
   * @defaultValue true
   */
  showRemoveOption?: boolean;
  /**
   * Whether to allow inline slot renaming
   * @defaultValue true
   */
  allowRename?: boolean;
  /**
   * Label for the section
   * @defaultValue "Fillings"
   */
  label?: string;
  /**
   * Whether the manager is disabled
   * @defaultValue false
   */
  disabled?: boolean;
}

/**
 * Filling slot manager component with full CRUD support.
 *
 * Provides management of filling slots including:
 * - Add/remove/rename slots
 * - Select fillings within each slot
 * - Add/remove filling options within each slot
 *
 * @example
 * ```tsx
 * const { slots, actions, hasChanges } = useFillingSlotManagement({...});
 *
 * <FillingSlotManager
 *   slots={slots}
 *   actions={actions}
 *   hasChanges={hasChanges}
 *   getFillingName={(opt) => {
 *     if (opt.type === 'recipe') {
 *       return runtime.getFilling(opt.id)?.name ?? opt.id;
 *     }
 *     return runtime.getIngredient(opt.id)?.name ?? opt.id;
 *   }}
 *   onAddFillingOption={(slotId) => {
 *     setPickerSlotId(slotId);
 *     setShowFillingPicker(true);
 *   }}
 * />
 * ```
 *
 * @param props - Component props
 * @returns Filling slot manager element
 * @public
 */
export function FillingSlotManager({
  slots,
  actions,
  hasChanges,
  getFillingName,
  onAddFillingOption,
  onAddSlot,
  showRemoveSlot = true,
  showRemoveOption = true,
  allowRename = true,
  label = 'Fillings',
  disabled = false
}: IFillingSlotManagerProps): React.ReactElement | null {
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [editingSlotId, setEditingSlotId] = useState<SlotId | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddSlotClick = useCallback(() => {
    if (onAddSlot) {
      onAddSlot();
    } else {
      setIsAddingSlot(true);
      setNewSlotName('');
    }
  }, [onAddSlot]);

  const handleAddSlotConfirm = useCallback(() => {
    const trimmedName = newSlotName.trim();
    if (trimmedName) {
      actions.addSlot(trimmedName);
    }
    setIsAddingSlot(false);
    setNewSlotName('');
  }, [newSlotName, actions]);

  const handleAddSlotCancel = useCallback(() => {
    setIsAddingSlot(false);
    setNewSlotName('');
  }, []);

  const handleStartRename = useCallback((slot: IFillingSlotState) => {
    setEditingSlotId(slot.slotId);
    setEditingName(slot.name);
  }, []);

  const handleRenameConfirm = useCallback(() => {
    if (editingSlotId) {
      actions.renameSlot(editingSlotId, editingName);
    }
    setEditingSlotId(null);
    setEditingName('');
  }, [editingSlotId, editingName, actions]);

  const handleRenameCancel = useCallback(() => {
    setEditingSlotId(null);
    setEditingName('');
  }, []);

  if (slots.length === 0 && !onAddSlot) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-gray-600 dark:text-gray-400">{label}</label>
        {hasChanges && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Modified</span>
        )}
      </div>

      {slots.map((slot) => (
        <div key={slot.slotId} className="space-y-1 p-2 rounded-md bg-gray-50 dark:bg-gray-800/50">
          {/* Slot header with name */}
          <div className="flex items-center justify-between gap-2">
            {editingSlotId === slot.slotId ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameConfirm();
                    if (e.key === 'Escape') handleRenameCancel();
                  }}
                  className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  autoFocus
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={handleRenameConfirm}
                  disabled={disabled}
                  className="px-2 py-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleRenameCancel}
                  disabled={disabled}
                  className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium">
                    {slot.name}
                  </span>
                  {slot.hasChanges && (
                    <span className="text-[9px] text-amber-500 dark:text-amber-400">*</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {allowRename && (
                    <button
                      type="button"
                      onClick={() => handleStartRename(slot)}
                      disabled={disabled}
                      className="px-1.5 py-0.5 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Rename
                    </button>
                  )}
                  {showRemoveSlot && (
                    <button
                      type="button"
                      onClick={() => actions.removeSlot(slot.slotId)}
                      disabled={disabled}
                      className="px-1.5 py-0.5 text-[10px] text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Filling selector */}
          <div className="flex items-center gap-2">
            <select
              className="flex-1 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              value={slot.preferredId ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) actions.selectFilling(slot.slotId, value);
              }}
              disabled={disabled}
            >
              {slot.options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {getFillingName(opt)}
                </option>
              ))}
            </select>

            {showRemoveOption && slot.options.length > 1 && slot.preferredId && (
              <button
                type="button"
                onClick={() => actions.removeFillingOption(slot.slotId, slot.preferredId!)}
                disabled={disabled}
                className="px-1.5 py-1.5 text-[10px] text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove this filling from options"
              >
                Remove
              </button>
            )}
          </div>

          {/* Add filling option button */}
          {onAddFillingOption && (
            <button
              type="button"
              onClick={() => onAddFillingOption(slot.slotId)}
              disabled={disabled}
              className="text-[10px] text-chocolate-600 dark:text-chocolate-400 hover:text-chocolate-700 dark:hover:text-chocolate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add filling option
            </button>
          )}
        </div>
      ))}

      {/* Add slot section */}
      {isAddingSlot ? (
        <div className="flex items-center gap-2 p-2 rounded-md border border-dashed border-gray-300 dark:border-gray-600">
          <input
            type="text"
            value={newSlotName}
            onChange={(e) => setNewSlotName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSlotConfirm();
              if (e.key === 'Escape') handleAddSlotCancel();
            }}
            placeholder="Slot name..."
            className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            autoFocus
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleAddSlotConfirm}
            disabled={disabled || !newSlotName.trim()}
            className="px-2 py-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleAddSlotCancel}
            disabled={disabled}
            className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAddSlotClick}
          disabled={disabled}
          className="text-xs text-chocolate-600 dark:text-chocolate-400 hover:text-chocolate-700 dark:hover:text-chocolate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add filling slot
        </button>
      )}
    </div>
  );
}
