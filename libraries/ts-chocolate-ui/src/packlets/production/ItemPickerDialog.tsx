/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';

/**
 * Item for the picker dialog
 * @public
 */
export interface IPickerItem<TId extends string = string> {
  /** Unique identifier */
  id: TId;
  /** Display name */
  name: string;
  /** Optional description or subtitle */
  description?: string;
  /** Optional category for grouping */
  category?: string;
}

/**
 * Props for the ItemPickerDialog component
 * @public
 */
export interface IItemPickerDialogProps<TId extends string = string> {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Available items to pick from
   */
  items: readonly IPickerItem<TId>[];
  /**
   * Callback when an item is selected
   */
  onSelect: (item: IPickerItem<TId>) => void;
  /**
   * Callback when dialog is closed without selection
   */
  onClose: () => void;
  /**
   * Optional placeholder for search input
   * @defaultValue "Search..."
   */
  searchPlaceholder?: string;
  /**
   * Optional IDs to exclude from the list (already selected items)
   */
  excludeIds?: readonly TId[];
  /**
   * Optional empty state message
   * @defaultValue "No items available"
   */
  emptyMessage?: string;
}

/**
 * Generic item picker dialog with search functionality.
 *
 * Displays a modal overlay with a searchable list of items.
 * Used for selecting fillings, chocolates, procedures, etc.
 *
 * @example
 * ```tsx
 * <ItemPickerDialog
 *   isOpen={showPicker}
 *   title="Select Filling"
 *   items={availableFillings}
 *   onSelect={(item) => {
 *     actions.addFillingOption(slotId, { type: 'recipe', id: item.id });
 *     setShowPicker(false);
 *   }}
 *   onClose={() => setShowPicker(false)}
 *   excludeIds={existingFillingIds}
 * />
 * ```
 *
 * @param props - Component props
 * @returns Item picker dialog element or null if closed
 * @public
 */
export function ItemPickerDialog<TId extends string = string>({
  isOpen,
  title,
  items,
  onSelect,
  onClose,
  searchPlaceholder = 'Search...',
  excludeIds = [],
  emptyMessage = 'No items available'
}: IItemPickerDialogProps<TId>): React.ReactElement | null {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const excludeSet = new Set(excludeIds);
    const searchLower = search.toLowerCase().trim();

    return items.filter((item) => {
      // Exclude already selected items
      if (excludeSet.has(item.id)) return false;

      // Filter by search
      if (searchLower) {
        const nameMatch = item.name.toLowerCase().includes(searchLower);
        const descMatch = item.description?.toLowerCase().includes(searchLower) ?? false;
        const catMatch = item.category?.toLowerCase().includes(searchLower) ?? false;
        return nameMatch || descMatch || catMatch;
      }

      return true;
    });
  }, [items, excludeIds, search]);

  const handleSelect = useCallback(
    (item: IPickerItem<TId>) => {
      onSelect(item);
      setSearch('');
    },
    [onSelect]
  );

  const handleClose = useCallback(() => {
    onClose();
    setSearch('');
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-chocolate-500 dark:focus:ring-chocolate-400"
            autoFocus
          />
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {search ? 'No matching items' : emptyMessage}
            </div>
          ) : (
            <ul className="py-2">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 focus:outline-none"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                    )}
                    {item.category && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {item.category}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
