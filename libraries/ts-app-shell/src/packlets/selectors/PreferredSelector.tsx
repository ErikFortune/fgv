/*
 * Copyright (c) 2026 Erik Fortune
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

/**
 * PreferredSelector — compact popover for choosing one item from a set of options.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// PreferredSelector Types
// ============================================================================

/**
 * A single selectable item in the PreferredSelector.
 * @public
 */
export interface ISelectableItem<TId extends string = string> {
  /** Unique identifier */
  readonly id: TId;
  /** Primary display label */
  readonly label: string;
  /** Optional secondary label */
  readonly sublabel?: string;
}

/**
 * Props for the PreferredSelector component.
 * @public
 */
export interface IPreferredSelectorProps<TId extends string = string> {
  /** Available items to choose from */
  readonly items: ReadonlyArray<ISelectableItem<TId>>;
  /** Currently selected item ID */
  readonly selectedId: TId;
  /** ID of the preferred/default item (shows ★ marker) */
  readonly preferredId?: TId;
  /** Callback when an item is selected */
  readonly onSelect: (id: TId) => void;
  /** Callback to compare selected items side-by-side. Receives the IDs to compare. */
  readonly onCompare?: (ids: ReadonlyArray<TId>) => void;
  /** Callback for drill-down navigation on an item (shows › chevron per row) */
  readonly onDrillDown?: (id: TId) => void;
  /** Section title displayed above the trigger */
  readonly label?: string;
}

// ============================================================================
// PreferredSelector Component
// ============================================================================

/**
 * Compact inline selector with popover for choosing one item from a set.
 *
 * When there is only one item, renders as a static label.
 * When there are multiple items, renders a clickable trigger that opens
 * a popover with all options. If `onCompare` is provided, the popover
 * includes a compare toggle that enables checkboxes for multi-select,
 * with "Compare All" and "Compare Selected" actions.
 *
 * @public
 */
export function PreferredSelector<TId extends string = string>(
  props: IPreferredSelectorProps<TId>
): React.ReactElement {
  const { items, selectedId, preferredId, onSelect, onCompare, onDrillDown, label } = props;
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [compareMode, setCompareMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<TId>>(new Set());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedItem = items.find((item) => item.id === selectedId);
  const hasMultiple = items.length > 1;
  const canCompare = onCompare !== undefined && items.length >= 2;

  // Reset compare mode when popover closes
  useEffect(() => {
    if (!open) {
      setCompareMode(false);
      setCheckedIds(new Set());
    }
  }, [open]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Focus first item when popover opens
  useEffect(() => {
    if (open) {
      const selectedIdx = items.findIndex((item) => item.id === selectedId);
      setFocusIndex(selectedIdx >= 0 ? selectedIdx : 0);
    }
  }, [open, items, selectedId]);

  // Scroll focused item into view
  useEffect(() => {
    if (open && focusIndex >= 0 && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, focusIndex]);

  const handleToggle = useCallback((): void => {
    if (hasMultiple) {
      setOpen((prev) => !prev);
    }
  }, [hasMultiple]);

  const handleSelect = useCallback(
    (id: TId): void => {
      onSelect(id);
      setOpen(false);
    },
    [onSelect]
  );

  const handleDrillDown = useCallback(
    (id: TId, e: React.MouseEvent): void => {
      e.stopPropagation();
      onDrillDown?.(id);
      setOpen(false);
    },
    [onDrillDown]
  );

  const toggleChecked = useCallback((id: TId): void => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCompareAll = useCallback((): void => {
    if (onCompare) {
      onCompare(items.map((item) => item.id));
      setOpen(false);
    }
  }, [onCompare, items]);

  const handleCompareSelected = useCallback((): void => {
    if (onCompare && checkedIds.size >= 2) {
      onCompare(Array.from(checkedIds));
      setOpen(false);
    }
  }, [onCompare, checkedIds]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'Escape': {
          e.preventDefault();
          e.stopPropagation();
          if (compareMode) {
            setCompareMode(false);
            setCheckedIds(new Set());
          } else {
            setOpen(false);
            triggerRef.current?.focus();
          }
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          setFocusIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setFocusIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (focusIndex >= 0 && focusIndex < items.length) {
            if (compareMode) {
              toggleChecked(items[focusIndex].id);
            } else {
              handleSelect(items[focusIndex].id);
            }
          }
          break;
        }
        case ' ': {
          if (compareMode && focusIndex >= 0 && focusIndex < items.length) {
            e.preventDefault();
            toggleChecked(items[focusIndex].id);
          }
          break;
        }
        default:
          break;
      }
    },
    [open, items, focusIndex, handleSelect, compareMode, toggleChecked]
  );

  return (
    <div className="relative">
      {/* Section label */}
      {label && <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>}

      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-md border transition-colors w-full text-left ${
          hasMultiple
            ? 'border-gray-300 hover:border-choco-primary cursor-pointer bg-white'
            : 'border-transparent cursor-default bg-transparent'
        } ${open ? 'border-choco-primary ring-1 ring-choco-primary/20' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex-1 min-w-0 truncate text-gray-800">
          {selectedItem?.label ?? selectedId}
          {preferredId !== undefined && selectedId === preferredId && (
            <span className="ml-1 text-xs text-amber-500">★</span>
          )}
        </span>
        {hasMultiple && (
          <>
            <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{items.length}</span>
            <svg
              className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute z-50 mt-1 w-full min-w-[200px] max-h-[280px] bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col overflow-hidden"
          role="listbox"
          onKeyDown={handleKeyDown}
        >
          {/* Popover header */}
          {canCompare && (
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-gray-100 shrink-0">
              {compareMode ? (
                <div className="flex items-center gap-1.5">
                  {checkedIds.size >= 2 && (
                    <button
                      onClick={handleCompareSelected}
                      className="text-xs text-white bg-choco-primary rounded px-1.5 py-0.5 hover:bg-choco-primary/90 transition-colors font-medium"
                    >
                      Compare {checkedIds.size}
                    </button>
                  )}
                  <button
                    onClick={handleCompareAll}
                    className="text-xs text-choco-accent hover:text-choco-primary transition-colors font-medium"
                  >
                    All
                  </button>
                </div>
              ) : (
                <button
                  onClick={(): void => setCompareMode(true)}
                  className="text-xs text-choco-accent hover:text-choco-primary transition-colors font-medium"
                >
                  Compare…
                </button>
              )}
              <button
                onClick={(): void => {
                  if (compareMode) {
                    setCompareMode(false);
                    setCheckedIds(new Set());
                  } else {
                    setOpen(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={compareMode ? 'Exit compare' : 'Close'}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Items list */}
          <div className="overflow-y-auto flex-1">
            {items.map((item, index) => {
              const isSelected = item.id === selectedId;
              const isPreferred = preferredId !== undefined && item.id === preferredId;
              const isFocused = index === focusIndex;
              const isChecked = compareMode && checkedIds.has(item.id);

              return (
                <button
                  key={item.id}
                  ref={(el): void => {
                    itemRefs.current[index] = el;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onClick={(): void => {
                    if (compareMode) {
                      toggleChecked(item.id);
                    } else {
                      handleSelect(item.id);
                    }
                  }}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-sm transition-colors ${
                    isChecked
                      ? 'bg-choco-accent/10 text-choco-primary'
                      : isSelected && !compareMode
                      ? 'bg-choco-accent/10 text-choco-primary font-medium'
                      : isFocused
                      ? 'bg-gray-50 text-gray-800'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox (compare mode) or preferred star */}
                  {compareMode ? (
                    <span
                      className={`flex items-center justify-center w-3.5 h-3.5 rounded border shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-choco-accent border-choco-accent text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isChecked && (
                        <svg
                          className="w-2.5 h-2.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  ) : (
                    <span className="w-3 shrink-0 text-center text-xs">
                      {isPreferred ? <span className="text-amber-500">★</span> : ''}
                    </span>
                  )}

                  {/* Label + sublabel */}
                  <span className="flex-1 min-w-0">
                    <span className="truncate block">{item.label}</span>
                    {item.sublabel && (
                      <span className="text-xs text-gray-400 truncate block">{item.sublabel}</span>
                    )}
                  </span>

                  {/* Selection check (normal mode only) */}
                  {!compareMode && isSelected && (
                    <svg
                      className="w-3.5 h-3.5 text-choco-accent shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}

                  {/* Drill-down chevron (normal mode only) */}
                  {!compareMode && onDrillDown && (
                    <button
                      onClick={(e): void => handleDrillDown(item.id, e)}
                      className="text-gray-300 hover:text-choco-accent shrink-0 p-0.5 -mr-1"
                      aria-label={`Open ${item.label}`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
