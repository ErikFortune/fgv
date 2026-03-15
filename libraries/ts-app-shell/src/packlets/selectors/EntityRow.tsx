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
 * EntityRow — clickable text row with optional discrete swap-icon for alternates.
 *
 * Renders a uniform row regardless of whether alternates exist:
 * - Left slot: swap icon (when alternates exist) or empty spacer
 * - Name text: clickable for drill-down
 * - Optional right-side content (amount, sublabel, etc.)
 * - Drill-down chevron ›
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import type { ISelectableItem } from './PreferredSelector';

// ============================================================================
// EntityRow Types
// ============================================================================

/**
 * Props for the EntityRow component.
 * @public
 */
export interface IEntityRowProps<TId extends string = string> {
  /** All options (preferred + alternates). If length === 1, no swap icon is shown. */
  readonly items: ReadonlyArray<ISelectableItem<TId>>;
  /** ID of the preferred/default item (shows ★ marker) */
  readonly preferredId?: TId;
  /** Controlled selected ID (overrides internal state). Use with onSelect. */
  readonly selectedId?: TId;
  /** Callback when the displayed item changes via the swap picker */
  readonly onSelect?: (id: TId) => void;
  /** Callback when the row is clicked (drill-down navigation) */
  readonly onClick?: (id: TId) => void;
  /** Callback to compare items. When provided, popover shows compare buttons. */
  readonly onCompare?: (ids: ReadonlyArray<TId>) => void;
  /** Optional right-side content rendered before the › chevron */
  readonly rightContent?: React.ReactNode;
  /** Optional section label displayed above the row */
  readonly label?: string;
}

// ============================================================================
// EntityRow Component
// ============================================================================

/**
 * A clickable text row with an optional discrete swap-icon popover for
 * switching between alternates. Clicking the row itself always triggers
 * drill-down navigation. The swap icon opens a small picker to change
 * which alternate is displayed.
 *
 * @public
 */
export function EntityRow<TId extends string = string>(props: IEntityRowProps<TId>): React.ReactElement {
  const { items, preferredId, onClick, onSelect, onCompare, rightContent, label } = props;

  const hasAlternates = items.length > 1;
  const [internalId, setInternalId] = useState<TId>(preferredId ?? items[0]?.id ?? ('' as TId));
  const displayedId = props.selectedId ?? internalId;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<TId>>(new Set());
  const [focusIndex, setFocusIndex] = useState(-1);
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerBtnRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Reset displayed item when items or preferred change (e.g. variation switch)
  useEffect(() => {
    setInternalId(preferredId ?? items[0]?.id ?? ('' as TId));
  }, [preferredId, items]);

  // Reset compare mode when picker closes; set initial focus when it opens
  useEffect(() => {
    if (!pickerOpen) {
      setCompareMode(false);
      setCheckedIds(new Set());
      setFocusIndex(-1);
    } else {
      const idx = items.findIndex((i) => i.id === displayedId);
      setFocusIndex(idx >= 0 ? idx : 0);
    }
  }, [pickerOpen, items, displayedId]);

  const displayedItem = useMemo(
    () => items.find((i) => i.id === displayedId) ?? items[0],
    [items, displayedId]
  );
  const isPreferred = displayedId === preferredId;

  // Position the portal popover relative to the swap button
  useEffect(() => {
    if (pickerOpen && pickerBtnRef.current) {
      const rect = pickerBtnRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.bottom + 2, left: rect.left });
    }
  }, [pickerOpen]);

  // Close picker on outside click or scroll
  useEffect(() => {
    if (!pickerOpen) {
      return;
    }
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        pickerBtnRef.current &&
        !pickerBtnRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    };
    const handleScroll = (): void => {
      setPickerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Close on any scroll so the popover doesn't float away from the button
    document.addEventListener('scroll', handleScroll, true);
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [pickerOpen]);

  const handleRowClick = useCallback((): void => {
    if (onClick) {
      onClick(displayedId);
    }
  }, [onClick, displayedId]);

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(displayedId);
      }
    },
    [onClick, displayedId]
  );

  const handlePickerToggle = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    setPickerOpen((prev) => !prev);
  }, []);

  const handlePickItem = useCallback(
    (id: TId): void => {
      setInternalId(id);
      if (onSelect) {
        onSelect(id);
      }
      setPickerOpen(false);
    },
    [onSelect]
  );

  const handleCompareAll = useCallback((): void => {
    if (onCompare) {
      onCompare(items.map((i) => i.id));
    }
    setPickerOpen(false);
  }, [onCompare, items]);

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

  const handleCompareSelected = useCallback((): void => {
    if (onCompare && checkedIds.size >= 2) {
      onCompare(Array.from(checkedIds));
      setPickerOpen(false);
    }
  }, [onCompare, checkedIds]);

  const handlePickerKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      switch (e.key) {
        case 'Escape': {
          e.preventDefault();
          e.stopPropagation();
          if (compareMode) {
            setCompareMode(false);
            setCheckedIds(new Set());
          } else {
            setPickerOpen(false);
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
              handlePickItem(items[focusIndex].id);
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
    [items, focusIndex, compareMode, toggleChecked, handlePickItem]
  );

  // Render the picker popover via portal so it escapes ancestor overflow clipping
  const pickerPopover = pickerOpen
    ? ReactDOM.createPortal(
        <div
          ref={pickerRef}
          style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left }}
          className="z-50 min-w-[180px] max-h-[200px] bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col overflow-hidden"
          onKeyDown={handlePickerKeyDown}
        >
          <div className="flex items-center justify-between px-2.5 py-1 border-b border-gray-100 shrink-0">
            {onCompare && items.length >= 2 ? (
              compareMode ? (
                <>
                  <div className="flex items-center gap-1.5">
                    {checkedIds.size >= 2 && (
                      <button
                        onClick={(e): void => {
                          e.stopPropagation();
                          handleCompareSelected();
                        }}
                        className="text-[10px] text-white bg-choco-primary rounded px-1.5 py-0.5 hover:bg-choco-primary/90 transition-colors font-medium"
                      >
                        Compare {checkedIds.size}
                      </button>
                    )}
                    <button
                      onClick={(e): void => {
                        e.stopPropagation();
                        handleCompareAll();
                      }}
                      className="text-[10px] text-choco-accent hover:text-choco-primary transition-colors font-medium"
                    >
                      All
                    </button>
                  </div>
                  <button
                    onClick={(e): void => {
                      e.stopPropagation();
                      setCompareMode(false);
                      setCheckedIds(new Set());
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Exit compare"
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
                </>
              ) : (
                <>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    Options
                  </span>
                  <button
                    onClick={(e): void => {
                      e.stopPropagation();
                      setCompareMode(true);
                    }}
                    className="text-[10px] text-choco-accent hover:text-choco-primary transition-colors font-medium"
                  >
                    Compare…
                  </button>
                </>
              )
            ) : (
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                Alternates
              </span>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.map((item, index) => {
              const isCurrent = item.id === displayedId;
              const isPref = item.id === preferredId;
              const isFocused = index === focusIndex;
              const isChecked = compareMode && checkedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  ref={(el): void => {
                    itemRefs.current[index] = el;
                  }}
                  onClick={(e): void => {
                    e.stopPropagation();
                    if (compareMode) {
                      toggleChecked(item.id);
                    } else {
                      handlePickItem(item.id);
                    }
                  }}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-sm transition-colors ${
                    isChecked
                      ? 'bg-choco-accent/10 text-choco-primary'
                      : isCurrent && !compareMode
                      ? 'bg-choco-accent/10 text-choco-primary font-medium'
                      : isFocused
                      ? 'bg-gray-50 text-gray-800'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
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
                      {isPref ? <span className="text-amber-500">★</span> : ''}
                    </span>
                  )}
                  <span className="flex-1 min-w-0 truncate">
                    {item.label}
                    {item.sublabel && <span className="ml-1.5 text-xs text-gray-400">{item.sublabel}</span>}
                  </span>
                  {!compareMode && isCurrent && (
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
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div>
      {label && (
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      )}
      <div
        className={`flex items-center gap-1.5 py-1.5 pl-0 pr-2 rounded-md ${
          onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
        }`}
        onClick={handleRowClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={handleRowKeyDown}
      >
        {/* Fixed-width left slot for swap icon — keeps names aligned */}
        <span className="w-4 shrink-0 flex items-center justify-center">
          {hasAlternates ? (
            <button
              ref={pickerBtnRef}
              onClick={handlePickerToggle}
              className="text-gray-400 hover:text-choco-accent p-0 transition-colors"
              aria-label="Switch alternate"
              tabIndex={-1}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          ) : null}
        </span>
        <span className="text-sm text-gray-800 flex-1 truncate">
          {displayedItem?.label ?? ''}
          {hasAlternates && isPreferred && <span className="ml-1 text-xs text-amber-500">★</span>}
          {displayedItem?.sublabel && (
            <span className="ml-1.5 text-xs text-gray-400">{displayedItem.sublabel}</span>
          )}
        </span>
        {rightContent}
        {onClick && <span className="text-gray-300 text-xs shrink-0">›</span>}
      </div>
      {pickerPopover}
    </div>
  );
}
